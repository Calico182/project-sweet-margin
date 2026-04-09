<template>
  <section class="calculator-page">
    <div class="layout">
      <RecipeForm
        v-model="recipe"
        v-model:selected-recipe-id="selectedRecipeId"
        :saved-recipes="recipes"
        :save-confirmation-visible="saveConfirmationVisible"
        :last-updated-label="lastUpdatedLabel"
        @save="handleSave"
        @new="handleNew"
        @delete-selected="handleDeleteSelected"
        @load-recipe="handleLoad"
        @add-ingredient="handleAddIngredient"
        @remove-ingredient="handleRemoveIngredient"
      />

      <CostSummary :summary="summary" />
    </div>
    <button type="button" class="floating-save" @click="handleSave">Save recipe</button>
  </section>
</template>

<script setup lang="ts">
import CostSummary from '~/components/calculator/CostSummary.vue'
import RecipeForm from '~/components/calculator/RecipeForm.vue'
import { useRecipeCalculator } from '~/composables/useRecipeCalculator'
import { useMasterIngredients } from '~/composables/useMasterIngredients'
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
const lastUpdatedAt = ref<string | null>(null)
const saveConfirmationVisible = ref(false)
let saveConfirmationTimer: ReturnType<typeof setTimeout> | null = null

const { recipes, saveRecipe, deleteRecipe, getRecipe } = useRecipeStorage()
const { items: masterIngredients, populateFromRecipe } = useMasterIngredients()
const { summary } = useRecipeCalculator(recipe, masterIngredients)

const lastUpdatedLabel = computed(() => {
  if (!lastUpdatedAt.value) return ''
  const asDate = new Date(lastUpdatedAt.value)
  if (Number.isNaN(asDate.getTime())) return ''
  return asDate.toLocaleString('en-ZA', { dateStyle: 'medium', timeStyle: 'short' })
})

function handleSave() {
  if (!recipe.value.name.trim()) {
    recipe.value.name = 'Untitled recipe'
  }

  saveRecipe(recipe.value)
  populateFromRecipe(recipe.value.ingredients)
  selectedRecipeId.value = recipe.value.id
  lastUpdatedAt.value = new Date().toISOString()

  saveConfirmationVisible.value = true
  if (saveConfirmationTimer) {
    clearTimeout(saveConfirmationTimer)
  }
  saveConfirmationTimer = setTimeout(() => {
    saveConfirmationVisible.value = false
  }, 1800)
}

function handleNew() {
  recipe.value = createDefaultRecipe(crypto.randomUUID())
  selectedRecipeId.value = ''
  lastUpdatedAt.value = null
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
  const saved = recipes.value.find((entry) => entry.id === id)
  lastUpdatedAt.value = saved?.updatedAt ?? null
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
  padding: 2.25rem 1.25rem 5.5rem;
}

.layout {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(280px, 1fr);
  gap: 1rem;
  align-items: start;
}

.floating-save {
  position: fixed;
  right: 1.25rem;
  bottom: 1.25rem;
  border: 1px solid var(--color-accent-deep);
  background: var(--color-accent-deep);
  color: #fff;
  border-radius: 999px;
  padding: 0.7rem 1rem;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 8px 24px rgb(0 0 0 / 0.16);
  z-index: 70;
}

@media (max-width: 980px) {
  .layout {
    grid-template-columns: 1fr;
  }
  .floating-save {
    right: 1rem;
    bottom: 1rem;
  }
}
</style>
