<template>
  <header class="signal-h">
    <div class="badges">
      <span class="badge" :class="badgeClassRequest">{{ requestLabel }}</span>
      <span class="badge" :class="badgeClassData">{{ dataLabel }}</span>
      <span class="badge" :class="badgeClassNarrative">Narrative: {{ narrativeLabel }}</span>
      <span v-if="payload.cardVersion" class="badge info">Synthesis {{ payload.cardVersion }}</span>
    </div>

    <p class="kpi-id">{{ payload.overview.kpiId }}</p>
    <h2 class="title">{{ payload.overview.title }}</h2>
    <p v-if="payload.dataFreshnessLine" class="muted small data-fresh">
      {{ payload.dataFreshnessLine }}
    </p>
    <p class="value">{{ payload.overview.currentValue }}</p>
    <p v-if="payload.overview.changeLabel" class="change">
      <span
        v-if="payload.overview.changePct !== null && payload.overview.changePct !== undefined"
      >
        {{ payload.overview.changePct }}% ·
      </span>
      {{ payload.overview.changeLabel }}
    </p>
    <p class="summary">{{ payload.overview.oneLineSummary }}</p>
  </header>

  <section
    v-if="recommendationRationale && recommendationRationale.length"
    class="block why-rec"
  >
    <h3>Why it’s recommended</h3>
    <div class="lead rationale-blocks">{{ recommendationRationale }}</div>
  </section>

  <hr class="rule" />

  <!-- Pipeline v2: structured analysis / synthesis (preferred) -->
  <template v-if="hasV2Sections">
    <section class="block analysis-block">
      <h3>Analysis</h3>
      <p class="lead section-lead">What the data shows</p>
      <p v-if="payload.analysisSection?.conclusion" class="lead">
        {{ payload.analysisSection.conclusion }}
      </p>
      <ul v-if="payload.analysisSection?.chainOfThought?.length" class="cot-list">
        <li v-for="(line, idx) in payload.analysisSection.chainOfThought" :key="idx">
          {{ line }}
        </li>
      </ul>
    </section>

    <section class="block synthesis-block">
      <h3>Synthesis</h3>
      <p class="lead section-lead">So what / benchmarks</p>
      <p v-if="payload.synthesisSection?.conclusion" class="lead">
        {{ payload.synthesisSection.conclusion }}
      </p>
      <template v-if="payload.synthesisSection?.citedBenchmarksDisplay">
        <h4>Benchmarks</h4>
        <p class="lead bench">{{ payload.synthesisSection.citedBenchmarksDisplay }}</p>
      </template>
      <ul v-if="payload.synthesisSection?.chainOfThought?.length" class="cot-list">
        <li v-for="(line, idx) in payload.synthesisSection.chainOfThought" :key="idx">
          {{ line }}
        </li>
      </ul>
    </section>

    <section v-if="payload.retrievedSourcesPreview?.length" class="block sources-block">
      <h3>Sources used for this card</h3>
      <p class="muted small">
        RAG retrieval (knowledge base chunks). Snippets also appear in the narrative above.
      </p>
      <ul class="source-list">
        <li v-for="(s, idx) in payload.retrievedSourcesPreview" :key="idx">
          <span class="src-kb">{{ s.kb }}</span>
          <span class="src-path">{{ s.sourcePath }}</span>
          <span v-if="s.heading" class="src-head"> — {{ s.heading }}</span>
        </li>
      </ul>
      <p v-if="payload.llmCallsArtifactHint" class="muted small hint-file">
        {{ payload.llmCallsArtifactHint }}
      </p>
    </section>
  </template>

  <!-- Legacy flat expanded (v1-style payloads) -->
  <section v-else-if="payload.expanded" class="block">
    <h3>Analysis &amp; synthesis</h3>
    <p class="lead">{{ payload.expanded.execSummary }}</p>
    <h4>Takeaway</h4>
    <ul>
      <li>{{ payload.expanded.takeawayBreakdown.directionGoodOrBad }}</li>
      <li>{{ payload.expanded.takeawayBreakdown.expectedOrUnexpected }}</li>
    </ul>

    <template v-if="payload.expanded.benchmarkComparison">
      <h4>Benchmark</h4>
      <p>{{ payload.expanded.benchmarkComparison }}</p>
    </template>
    <template v-if="payload.expanded.rootCauseAnalysis">
      <h4>Root cause</h4>
      <p>{{ payload.expanded.rootCauseAnalysis }}</p>
    </template>
    <template v-if="payload.expanded.rootCauseRationale">
      <h4>Chain of thought</h4>
      <p class="mono">{{ payload.expanded.rootCauseRationale }}</p>
    </template>
  </section>

  <section v-else-if="payload.insufficient" class="block">
    <h3>What’s missing</h3>
    <p class="lead">{{ payload.insufficient.whyItMatters }}</p>

    <h4>Missing data</h4>
    <ul>
      <li v-for="(m, idx) in payload.insufficient.missingData" :key="idx">
        {{ m }}
      </li>
    </ul>

    <template v-if="payload.insufficient.sourcingTips?.length">
      <h4>How to source it</h4>
      <ul>
        <li v-for="(t, idx) in payload.insufficient.sourcingTips" :key="idx">
          {{ t }}
        </li>
      </ul>
    </template>
  </section>

  <details class="prov">
    <summary>What we found (provenance)</summary>

    <template v-if="payload.qualityNotesForUi?.length">
      <h4 class="dq-title">Data quality (this run)</h4>
      <p class="muted small">
        Notes from the input file quality gate. Same entries are included in the JSON below.
      </p>
      <ul class="dq-list">
        <li v-for="(n, idx) in payload.qualityNotesForUi" :key="idx" :class="`dq-${n.level}`">
          <strong>{{ n.level }}</strong>: {{ n.message }}
        </li>
      </ul>
    </template>

    <p class="small">Overview (raw)</p>
    <pre class="mono">{{ JSON.stringify(payload.overview.provenance, null, 2) }}</pre>
    <template v-if="payload.expanded">
      <p class="small">Expanded (raw)</p>
      <pre class="mono">{{ JSON.stringify(payload.expanded.provenance, null, 2) }}</pre>
    </template>
  </details>
</template>

<script setup lang="ts">
import type { SignalPreviewPayload } from "~/types/signal-preview";

const props = defineProps<{ payload: SignalPreviewPayload }>();

const recommendationRationale = computed(
  () => props.payload.recommendationRationale ?? "",
);

const hasV2Sections = computed(
  () =>
    Boolean(
      props.payload.analysisSection &&
        props.payload.synthesisSection &&
        props.payload.dataSufficiency === "sufficient",
    ),
);

const requestLabel = computed(() =>
  props.payload.requestType === "recommended" ? "Recommended" : "Requested",
);

const dataLabel = computed(() =>
  props.payload.dataSufficiency === "sufficient" ? "Sufficient data" : "Insufficient data",
);

const narrativeLabel = computed(() =>
  props.payload.narrativeSource === "llm" ? "LLM" : "Stub/Fallback",
);

const badgeClassRequest = computed(() =>
  props.payload.requestType === "recommended" ? "ok" : "info",
);

const badgeClassData = computed(() =>
  props.payload.dataSufficiency === "sufficient" ? "ok" : "bad",
);

const badgeClassNarrative = computed(() =>
  props.payload.narrativeSource === "llm" ? "info" : "bad",
);
</script>

<style scoped>
.signal-h .kpi-id {
  font-size: 0.75rem;
  color: #71717a;
  margin: 0;
}
.title {
  margin: 0.25rem 0 0;
  font-size: 1.35rem;
}
.value {
  font-size: 2rem;
  font-weight: 700;
  margin: 0.5rem 0 0;
}
.change {
  margin: 0.25rem 0 0;
  color: #3f3f46;
}
.summary {
  margin: 0.75rem 0 0;
  line-height: 1.45;
}
.muted {
  color: #71717a;
  font-size: 0.9rem;
}
.small {
  font-size: 0.8rem;
}
.rule {
  border: none;
  border-top: 1px solid #e4e4e7;
  margin: 1rem 0;
}
.block h3 {
  margin: 0 0 0.5rem;
  font-size: 1.1rem;
}
.block h4 {
  margin: 0.75rem 0 0.25rem;
  font-size: 0.95rem;
}
.lead {
  line-height: 1.5;
}
.section-lead {
  font-size: 0.85rem;
  color: #52525b;
  margin: 0 0 0.35rem;
}
.rationale-blocks {
  white-space: pre-line;
}
.analysis-block,
.synthesis-block,
.sources-block {
  margin-bottom: 1rem;
}
.cot-list {
  margin: 0.5rem 0 0;
  padding-left: 1.25rem;
}
.cot-list li {
  margin-bottom: 0.35rem;
  line-height: 1.45;
}
.bench {
  white-space: pre-line;
}
.source-list {
  margin: 0.35rem 0 0;
  padding-left: 1.1rem;
  font-size: 0.9rem;
  line-height: 1.45;
}
.src-kb {
  font-weight: 600;
  margin-right: 0.35rem;
}
.src-path {
  color: #52525b;
}
.hint-file {
  margin-top: 0.5rem;
}
ul {
  margin: 0.25rem 0 0;
  padding-left: 1.25rem;
}
.prov {
  margin-top: 1.25rem;
  padding: 0.5rem;
  background: #fafafa;
  border: 1px solid #e4e4e7;
  border-radius: 4px;
}
.dq-title {
  margin: 0.5rem 0 0.25rem;
  font-size: 0.95rem;
}
.dq-list {
  list-style: none;
  padding-left: 0;
  margin: 0.35rem 0 0.75rem;
}
.dq-list li {
  margin-bottom: 0.35rem;
  font-size: 0.88rem;
  line-height: 1.4;
}
.dq-pass {
  color: #166534;
}
.dq-warn {
  color: #a16207;
}
.dq-fail {
  color: #991b1b;
}
.mono {
  font-family: ui-monospace, monospace;
  font-size: 0.75rem;
  overflow: auto;
}
.badge {
  font-size: 0.7rem;
  font-weight: 600;
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
  display: inline-block;
}
.badges {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  flex-wrap: wrap;
}
.ok {
  background: #dcfce7;
  color: #166534;
}
.bad {
  background: #fee2e2;
  color: #991b1b;
}
.info {
  background: #eef2ff;
  color: #3730a3;
}
</style>
