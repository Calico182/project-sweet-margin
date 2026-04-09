<template>
  <section class="form">
    <header class="form__header">
      <div>
        <p class="eyebrow">Cost calculator</p>
        <h1 class="title">Cake Cost Calculator</h1>
        <p class="lede">Enter ingredients, time, overhead, and margin to generate invoice-ready pricing.</p>
      </div>
      <div class="save-tools">
        <select v-model="selectedRecipeId" @change="onLoadRecipe">
          <option value="">Load saved recipe...</option>
          <option v-for="saved in savedRecipes" :key="saved.id" :value="saved.id">{{ saved.name }}</option>
        </select>
        <button type="button" class="btn" @click="$emit('save')">Save</button>
        <button type="button" class="btn btn--ghost" @click="$emit('new')">New</button>
        <button type="button" class="btn btn--danger" :disabled="!selectedRecipeId" @click="$emit('delete-selected')">Delete</button>
      </div>
    </header>

    <section class="panel grid">
      <label>
        Recipe name
        <input v-model="recipe.name" type="text" />
      </label>
      <label>
        Servings
        <input v-model.number="recipe.servings" type="number" min="1" step="1" />
      </label>
      <label>
        Labor minutes
        <input v-model.number="recipe.laborMinutes" type="number" min="0" step="1" />
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
      @add-ingredient="$emit('add-ingredient')"
      @remove-ingredient="(id) => $emit('remove-ingredient', id)"
    />
  </section>
</template>

<script setup lang="ts">
import type { RecipeCostInput } from '~/types/calculator'
import type { SavedRecipe } from '~/composables/useRecipeStorage'
import IngredientTable from '~/components/calculator/IngredientTable.vue'

const recipe = defineModel<RecipeCostInput>({ required: true })
const selectedRecipeId = defineModel<string | ''>('selectedRecipeId', {
  required: true
})

defineProps<{
  savedRecipes: SavedRecipe[]
}>()

const emit = defineEmits<{
  (e: 'save'): void
  (e: 'new'): void
  (e: 'delete-selected'): void
  (e: 'load-recipe', id: string): void
  (e: 'add-ingredient'): void
  (e: 'remove-ingredient', id: string): void
}>()

function onLoadRecipe(event: Event) {
  const target = event.target as HTMLSelectElement
  if (target.value) {
    emit('load-recipe', target.value)
  }
}
</script>

<style scoped>
.form { display: flex; flex-direction: column; gap: 1rem; }
.form__header { display: flex; justify-content: space-between; gap: 1rem; align-items: flex-start; }
.eyebrow { margin: 0 0 0.4rem; font-size: 0.8rem; letter-spacing: 0.08em; text-transform: uppercase; font-weight: 600; color: var(--color-accent-deep); }
.title { margin: 0 0 0.5rem; font-family: var(--font-display); font-size: clamp(1.6rem, 3.5vw, 2.3rem); line-height: 1.15; }
.lede { margin: 0; color: var(--color-text-muted); max-width: 42rem; }
.save-tools { display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap; justify-content: flex-end; }
.panel { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 0.75rem; padding: 1rem; }
.grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.8rem; }
label { display: flex; flex-direction: column; gap: 0.25rem; font-size: 0.9rem; color: var(--color-text-muted); }
input, select { padding: 0.5rem 0.6rem; border: 1px solid var(--color-border); border-radius: 0.45rem; background: #fff; }
.btn { border: 1px solid var(--color-border); background: #fff; color: var(--color-text); border-radius: 0.45rem; padding: 0.45rem 0.7rem; cursor: pointer; }
.btn--ghost { background: var(--color-bg); }
.btn--danger { border-color: #e6c2c8; color: #9f3447; }
.btn:disabled { opacity: 0.5; cursor: not-allowed; }
@media (max-width: 900px) { .grid { grid-template-columns: 1fr; } .form__header { flex-direction: column; } .save-tools { justify-content: flex-start; } }
</style>
