<template>
  <section class="panel">
    <header class="panel__header">
      <div>
        <h2 class="panel__title">Ingredients</h2>
        <p class="panel__text">Add each ingredient with recipe quantity and waste.</p>
      </div>
      <button type="button" class="btn btn--ghost" @click="$emit('add-ingredient')">
        + Add ingredient
      </button>
    </header>

    <div class="table-wrap">
      <table class="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Recipe qty</th>
            <th>Recipe unit</th>
            <th>Waste %</th>
            <th />
          </tr>
        </thead>
        <tbody>
          <tr v-for="ingredient in modelValue" :key="ingredient.id">
            <td>
              <input v-model="ingredient.name" placeholder="e.g. Cake flour" />
            </td>
            <td><input v-model.number="ingredient.recipeQuantity" type="number" min="0" step="0.01" /></td>
            <td>
              <select v-model="ingredient.recipeUnit">
                <option v-for="unit in units" :key="unit" :value="unit">{{ unit }}</option>
              </select>
            </td>
            <td><input v-model.number="ingredient.wastePercent" type="number" min="0" step="0.1" /></td>
            <td>
              <button type="button" class="btn btn--danger" @click="$emit('remove-ingredient', ingredient.id)">
                Remove
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { IngredientInput, IngredientUnit } from '~/types/calculator'

defineProps<{
  modelValue: IngredientInput[]
}>()

defineEmits<{
  (e: 'add-ingredient'): void
  (e: 'remove-ingredient', id: string): void
}>()

const units: IngredientUnit[] = ['g', 'kg', 'ml', 'l', 'tsp', 'tbsp', 'cup', 'each']
</script>

<style scoped>
.panel { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 0.75rem; padding: 1rem; }
.panel__header { display: flex; justify-content: space-between; gap: 1rem; align-items: center; margin-bottom: 0.75rem; }
.panel__title { margin: 0; font-size: 1.1rem; }
.panel__text { margin: 0.25rem 0 0; color: var(--color-text-muted); font-size: 0.9rem; }
.table-wrap { overflow-x: auto; }
.table { width: 100%; border-collapse: collapse; min-width: 720px; }
th, td { text-align: left; padding: 0.45rem; vertical-align: middle; }
th { font-size: 0.8rem; color: var(--color-text-muted); font-weight: 600; }
input, select { width: 100%; padding: 0.45rem 0.55rem; border: 1px solid var(--color-border); border-radius: 0.45rem; background: #fff; }
.table th:nth-child(3),
.table td:nth-child(3) { min-width: 7.25rem; }
.table th:nth-child(4),
.table td:nth-child(4) { min-width: 5.5rem; }
.btn { border: 1px solid var(--color-border); background: #fff; color: var(--color-text); border-radius: 0.45rem; padding: 0.42rem 0.7rem; cursor: pointer; }
.btn--ghost { background: var(--color-bg); }
.btn--danger { border-color: #e6c2c8; color: #9f3447; }
</style>
