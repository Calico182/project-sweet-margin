<template>
  <section class="pantry-page">
    <header class="header">
      <div>
        <p class="eyebrow">Master list</p>
        <h1 class="title">Pantry</h1>
        <p class="lede">Central ingredient catalog with unit quantity, unit price, and default waste.</p>
        <p v-if="lastUpdatedLabel" class="updated-at">Last updated: {{ lastUpdatedLabel }}</p>
      </div>
      <div class="tools">
        <button type="button" class="btn btn--ghost" @click="syncFromRecipes">
          Sync from recipes
        </button>
        <button type="button" class="btn" @click="addEmpty">+ Add ingredient</button>
      </div>
    </header>

    <section class="panel">
      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Unit qty</th>
              <th>Unit</th>
              <th>Unit price</th>
              <th>Trend</th>
              <th>Default waste %</th>
              <th />
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in items" :key="item.id" :class="{ 'row-new': highlightedIds.has(item.id) }">
              <td><input v-model="item.name" type="text" placeholder="e.g. cake flour" @change="touchItem(item)" /></td>
              <td><input v-model.number="item.unitQuantity" type="number" min="0" step="0.01" @change="touchItem(item)" /></td>
              <td>
                <select v-model="item.unit" @change="touchItem(item)">
                  <option v-for="unit in units" :key="unit" :value="unit">{{ unit }}</option>
                </select>
              </td>
              <td><input v-model.number="item.unitPrice" type="number" min="0" step="0.01" @change="touchItem(item)" /></td>
              <td>
                <span class="trend" :class="trendClass(item)">
                  {{ trendLabel(item) }}
                </span>
              </td>
              <td><input v-model.number="item.defaultWastePercent" type="number" min="0" step="0.1" @change="touchItem(item)" /></td>
              <td>
                <button type="button" class="btn btn--danger" @click="removeItem(item.id)">Remove</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </section>
</template>

<script setup lang="ts">
import type { IngredientUnit, MasterIngredient } from '~/types/calculator'
import { useMasterIngredients } from '~/composables/useMasterIngredients'
import { useRecipeStorage } from '~/composables/useRecipeStorage'

useHead({
  title: 'Pantry — Sweet Margins',
  meta: [
    {
      name: 'description',
      content: 'Manage your master ingredient list for recipe costing in Sweet Margins.'
    }
  ]
})

const units: IngredientUnit[] = ['g', 'kg', 'ml', 'l', 'tsp', 'tbsp', 'cup', 'each']
const { items, upsertItem, removeItem, populateFromRecipe } = useMasterIngredients()
const { recipes } = useRecipeStorage()
const highlightedIds = ref<Set<string>>(new Set())
let highlightTimer: ReturnType<typeof setTimeout> | null = null

const lastUpdatedLabel = computed(() => {
  const timestamps = items.value
    .map((item) => new Date(item.updatedAt).getTime())
    .filter((value) => Number.isFinite(value) && value > 0)
  if (!timestamps.length) return ''
  const last = new Date(Math.max(...timestamps))
  return last.toLocaleString('en-ZA', { dateStyle: 'medium', timeStyle: 'short' })
})

function addEmpty() {
  const item: MasterIngredient = {
    id: crypto.randomUUID(),
    name: '',
    unitQuantity: 1,
    unit: 'g',
    unitPrice: 0,
    priceHistory: [],
    defaultWastePercent: 0,
    updatedAt: new Date().toISOString()
  }
  upsertItem(item)
}

function touchItem(item: MasterIngredient) {
  upsertItem({ ...item })
}

function syncFromRecipes() {
  const addedIds: string[] = []
  for (const saved of recipes.value) {
    addedIds.push(...populateFromRecipe(saved.recipe.ingredients))
  }
  if (addedIds.length) {
    highlightedIds.value = new Set(addedIds)
    if (highlightTimer) {
      clearTimeout(highlightTimer)
    }
    highlightTimer = setTimeout(() => {
      highlightedIds.value = new Set()
    }, 3500)
  }
}

function trendLabel(item: MasterIngredient): string {
  const history = item.priceHistory ?? []
  if (history.length < 2) return 'New'
  const prev = history[history.length - 2]
  const curr = history[history.length - 1]
  if (!prev || !curr) return 'New'
  const prevUnitCost = prev.unitQuantity > 0 ? prev.unitPrice / prev.unitQuantity : 0
  const currUnitCost = curr.unitQuantity > 0 ? curr.unitPrice / curr.unitQuantity : 0
  if (prevUnitCost <= 0 || currUnitCost <= 0) return 'No data'
  const diff = ((currUnitCost - prevUnitCost) / prevUnitCost) * 100
  if (Math.abs(diff) < 0.1) return 'Flat'
  return `${diff > 0 ? '+' : ''}${diff.toFixed(1)}%`
}

function trendClass(item: MasterIngredient): string {
  const label = trendLabel(item)
  if (label === 'Flat') return 'trend--flat'
  if (label.startsWith('+')) return 'trend--up'
  if (label.startsWith('-')) return 'trend--down'
  return 'trend--neutral'
}
</script>

<style scoped>
.pantry-page { max-width: 72rem; margin: 0 auto; padding: 2.25rem 1.25rem 4rem; display: flex; flex-direction: column; gap: 1rem; }
.header { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; }
.eyebrow { margin: 0 0 0.4rem; font-size: 0.8rem; letter-spacing: 0.08em; text-transform: uppercase; font-weight: 600; color: var(--color-accent-deep); }
.title { margin: 0 0 0.5rem; font-family: var(--font-display); font-size: clamp(1.6rem, 3.5vw, 2.3rem); line-height: 1.15; }
.lede { margin: 0; color: var(--color-text-muted); max-width: 48rem; }
.updated-at { margin: 0.4rem 0 0; color: var(--color-text-muted); font-size: 0.82rem; }
.tools { display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap; }
.panel { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 0.75rem; padding: 1rem; }
.table-wrap { overflow-x: auto; }
.table { width: 100%; border-collapse: collapse; min-width: 760px; }
th, td { text-align: left; padding: 0.45rem; vertical-align: middle; }
th { font-size: 0.8rem; color: var(--color-text-muted); font-weight: 600; }
input, select { width: 100%; padding: 0.45rem 0.55rem; border: 1px solid var(--color-border); border-radius: 0.45rem; background: #fff; }
.row-new td { background: #fff6db; transition: background 0.2s ease; }
.trend { display: inline-flex; min-width: 4.7rem; justify-content: center; border-radius: 999px; padding: 0.2rem 0.5rem; font-size: 0.78rem; font-weight: 600; }
.trend--up { color: #8f2433; background: #fbe8ec; }
.trend--down { color: #116241; background: #e7f7ef; }
.trend--flat { color: #5f6066; background: #ececef; }
.trend--neutral { color: #5f6066; background: #f3f1ef; }
.btn { border: 1px solid var(--color-border); background: #fff; color: var(--color-text); border-radius: 0.45rem; padding: 0.42rem 0.7rem; cursor: pointer; }
.btn--ghost { background: var(--color-bg); }
.btn--danger { border-color: #e6c2c8; color: #9f3447; }
@media (max-width: 900px) { .header { flex-direction: column; } }
</style>
