/**
 * Phase 2 — Enrich insufficient-data cards with KB2 (why the metric matters + citations)
 * and KB1 (user-specific decision context). Export instructions stay deterministic from
 * `insufficient-cards.ts`; this layer adds RAG-grounded paragraphs.
 */
import { retrieve } from "../../rag/index.js";
import type { RetrievalResult } from "../../rag/types.js";
import type { InsufficientCard, RagSourceSnippet } from "./insufficient-cards.js";

export type { RagSourceSnippet };

function formatTopChunks(results: RetrievalResult[], maxChars: number): { text: string; sources: RagSourceSnippet[] } {
  const sources: RagSourceSnippet[] = [];
  const parts: string[] = [];
  for (const r of results) {
    const excerpt = r.chunk.text.replace(/\s+/g, " ").trim().slice(0, 400);
    sources.push({
      kb: r.chunk.kb,
      sourcePath: r.chunk.sourcePath,
      heading: r.chunk.heading,
      excerpt,
      relevanceScore: 1 - r.distance,
    });
    parts.push(excerpt);
    if (parts.join(" ").length >= maxChars) break;
  }
  return { text: parts.join("\n\n"), sources };
}

/**
 * Retrieves KB2 benchmarks/context for why this KPI class matters, and KB1 snippets
 * tying the gap to the user's role and decisions.
 */
export async function enrichInsufficientCardWithRag(
  card: InsufficientCard,
  userId: string,
): Promise<InsufficientCard> {
  const title = card.title;
  const kb2Query = `benchmarks ${title} metric importance SaaS support sales health why track`;
  const kb1Query =
    userId.toLowerCase() === "sam"
      ? `Sam customer success decisions priorities ${title} metric`
      : `Surge CEO goals decisions ${title} pipeline`;

  const kb2Results = await retrieve(kb2Query, 4, { kb: "kb2" });
  const kb1Results = await retrieve(kb1Query, 3, { kb: "kb1" });

  const domain = formatTopChunks(kb2Results, 1200);
  const personal = formatTopChunks(kb1Results, 800);

  const domainContextParagraph =
    domain.text.length > 0
      ? `Why this metric matters (from knowledge base): ${domain.text.slice(0, 900)}` +
        (domain.sources[0]
          ? ` — Source: ${domain.sources[0]!.sourcePath} (${domain.sources[0]!.heading}).`
          : "")
      : "Why this metric matters: industry context could not be retrieved; rely on the formula description above.";

  const userDecisionParagraph =
    personal.text.length > 0
      ? `How this gap connects to your decisions: ${personal.text.slice(0, 700)}` +
        (personal.sources[0] ? ` — See: ${personal.sources[0]!.sourcePath}.` : "")
      : `Decision link: ${card.decisionLink}`;

  const retrievedKbSources = [...domain.sources, ...personal.sources];

  return {
    ...card,
    domainContextParagraph,
    userDecisionParagraph,
    retrievedKbSources,
  };
}
