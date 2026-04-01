/**
 * Phase 3 — KB2 + KB1 + KB3 retrieval for "why we're recommending this KPI" copy on sufficient cards.
 */
import { retrieve } from "../../rag/index.js";

export interface WhyRecommended {
  /** Full multi-paragraph rationale for UI and merge into synthesis CoT. */
  summary: string;
  citedBenchmarks: { claim: string; source: string }[];
}

function trimSnippet(text: string, max: number): string {
  const t = text.replace(/\s+/g, " ").trim();
  return t.length <= max ? t : `${t.slice(0, max - 1)}…`;
}

/**
 * Builds rationale: why the KPI matters, leading-indicator framing, and lever — plus benchmarks.
 */
export async function buildWhyRecommendedRationale(
  kpiId: string,
  title: string,
  userId: string,
): Promise<WhyRecommended> {
  const kb2 = await retrieve(`${title} SaaS benchmark healthy typical range why track`, 4, { kb: "kb2" });
  const kb1 = await retrieve(
    userId.toLowerCase() === "sam"
      ? `Sam customer success priorities ${title}`
      : `Surge CEO sales priorities ${title}`,
    3,
    { kb: "kb1" },
  );
  const kb3 = await retrieve(
    `${title} KPI leading indicator operational lever what to watch ${kpiId}`,
    4,
    { kb: "kb3" },
  );

  const cited: { claim: string; source: string }[] = [];

  let benchmarkLine = "";
  for (const r of kb2.slice(0, 2)) {
    const claim = trimSnippet(r.chunk.text, 220);
    benchmarkLine = benchmarkLine ? `${benchmarkLine} ${claim}` : claim;
    cited.push({
      claim,
      source: `${r.chunk.sourcePath} — ${r.chunk.heading}`,
    });
  }

  const personal =
    kb1.length > 0 ? trimSnippet(kb1[0]!.chunk.text, 220) : "";

  const playbook =
    kb3.length > 0 ? trimSnippet(kb3[0]!.chunk.text, 280) : "";

  const whyMatters =
    benchmarkLine ||
    `${title} is a standard signal for your stage — tracking it reduces blind spots in pipeline and customer motion.`;

  const leading =
    playbook ||
    `Movements in ${title} often show up before revenue and retention shift — use it as an early check on whether your motion is healthy.`;

  const lever =
    personal ||
    `Focusing here helps you decide where to spend limited sales and CS time this quarter.`;

  const summary = [
    `Why this KPI matters`,
    whyMatters,
    ``,
    `Leading indicator`,
    leading,
    ``,
    `Lever / what to watch`,
    lever,
  ].join("\n");

  return { summary: summary.slice(0, 1200), citedBenchmarks: cited };
}
