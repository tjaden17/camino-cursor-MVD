<template>
  <div>
    <h1>MVD quality check</h1>
    <p class="muted">
      Runs the same checks as <code>npm run qc</code> at the repo root. Repo:
      <code>{{ repoHint }}</code>
    </p>
    <button type="button" class="btn" :disabled="pending" @click="refresh">
      {{ pending ? "Running…" : "Run QC" }}
    </button>
    <p class="muted small">
      Transparency pages:
      <a href="/transparency/recommendations">user KPI recommendations</a>
      ·
      <a href="/transparency/kpi-dictionary">KPI dictionary</a>
    </p>
    <p v-if="error" class="err">{{ error }}</p>

    <section v-if="data" class="section">
      <h2>Golden (numeric replay)</h2>
      <div v-for="(g, i) in data.golden" :key="i" class="card">
        <div class="row">
          <span :class="g.pass ? 'badge ok' : 'badge bad'">{{ g.pass ? "PASS" : "FAIL" }}</span>
          <strong>{{ g.scenarioId }}</strong>
          <span class="muted">{{ g.ruleId }}</span>
        </div>
        <pre class="small">{{ JSON.stringify(g, null, 2) }}</pre>
      </div>
    </section>

    <section v-if="data" class="section">
      <h2>JSON schema samples</h2>
      <div v-for="(s, i) in data.schemaChecks" :key="i" class="card">
        <div class="row">
          <span :class="s.pass ? 'badge ok' : 'badge bad'">{{ s.pass ? "PASS" : "FAIL" }}</span>
          <span>{{ s.file }}</span>
        </div>
        <p v-if="s.errors?.length" class="err">{{ s.errors.join("\n") }}</p>
      </div>
    </section>

    <section v-if="data" class="section">
      <h2>Insufficient-data checks</h2>
      <div v-for="(row, i) in data.insufficient" :key="i" class="card">
        <div class="row">
          <span :class="row.ok ? 'badge ok' : 'badge bad'">{{ row.ok ? "OK" : "FAIL" }}</span>
          <span>{{ row.file }}</span>
        </div>
        <p v-if="row.errors?.length" class="muted small">{{ row.errors.join("\n") }}</p>
      </div>
    </section>

    <section class="section">
      <h2>Validate JSON (optional)</h2>
      <label class="block"
        >Schema
        <select v-model="validateSchema" class="input">
          <option value="signal_overview">signal_overview</option>
          <option value="signal_expanded">signal_expanded</option>
          <option value="insufficient_data">insufficient_data</option>
          <option value="weekly_brief_row">weekly_brief_row</option>
        </select>
      </label>
      <label class="block"
        >JSON payload
        <textarea v-model="validateText" class="area" rows="8" placeholder="{ }" />
      </label>
      <button type="button" class="btn" @click="runValidate">Validate</button>
      <p v-if="validateResult" class="small">
        <span :class="validateResult.ok ? 'ok' : 'err'">{{ validateResult.ok ? "OK" : "Invalid" }}</span>
        {{ validateResult.errors?.join("; ") }}
      </p>
    </section>
  </div>
</template>

<script setup lang="ts">
const config = useRuntimeConfig();
const repoHint = computed(() => String(config.public?.mvdRepoRoot ?? ""));

const { data, pending, error, refresh } = await useFetch("/api/qc/run", {
  immediate: false,
});

const validateSchema = ref("signal_overview");
const validateText = ref('{\n  "kind": "signal_overview",\n  "kpiId": "kpi.test"\n}');
const validateResult = ref<{ ok: boolean; errors?: string[] } | null>(null);

function validateFetchErrorMessage(e: unknown): string {
  if (e && typeof e === "object") {
    const o = e as { statusMessage?: string; message?: string; data?: { message?: string } };
    if (typeof o.statusMessage === "string" && o.statusMessage.trim()) return o.statusMessage;
    if (typeof o.data?.message === "string" && o.data.message.trim()) return o.data.message;
    if (typeof o.message === "string" && o.message.trim()) return o.message;
  }
  if (e instanceof Error && e.message.trim()) return e.message;
  return "Request failed";
}

async function runValidate() {
  validateResult.value = null;
  let payload: unknown;
  try {
    payload = JSON.parse(validateText.value || "{}");
  } catch {
    validateResult.value = { ok: false, errors: ["Invalid JSON"] };
    return;
  }
  try {
    const res = await $fetch<{ ok: boolean; errors: string[] }>("/api/qc/validate", {
      method: "POST",
      body: { schemaId: validateSchema.value, payload },
    });
    validateResult.value = res;
  } catch (e) {
    validateResult.value = { ok: false, errors: [validateFetchErrorMessage(e)] };
  }
}
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
  font-size: 0.8rem;
}
.section {
  margin-top: 1rem;
}
.card {
  border: 1px solid #e4e4e7;
  border-radius: 8px;
  padding: 0.75rem;
  margin-top: 0.5rem;
  background: #fff;
}
.row {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  flex-wrap: wrap;
}
.badge {
  font-size: 0.7rem;
  font-weight: 600;
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
}
.badge.ok {
  background: #dcfce7;
  color: #166534;
}
.badge.bad {
  background: #fee2e2;
  color: #991b1b;
}
.btn {
  margin-top: 0.5rem;
  padding: 0.4rem 0.75rem;
  cursor: pointer;
}
.err {
  color: #b91c1c;
}
.ok {
  color: #15803d;
}
pre {
  overflow: auto;
  margin: 0.5rem 0 0;
}
.block {
  display: block;
  margin-top: 0.5rem;
}
.input,
.area {
  display: block;
  width: 100%;
  max-width: 640px;
  margin-top: 0.25rem;
  font-family: ui-monospace, monospace;
  font-size: 0.85rem;
}
.area {
  padding: 0.5rem;
}
</style>
