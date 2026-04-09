import type { RecipeCostInput } from '~/types/calculator'

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
    return Array.isArray(parsed) ? parsed : []
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

export function useRecipeStorage() {
  const recipes = ref<SavedRecipe[]>([])

  const loadRecipes = () => {
    recipes.value = readStorage().sort((a, b) => {
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    })
  }

  const saveRecipe = (recipe: RecipeCostInput) => {
    const entry: SavedRecipe = {
      id: recipe.id,
      name: recipe.name.trim() || 'Untitled recipe',
      updatedAt: new Date().toISOString(),
      recipe: structuredClone(recipe)
    }

    const next = recipes.value.filter((item) => item.id !== recipe.id)
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
    return found ? structuredClone(found.recipe) : null
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
