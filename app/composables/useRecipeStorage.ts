import type { RecipeCostInput } from '~/types/calculator'
import { createDefaultRecipe } from '~/utils/costing'

const STORAGE_KEY = 'sweet-margins-recipes-v1'

export interface SavedRecipe {
  id: string
  name: string
  updatedAt: string
  recipe: RecipeCostInput
}

function readStorage(): SavedRecipe[] {
  if (!import.meta.client) {
    return []
  }

  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    return []
  }

  try {
    const parsed = JSON.parse(raw) as SavedRecipe[]
    if (!Array.isArray(parsed)) {
      return []
    }
    return parsed
      .filter((entry): entry is SavedRecipe => Boolean(entry && typeof entry === 'object' && entry.recipe))
      .map((entry) => ({
        ...entry,
        name: String(entry.name ?? 'Untitled recipe'),
        updatedAt: String(entry.updatedAt ?? new Date().toISOString()),
        recipe: normalizeRecipe(entry.recipe)
      }))
  } catch {
    return []
  }
}

function writeStorage(recipes: SavedRecipe[]) {
  if (!import.meta.client) {
    return
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(recipes))
}

function normalizeRecipe(input: Record<string, unknown>): RecipeCostInput {
  const fallback = createDefaultRecipe(crypto.randomUUID())
  const legacyLaborMinutes = typeof input.laborMinutes === 'number' ? input.laborMinutes : null
  const migratedLaborHours =
    typeof input.laborHours === 'number'
      ? input.laborHours
      : (legacyLaborMinutes !== null ? legacyLaborMinutes / 60 : fallback.laborHours)
  return {
    ...fallback,
    ...input,
    laborHours: migratedLaborHours,
    ingredients: Array.isArray(input.ingredients) ? input.ingredients : fallback.ingredients
  }
}

function cloneRecipe(recipe: RecipeCostInput): RecipeCostInput {
  // Serialize through JSON to avoid issues cloning Vue reactive proxies.
  const plain = JSON.parse(JSON.stringify(recipe)) as Record<string, unknown>
  return normalizeRecipe(plain)
}

export function useRecipeStorage() {
  const recipes = ref<SavedRecipe[]>([])

  const loadRecipes = () => {
    recipes.value = readStorage().sort((a, b) => {
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    })
  }

  const saveRecipe = (recipe: RecipeCostInput) => {
    const safeRecipe = cloneRecipe(recipe)
    const entry: SavedRecipe = {
      id: safeRecipe.id,
      name: safeRecipe.name.trim() || 'Untitled recipe',
      updatedAt: new Date().toISOString(),
      recipe: safeRecipe
    }

    const next = recipes.value.filter((item) => item.id !== safeRecipe.id)
    next.unshift(entry)
    recipes.value = next
    writeStorage(next)
  }

  const deleteRecipe = (id: string) => {
    const next = recipes.value.filter((item) => item.id !== id)
    recipes.value = next
    writeStorage(next)
  }

  const getRecipe = (id: string): RecipeCostInput | null => {
    const found = recipes.value.find((item) => item.id === id)
    return found ? cloneRecipe(found.recipe) : null
  }

  onMounted(loadRecipes)

  return {
    recipes,
    loadRecipes,
    saveRecipe,
    deleteRecipe,
    getRecipe
  }
}
