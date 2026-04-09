import type {
  IngredientCostBreakdown,
  IngredientInput,
  IngredientUnit,
  RecipeCostInput,
  RecipeCostSummary
} from '~/types/calculator'

const unitCategory: Record<IngredientUnit, 'mass' | 'volume' | 'count'> = {
  g: 'mass',
  kg: 'mass',
  ml: 'volume',
  l: 'volume',
  tsp: 'volume',
  tbsp: 'volume',
  cup: 'volume',
  each: 'count'
}

const unitToBaseFactor: Record<IngredientUnit, number> = {
  g: 1,
  kg: 1000,
  ml: 1,
  l: 1000,
  tsp: 5,
  tbsp: 15,
  cup: 240,
  each: 1
}

export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

function toBaseUnit(value: number, unit: IngredientUnit): number {
  return value * unitToBaseFactor[unit]
}

function clampNonNegative(value: number): number {
  if (!Number.isFinite(value) || value < 0) {
    return 0
  }
  return value
}

export function createEmptyIngredient(id: string): IngredientInput {
  return {
    id,
    name: '',
    recipeQuantity: 0,
    recipeUnit: 'g',
    purchaseQuantity: 0,
    purchaseUnit: 'g',
    purchasePrice: 0,
    wastePercent: 0
  }
}

export function createDefaultRecipe(id: string): RecipeCostInput {
  return {
    id,
    name: 'New recipe',
    servings: 12,
    laborMinutes: 60,
    laborRatePerHour: 25,
    overheadFixed: 0,
    overheadPercent: 0,
    profitPercent: 30,
    ingredients: [createEmptyIngredient(crypto.randomUUID())]
  }
}

export function calculateIngredientLine(
  ingredient: IngredientInput
): IngredientCostBreakdown {
  const recipeQty = clampNonNegative(ingredient.recipeQuantity)
  const packQty = clampNonNegative(ingredient.purchaseQuantity)
  const packPrice = clampNonNegative(ingredient.purchasePrice)
  const wastePercent = clampNonNegative(ingredient.wastePercent)

  const recipeCategory = unitCategory[ingredient.recipeUnit]
  const packCategory = unitCategory[ingredient.purchaseUnit]

  if (recipeCategory !== packCategory) {
    return {
      ...ingredient,
      lineCost: 0,
      valid: false,
      note: 'Recipe unit and purchase unit must be compatible.'
    }
  }

  if (packQty <= 0) {
    return {
      ...ingredient,
      lineCost: 0,
      valid: false,
      note: 'Purchase quantity must be greater than 0.'
    }
  }

  const requiredBase =
    toBaseUnit(recipeQty, ingredient.recipeUnit) * (1 + wastePercent / 100)
  const packBase = toBaseUnit(packQty, ingredient.purchaseUnit)
  const costPerBase = packPrice / packBase

  return {
    ...ingredient,
    lineCost: roundMoney(requiredBase * costPerBase),
    valid: true
  }
}

export function calculateRecipeSummary(input: RecipeCostInput): RecipeCostSummary {
  const ingredientLines = input.ingredients.map(calculateIngredientLine)
  const warnings = ingredientLines.filter((line) => !line.valid).map((line) => {
    const label = line.name.trim() || 'Unnamed ingredient'
    return `${label}: ${line.note ?? 'Invalid ingredient data.'}`
  })

  const ingredientsCost = roundMoney(
    ingredientLines.reduce((sum, line) => sum + (line.valid ? line.lineCost : 0), 0)
  )

  const laborCost = roundMoney(
    (clampNonNegative(input.laborMinutes) / 60) *
      clampNonNegative(input.laborRatePerHour)
  )

  const overheadFixed = clampNonNegative(input.overheadFixed)
  const overheadPercent = clampNonNegative(input.overheadPercent)
  const subtotalBeforeOverhead = ingredientsCost + laborCost
  const overheadCost = roundMoney(
    overheadFixed + subtotalBeforeOverhead * (overheadPercent / 100)
  )

  const baseCost = roundMoney(ingredientsCost + laborCost + overheadCost)
  const profitAmount = roundMoney(
    baseCost * (clampNonNegative(input.profitPercent) / 100)
  )
  const totalPrice = roundMoney(baseCost + profitAmount)

  const servings = clampNonNegative(input.servings)
  const divisor = servings > 0 ? servings : 1

  return {
    ingredientsCost,
    laborCost,
    overheadCost,
    baseCost,
    profitAmount,
    totalPrice,
    pricePerServing: roundMoney(totalPrice / divisor),
    costPerServing: roundMoney(baseCost / divisor),
    ingredientLines,
    warnings
  }
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value)
}
