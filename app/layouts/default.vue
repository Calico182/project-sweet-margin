<template>
  <div class="layout">
    <header class="header">
      <nav class="nav" aria-label="Main">
        <NuxtLink to="/" class="brand">
          <span class="brand__mark" aria-hidden="true" />
          Sweet Margins
        </NuxtLink>
        <ul class="nav__links">
          <li>
            <NuxtLink to="/" class="nav__link">Home</NuxtLink>
          </li>
          <li>
            <NuxtLink to="/calculator" class="nav__link">Calculator</NuxtLink>
          </li>
          <li>
            <NuxtLink to="/pantry" class="nav__link">Pantry</NuxtLink>
          </li>
          <li>
            <NuxtLink to="/#features" class="nav__link">Features</NuxtLink>
          </li>
          <li>
            <NuxtLink to="/#how-it-works" class="nav__link">How it works</NuxtLink>
          </li>
          <li>
            <button type="button" class="theme-toggle" :aria-pressed="isDark" @click="toggleTheme">
              <span class="theme-toggle__label">Dark mode</span>
              <span class="theme-toggle__track" aria-hidden="true">
                <span class="theme-toggle__thumb" />
              </span>
            </button>
          </li>
        </ul>
      </nav>
    </header>
    <main class="main">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
const STORAGE_KEY = 'sweet-margins-theme'
const isDark = ref(false)

function applyTheme() {
  if (!import.meta.client) return
  document.documentElement.dataset.theme = isDark.value ? 'dark' : 'light'
  window.localStorage.setItem(STORAGE_KEY, isDark.value ? 'dark' : 'light')
}

function toggleTheme() {
  isDark.value = !isDark.value
  applyTheme()
}

onMounted(() => {
  const saved = window.localStorage.getItem(STORAGE_KEY)
  if (saved === 'dark' || saved === 'light') {
    isDark.value = saved === 'dark'
  } else {
    isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches
  }
  applyTheme()
})
</script>

<style scoped>
.layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--color-bg);
  color: var(--color-text);
}

.header {
  position: sticky;
  top: 0;
  z-index: 50;
  border-bottom: 1px solid var(--color-border);
  background: color-mix(in srgb, var(--color-bg) 92%, transparent);
  backdrop-filter: blur(10px);
}

.nav {
  max-width: 72rem;
  margin: 0 auto;
  padding: 0.875rem 1.25rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 1.125rem;
  letter-spacing: -0.02em;
  color: var(--color-text);
  text-decoration: none;
}

.brand:hover {
  color: var(--color-accent);
}

.brand__mark {
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 0.4rem;
  background: linear-gradient(
    145deg,
    var(--color-accent) 0%,
    var(--color-accent-deep) 100%
  );
  box-shadow: 0 1px 2px rgb(0 0 0 / 0.06);
}

.nav__links {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  list-style: none;
  margin: 0;
  padding: 0;
}

.nav__link {
  display: inline-block;
  padding: 0.5rem 0.75rem;
  font-size: 0.9375rem;
  font-weight: 500;
  color: var(--color-text-muted);
  text-decoration: none;
  border-radius: 0.375rem;
  transition:
    color 0.15s ease,
    background 0.15s ease;
}

.nav__link:hover {
  color: var(--color-text);
  background: var(--color-surface);
}

.nav__link.router-link-active {
  color: var(--color-accent-deep);
  background: color-mix(in srgb, var(--color-accent) 12%, transparent);
}

.theme-toggle {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.35rem 0.5rem;
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--color-text-muted);
  background: transparent;
  border: 1px solid color-mix(in srgb, var(--color-border) 85%, transparent);
  border-radius: 0.375rem;
  cursor: pointer;
}

.theme-toggle:hover {
  color: var(--color-text);
  background: var(--color-surface);
}

.theme-toggle__track {
  width: 2.2rem;
  height: 1.2rem;
  border-radius: 999px;
  background: #d9d1cb;
  display: inline-flex;
  align-items: center;
  padding: 0.12rem;
  transition: background 0.2s ease;
}

.theme-toggle__thumb {
  width: 0.95rem;
  height: 0.95rem;
  border-radius: 999px;
  background: #fff;
  box-shadow: 0 1px 2px rgb(0 0 0 / 0.2);
  transform: translateX(0);
  transition: transform 0.2s ease;
}

.theme-toggle[aria-pressed="true"] .theme-toggle__track {
  background: var(--color-accent-deep);
}

.theme-toggle[aria-pressed="true"] .theme-toggle__thumb {
  transform: translateX(0.98rem);
}

.main {
  flex: 1;
  width: 100%;
}

@media (max-width: 520px) {
  .nav {
    flex-wrap: wrap;
  }

  .nav__links {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>
