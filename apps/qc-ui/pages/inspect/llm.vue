<template>
  <div>
    <h1>LLM input / output</h1>
    <p class="muted">Stub or live model output per card (<code>step-4-llm-calls.json</code>)</p>
    <p v-if="error" class="err">{{ String(error) }}</p>
    <template v-else-if="data">
      <p class="small muted">Run ID: {{ data.runId }} · {{ data.cards?.length ?? 0 }} entries</p>
      <article v-for="(c, i) in data.cards" :key="i" class="card">
        <h2>{{ c.kpiId }} <span class="tag">{{ c.requestType }}</span> · {{ c.userId }}</h2>
        <p class="small">
          Prompt size: {{ c.input?.systemPromptChars ?? "?" }} + {{ c.input?.userPromptChars ?? "?" }} chars
          (stubbed: {{ c.output?.stubbed }})
        </p>
        <details>
          <summary>Retrieved summary</summary>
          <p class="mono small">{{ c.input?.retrievedSummary }}</p>
        </details>
        <details>
          <summary>Analysis (version A)</summary>
          <p>{{ c.output?.versionA?.analysis?.conclusion }}</p>
        </details>
        <details>
          <summary>Synthesis A vs B</summary>
          <p><strong>A:</strong> {{ c.output?.versionA?.synthesis?.conclusion }}</p>
          <p><strong>B:</strong> {{ c.output?.versionB?.synthesis?.conclusion }}</p>
        </details>
      </article>
    </template>
    <p v-else-if="pending">Loading…</p>
  </div>
</template>

<script setup lang="ts">
const { data, pending, error } = await useFetch("/api/inspect/llm");
</script>

<style scoped>
h1 {
  font-size: 1.35rem;
}
h2 {
  font-size: 1rem;
  margin: 0 0 0.35rem;
}
.tag {
  font-size: 0.75rem;
  background: #eef2ff;
  color: #3730a3;
  padding: 0.1rem 0.35rem;
  border-radius: 4px;
}
.muted {
  color: #71717a;
}
.small {
  font-size: 0.8rem;
}
.mono {
  font-family: ui-monospace, monospace;
  white-space: pre-wrap;
}
.card {
  border: 1px solid #e4e4e7;
  border-radius: 8px;
  padding: 0.75rem;
  margin-top: 0.75rem;
  background: #fff;
}
details {
  margin-top: 0.5rem;
}
.err {
  color: #b91c1c;
}
</style>
