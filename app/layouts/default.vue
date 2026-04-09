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
            <NuxtLink to="/#features" class="nav__link">Features</NuxtLink>
          </li>
          <li>
            <NuxtLink to="/#how-it-works" class="nav__link">How it works</NuxtLink>
          </li>
        </ul>
      </nav>
    </header>
    <main class="main">
      <slot />
    </main>
  </div>
</template>

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
