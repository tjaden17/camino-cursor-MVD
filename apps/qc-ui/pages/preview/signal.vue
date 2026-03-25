<template>
  <div>
    <h1>Signal preview</h1>
    <p class="muted">
      Wireframe UX to support UAT: switch user, browse cards, and validate provenance.
    </p>

    <section class="controls">
      <label class="block">
        User perspective
        <select v-model="userId" class="input" @change="onPerspectiveChange">
          <option value="surge">Surge</option>
          <option value="sam">Sam</option>
        </select>
      </label>

      <div class="nav">
        <button type="button" class="btn" :disabled="cardIndex <= 0" @click="prevCard">
          Prev
        </button>
        <span class="muted small">
          Card {{ cardIndex + 1 }} / {{ cardCount }}
          <span v-if="payload?.source">· {{ payload.source }}</span>
        </span>
        <button
          type="button"
          class="btn"
          :disabled="cardIndex >= cardCount - 1"
          @click="nextCard"
        >
          Next
        </button>
      </div>

      <div class="dots">
        <button
          v-for="i in cardCount"
          :key="i - 1"
          type="button"
          class="dot"
          :class="{ active: i - 1 === cardIndex }"
          @click="goToDot(i - 1)"
          :aria-label="`Go to card ${i}`"
        />
      </div>
    </section>

    <p v-if="error" class="err">{{ error }}</p>

    <article v-if="payload" class="signal">
      <header class="signal-h">
        <div class="badges">
          <span class="badge" :class="badgeClassRequest">{{ requestLabel }}</span>
          <span class="badge" :class="badgeClassData">{{ dataLabel }}</span>
        </div>

        <p class="kpi-id">{{ payload.overview.kpiId }}</p>
        <h2 class="title">{{ payload.overview.title }}</h2>
        <p class="value">{{ payload.overview.currentValue }}</p>
        <p v-if="payload.overview.changeLabel" class="change">
          <span
            v-if="
              payload.overview.changePct !== null && payload.overview.changePct !== undefined
            "
          >
            {{ payload.overview.changePct }}% ·
          </span>
          {{ payload.overview.changeLabel }}
        </p>
        <p class="summary">{{ payload.overview.oneLineSummary }}</p>
      </header>

      <section
        v-if="meta.recommendationRationale && meta.recommendationRationale.length"
        class="block why-rec"
      >
        <h3>Why it’s recommended</h3>
        <p class="lead">{{ meta.recommendationRationale }}</p>
      </section>

      <hr class="rule" />

      <section v-if="payload.expanded" class="block">
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
          <h4>Audit rationale (chain)</h4>
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
        <p class="small">Overview</p>
        <pre class="mono">{{ JSON.stringify(payload.overview.provenance, null, 2) }}</pre>
        <template v-if="payload.expanded">
          <p class="small">Expanded</p>
          <pre class="mono">{{ JSON.stringify(payload.expanded.provenance, null, 2) }}</pre>
        </template>
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

interface Insufficient {
  whyItMatters: string;
  missingData: string[];
  sourcingTips?: string[];
}

interface Payload {
  source?: string;
  userId?: string;
  cardIndex?: number;
  cardCount?: number;
  requestType?: string;
  dataSufficiency?: string;
  recommendationRationale?: string;
  overview: Overview;
  expanded?: Expanded;
  insufficient?: Insufficient;
}

const userId = ref("surge");
const cardIndex = ref(0);

// Production Nitro: explicit `refresh()` after changing refs — reliable after SSR hydration.
const { data: payload, error, refresh: refreshSignal } = await useAsyncData(
  "preview-signal",
  () =>
    $fetch<Payload>("/api/preview/signal", {
      query: {
        userId: userId.value,
        card: cardIndex.value,
      },
    }),
);

const cardCount = computed(() => Math.max(1, payload.value?.cardCount ?? 1));

async function onPerspectiveChange() {
  cardIndex.value = 0;
  await refreshSignal();
}

async function prevCard() {
  cardIndex.value = Math.max(0, cardIndex.value - 1);
  await refreshSignal();
}

async function nextCard() {
  cardIndex.value = Math.min(cardCount.value - 1, cardIndex.value + 1);
  await refreshSignal();
}

async function goToDot(i: number) {
  cardIndex.value = i;
  await refreshSignal();
}

const meta = computed(() => ({
  requestType: payload.value?.requestType ?? "requested",
  dataSufficiency: payload.value?.dataSufficiency ?? "sufficient",
  recommendationRationale: payload.value?.recommendationRationale ?? "",
}));

const requestLabel = computed(() =>
  meta.value.requestType === "recommended" ? "Recommended" : "Requested",
);

const dataLabel = computed(() =>
  meta.value.dataSufficiency === "sufficient" ? "Sufficient data" : "Insufficient data",
);

const badgeClassRequest = computed(() =>
  meta.value.requestType === "recommended" ? "ok" : "info",
);

const badgeClassData = computed(() =>
  meta.value.dataSufficiency === "sufficient" ? "ok" : "bad",
);
</script>

<style scoped>
.muted {
  color: #71717a;
  font-size: 0.9rem;
}
.small {
  font-size: 0.8rem;
}
.err {
  color: #b91c1c;
}
.controls {
  margin-top: 0.75rem;
  border: 1px solid #e4e4e7;
  border-radius: 8px;
  padding: 0.75rem;
  max-width: 42rem;
  background: #fff;
}
.nav {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  justify-content: space-between;
  margin-top: 0.75rem;
}
.btn {
  padding: 0.35rem 0.7rem;
  cursor: pointer;
}
.btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
.block {
  display: block;
  margin-top: 0.5rem;
}
.input {
  display: block;
  width: 100%;
  max-width: 220px;
  margin-top: 0.25rem;
}
.dots {
  display: flex;
  gap: 0.35rem;
  margin-top: 0.75rem;
  flex-wrap: wrap;
}
.dot {
  width: 12px;
  height: 12px;
  border-radius: 999px;
  border: 1px solid #a1a1aa;
  background: #fff;
  cursor: pointer;
}
.dot.active {
  background: #166534;
  border-color: #166534;
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
</style>
