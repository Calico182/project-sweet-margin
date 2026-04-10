import type { Ref } from 'vue'
import type { MasterIngredient, RecipeCostInput } from '~/types/calculator'
import { calculateRecipeSummary } from '~/utils/costing'

export function useRecipeCalculator(
  recipe: Ref<RecipeCostInput>,
  masterIngredients: Ref<MasterIngredient[]>
) {
  const summary = computed(() =>
    calculateRecipeSummary(recipe.value, masterIngredients.value)
  )
  const hasValidationIssues = computed(() => summary.value.warnings.length > 0)

  return {
    summary,
    hasValidationIssues
  }
}
