/**
 * Pipeline v2 — RAG-enhanced signal intelligence pipeline.
 *
 * Stages: quality gate → candidate generation → compute → RAG prompt → LLM → cross-ref → cards
 *
 * For MVD: LLM calls are stubbed when no API key is present. The prompts are still assembled
 * (proving the RAG retrieval works) but the analysis/synthesis text comes from a template.
 */
import { randomUUID } from "node:crypto";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { getRepoRoot } from "../../repo-root.js";
import { loadAllKnowledgeChunks, indexChunks, setNamespace } from "../../rag/index.js";
import { generateCandidates } from "./generate-candidates.js";
import { checkFileQuality, type FileQualityReport } from "./data-quality-check.js";
import { computeAllForUser, type ComputedKpi } from "./kpi-compute.js";
import { assemblePrompts, type AssembledPrompt } from "./rag-prompt-assembly.js";
import { getRelatedSignals } from "./cross-signal-ref.js";
import { generateAllInsufficientCards } from "./insufficient-cards.js";
import { enrichInsufficientCardWithRag } from "./insufficient-rag-enrichment.js";
import { buildWhyRecommendedRationale, type WhyRecommended } from "./recommended-rationale.js";
import {
  evaluateDecisionTriggers,
  type CatalogueDecisionRow,
  type TriggeredDecisionRecommendation,
} from "./decision-triggers.js";
import {
  buildStep1cDataQualityJson,
  buildStep23ComputedJson,
  buildStep4LlmCallsJson,
} from "./inspector-artifacts.js";
import {
  buildSignalCard,
  buildInsufficientCardV2,
  type AnyCardV2,
  type PipelineOutputV2,
  type UserCardDeck,
  type AnalysisSection,
  type SynthesisSection,
  type QualityNote,
} from "./card-schema.js";

export interface PipelineV2Options {
  userIds: string[];
  outDir?: string;
  skipLlm?: boolean;
}

export interface PipelineV2Result {
  ok: boolean;
  output: PipelineOutputV2;
  qualityReports: FileQualityReport[];
  outDir: string;
}

const DATA_FILES: { path: string; requiredColumns: string[]; keyColumns: string[]; idColumn?: string }[] = [
  {
    path: "data/zoho/Zoho - CRM - Leads.csv",
    requiredColumns: ["Id", "Created Time", "Company"],
    keyColumns: ["Created Time"],
    idColumn: "Id",
  },
  {
    path: "data/zoho/Zoho - CRM - Deals.csv",
    requiredColumns: ["Id", "Stage", "Amount", "Created Time"],
    keyColumns: ["Stage", "Amount"],
    idColumn: "Id",
  },
  {
    path: "data/custom/Shifts Data - Shifts (Non protected).csv",
    requiredColumns: ["Shift Alias", "Shift Date", "Current Shift Status"],
    keyColumns: ["Shift Date", "Current Shift Status"],
    idColumn: "Shift Alias",
  },
  {
    path: "data/zoho/Zoho-Desk-Tickets.csv",
    requiredColumns: ["ID", "Status", "Channel", "Created Time"],
    keyColumns: ["Status", "Channel"],
    idColumn: "ID",
  },
];

export async function runPipelineV2(opts: PipelineV2Options): Promise<PipelineV2Result> {
  const repoRoot = getRepoRoot();
  const outDir = opts.outDir ?? join(repoRoot, "out");
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
  const runId = `run-${new Date().toISOString().slice(0, 19).replace(/[:-]/g, "")}Z-${randomUUID().slice(0, 8)}`;

  const decisionsPath = join(repoRoot, "data", "decision-catalogue", "decisions-v1.json");
  const decisionsDoc = JSON.parse(readFileSync(decisionsPath, "utf8")) as {
    decisions: CatalogueDecisionRow[];
  };

  // Step 1: Index knowledge bases for RAG retrieval
  setNamespace("pipeline-v2");
  const chunks = loadAllKnowledgeChunks();
  await indexChunks(chunks);

  // Step 1c: Data quality gate
  const qualityReports: FileQualityReport[] = [];
  for (const df of DATA_FILES) {
    const absPath = join(repoRoot, df.path);
    if (!existsSync(absPath)) continue;
    const report = checkFileQuality(absPath, df.requiredColumns, df.keyColumns, df.idColumn);
    qualityReports.push(report);
  }

  const qualityNotesByFile = new Map<string, QualityNote[]>();
  for (const r of qualityReports) {
    const notes: QualityNote[] = r.issues.map((issue) => ({
      level: r.level,
      message: issue,
    }));
    qualityNotesByFile.set(r.filePath, notes);
  }

  const blocked = qualityReports.filter((r) => r.level === "fail");
  if (blocked.length > 0) {
    const msg = blocked.map((r) => `${r.filePath}: ${r.issues.join("; ")}`).join("\n");
    throw new Error(`Data quality gate failed:\n${msg}`);
  }

  // Step 2: Per-user card generation
  const kpiSpec = JSON.parse(
    readFileSync(join(repoRoot, "data", "kpi-spec", "kpi-spec-v2.json"), "utf8"),
  ) as { kpis: { kpiId: string; title: string; unitHint: string }[] };
  const kpiMeta = new Map(kpiSpec.kpis.map((k) => [k.kpiId, k]));

  const userDecks: UserCardDeck[] = [];
  const step23Payload: Array<{ userId: string; kpis: ComputedKpi[]; titles: Map<string, string> }> = [];
  const llmEntries: Parameters<typeof buildStep4LlmCallsJson>[1] = [];
  const allTriggers: TriggeredDecisionRecommendation[] = [];

  for (const userId of opts.userIds) {
    const candidates = generateCandidates(userId);
    const sufficientCandidates = candidates.filter((c) => c.status === "sufficient");

    // Step 3: Compute real numbers for sufficient + org-wide recommended KPIs
    const computedKpis = computeAllForUser(userId);
    const computedMap = new Map(computedKpis.map((k) => [k.kpiId, k]));
    const displayValueMap = new Map(computedKpis.map((k) => [k.kpiId, k.displayValue]));

    const titles = new Map<string, string>();
    for (const k of computedKpis) {
      titles.set(k.kpiId, kpiMeta.get(k.kpiId)?.title ?? k.kpiId);
    }
    step23Payload.push({ userId, kpis: computedKpis, titles });

    allTriggers.push(...evaluateDecisionTriggers(userId, computedKpis, decisionsDoc.decisions));

    // Build cards for each sufficient KPI
    const cards: AnyCardV2[] = [];

    for (const candidate of sufficientCandidates) {
      const kpi = computedMap.get(candidate.kpiId);
      if (!kpi) continue;

      const meta = kpiMeta.get(candidate.kpiId);
      const title = meta?.title ?? candidate.title;
      const unitHint = meta?.unitHint ?? candidate.unitHint;
      const requestType = candidate.type;

      let whyRecommended: WhyRecommended | undefined;
      let recommendedRationale: string | undefined;
      if (requestType === "recommended") {
        whyRecommended = await buildWhyRecommendedRationale(candidate.kpiId, title, userId);
        recommendedRationale = whyRecommended.summary;
      }

      // Step 4: RAG-enhanced prompt assembly
      const prompts = await assemblePrompts(kpi, userId, title);

      // Step 5: LLM call (or stub)
      const analysisA = await generateAnalysis(prompts.versionA, opts.skipLlm);
      let synthesisA = await generateSynthesis(prompts.versionA, opts.skipLlm);
      let synthesisB = await generateSynthesis(prompts.versionB, opts.skipLlm);
      if (whyRecommended) {
        synthesisA = mergeWhyRecommendedIntoSynthesis(synthesisA, whyRecommended);
        synthesisB = mergeWhyRecommendedIntoSynthesis(synthesisB, whyRecommended);
      }

      // Cross-signal references
      const relatedSignals = getRelatedSignals(kpi.kpiId);

      // Quality notes for this card's source files
      const notes: QualityNote[] = [];
      for (const [, qn] of qualityNotesByFile) {
        notes.push(...qn);
      }

      const narrativeSource: "llm" | "fallback" =
        opts.skipLlm || !process.env.ANTHROPIC_API_KEY?.trim()
          ? "fallback"
          : "llm";

      llmEntries.push({
        userId,
        kpiId: candidate.kpiId,
        requestType,
        promptA: prompts.versionA,
        analysisA,
        synthesisA,
        synthesisB,
        skipLlm: Boolean(opts.skipLlm || !process.env.ANTHROPIC_API_KEY),
      });

      // Version A card
      cards.push(
        buildSignalCard(
          kpi,
          title,
          unitHint,
          "A",
          requestType,
          analysisA,
          synthesisA,
          relatedSignals,
          displayValueMap,
          prompts.versionA.retrievedContext.sources,
          notes,
          narrativeSource,
          recommendedRationale,
        ),
      );

      // Version B card
      cards.push(
        buildSignalCard(
          kpi,
          title,
          unitHint,
          "B",
          requestType,
          analysisA,
          synthesisB,
          relatedSignals,
          displayValueMap,
          prompts.versionB.retrievedContext.sources,
          notes,
          narrativeSource,
          recommendedRationale,
        ),
      );
    }

    // Step 6: Insufficient cards (Phase 2 RAG enrichment)
    const insufficientCards = generateAllInsufficientCards(userId);
    for (const ic of insufficientCards) {
      const enriched = await enrichInsufficientCardWithRag(ic, userId);
      cards.push(buildInsufficientCardV2(enriched, "A"));
    }

    userDecks.push({
      userId,
      generatedAt: new Date().toISOString(),
      cards,
    });
  }

  const output: PipelineOutputV2 = {
    runId,
    generatedAt: new Date().toISOString(),
    pipelineVersion: "2.0",
    users: userDecks,
    triggeredDecisionRecommendations: allTriggers,
  };

  // Write outputs
  writeFileSync(join(outDir, "pipeline-v2-output.json"), JSON.stringify(output, null, 2), "utf8");
  writeFileSync(
    join(outDir, "data-quality-report.json"),
    JSON.stringify({ reports: qualityReports }, null, 2),
    "utf8",
  );

  writeFileSync(
    join(outDir, "step-1c-data-quality.json"),
    JSON.stringify(buildStep1cDataQualityJson(repoRoot, runId, qualityReports), null, 2),
    "utf8",
  );
  writeFileSync(
    join(outDir, "step-2-3-computed.json"),
    JSON.stringify(buildStep23ComputedJson(repoRoot, runId, step23Payload), null, 2),
    "utf8",
  );
  writeFileSync(
    join(outDir, "step-4-llm-calls.json"),
    JSON.stringify(buildStep4LlmCallsJson(runId, llmEntries), null, 2),
    "utf8",
  );

  return { ok: true, output, qualityReports, outDir };
}

function mergeWhyRecommendedIntoSynthesis(
  base: SynthesisSection,
  why: WhyRecommended,
): SynthesisSection {
  const oneLine = why.summary.replace(/\s*\n+\s*/g, " ").trim();
  const short = oneLine.length > 280 ? `${oneLine.slice(0, 277)}…` : oneLine;
  return {
    ...base,
    chainOfThought: [`Why recommended: ${short}`, ...base.chainOfThought],
    citedBenchmarks: [...why.citedBenchmarks, ...base.citedBenchmarks],
  };
}

/**
 * Generate analysis from assembled prompt.
 * When no LLM is available, produces a structured stub from the prompt's computed data.
 */
async function generateAnalysis(
  prompt: AssembledPrompt,
  skipLlm?: boolean,
): Promise<AnalysisSection> {
  if (skipLlm || !process.env.ANTHROPIC_API_KEY) {
    return stubAnalysis(prompt);
  }
  return callLlmForAnalysis(prompt);
}

async function generateSynthesis(
  prompt: AssembledPrompt,
  skipLlm?: boolean,
): Promise<SynthesisSection> {
  if (skipLlm || !process.env.ANTHROPIC_API_KEY) {
    return stubSynthesis(prompt);
  }
  return callLlmForSynthesis(prompt);
}

function stubAnalysis(prompt: AssembledPrompt): AnalysisSection {
  const patternText = prompt.retrievedContext.kb3Patterns.join(" ").slice(0, 200);
  return {
    conclusion: `[Stub analysis for ${prompt.kpiId}] The metric has been computed from source data. See breakdowns for detail.`,
    chainOfThought: [
      `Computed ${prompt.kpiId} from deterministic formula`,
      `Retrieved ${prompt.retrievedContext.kb2Benchmarks.length} benchmark chunks`,
      `Analysis pattern: ${patternText || "none retrieved"}`,
    ],
  };
}

function stubSynthesis(prompt: AssembledPrompt): SynthesisSection {
  const isPersonal = prompt.version === "B";
  const benchmarkSnippet = prompt.retrievedContext.kb2Benchmarks[0]?.slice(0, 150) ?? "No benchmark available";
  const userSnippet = isPersonal
    ? (prompt.retrievedContext.kb1User[0]?.slice(0, 150) ?? "")
    : "";

  return {
    conclusion: isPersonal
      ? `[Stub synthesis — Personal] This metric connects to your specific goals. ${userSnippet}`
      : `[Stub synthesis — Org-level] Compare against industry benchmarks. ${benchmarkSnippet}`,
    chainOfThought: [
      `Version ${prompt.version}: ${isPersonal ? "personal + org context" : "org context only"}`,
      `Benchmarks retrieved: ${prompt.retrievedContext.kb2Benchmarks.length}`,
    ],
    citedBenchmarks: prompt.retrievedContext.kb2Benchmarks.length > 0
      ? [{
          claim: benchmarkSnippet.slice(0, 100),
          source: prompt.retrievedContext.sources.find((s) => s.kb === "kb2")?.sourcePath ?? "KB2",
        }]
      : [],
  };
}

async function callLlmForAnalysis(prompt: AssembledPrompt): Promise<AnalysisSection> {
  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  const client = new Anthropic();
  const model = process.env.ANTHROPIC_MODEL ?? "claude-3-5-sonnet-20241022";

  const resp = await client.messages.create({
    model,
    max_tokens: 1024,
    system: prompt.systemPrompt,
    messages: [{
      role: "user",
      content: `${prompt.userPrompt}\n\nRespond in JSON: { "conclusion": "2-3 sentences", "chainOfThought": ["step1", "step2", ...] }`,
    }],
  });

  const text = resp.content[0]?.type === "text" ? resp.content[0].text : "";
  try {
    const parsed = JSON.parse(text.replace(/^```json\s*/i, "").replace(/\s*```$/i, "")) as AnalysisSection;
    return parsed;
  } catch {
    return { conclusion: text.slice(0, 500), chainOfThought: ["LLM response parsed as plain text"] };
  }
}

async function callLlmForSynthesis(prompt: AssembledPrompt): Promise<SynthesisSection> {
  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  const client = new Anthropic();
  const model = process.env.ANTHROPIC_MODEL ?? "claude-3-5-sonnet-20241022";

  const resp = await client.messages.create({
    model,
    max_tokens: 1024,
    system: prompt.systemPrompt,
    messages: [{
      role: "user",
      content: `${prompt.userPrompt}\n\nRespond in JSON: { "conclusion": "2-3 sentences", "chainOfThought": ["step1", ...], "citedBenchmarks": [{"claim": "...", "source": "..."}] }`,
    }],
  });

  const text = resp.content[0]?.type === "text" ? resp.content[0].text : "";
  try {
    const parsed = JSON.parse(text.replace(/^```json\s*/i, "").replace(/\s*```$/i, "")) as SynthesisSection;
    return parsed;
  } catch {
    return {
      conclusion: text.slice(0, 500),
      chainOfThought: ["LLM response parsed as plain text"],
      citedBenchmarks: [],
    };
  }
}
