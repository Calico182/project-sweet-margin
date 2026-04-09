import type {
  IngredientCostBreakdown,
  IngredientInput,
  MasterIngredient,
  IngredientUnit,
  RecipeCostInput,
  RecipeCostSummary,
  UnitSystem
} from '~/types/calculator'

const unitCategory: Record<IngredientUnit, 'mass' | 'volume' | 'count'> = {
  g: 'mass',
  kg: 'mass',
  oz: 'mass',
  lb: 'mass',
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
  oz: 28.3495,
  lb: 453.592,
  ml: 1,
  l: 1000,
  tsp: 5,
  tbsp: 15,
  cup: 240,
  each: 1
}

const densityGPerMlByIngredient: Record<string, number> = {
  'baking soda': 0.92,
  cornstarch: 0.54,
  salt: 1.2
}

export function getUnitsForSystem(unitSystem: UnitSystem): IngredientUnit[] {
  if (unitSystem === 'imperial') {
    return ['oz', 'lb', 'tsp', 'tbsp', 'cup', 'ml', 'l', 'each']
  }
  return ['g', 'kg', 'ml', 'l', 'tsp', 'tbsp', 'cup', 'each']
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

function getDensityGPerMl(ingredientName: string): number | null {
  const key = normalizeIngredientKey(ingredientName)
  const exact = densityGPerMlByIngredient[key]
  if (exact) return exact

  for (const [name, density] of Object.entries(densityGPerMlByIngredient)) {
    if (key.includes(name)) return density
  }
  return null
}

function convertRequiredToPackBase(
  ingredient: IngredientInput,
  masterIngredient: MasterIngredient,
  wastePercent: number
): { ok: true; requiredInPackBase: number } | { ok: false; note: string } {
  const recipeCategory = unitCategory[ingredient.recipeUnit]
  const packCategory = unitCategory[masterIngredient.unit]

  const recipeBase = toBaseUnit(clampNonNegative(ingredient.recipeQuantity), ingredient.recipeUnit)
  const requiredWithWaste = recipeBase * (1 + wastePercent / 100)

  if (recipeCategory === packCategory) {
    return { ok: true, requiredInPackBase: requiredWithWaste }
  }

  const isMassVolumePair =
    (recipeCategory === 'volume' && packCategory === 'mass') ||
    (recipeCategory === 'mass' && packCategory === 'volume')

  if (!isMassVolumePair) {
    return { ok: false, note: 'Recipe unit and master ingredient unit must be compatible.' }
  }

  const density = getDensityGPerMl(ingredient.name)
  if (!density) {
    return {
      ok: false,
      note: 'Need density conversion for this ingredient. Use matching unit types or add density support.'
    }
  }

  if (recipeCategory === 'volume' && packCategory === 'mass') {
    return { ok: true, requiredInPackBase: requiredWithWaste * density }
  }

  // recipe mass -> pack volume
  return { ok: true, requiredInPackBase: requiredWithWaste / density }
}

export function createEmptyIngredient(id: string): IngredientInput {
  return {
    id,
    name: '',
    recipeQuantity: 0,
    recipeUnit: 'g',
    wastePercent: 0
  }
}

export function createDefaultRecipe(id: string): RecipeCostInput {
  return {
    id,
    name: 'New recipe',
    servings: null,
    laborHours: null,
    laborRatePerHour: 25,
    overheadFixed: 50,
    overheadPercent: 0,
    profitPercent: 30,
    recommendedSellingPrice: null,
    unitSystem: 'metric',
    sourceUrl: '',
    ingredients: [createEmptyIngredient(crypto.randomUUID())]
  }
}

export function calculateIngredientLine(
  ingredient: IngredientInput,
  masterIngredient?: MasterIngredient
): IngredientCostBreakdown {
  const packQty = clampNonNegative(masterIngredient?.unitQuantity ?? 0)
  const packPrice = clampNonNegative(masterIngredient?.unitPrice ?? 0)
  const wastePercent = clampNonNegative(
    ingredient.wastePercent > 0
      ? ingredient.wastePercent
      : (masterIngredient?.defaultWastePercent ?? 0)
  )

  if (!masterIngredient) {
    return {
      ...ingredient,
      lineCost: 0,
      valid: false,
      note: 'Ingredient not found in master list.'
    }
  }

  if (packQty <= 0) {
    return {
      ...ingredient,
      lineCost: 0,
      valid: false,
      note: 'Unit quantity in master list must be greater than 0.'
    }
  }

  const converted = convertRequiredToPackBase(ingredient, masterIngredient, wastePercent)
  if (!converted.ok) {
    return {
      ...ingredient,
      lineCost: 0,
      valid: false,
      note: converted.note
    }
  }

  const packBase = toBaseUnit(packQty, masterIngredient.unit)
  const costPerBase = packPrice / packBase

  return {
    ...ingredient,
    lineCost: roundMoney(converted.requiredInPackBase * costPerBase),
    valid: true
  }
}

export function normalizeIngredientKey(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\([^)]*\)/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function calculateRecipeSummary(
  input: RecipeCostInput,
  masterIngredients: MasterIngredient[] = []
): RecipeCostSummary {
  const byName = new Map(
    masterIngredients.map((item) => [normalizeIngredientKey(item.name), item] as const)
  )
  const ingredientLines = input.ingredients.map((ingredient) => {
    const match = byName.get(normalizeIngredientKey(ingredient.name))
    return calculateIngredientLine(ingredient, match)
  })
  const warnings = ingredientLines
    .filter((line) => !line.valid)
    .filter((line) => line.name.trim().length > 0)
    .filter((line) => line.note !== 'Ingredient not found in master list.')
    .map((line) => `${line.name.trim()}: ${line.note ?? 'Invalid ingredient data.'}`)

  const ingredientsCost = roundMoney(
    ingredientLines.reduce((sum, line) => sum + (line.valid ? line.lineCost : 0), 0)
  )

  const laborCost = roundMoney(
    clampNonNegative(input.laborHours ?? 0) *
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

  const servings = clampNonNegative(input.servings ?? 0)
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
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value)
}
