<template>
  <div>
    <h1>Org context &amp; strategy catalogue (v1.1)</h1>
    <p class="muted">
      Secondary validation surface (Decision 4): full <strong>12 KPIs + 6 decisions</strong> from the pipeline,
      not the signal preview deck.
    </p>
    <p class="muted">
      Source: <code>{{ data?.source }}</code>
    </p>
    <p v-if="error" class="err">{{ error.message }}</p>

    <section v-if="data?.org" class="card">
      <h2>Org merge</h2>
      <pre class="pre">{{ JSON.stringify(data.org, null, 2) }}</pre>
    </section>

    <section v-if="data?.strategyCatalogue" class="card">
      <h2>Strategy catalogue</h2>
      <pre class="pre">{{ JSON.stringify(data.strategyCatalogue, null, 2) }}</pre>
    </section>
    <p v-else-if="data && !data.strategyCatalogue" class="muted">No strategy-catalogue.json in out/ yet.</p>
  </div>
</template>

<script setup lang="ts">
const { data, error } = await useFetch("/api/transparency/org-context");
</script>

<style scoped>
.muted {
  color: #71717a;
  font-size: 0.9rem;
}
.small {
  font-size: 0.85rem;
}
.card {
  border: 1px solid #e4e4e7;
  border-radius: 8px;
  padding: 0.75rem;
  margin-top: 0.75rem;
  background: #fff;
}
.pre {
  overflow: auto;
  font-size: 0.75rem;
  max-height: 70vh;
}
.err {
  color: #b91c1c;
}
</style>
