<template>
  <div>
    <h1>User KPI recommendation transparency</h1>
    <p class="muted">
      Source: <code>{{ data?.source }}</code>
    </p>
    <p v-if="error" class="err">{{ error.message }}</p>

    <section v-if="data" class="card">
      <h2>Shared KPIs across users</h2>
      <p v-if="data.sharedKpis.length === 0" class="muted">No overlap found.</p>
      <ul v-else>
        <li v-for="k in data.sharedKpis" :key="k"><code>{{ k }}</code></li>
      </ul>
    </section>

    <section v-for="u in data?.users ?? []" :key="u.userId" class="card">
      <h2>{{ u.profile.name }} <span class="muted">({{ u.profile.role }})</span></h2>
      <p class="small"><strong>Goals:</strong> {{ u.profile.primaryGoals.join(" | ") || "n/a" }}</p>
      <p class="small"><strong>Selection rationale:</strong> {{ u.selectionRationale }}</p>
      <h3>Requested KPIs</h3>
      <ul>
        <li v-for="k in u.requestedKpis" :key="`r-${u.userId}-${k}`">
          <code>{{ k }}</code>
          <span v-if="u.uniqueKpis.includes(k)" class="badge unique">user-specific</span>
          <span v-else class="badge shared">shared</span>
        </li>
      </ul>
      <h3>Recommended KPIs</h3>
      <ul>
        <li v-for="k in u.recommendedKpis" :key="`m-${u.userId}-${k}`">
          <code>{{ k }}</code>
          <span v-if="u.uniqueKpis.includes(k)" class="badge unique">user-specific</span>
          <span v-else class="badge shared">shared</span>
        </li>
      </ul>
    </section>
  </div>
</template>

<script setup lang="ts">
const { data, error } = await useFetch("/api/transparency/recommendations");
</script>

<style scoped>
.muted { color: #71717a; }
.small { font-size: 0.9rem; }
.card { border: 1px solid #e4e4e7; border-radius: 8px; padding: 0.75rem; margin-top: 0.75rem; background: #fff; }
.badge { font-size: 0.7rem; margin-left: 0.35rem; padding: 0.1rem 0.35rem; border-radius: 4px; }
.badge.unique { background: #ecfeff; color: #155e75; }
.badge.shared { background: #eef2ff; color: #3730a3; }
.err { color: #b91c1c; }
</style>
