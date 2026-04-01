<template>
  <div>
    <h1>Computed numbers</h1>
    <p class="muted">Formula outputs per user (<code>step-2-3-computed.json</code>)</p>
    <p v-if="error" class="err">{{ String(error) }}</p>
    <template v-else-if="data">
      <p class="small muted">Run ID: {{ data.runId }}</p>
      <section v-for="u in data.users" :key="u.userId" class="block">
        <h2>User: {{ u.userId }}</h2>
        <article v-for="k in u.kpis" :key="k.kpiId" class="card">
          <h3>{{ k.title }} <span class="kid">({{ k.kpiId }})</span></h3>
          <p>
            <strong>Current:</strong>
            {{ k.result?.currentValue }} · trend {{ k.result?.trend }} · delta {{ k.result?.delta }}
          </p>
          <p class="small">
            <strong>Source file:</strong>
            {{ k.source?.file }} · {{ k.source?.rowsUsed }} rows · freshness {{ k.source?.freshness }}
          </p>
          <p class="small mono">{{ k.formula?.description }}</p>
        </article>
      </section>
    </template>
    <p v-else-if="pending">Loading…</p>
  </div>
</template>

<script setup lang="ts">
const { data, pending, error } = await useFetch("/api/inspect/computed");
</script>

<style scoped>
h1 {
  font-size: 1.35rem;
}
h2 {
  font-size: 1.1rem;
  margin-top: 1rem;
}
h3 {
  font-size: 1rem;
  margin: 0 0 0.35rem;
}
.kid {
  font-weight: 400;
  color: #71717a;
  font-size: 0.85rem;
}
.muted {
  color: #71717a;
}
.small {
  font-size: 0.85rem;
}
.mono {
  font-family: ui-monospace, monospace;
}
.block {
  margin-top: 0.5rem;
}
.card {
  border: 1px solid #e4e4e7;
  border-radius: 8px;
  padding: 0.75rem;
  margin-top: 0.5rem;
  background: #fff;
}
.err {
  color: #b91c1c;
}
</style>
