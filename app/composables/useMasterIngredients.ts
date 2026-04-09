import type { IngredientInput, MasterIngredient } from '~/types/calculator'
import { normalizeIngredientKey } from '~/utils/costing'

const STORAGE_KEY = 'sweet-margins-master-ingredients-v1'

function readStorage(): MasterIngredient[] {
  if (!import.meta.client) return []
  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw) as MasterIngredient[]
    if (!Array.isArray(parsed)) return []
    return parsed.map((item) => ({
      ...item,
      priceHistory: Array.isArray(item.priceHistory) ? item.priceHistory : []
    }))
  } catch {
    return []
  }
}

function writeStorage(items: MasterIngredient[]) {
  if (!import.meta.client) return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

function createFromRecipeIngredient(ingredient: IngredientInput): MasterIngredient | null {
  const name = ingredient.name.trim()
  if (!name) return null
  return {
    id: crypto.randomUUID(),
    name,
    unitQuantity: 1,
    unit: ingredient.recipeUnit,
    unitPrice: 0,
    priceHistory: [],
    defaultWastePercent: ingredient.wastePercent || 0,
    updatedAt: new Date().toISOString()
  }
}

function trackPriceChange(previous: MasterIngredient | undefined, next: MasterIngredient) {
  const history = [...(previous?.priceHistory ?? next.priceHistory ?? [])]
  const changed =
    !previous ||
    previous.unitPrice !== next.unitPrice ||
    previous.unitQuantity !== next.unitQuantity ||
    previous.unit !== next.unit

  if (changed) {
    history.push({
      at: new Date().toISOString(),
      unitPrice: next.unitPrice,
      unitQuantity: next.unitQuantity,
      unit: next.unit
    })
  }

  return history.slice(-250)
}

export function useMasterIngredients() {
  const items = ref<MasterIngredient[]>([])

  const loadItems = () => {
    items.value = readStorage().sort((a, b) => a.name.localeCompare(b.name))
  }

  const saveItems = (next: MasterIngredient[]) => {
    items.value = [...next].sort((a, b) => a.name.localeCompare(b.name))
    writeStorage(items.value)
  }

  const upsertItem = (item: MasterIngredient) => {
    const key = normalizeIngredientKey(item.name)
    const next = [...items.value]
    const idx = next.findIndex((entry) => normalizeIngredientKey(entry.name) === key)
    const previous = idx >= 0 ? next[idx] : undefined
    const payload: MasterIngredient = {
      ...item,
      priceHistory: trackPriceChange(previous, item),
      updatedAt: new Date().toISOString()
    }
    if (idx >= 0) next[idx] = payload
    else next.push(payload)
    saveItems(next)
  }

  const removeItem = (id: string) => {
    saveItems(items.value.filter((item) => item.id !== id))
  }

  const populateFromRecipe = (ingredients: IngredientInput[]) => {
    const next = [...items.value]
    const existingKeys = new Set(next.map((entry) => normalizeIngredientKey(entry.name)))
    const addedIds: string[] = []
    for (const ingredient of ingredients) {
      const created = createFromRecipeIngredient(ingredient)
      if (!created) continue
      const key = normalizeIngredientKey(created.name)
      if (existingKeys.has(key)) continue
      existingKeys.add(key)
      next.push(created)
      addedIds.push(created.id)
    }
    saveItems(next)
    return addedIds
  }

  onMounted(loadItems)

  return {
    items,
    loadItems,
    upsertItem,
    removeItem,
    populateFromRecipe
  }
}
