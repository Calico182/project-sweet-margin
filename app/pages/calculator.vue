<template>
  <section class="calculator-page">
    <div class="layout">
      <RecipeForm
        v-model="recipe"
        v-model:selected-recipe-id="selectedRecipeId"
        :saved-recipes="recipes"
        @save="handleSave"
        @new="handleNew"
        @delete-selected="handleDeleteSelected"
        @load-recipe="handleLoad"
        @add-ingredient="handleAddIngredient"
        @remove-ingredient="handleRemoveIngredient"
      />

      <CostSummary :summary="summary" />
    </div>
  </section>
</template>

<script setup lang="ts">
import CostSummary from '~/components/calculator/CostSummary.vue'
import RecipeForm from '~/components/calculator/RecipeForm.vue'
import { useRecipeCalculator } from '~/composables/useRecipeCalculator'
import { useRecipeStorage } from '~/composables/useRecipeStorage'
import type { RecipeCostInput } from '~/types/calculator'
import { createDefaultRecipe, createEmptyIngredient } from '~/utils/costing'

useHead({
  title: 'Calculator — Sweet Margins',
  meta: [
    {
      name: 'description',
      content:
        'Build and calculate ingredient costs for cakes and baked goods in Sweet Margins.'
    }
  ]
})

const recipe = ref<RecipeCostInput>(createDefaultRecipe(crypto.randomUUID()))
const selectedRecipeId = ref<string | ''>('')

const { recipes, saveRecipe, deleteRecipe, getRecipe } = useRecipeStorage()
const { summary } = useRecipeCalculator(recipe)

function handleSave() {
  if (!recipe.value.name.trim()) {
    recipe.value.name = 'Untitled recipe'
  }

  saveRecipe(recipe.value)
  selectedRecipeId.value = recipe.value.id
}

function handleNew() {
  recipe.value = createDefaultRecipe(crypto.randomUUID())
  selectedRecipeId.value = ''
}

function handleDeleteSelected() {
  if (!selectedRecipeId.value) {
    return
  }

  deleteRecipe(selectedRecipeId.value)
  handleNew()
}

function handleLoad(id: string) {
  const loaded = getRecipe(id)
  if (!loaded) {
    return
  }

  recipe.value = loaded
  selectedRecipeId.value = id
}

function handleAddIngredient() {
  recipe.value.ingredients.push(createEmptyIngredient(crypto.randomUUID()))
}

function handleRemoveIngredient(id: string) {
  if (recipe.value.ingredients.length === 1) {
    recipe.value.ingredients[0] = createEmptyIngredient(crypto.randomUUID())
    return
  }

  recipe.value.ingredients = recipe.value.ingredients.filter(
    (ingredient) => ingredient.id !== id
  )
}
</script>

<style scoped>
.calculator-page {
  max-width: 72rem;
  margin: 0 auto;
  padding: 2.25rem 1.25rem 4rem;
}

.layout {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(280px, 1fr);
  gap: 1rem;
  align-items: start;
}

@media (max-width: 980px) {
  .layout {
    grid-template-columns: 1fr;
  }
}
</style>
