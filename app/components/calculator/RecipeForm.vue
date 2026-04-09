<template>
  <section class="form">
    <header class="form__header">
      <div>
        <p class="eyebrow">Cost calculator</p>
        <h1 class="title">Cake Cost Calculator</h1>
        <p class="lede">Enter ingredients, time, overhead, and margin to generate invoice-ready pricing.</p>
        <p v-if="lastUpdatedLabel" class="updated-at">Last updated: {{ lastUpdatedLabel }}</p>
      </div>
      <div class="save-tools">
        <select v-model="selectedRecipeId" @change="onLoadRecipe">
          <option value="">Recipes</option>
          <option v-for="saved in savedRecipes" :key="saved.id" :value="saved.id">{{ saved.name }}</option>
        </select>
        <button type="button" class="btn" @click="$emit('save')">Save</button>
        <span v-if="saveConfirmationVisible" class="save-confirmation" aria-live="polite">Saved</span>
        <button type="button" class="btn btn--ghost" @click="$emit('new')">New</button>
        <button type="button" class="btn btn--danger" :disabled="!selectedRecipeId" @click="$emit('delete-selected')">Delete</button>
      </div>
    </header>

    <section class="panel import-panel">
      <label>
        Recipe URL
        <input
          v-model="importUrl"
          type="url"
          placeholder="https://example.com/recipe"
          @keydown.enter.prevent="onImport"
        />
      </label>
      <label>
        Unit system
        <select v-model="recipe.unitSystem">
          <option value="metric">Metric (default)</option>
          <option value="imperial">Imperial</option>
        </select>
      </label>
      <button type="button" class="btn" :disabled="isImporting || !importUrl.trim()" @click="onImport">
        {{ isImporting ? 'Importing...' : 'Import recipe' }}
      </button>
      <p v-if="importError" class="import-error">{{ importError }}</p>
      <ul v-if="parserWarnings.length" class="import-warnings">
        <li v-for="warning in parserWarnings" :key="warning">{{ warning }}</li>
      </ul>
    </section>

    <section class="panel grid">
      <label>
        Recipe name
        <input v-model="recipe.name" type="text" />
      </label>
      <label>
        Servings
        <input v-model.number="recipe.servings" type="number" min="1" step="1" placeholder="e.g. 12" />
      </label>
      <label>
        Labor hours
        <input v-model.number="recipe.laborHours" type="number" min="0" step="0.25" placeholder="e.g. 2.5" />
      </label>
      <label>
        Labor rate / hour
        <input v-model.number="recipe.laborRatePerHour" type="number" min="0" step="0.01" />
      </label>
      <label>
        Overhead fixed
        <input v-model.number="recipe.overheadFixed" type="number" min="0" step="0.01" />
      </label>
      <label>
        Overhead %
        <input v-model.number="recipe.overheadPercent" type="number" min="0" step="0.1" />
      </label>
      <label>
        Profit %
        <input v-model.number="recipe.profitPercent" type="number" min="0" step="0.1" />
      </label>
    </section>

    <IngredientTable
      :model-value="recipe.ingredients"
      :unit-system="recipe.unitSystem"
      @add-ingredient="$emit('add-ingredient')"
      @remove-ingredient="(id) => $emit('remove-ingredient', id)"
    />
  </section>
</template>

<script setup lang="ts">
import type { RecipeCostInput } from '~/types/calculator'
import type { SavedRecipe } from '~/composables/useRecipeStorage'
import IngredientTable from '~/components/calculator/IngredientTable.vue'

interface ImportResponse {
  title: string
  sourceUrl: string
  warnings: string[]
  servings: number | null
  totalTimeHours: number | null
  ingredients: Array<{
    name: string
    quantity: number
    unit: string
    note?: string
    rawText: string
    confidence: number
  }>
}

const recipe = defineModel<RecipeCostInput>({ required: true })
const selectedRecipeId = defineModel<string | ''>('selectedRecipeId', {
  required: true
})

defineProps<{
  savedRecipes: SavedRecipe[]
  saveConfirmationVisible: boolean
  lastUpdatedLabel: string
}>()

const emit = defineEmits<{
  (e: 'save'): void
  (e: 'new'): void
  (e: 'delete-selected'): void
  (e: 'load-recipe', id: string): void
  (e: 'add-ingredient'): void
  (e: 'remove-ingredient', id: string): void
}>()

const importUrl = ref('')
const isImporting = ref(false)
const importError = ref('')
const parserWarnings = ref<string[]>([])

function onLoadRecipe(event: Event) {
  const target = event.target as HTMLSelectElement
  if (target.value) {
    emit('load-recipe', target.value)
  }
}

async function onImport() {
  importError.value = ''
  parserWarnings.value = []
  isImporting.value = true

  try {
    const response = await $fetch<ImportResponse>('/api/recipe/parse', {
      method: 'POST',
      body: {
        url: importUrl.value,
        unitSystem: recipe.value.unitSystem
      }
    })

    recipe.value.name = response.title || recipe.value.name
    recipe.value.sourceUrl = response.sourceUrl
    recipe.value.servings = response.servings
    recipe.value.laborHours = response.totalTimeHours
    recipe.value.ingredients = response.ingredients.map((ingredient) => ({
      id: crypto.randomUUID(),
      name: ingredient.name,
      recipeQuantity: ingredient.quantity,
      recipeUnit: (ingredient.unit || 'each') as RecipeCostInput['ingredients'][number]['recipeUnit'],
      wastePercent: 0,
      rawText: ingredient.rawText,
      parseConfidence: ingredient.confidence,
      parseNote: ingredient.note
    }))

    parserWarnings.value = response.warnings ?? []
  } catch (error) {
    importError.value = (error as { data?: { statusMessage?: string } })?.data?.statusMessage ?? 'Could not import this recipe URL.'
  } finally {
    isImporting.value = false
  }
}
</script>

<style scoped>
.form { display: flex; flex-direction: column; gap: 1rem; }
.form__header { display: flex; justify-content: space-between; gap: 1rem; align-items: flex-start; }
.eyebrow { margin: 0 0 0.4rem; font-size: 0.8rem; letter-spacing: 0.08em; text-transform: uppercase; font-weight: 600; color: var(--color-accent-deep); }
.title { margin: 0 0 0.5rem; font-family: var(--font-display); font-size: clamp(1.6rem, 3.5vw, 2.3rem); line-height: 1.15; }
.lede { margin: 0; color: var(--color-text-muted); max-width: 42rem; }
.updated-at { margin: 0.4rem 0 0; color: var(--color-text-muted); font-size: 0.82rem; }
.save-tools { display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap; justify-content: flex-end; }
.save-confirmation { color: #116241; font-weight: 600; font-size: 0.86rem; padding: 0 0.1rem; }
.panel { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 0.75rem; padding: 1rem; }
.import-panel { display: grid; gap: 0.8rem; grid-template-columns: minmax(0, 2fr) minmax(180px, 1fr) auto; align-items: end; }
.grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.8rem; }
label { display: flex; flex-direction: column; gap: 0.25rem; font-size: 0.9rem; color: var(--color-text-muted); }
input, select { padding: 0.5rem 0.6rem; border: 1px solid var(--color-border); border-radius: 0.45rem; background: #fff; }
.btn { border: 1px solid var(--color-border); background: #fff; color: var(--color-text); border-radius: 0.45rem; padding: 0.45rem 0.7rem; cursor: pointer; }
.btn--ghost { background: var(--color-bg); }
.btn--danger { border-color: #e6c2c8; color: #9f3447; }
.btn:disabled { opacity: 0.5; cursor: not-allowed; }
.import-error { margin: 0; color: #9f3447; grid-column: 1 / -1; }
.import-warnings { margin: 0; padding-left: 1rem; color: #8f6a1a; grid-column: 1 / -1; }
@media (max-width: 900px) { .grid { grid-template-columns: 1fr; } .form__header { flex-direction: column; } .save-tools { justify-content: flex-start; } .import-panel { grid-template-columns: 1fr; } }
</style>
