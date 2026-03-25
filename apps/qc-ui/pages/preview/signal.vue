<template>
  <div>
    <h1>Signal card (wireframe)</h1>
    <p class="muted">
      Content-first layout — not polished UX. Data from
      <code>fixtures/samples/signal-card-user-preview.json</code>.
    </p>
    <p v-if="error" class="err">{{ error }}</p>

    <article v-if="card" class="signal">
      <header class="signal-h">
        <p class="kpi-id">{{ card.overview.kpiId }}</p>
        <h2 class="title">{{ card.overview.title }}</h2>
        <p class="value">{{ card.overview.currentValue }}</p>
        <p v-if="card.overview.changeLabel" class="change">
          <span v-if="card.overview.changePct !== null && card.overview.changePct !== undefined">
            {{ card.overview.changePct }}% ·
          </span>
          {{ card.overview.changeLabel }}
        </p>
        <p class="summary">{{ card.overview.oneLineSummary }}</p>
      </header>

      <hr class="rule" />

      <section class="block">
        <h3>Analysis &amp; synthesis</h3>
        <p class="lead">{{ card.expanded.execSummary }}</p>
        <h4>Takeaway</h4>
        <ul>
          <li>{{ card.expanded.takeawayBreakdown.directionGoodOrBad }}</li>
          <li>{{ card.expanded.takeawayBreakdown.expectedOrUnexpected }}</li>
        </ul>
        <template v-if="card.expanded.benchmarkComparison">
          <h4>Benchmark</h4>
          <p>{{ card.expanded.benchmarkComparison }}</p>
        </template>
        <template v-if="card.expanded.rootCauseAnalysis">
          <h4>Root cause</h4>
          <p>{{ card.expanded.rootCauseAnalysis }}</p>
        </template>
        <template v-if="card.expanded.rootCauseRationale">
          <h4>Audit rationale (chain)</h4>
          <p class="mono">{{ card.expanded.rootCauseRationale }}</p>
        </template>
      </section>

      <details class="prov">
        <summary>What we found (provenance)</summary>
        <p class="small">Overview</p>
        <pre class="mono">{{ JSON.stringify(card.overview.provenance, null, 2) }}</pre>
        <p class="small">Expanded</p>
        <pre class="mono">{{ JSON.stringify(card.expanded.provenance, null, 2) }}</pre>
      </details>
    </article>
  </div>
</template>

<script setup lang="ts">
interface Overview {
  kpiId: string;
  title: string;
  currentValue: string;
  changePct: number | null;
  changeLabel: string;
  oneLineSummary: string;
  provenance: Record<string, unknown>;
}

interface Expanded {
  execSummary: string;
  takeawayBreakdown: { directionGoodOrBad: string; expectedOrUnexpected: string };
  benchmarkComparison?: string;
  rootCauseAnalysis?: string;
  rootCauseRationale?: string;
  provenance: Record<string, unknown>;
}

interface Card {
  overview: Overview;
  expanded: Expanded;
}

const { data: card, error } = await useFetch<Card>("/api/preview/signal");
</script>

<style scoped>
.muted {
  color: #71717a;
  font-size: 0.9rem;
}
.err {
  color: #b91c1c;
}
.signal {
  border: 2px solid #18181b;
  border-radius: 4px;
  padding: 1rem 1.25rem;
  margin-top: 1rem;
  max-width: 42rem;
  background: #fff;
}
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
.mono {
  font-family: ui-monospace, monospace;
  font-size: 0.75rem;
  overflow: auto;
}
.small {
  font-size: 0.8rem;
  color: #52525b;
}
</style>
