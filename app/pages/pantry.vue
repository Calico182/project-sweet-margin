<template>
  <section ref="pantryRoot" class="pantry-page">
    <header class="header">
      <div>
        <p class="eyebrow">Master list</p>
        <h1 class="title">Pantry</h1>
        <p class="lede">Central ingredient catalog with unit quantity, unit price, and default waste.</p>
        <p v-if="lastUpdatedLabel" class="updated-at">Last updated: {{ lastUpdatedLabel }}</p>
        <p
          v-if="saveNotice.message"
          class="save-notice"
          :class="saveNotice.type === 'error' ? 'save-notice--error' : 'save-notice--success'"
          aria-live="polite"
        >
          <span v-if="saveNotice.type === 'error'">Oops! {{ saveNotice.message }}</span>
          <span v-else>🧁 {{ saveNotice.message }}</span>
        </p>
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
              <th>Unit Quantity</th>
              <th>Unit</th>
              <th>Unit Price</th>
              <th>Status</th>
              <th>Trend</th>
              <th>Default Waste %</th>
              <th />
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in items" :key="item.id" :class="{ 'row-new': highlightedIds.has(item.id), 'row-needs-input': needsPricing(item) }">
              <td><input v-model="item.name" type="text" placeholder="e.g. cake flour" @change="touchItem(item)" /></td>
              <td><input v-model.number="item.unitQuantity" type="number" min="0" step="0.01" @change="touchItem(item)" /></td>
              <td>
                <select v-model="item.unit" @change="touchItem(item)">
                  <option v-for="unit in units" :key="unit" :value="unit">{{ unit }}</option>
                </select>
              </td>
              <td><input v-model.number="item.unitPrice" type="number" min="0" step="0.01" @change="touchItem(item)" /></td>
              <td>
                <span class="status-pill" :class="statusClass(item)">
                  {{ statusLabel(item) }}
                </span>
              </td>
              <td>
                <span class="trend" :class="trendClass(item)">
                  {{ trendLabel(item) }}
                </span>
              </td>
              <td><input v-model.number="item.defaultWastePercent" type="number" min="0" step="0.1" @change="touchItem(item)" /></td>
              <td>
                <details class="row-menu">
                  <summary class="btn btn--ghost btn--small">Actions</summary>
                  <div class="row-menu__items">
                    <button type="button" class="row-menu__item" @click="selectHistory(item.id)">
                      View history
                    </button>
                    <button type="button" class="row-menu__item row-menu__item--danger" @click="onRemoveItem(item.id)">
                      Remove ingredient
                    </button>
                  </div>
                </details>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section v-if="selectedHistoryItem" class="panel history-panel">
      <h3 class="history-title">Price history: {{ selectedHistoryItem.name || 'Unnamed ingredient' }}</h3>
      <p class="history-note">Tracks each saved unit price update.</p>
      <ul class="history-list">
        <li v-for="entry in sortedHistory" :key="entry.at + '-' + entry.unitPrice">
          <span>{{ formatHistoryDate(entry.at) }}</span>
          <span>{{ formatMoney(entry.unitPrice) }} / {{ entry.unitQuantity }} {{ entry.unit }}</span>
        </li>
      </ul>
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
const pantryRoot = ref<HTMLElement | null>(null)
const highlightedIds = ref<Set<string>>(new Set())
const selectedHistoryId = ref<string | null>(null)
let highlightTimer: ReturnType<typeof setTimeout> | null = null
const saveNotice = ref<{ type: 'success' | 'error'; message: string }>({
  type: 'success',
  message: ''
})
let saveNoticeTimer: ReturnType<typeof setTimeout> | null = null

const lastUpdatedLabel = computed(() => {
  const timestamps = items.value
    .map((item) => new Date(item.updatedAt).getTime())
    .filter((value) => Number.isFinite(value) && value > 0)
  if (!timestamps.length) return ''
  const last = new Date(Math.max(...timestamps))
  return last.toLocaleString('en-ZA', { dateStyle: 'medium', timeStyle: 'short' })
})

const selectedHistoryItem = computed(() =>
  items.value.find((item) => item.id === selectedHistoryId.value) ?? null
)

const sortedHistory = computed(() => {
  const history = selectedHistoryItem.value?.priceHistory ?? []
  return [...history].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
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
  try {
    upsertItem(item)
    showSaveNotice('success', 'Ingredient added and saved.')
  } catch {
    showSaveNotice('error', 'Could not save ingredient.')
  }
}

function touchItem(item: MasterIngredient) {
  try {
    upsertItem({ ...item })
    showSaveNotice('success', 'Changes saved.')
  } catch {
    showSaveNotice('error', 'Could not save changes.')
  }
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
    showSaveNotice('success', `Added ${addedIds.length} new ingredient${addedIds.length === 1 ? '' : 's'} to Pantry.`)
  } else {
    showSaveNotice('success', 'Pantry is already up to date.')
  }
}

function trendLabel(item: MasterIngredient): string {
  const history = item.priceHistory ?? []
  if (history.length < 2) return '—'
  const prev = history[history.length - 2]
  const curr = history[history.length - 1]
  if (!prev || !curr) return '—'
  const prevUnitCost = prev.unitQuantity > 0 ? prev.unitPrice / prev.unitQuantity : 0
  const currUnitCost = curr.unitQuantity > 0 ? curr.unitPrice / curr.unitQuantity : 0
  if (prevUnitCost <= 0 || currUnitCost <= 0) return '—'
  const diff = ((currUnitCost - prevUnitCost) / prevUnitCost) * 100
  if (Math.abs(diff) < 0.1) return 'Flat'
  return `${diff > 0 ? '+' : ''}${diff.toFixed(1)}%`
}

function trendClass(item: MasterIngredient): string {
  const label = trendLabel(item)
  if (label === '—') return 'trend--neutral'
  if (label === 'Flat') return 'trend--flat'
  if (label.startsWith('+')) return 'trend--up'
  if (label.startsWith('-')) return 'trend--down'
  return 'trend--neutral'
}

function needsPricing(item: MasterIngredient): boolean {
  return item.unitPrice <= 0 || item.unitQuantity <= 0
}

function statusLabel(item: MasterIngredient): string {
  if (highlightedIds.value.has(item.id)) return 'New ingredient'
  if (needsPricing(item)) return 'Needs pricing'
  return 'Ready'
}

function statusClass(item: MasterIngredient): string {
  if (highlightedIds.value.has(item.id)) return 'status-pill--new'
  if (needsPricing(item)) return 'status-pill--warn'
  return 'status-pill--ok'
}

function onRemoveItem(id: string) {
  try {
    removeItem(id)
    if (selectedHistoryId.value === id) {
      selectedHistoryId.value = null
    }
    showSaveNotice('success', 'Ingredient removed and saved.')
  } catch {
    showSaveNotice('error', 'Could not remove ingredient.')
  }
}

function selectHistory(id: string) {
  selectedHistoryId.value = selectedHistoryId.value === id ? null : id
}

function showSaveNotice(type: 'success' | 'error', message: string) {
  saveNotice.value = { type, message }
  if (saveNoticeTimer) {
    clearTimeout(saveNoticeTimer)
  }
  saveNoticeTimer = setTimeout(() => {
    saveNotice.value = { ...saveNotice.value, message: '' }
  }, 2200)
}

function handleDocumentClick(event: MouseEvent) {
  const target = event.target as Node | null
  if (!pantryRoot.value || !target) return

  const openMenus = pantryRoot.value.querySelectorAll<HTMLDetailsElement>('details.row-menu[open]')
  for (const menu of openMenus) {
    if (!menu.contains(target)) {
      menu.removeAttribute('open')
    }
  }
}

function formatHistoryDate(value: string): string {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleString('en-ZA', { dateStyle: 'medium', timeStyle: 'short' })
}

function formatMoney(value: number): string {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value)
}

onMounted(() => {
  document.addEventListener('click', handleDocumentClick)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick)
})
</script>

<style scoped>
.pantry-page { max-width: 72rem; margin: 0 auto; padding: 2.25rem 1.25rem 4rem; display: flex; flex-direction: column; gap: 1rem; }
.header { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; }
.eyebrow { margin: 0 0 0.4rem; font-size: 0.8rem; letter-spacing: 0.08em; text-transform: uppercase; font-weight: 600; color: var(--color-accent-deep); }
.title { margin: 0 0 0.5rem; font-family: var(--font-display); font-size: clamp(1.6rem, 3.5vw, 2.3rem); line-height: 1.15; }
.lede { margin: 0; color: var(--color-text-muted); max-width: 48rem; }
.updated-at { margin: 0.4rem 0 0; color: var(--color-text-muted); font-size: 0.82rem; }
.save-notice { margin: 0.45rem 0 0; display: inline-flex; font-weight: 600; font-size: 0.83rem; padding: 0.3rem 0.55rem; border-radius: 999px; border: 1px solid transparent; }
.save-notice--success { color: #116241; background: #e8f7ee; border-color: #bfe9cf; }
.save-notice--error { color: #9f3447; background: #fcecef; border-color: #efc8d0; }
.tools { display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap; }
.panel { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 0.75rem; padding: 1rem; }
.history-panel { display: flex; flex-direction: column; gap: 0.5rem; }
.history-title { margin: 0; font-size: 1rem; }
.history-note { margin: 0; color: var(--color-text-muted); font-size: 0.85rem; }
.history-list { margin: 0; padding-left: 1rem; display: flex; flex-direction: column; gap: 0.3rem; }
.history-list li { display: flex; justify-content: space-between; gap: 0.75rem; font-size: 0.86rem; }
.table-wrap { overflow-x: auto; }
.table { width: 100%; border-collapse: collapse; min-width: 760px; }
th, td { text-align: left; padding: 0.45rem; vertical-align: middle; }
th { font-size: 0.8rem; color: var(--color-text-muted); font-weight: 600; }
input, select { width: 100%; padding: 0.45rem 0.55rem; border: 1px solid var(--color-border); border-radius: 0.45rem; background: #fff; }
.row-new td { background: #fff6db; transition: background 0.2s ease; }
.row-needs-input td { border-top: 1px dashed #caa96a; border-bottom: 1px dashed #caa96a; }
.status-pill { display: inline-flex; min-width: 6.6rem; justify-content: center; border-radius: 999px; padding: 0.2rem 0.5rem; font-size: 0.76rem; font-weight: 600; }
.status-pill--new { color: #7d5a10; background: #fff0c7; }
.status-pill--warn { color: #8f5e0f; background: #fbe9c6; }
.status-pill--ok { color: #116241; background: #e8f7ee; }
.trend { display: inline-flex; min-width: 4.7rem; justify-content: center; border-radius: 999px; padding: 0.2rem 0.5rem; font-size: 0.78rem; font-weight: 600; }
.trend--up { color: #8f2433; background: #fbe8ec; }
.trend--down { color: #116241; background: #e7f7ef; }
.trend--flat { color: #5f6066; background: #ececef; }
.trend--neutral { color: #5f6066; background: #f3f1ef; }
.btn { border: 1px solid var(--color-border); background: #fff; color: var(--color-text); border-radius: 0.45rem; padding: 0.42rem 0.7rem; cursor: pointer; }
.btn--ghost { background: var(--color-bg); }
.btn--danger { border-color: #e6c2c8; color: #9f3447; }
.btn--small { margin-right: 0.3rem; padding: 0.35rem 0.55rem; }
.row-menu { position: relative; display: inline-block; }
.row-menu summary { list-style: none; }
.row-menu summary::-webkit-details-marker { display: none; }
.row-menu__items {
  position: absolute;
  right: 0;
  margin-top: 0.25rem;
  min-width: 10.5rem;
  background: #fff;
  border: 1px solid var(--color-border);
  border-radius: 0.45rem;
  box-shadow: 0 8px 20px rgb(0 0 0 / 0.08);
  z-index: 20;
  padding: 0.3rem;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}
.row-menu__item {
  border: 0;
  background: transparent;
  text-align: left;
  border-radius: 0.35rem;
  padding: 0.38rem 0.45rem;
  color: var(--color-text);
  cursor: pointer;
}
.row-menu__item:hover { background: var(--color-surface); }
.row-menu__item--danger { color: #9f3447; }

:global([data-theme="dark"]) .row-needs-input td {
  border-top-color: #4a5668;
  border-bottom-color: #4a5668;
}

:global([data-theme="dark"]) .row-menu__items {
  background: #1f2731;
  border-color: #3a4658;
  box-shadow: 0 10px 24px rgb(0 0 0 / 0.35);
}

:global([data-theme="dark"]) .row-menu__item {
  color: #e7eef8;
}

:global([data-theme="dark"]) .row-menu__item:hover {
  background: #2a3442;
}

:global([data-theme="dark"]) .row-menu__item--danger {
  color: #ff9dad;
}
@media (max-width: 900px) { .header { flex-direction: column; } }
</style>
