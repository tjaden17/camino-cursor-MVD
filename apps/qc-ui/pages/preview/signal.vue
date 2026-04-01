<template>
  <div>
    <nav class="tabs" aria-label="Preview navigation">
      <NuxtLink to="/preview/signal" class="tab" active-class="active">Signal preview</NuxtLink>
      <NuxtLink
        to="/transparency/recommendations"
        class="tab"
        active-class="active"
      >User context</NuxtLink>
      <NuxtLink
        to="/transparency/kpi-dictionary"
        class="tab"
        active-class="active"
      >KPI calcs</NuxtLink>
    </nav>
    <h1>Signal preview</h1>
    <p class="muted">
      Wireframe UX to support UAT: switch user, browse cards, and validate provenance.
    </p>

    <section class="controls">
      <p class="muted small">
        Pipeline v2 only: <code>out/pipeline-v2-output.json</code> if present, otherwise
        <code>out/test-e2e-v2/pipeline-v2-output.json</code> (e.g.
        <code>npm run test -- src/pipeline/stages/run-pipeline-v2.test.ts</code>).
      </p>

      <label class="block">
        User perspective
        <select class="input" :value="userFromRoute" @change="onUserSelect($event)">
          <option value="surge">Surge</option>
          <option value="sam">Sam</option>
        </select>
      </label>

      <label class="block">
        Layout
        <select class="input" :value="viewAll ? 'all' : 'one'" @change="onLayoutSelect($event)">
          <option value="one">One card (prev/next)</option>
          <option value="all">All cards (scroll)</option>
        </select>
      </label>
      <label v-if="viewAll" class="block">
        Synthesis version
        <select class="input" :value="deckVersionFromRoute" @change="onVersionSelect($event)">
          <option value="A">A — org-level tone</option>
          <option value="B">B — personal tone</option>
        </select>
      </label>

      <p class="muted small">
        Or jump directly:
        <a
          class="inline-link"
          :href="buildHref('surge', 0)"
          @click.prevent="goTo('surge', 0)"
        >Surge</a>
        ·
        <a
          class="inline-link"
          :href="buildHref('sam', 0)"
          @click.prevent="goTo('sam', 0)"
        >Sam</a>
      </p>

      <div v-if="!isDeckView" class="nav">
        <a
          v-if="cardIdx > 0"
          class="btn"
          :href="buildHref(userFromRoute, cardIdx - 1)"
          @click.prevent="goTo(userFromRoute, cardIdx - 1)"
        >
          Prev
        </a>
        <span v-else class="btn btn-disabled" aria-disabled="true">Prev</span>
        <span class="muted small">
          Card {{ cardIdx + 1 }} / {{ cardCount }}
          <span v-if="payload?.source">· {{ payload.source }}</span>
        </span>
        <a
          v-if="cardIdx < cardCount - 1"
          class="btn"
          :href="buildHref(userFromRoute, cardIdx + 1)"
          @click.prevent="goTo(userFromRoute, cardIdx + 1)"
        >
          Next
        </a>
        <span v-else class="btn btn-disabled" aria-disabled="true">Next</span>
      </div>

      <div v-if="!isDeckView" class="dots">
        <a
          v-for="i in cardCount"
          :key="i - 1"
          class="dot"
          :class="{ active: i - 1 === cardIdx }"
          :href="buildHref(userFromRoute, i - 1)"
          :aria-label="`Go to card ${i}`"
          :aria-current="i - 1 === cardIdx ? 'true' : undefined"
          @click.prevent="goTo(userFromRoute, i - 1)"
        />
      </div>

      <p v-if="!isDeckView && cardCount <= 1" class="muted small hint">
        <strong>Only one card</strong> in the loaded v2 deck. If you expected more, re-run the v2 pipeline so
        <code>pipeline-v2-output.json</code> includes the full user deck.
      </p>
    </section>

    <p v-if="error" class="err">{{ error }}</p>
    <p v-if="deckError" class="err">{{ deckError }}</p>
    <p v-if="isDeckView && deckPending" class="muted">Loading full deck…</p>

    <template v-if="isDeckView && deckPayload?.cards?.length">
      <p class="muted small">
        Showing {{ deckPayload.cards.length }} cards · {{ deckPayload.source }} · run
        {{ deckPayload.runId ?? "—" }}
      </p>
      <article v-for="(pl, di) in deckPayload.cards" :key="di" class="signal deck-card">
        <SignalCardBody :payload="pl" />
      </article>
    </template>

    <article v-else-if="payload" class="signal">
      <SignalCardBody :payload="payload" />
    </article>
  </div>
</template>

<script setup lang="ts">
import type { SignalPreviewPayload } from "~/types/signal-preview";

const route = useRoute();

const userFromRoute = computed(() => {
  const u = String(route.query.userId ?? "surge").toLowerCase();
  return u === "sam" ? "sam" : "surge";
});

const cardIdx = computed(() => {
  const n = Number(route.query.card);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.floor(n);
});

const viewAll = computed(() => String(route.query.view ?? "").toLowerCase() === "all");

const deckVersionFromRoute = computed(() =>
  String(route.query.version ?? "A").toUpperCase() === "B" ? "B" : "A",
);

const isDeckView = computed(() => viewAll.value);

const { data: payload, error } = await useAsyncData(
  () => `preview-signal:${route.fullPath}`,
  async () => {
    if (viewAll.value) return null;
    return await $fetch<SignalPreviewPayload>("/api/preview/signal", {
      query: {
        userId: userFromRoute.value,
        card: cardIdx.value,
      },
    });
  },
);

const cardCount = computed(() => Math.max(1, payload.value?.cardCount ?? 1));

type DeckResponse = {
  cards: SignalPreviewPayload[];
  runId: string | null;
  source: string;
  cardVersion: string;
};

const deckPayload = ref<DeckResponse | null>(null);
const deckError = ref<string | null>(null);
const deckPending = ref(false);

async function loadDeck() {
  deckError.value = null;
  if (!isDeckView.value) {
    deckPayload.value = null;
    return;
  }
  deckPending.value = true;
  try {
    deckPayload.value = await $fetch<DeckResponse>("/api/preview/signal-deck", {
      query: { userId: userFromRoute.value, version: deckVersionFromRoute.value },
    });
  } catch (e) {
    deckPayload.value = null;
    deckError.value =
      e && typeof e === "object" && "statusMessage" in e
        ? String((e as { statusMessage?: string }).statusMessage)
        : "Could not load deck";
  } finally {
    deckPending.value = false;
  }
}

watch(() => route.fullPath, loadDeck, { immediate: true });

function buildHref(userId: string, card: number): string {
  const u = userId === "sam" ? "sam" : "surge";
  const c = Math.max(0, Math.floor(card));
  const qs = new URLSearchParams({ userId: u, card: String(c) });
  if (viewAll.value) {
    qs.set("view", "all");
    qs.set("version", deckVersionFromRoute.value);
  }
  return `${route.path}?${qs.toString()}`;
}

function goTo(userId: string, card: number) {
  if (import.meta.client) {
    window.location.assign(buildHref(userId, card));
  }
}

function applyQueryFromControls(partial: {
  userId?: string;
  card?: string;
  view?: "all";
  version?: string;
}) {
  const qs = new URLSearchParams();
  qs.set("userId", partial.userId ?? userFromRoute.value);
  qs.set("card", partial.card ?? "0");
  if (partial.view === "all") {
    qs.set("view", "all");
    qs.set("version", partial.version ?? deckVersionFromRoute.value);
  }
  if (import.meta.client) {
    window.location.assign(`${route.path}?${qs.toString()}`);
  }
}

function onUserSelect(ev: Event) {
  const v = (ev.target as HTMLSelectElement).value;
  const userId = v === "sam" ? "sam" : "surge";
  applyQueryFromControls({
    userId,
    card: "0",
    ...(viewAll.value ? { view: "all" as const, version: deckVersionFromRoute.value } : {}),
  });
}

function onLayoutSelect(ev: Event) {
  const v = (ev.target as HTMLSelectElement).value;
  applyQueryFromControls({
    userId: userFromRoute.value,
    card: "0",
    ...(v === "all" ? { view: "all", version: deckVersionFromRoute.value } : {}),
  });
}

function onVersionSelect(ev: Event) {
  const ver = (ev.target as HTMLSelectElement).value === "B" ? "B" : "A";
  applyQueryFromControls({
    userId: userFromRoute.value,
    card: "0",
    view: "all",
    version: ver,
  });
}
</script>

<style scoped>
.tabs {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin: 0.25rem 0 1rem;
}
.tab {
  padding: 0.35rem 0.7rem;
  text-decoration: none;
  color: inherit;
  border: 1px solid #a1a1aa;
  border-radius: 999px;
  background: #fafafa;
  box-sizing: border-box;
}
.tab.active {
  background: #166534;
  border-color: #166534;
  color: #fff;
}
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
  text-decoration: none;
  color: inherit;
  border: 1px solid #a1a1aa;
  border-radius: 6px;
  background: #fafafa;
  font: inherit;
  display: inline-block;
  box-sizing: border-box;
}
a.btn:hover {
  background: #f4f4f5;
}
.btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
.btn-disabled {
  opacity: 0.55;
  cursor: not-allowed;
  pointer-events: none;
}
.inline-link {
  color: #3730a3;
}
.inline-link:hover {
  text-decoration: underline;
}
.hint {
  margin-top: 0.75rem;
  max-width: 42rem;
  line-height: 1.45;
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
  text-decoration: none;
  display: inline-block;
  box-sizing: border-box;
  vertical-align: middle;
}
a.dot:hover {
  border-color: #52525b;
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
.signal.deck-card {
  margin-top: 1.5rem;
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
