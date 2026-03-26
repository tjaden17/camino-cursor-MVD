<template>
  <div>
    <h1>KPI calculation dictionary</h1>
    <p class="muted">
      Shared-org assumption: <strong>{{ data?.sharedOrgAssumption ? "on" : "off" }}</strong>
      · Source: <code>{{ data?.source }}</code>
    </p>
    <p v-if="error" class="err">{{ error.message }}</p>

    <section v-for="e in data?.entries ?? []" :key="e.kpiId" class="card">
      <div class="row">
        <h2>{{ e.title }}</h2>
        <span class="badge" :class="e.status">{{ e.status }}</span>
      </div>
      <p><code>{{ e.kpiId }}</code></p>
      <p class="small"><strong>Unit:</strong> {{ e.unitHint }}</p>
      <p class="small"><strong>Rule:</strong> <code>{{ e.ruleId }}</code></p>
      <p class="small"><strong>Source:</strong> <code>{{ e.sourceId }}</code></p>
      <p class="small"><strong>Formula summary:</strong> {{ e.formulaSummary }}</p>
      <p class="small">
        <strong>Cards in current deck:</strong> {{ e.traceability.cardCountInDeck }} ·
        <a
          :href="`${e.traceability.previewPath}?userId=${e.traceability.previewUserId}&card=${e.traceability.previewCardIndex}`"
        >
          open preview
        </a>
      </p>
    </section>
  </div>
</template>

<script setup lang="ts">
const { data, error } = await useFetch("/api/transparency/kpi-dictionary");
</script>

<style scoped>
.muted { color: #71717a; }
.small { font-size: 0.9rem; }
.card { border: 1px solid #e4e4e7; border-radius: 8px; padding: 0.75rem; margin-top: 0.75rem; background: #fff; }
.row { display: flex; align-items: center; gap: 0.5rem; }
.badge { font-size: 0.7rem; padding: 0.1rem 0.35rem; border-radius: 4px; text-transform: uppercase; }
.badge.replayed { background: #dcfce7; color: #166534; }
.badge.proxy { background: #fef9c3; color: #854d0e; }
.badge.illustrative { background: #fee2e2; color: #991b1b; }
.err { color: #b91c1c; }
</style>
