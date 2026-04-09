import type { Ref } from 'vue'
import type { RecipeCostInput } from '~/types/calculator'
import { calculateRecipeSummary } from '~/utils/costing'

export function useRecipeCalculator(recipe: Ref<RecipeCostInput>) {
  const summary = computed(() => calculateRecipeSummary(recipe.value))
  const hasValidationIssues = computed(() => summary.value.warnings.length > 0)

  return {
    summary,
    hasValidationIssues
  }
}
