import { defineEventHandler, readBody, createError } from 'h3'
import { parseIngredients, type UnitSystem } from '../../utils/ingredientNlp'

interface ParseRequestBody {
  url?: string
  unitSystem?: UnitSystem
}

function isSafeUrl(urlString: string): boolean {
  try {
    const parsed = new URL(urlString)
    if (!(parsed.protocol === 'http:' || parsed.protocol === 'https:')) {
      return false
    }

    const host = parsed.hostname.toLowerCase()
    if (host === 'localhost' || host === '127.0.0.1' || host === '::1') {
      return false
    }

    return true
  } catch {
    return false
  }
}

function decodeHtml(input: string): string {
  return input
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&frac14;|&#188;/g, ' 1/4 ')
    .replace(/&frac12;|&#189;/g, ' 1/2 ')
    .replace(/&frac34;|&#190;/g, ' 3/4 ')
}

function extractTitle(html: string): string {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
  return decodeHtml((match?.[1] ?? 'Imported recipe').trim())
}

interface JsonLdRecipeData {
  ingredients: string[]
  yieldValue: number | null
  totalTimeHours: number | null
}

function parseYieldToNumber(value: unknown): number | null {
  if (!value) return null
  if (typeof value === 'number' && Number.isFinite(value)) return value
  const asText = Array.isArray(value) ? String(value[0] ?? '') : String(value)
  const match = asText.match(/(\d+(?:\.\d+)?)/)
  return match ? Number(match[1]) : null
}

function parseIsoDurationHours(value: unknown): number | null {
  const text = String(value ?? '').trim()
  if (!text) return null
  const match = text.match(/^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?)?$/i)
  if (!match) return null
  const days = Number(match[1] ?? 0)
  const hours = Number(match[2] ?? 0)
  const minutes = Number(match[3] ?? 0)
  return days * 24 + hours + minutes / 60
}

function extractJsonLdRecipeData(html: string): JsonLdRecipeData {
  const result: JsonLdRecipeData = {
    ingredients: [],
    yieldValue: null,
    totalTimeHours: null
  }

  const collectFromNode = (node: unknown): string[] => {
    if (!node || typeof node !== 'object') return []
    const recipeNode = node as Record<string, unknown>

    if (Array.isArray(recipeNode.recipeIngredient)) {
      return recipeNode.recipeIngredient.map((line) => String(line))
    }

    return []
  }

  const scripts = [...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)]
  for (const script of scripts) {
    const content = script[1]
    try {
      const parsed = JSON.parse(content)
      const queue = Array.isArray(parsed) ? [...parsed] : [parsed]

      while (queue.length) {
        const node = queue.shift()
        if (!node) continue
        if (typeof node !== 'object') continue
        const obj = node as Record<string, unknown>
        const type = Array.isArray(obj['@type']) ? obj['@type'].join(',') : String(obj['@type'] ?? '')

        if (type.toLowerCase().includes('recipe')) {
          const ingredients = collectFromNode(obj)
          if (ingredients.length && !result.ingredients.length) result.ingredients = ingredients
          if (result.yieldValue === null) result.yieldValue = parseYieldToNumber(obj.recipeYield)
          if (result.totalTimeHours === null) {
            result.totalTimeHours = parseIsoDurationHours(obj.totalTime)
          }
          if (result.ingredients.length) return result
        }

        if (Array.isArray(obj['@graph'])) {
          queue.push(...obj['@graph'])
        }

        if (Array.isArray(obj.mainEntity)) {
          queue.push(...obj.mainEntity)
        } else if (obj.mainEntity) {
          queue.push(obj.mainEntity)
        }
      }
    } catch {
      continue
    }
  }

  return result
}

function stripTags(input: string): string {
  return decodeHtml(input.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim())
}

function extractListItems(html: string): string[] {
  const matches = [...html.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)]
  return matches
    .map((entry) => stripTags(entry[1]))
    .filter((line) => /\d/.test(line) && /[a-zA-Z]{3,}/.test(line))
    .filter((line) => !/minutes|hour|serve|preheat|oven|bake|cool/i.test(line))
}

export default defineEventHandler(async (event) => {
  const body = await readBody<ParseRequestBody>(event)
  const url = body.url?.trim()
  const unitSystem: UnitSystem = body.unitSystem === 'imperial' ? 'imperial' : 'metric'

  if (!url || !isSafeUrl(url)) {
    throw createError({ statusCode: 400, statusMessage: 'Please provide a valid public recipe URL.' })
  }

  let html = ''
  try {
    html = await $fetch<string>(url, {
      responseType: 'text',
      timeout: 12000,
      headers: {
        'user-agent': 'sweet-margin-recipe-parser/1.0 (+https://sweet-margin.local)'
      }
    })
  } catch {
    throw createError({ statusCode: 502, statusMessage: 'Unable to fetch recipe URL.' })
  }

  const title = extractTitle(html)
  const jsonLdData = extractJsonLdRecipeData(html)
  const jsonLdLines = jsonLdData.ingredients
  const fallbackLines = jsonLdLines.length ? [] : extractListItems(html)
  const lines = jsonLdLines.length ? jsonLdLines : fallbackLines.slice(0, 40)

  if (!lines.length) {
    throw createError({ statusCode: 422, statusMessage: 'No ingredient lines found on this page.' })
  }

  const parsedIngredients = parseIngredients(lines, unitSystem)

  return {
    title,
    sourceUrl: url,
    ingredientLines: lines,
    ingredients: parsedIngredients,
    servings: jsonLdData.yieldValue,
    totalTimeHours: jsonLdData.totalTimeHours,
    unitSystem,
    warnings: parsedIngredients
      .filter((item) => item.confidence < 0.6)
      .map((item) => `Low-confidence parse: ${item.rawText}`)
      .slice(0, 8)
  }
})
