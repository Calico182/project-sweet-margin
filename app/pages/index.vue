<template>
  <div class="landing">
    <section class="hero">
      <p class="eyebrow">Baking cost &amp; invoicing</p>
      <h1 class="hero__title">
        Price your cakes with confidence
      </h1>
      <p class="hero__lede">
        Sweet Margins is a cakeulator for listing ingredients, understanding
        your baked goods costs, and building numbers you can stand behind when
        you invoice.
      </p>
      <div class="hero__actions">
        <NuxtLink to="/calculator" class="pill pill--action">Open calculator</NuxtLink>
        <NuxtLink to="/pantry" class="pill">Open pantry</NuxtLink>
      </div>
    </section>

    <section id="features" class="section">
      <h2 class="section__title">Built for bakers who sell</h2>
      <ul class="feature-grid">
        <li class="feature-card">
          <h3 class="feature-card__title">Ingredient lists</h3>
          <p class="feature-card__text">
            Capture what goes into each bake—flours, fats, flavourings, and
            more—so nothing is left to guesswork.
          </p>
        </li>
        <li class="feature-card">
          <h3 class="feature-card__title">True cost per item</h3>
          <p class="feature-card__text">
            Roll up quantities and prices into clear per-batch and per-unit
            costs you can use in quotes and invoices.
          </p>
        </li>
        <li class="feature-card">
          <h3 class="feature-card__title">Invoice-ready figures</h3>
          <p class="feature-card__text">
            Export numbers that match how you actually bake, not a spreadsheet
            that drifts out of date.
          </p>
        </li>
      </ul>
    </section>

    <section id="how-it-works" class="section section--alt">
      <h2 class="section__title">How it will work</h2>
      <ol class="steps">
        <li class="steps__item">
          <span class="steps__num">1</span>
          <div>
            <h3 class="steps__heading">Add your ingredients</h3>
            <p class="steps__text">
              Build a pantry with pack sizes and prices you pay today.
            </p>
          </div>
        </li>
        <li class="steps__item">
          <span class="steps__num">2</span>
          <div>
            <h3 class="steps__heading">Define your recipes</h3>
            <p class="steps__text">
              Turn recipes into line items that map cleanly to what you sell.
            </p>
          </div>
        </li>
        <li class="steps__item">
          <span class="steps__num">3</span>
          <div>
            <h3 class="steps__heading">See margins before you quote</h3>
            <p class="steps__text">
              Know your floor before you name a price—then invoice with a
              straight face.
            </p>
          </div>
        </li>
      </ol>
    </section>
  </div>
</template>

<script setup lang="ts">
useHead({
  title: 'Sweet Margins — Cakeulator for baking costs',
  meta: [
    {
      name: 'description',
      content:
        'Sweet Margins helps you enter baking ingredients and calculate costs for cakes and baked goods—built for invoicing and pricing.'
    }
  ]
})
</script>

<style scoped>
.landing {
  max-width: 72rem;
  margin: 0 auto;
  padding: 0 1.25rem 4rem;
}

.hero {
  padding: 3.5rem 0 3rem;
  max-width: 40rem;
}

.eyebrow {
  margin: 0 0 0.75rem;
  font-size: 0.8125rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-accent-deep);
}

.hero__title {
  margin: 0 0 1rem;
  font-family: var(--font-display);
  font-size: clamp(2rem, 4.5vw, 2.75rem);
  font-weight: 600;
  line-height: 1.15;
  letter-spacing: -0.03em;
  color: var(--color-text);
}

.hero__lede {
  margin: 0 0 1.5rem;
  font-size: 1.0625rem;
  line-height: 1.65;
  color: var(--color-text-muted);
}

.hero__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: center;
}

.pill {
  display: inline-flex;
  align-items: center;
  padding: 0.5rem 0.875rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-muted);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 999px;
  text-decoration: none;
}

.pill--action {
  color: var(--color-accent-deep);
}

.section {
  padding: 2.5rem 0;
}

.section--alt {
  margin: 0 -1.25rem;
  padding: 2.5rem 1.25rem;
  background: var(--color-surface);
  border-radius: 1rem;
  border: 1px solid var(--color-border);
}

.section__title {
  margin: 0 0 1.5rem;
  font-family: var(--font-display);
  font-size: 1.375rem;
  font-weight: 600;
  letter-spacing: -0.02em;
}

.feature-grid {
  display: grid;
  gap: 1rem;
  list-style: none;
  margin: 0;
  padding: 0;
}

@media (min-width: 640px) {
  .feature-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

.feature-card {
  padding: 1.25rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 0.75rem;
}

.section--alt .feature-card {
  background: var(--color-bg);
}

.feature-card__title {
  margin: 0 0 0.5rem;
  font-size: 1rem;
  font-weight: 600;
}

.feature-card__text {
  margin: 0;
  font-size: 0.9375rem;
  line-height: 1.55;
  color: var(--color-text-muted);
}

.steps {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.steps__item {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
}

.steps__num {
  flex-shrink: 0;
  width: 2rem;
  height: 2rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-accent-deep);
  background: color-mix(in srgb, var(--color-accent) 18%, transparent);
  border-radius: 0.5rem;
}

.steps__heading {
  margin: 0 0 0.25rem;
  font-size: 1rem;
  font-weight: 600;
}

.steps__text {
  margin: 0;
  font-size: 0.9375rem;
  line-height: 1.55;
  color: var(--color-text-muted);
}
</style>
