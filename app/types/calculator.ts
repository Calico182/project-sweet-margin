export type IngredientUnit =
  | 'g'
  | 'kg'
  | 'ml'
  | 'l'
  | 'tsp'
  | 'tbsp'
  | 'cup'
  | 'each'

export interface IngredientInput {
  id: string
  name: string
  recipeQuantity: number
  recipeUnit: IngredientUnit
  purchaseQuantity: number
  purchaseUnit: IngredientUnit
  purchasePrice: number
  wastePercent: number
}

export interface RecipeCostInput {
  id: string
  name: string
  servings: number
  laborMinutes: number
  laborRatePerHour: number
  overheadFixed: number
  overheadPercent: number
  profitPercent: number
  ingredients: IngredientInput[]
}

export interface IngredientCostBreakdown extends IngredientInput {
  lineCost: number
  valid: boolean
  note?: string
}

export interface RecipeCostSummary {
  ingredientsCost: number
  laborCost: number
  overheadCost: number
  baseCost: number
  profitAmount: number
  totalPrice: number
  pricePerServing: number
  costPerServing: number
  ingredientLines: IngredientCostBreakdown[]
  warnings: string[]
}
