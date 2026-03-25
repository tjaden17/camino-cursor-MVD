<template>
  <div class="layout">
    <header class="header">
      <NuxtLink to="/">QC dashboard</NuxtLink>
      <span class="sep">|</span>
      <NuxtLink to="/preview/signal">Signal preview</NuxtLink>
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
.header a {
  color: #18181b;
  text-decoration: none;
}
.header a:hover {
  text-decoration: underline;
}
.sep {
  margin: 0 0.5rem;
  color: #a1a1aa;
}
.main {
  padding: 1rem;
  max-width: 960px;
}
</style>
