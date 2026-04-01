<template>
  <div class="layout">
    <header class="header">
      <nav class="nav" aria-label="Main">
        <NuxtLink to="/" class="brand">Pipeline inspector</NuxtLink>
        <span class="sep">·</span>
        <NuxtLink to="/inspect/data-quality">Data quality</NuxtLink>
        <NuxtLink to="/inspect/computed">Computed</NuxtLink>
        <NuxtLink to="/inspect/llm">LLM</NuxtLink>
        <NuxtLink to="/inspect/flags">Flags</NuxtLink>
        <span class="sep">·</span>
        <NuxtLink to="/preview/signal">Signal preview</NuxtLink>
        <NuxtLink to="/dev-checks">Dev checks</NuxtLink>
        <span class="sep">·</span>
        <NuxtLink to="/transparency/recommendations">Transparency</NuxtLink>
      </nav>
    </header>
    <main class="main">
      <NuxtPage />
    </main>
  </div>
</template>

<style scoped>
.layout {
  min-height: 100vh;
  font-family: system-ui, sans-serif;
}
.header {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #e4e4e7;
  background: #fafafa;
}
.nav {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem 0.65rem;
  align-items: center;
  max-width: 1100px;
}
.nav a {
  color: #18181b;
  text-decoration: none;
  font-size: 0.9rem;
}
.nav a:hover,
.nav a.router-link-active {
  text-decoration: underline;
}
.brand {
  font-weight: 600;
}
.sep {
  color: #a1a1aa;
  user-select: none;
}
.main {
  padding: 1rem;
  max-width: 960px;
}
</style>
