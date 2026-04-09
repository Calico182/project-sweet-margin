export type UnitSystem = 'metric' | 'imperial'

export type IngredientUnit =
  | 'g'
  | 'kg'
  | 'ml'
  | 'l'
  | 'tsp'
  | 'tbsp'
  | 'cup'
  | 'oz'
  | 'lb'
  | 'each'

export interface IngredientInput {
  id: string
  name: string
  recipeQuantity: number
  recipeUnit: IngredientUnit
  wastePercent: number
  rawText?: string
  parseConfidence?: number
  parseNote?: string
}

export interface MasterIngredient {
  id: string
  name: string
  unitQuantity: number
  unit: IngredientUnit
  unitPrice: number
  priceHistory: Array<{
    at: string
    unitQuantity: number
    unit: IngredientUnit
    unitPrice: number
  }>
  defaultWastePercent: number
  updatedAt: string
}

export interface RecipeCostInput {
  id: string
  name: string
  servings: number | null
  laborHours: number | null
  laborRatePerHour: number
  overheadFixed: number
  overheadPercent: number
  profitPercent: number
  recommendedSellingPrice: number | null
  unitSystem: UnitSystem
  sourceUrl?: string
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
