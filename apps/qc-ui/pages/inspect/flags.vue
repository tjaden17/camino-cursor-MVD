<template>
  <div>
    <h1>Flagged issues</h1>
    <p class="muted">Stored in <code>out/flags.json</code> — flag something for a developer to fix after re-run.</p>

    <section class="form">
      <h2>Add a flag</h2>
      <label class="block"
        >Page id
        <input v-model="form.page" class="input" placeholder="e.g. computed-numbers" />
      </label>
      <label class="block"
        >Item (optional)
        <input v-model="form.itemId" class="input" placeholder="kpiId or file name" />
      </label>
      <label class="block"
        >Note
        <textarea v-model="form.note" class="area" rows="3" placeholder="What looks wrong?" />
      </label>
      <button type="button" class="btn" :disabled="saving" @click="submitFlag">Save flag</button>
      <p v-if="saveMsg" :class="saveOk ? 'ok' : 'err'">{{ saveMsg }}</p>
    </section>

    <section v-if="data?.flags?.length" class="section">
      <h2>Saved flags ({{ data.flags.length }})</h2>
      <article v-for="f in data.flags" :key="f.id" class="card">
        <p>
          <strong>{{ f.page }}</strong>
          <span v-if="f.itemId"> · {{ f.itemId }}</span>
        </p>
        <p>{{ f.note || "(no note)" }}</p>
        <p class="small muted">{{ f.createdAt }}</p>
      </article>
    </section>
    <p v-else class="muted section">No flags yet.</p>
  </div>
</template>

<script setup lang="ts">
const { data, refresh } = await useFetch<{ flags: Array<{ id: string; page: string; itemId?: string; note: string; createdAt: string }> }>(
  "/api/flags",
);

const form = reactive({
  page: "run-summary",
  itemId: "",
  note: "",
});
const saving = ref(false);
const saveMsg = ref("");
const saveOk = ref(false);

async function submitFlag() {
  saving.value = true;
  saveMsg.value = "";
  try {
    await $fetch("/api/flags", {
      method: "POST",
      body: {
        page: form.page.trim() || "unknown",
        itemId: form.itemId.trim() || undefined,
        note: form.note.trim(),
      },
    });
    saveOk.value = true;
    saveMsg.value = "Saved.";
    form.note = "";
    await refresh();
  } catch (e) {
    saveOk.value = false;
    saveMsg.value = e instanceof Error ? e.message : "Save failed";
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped>
h1 {
  font-size: 1.35rem;
}
h2 {
  font-size: 1.05rem;
  margin-top: 1rem;
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
.form {
  border: 1px solid #e4e4e7;
  border-radius: 8px;
  padding: 0.75rem;
  max-width: 32rem;
  background: #fafafa;
}
.block {
  display: block;
  margin-top: 0.5rem;
}
.input,
.area {
  display: block;
  width: 100%;
  margin-top: 0.25rem;
  font: inherit;
  box-sizing: border-box;
}
.area {
  padding: 0.35rem;
}
.btn {
  margin-top: 0.75rem;
  padding: 0.4rem 0.75rem;
  cursor: pointer;
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
.ok {
  color: #15803d;
}
</style>
