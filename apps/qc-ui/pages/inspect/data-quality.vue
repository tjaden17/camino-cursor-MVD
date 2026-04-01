<template>
  <div>
    <h1>Data quality</h1>
    <p class="muted">Did the input files pass our checks? (from <code>step-1c-data-quality.json</code>)</p>
    <p v-if="error" class="err">{{ String(error) }}</p>
    <template v-else-if="data">
      <p>
        {{ data.summary?.filesChecked ?? 0 }} files · {{ data.summary?.passed ?? 0 }} passed ·
        {{ data.summary?.warnings ?? 0 }} warnings · {{ data.summary?.failures ?? 0 }} failures
      </p>
      <p class="small muted">Run ID: {{ data.runId }}</p>
      <article v-for="(f, i) in data.files" :key="i" class="card">
        <h2>{{ f.fileName }}</h2>
        <p class="small">{{ f.filePath }} · {{ f.recordCount }} rows · status: {{ f.status }}</p>
        <ul v-if="f.issues?.length">
          <li v-for="(iss, j) in f.issues" :key="j">
            <strong>{{ iss.severity }}</strong>
            — {{ iss.detail }}
            <span v-if="iss.impact" class="muted">({{ iss.impact }})</span>
          </li>
        </ul>
        <p v-else class="muted">No issues listed.</p>
      </article>
    </template>
    <p v-else-if="pending">Loading…</p>
  </div>
</template>

<script setup lang="ts">
const { data, pending, error } = await useFetch("/api/inspect/data-quality");
</script>

<style scoped>
h1 {
  font-size: 1.35rem;
}
h2 {
  font-size: 1rem;
  margin: 0 0 0.35rem;
}
.muted {
  color: #71717a;
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
.err {
  color: #b91c1c;
}
</style>
