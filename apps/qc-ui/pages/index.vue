<template>
  <div>
    <h1>Pipeline run summary</h1>
    <p class="muted">
      Plain-English view of the last v2 pipeline outputs under <code>out/</code> in
      <code>{{ data?.repoRoot ?? "…" }}</code>
    </p>
    <button type="button" class="btn" :disabled="pending" @click="refresh">Refresh</button>
    <p v-if="error" class="err">{{ error }}</p>

    <section v-if="data" class="section">
      <h2>Last run</h2>
      <ul class="facts">
        <li>
          <strong>Run ID:</strong>
          {{ data.runId ?? "— (no pipeline-v2-output.json yet)" }}
        </li>
        <li>
          <strong>Generated:</strong>
          {{ data.generatedAt ?? "—" }}
        </li>
        <li>
          <strong>Decision trigger matches:</strong>
          {{ data.triggerCount }}
        </li>
        <li v-if="data.artifactHints.pipelineV2">
          <strong>Cards file:</strong>
          {{ data.artifactHints.pipelineV2 }}
        </li>
      </ul>
    </section>

    <section v-if="data?.dataQuality" class="section">
      <h2>Data quality (step 1c)</h2>
      <p>
        {{ data.dataQuality.filesChecked }} files · {{ data.dataQuality.passed }} passed ·
        {{ data.dataQuality.warnings }} warnings · {{ data.dataQuality.failures }} failures
      </p>
      <p class="small">
        <NuxtLink to="/inspect/data-quality">Open data quality detail →</NuxtLink>
      </p>
    </section>

    <section v-else class="section muted">
      <h2>Data quality</h2>
      <p>No step-1c-data-quality.json found. Run the v2 pipeline to generate it.</p>
    </section>

    <section v-if="data?.users?.length" class="section">
      <h2>Users in this run</h2>
      <div v-for="u in data.users" :key="u.userId" class="card">
        <strong>{{ u.userId }}</strong>
        <p class="small">
          {{ u.sufficientCardsA }} signal cards (version A) · {{ u.insufficientCards }} gap cards ·
          {{ u.totalCards }} rows total in JSON (includes A/B duplicates)
        </p>
        <NuxtLink :to="`/preview/signal?userId=${u.userId}&view=all`">Review all cards →</NuxtLink>
      </div>
    </section>

    <section class="section">
      <h2>Inspector pages</h2>
      <ul class="links">
        <li><NuxtLink to="/inspect/data-quality">Data quality</NuxtLink></li>
        <li><NuxtLink to="/inspect/computed">Computed numbers</NuxtLink></li>
        <li><NuxtLink to="/inspect/llm">LLM input / output</NuxtLink></li>
        <li><NuxtLink to="/inspect/flags">Flagged issues ({{ data?.flagCount ?? 0 }})</NuxtLink></li>
        <li><NuxtLink to="/preview/signal">Signal preview</NuxtLink></li>
        <li><NuxtLink to="/dev-checks">Dev checks (old QC)</NuxtLink></li>
      </ul>
    </section>
  </div>
</template>

<script setup lang="ts">
interface SummaryResponse {
  repoRoot: string;
  artifactHints: { pipelineV2: string | null; step1c: string | null };
  runId: string | null;
  generatedAt: string | null;
  triggerCount: number;
  dataQuality: {
    filesChecked: number;
    passed: number;
    warnings: number;
    failures: number;
  } | null;
  users: Array<{
    userId: string;
    sufficientCardsA: number;
    insufficientCards: number;
    totalCards: number;
  }>;
  flagCount: number;
}

const { data, pending, error, refresh } = await useFetch<SummaryResponse>("/api/inspect/summary");
</script>

<style scoped>
h1 {
  font-size: 1.35rem;
}
h2 {
  font-size: 1.1rem;
  margin-top: 1.25rem;
}
.muted {
  color: #71717a;
  font-size: 0.9rem;
}
.small {
  font-size: 0.85rem;
  margin: 0.35rem 0;
}
.section {
  margin-top: 1rem;
}
.facts {
  margin: 0;
  padding-left: 1.2rem;
  line-height: 1.6;
}
.links {
  line-height: 1.8;
}
.card {
  border: 1px solid #e4e4e7;
  border-radius: 8px;
  padding: 0.75rem;
  margin-top: 0.5rem;
  background: #fff;
}
.btn {
  margin-top: 0.5rem;
  padding: 0.4rem 0.75rem;
  cursor: pointer;
}
.err {
  color: #b91c1c;
}
</style>
