export type UnitSystem = 'metric' | 'imperial'

export interface ParsedIngredient {
  rawText: string
  name: string
  quantity: number
  unit: string
  note?: string
  confidence: number
}

const fractionTokenMap: Record<string, number> = {
  '1/2': 0.5,
  '1/3': 1 / 3,
  '2/3': 2 / 3,
  '1/4': 0.25,
  '3/4': 0.75,
  '1/8': 0.125,
  '3/8': 0.375,
  '5/8': 0.625,
  '7/8': 0.875
}

const unitAliases: Record<string, string> = {
  g: 'g',
  gram: 'g',
  grams: 'g',
  kg: 'kg',
  kilogram: 'kg',
  kilograms: 'kg',
  ml: 'ml',
  milliliter: 'ml',
  milliliters: 'ml',
  millilitre: 'ml',
  millilitres: 'ml',
  l: 'l',
  liter: 'l',
  liters: 'l',
  litre: 'l',
  litres: 'l',
  t: 'tsp',
  tsp: 'tsp',
  tsps: 'tsp',
  tspn: 'tsp',
  tspns: 'tsp',
  teaspoon: 'tsp',
  teaspoons: 'tsp',
  tbl: 'tbsp',
  tbs: 'tbsp',
  tbsp: 'tbsp',
  tbsps: 'tbsp',
  tablespoon: 'tbsp',
  tablespoons: 'tbsp',
  cup: 'cup',
  cups: 'cup',
  oz: 'oz',
  ounce: 'oz',
  ounces: 'oz',
  lb: 'lb',
  lbs: 'lb',
  pound: 'lb',
  pounds: 'lb',
  each: 'each',
  egg: 'each',
  eggs: 'each',
  clove: 'each',
  cloves: 'each',
  pinch: 'each',
  pinches: 'each'
}

const metricPreferredUnits = new Set(['g', 'kg', 'ml', 'l', 'tsp', 'tbsp', 'cup', 'each'])
const liquidKeywords = [
  'water',
  'milk',
  'cream',
  'oil',
  'vinegar',
  'extract',
  'juice',
  'syrup',
  'honey',
  'molasses'
]
const tspDefaultKeywords = [
  'salt',
  'baking soda',
  'bicarbonate of soda',
  'baking powder',
  'cinnamon',
  'nutmeg',
  'ginger',
  'clove',
  'allspice',
  'cardamom',
  'paprika',
  'turmeric',
  'cayenne',
  'pepper'
]

function normalizeText(input: string): string {
  return input
    .replace(/\u00a0/g, ' ')
    .replace(/\u215B/g, ' 1/8 ')
    .replace(/\u00BC/g, ' 1/4 ')
    .replace(/\u2153/g, ' 1/3 ')
    .replace(/\u00BD/g, ' 1/2 ')
    .replace(/\u2154/g, ' 2/3 ')
    .replace(/\u00BE/g, ' 3/4 ')
    .replace(/[\u2012-\u2015]/g, '-')
    .replace(/[()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function parseNumericToken(token: string): number {
  const cleaned = token.trim().toLowerCase()

  if (fractionTokenMap[cleaned] !== undefined) {
    return fractionTokenMap[cleaned]
  }

  if (/^\d+\/\d+$/.test(cleaned)) {
    const [a = Number.NaN, b = Number.NaN] = cleaned.split('/').map(Number)
    if (Number.isFinite(a) && Number.isFinite(b) && b > 0) {
      return a / b
    }
  }

  const asNumber = Number(cleaned)
  if (Number.isFinite(asNumber)) {
    return asNumber
  }

  return Number.NaN
}

function parseCompositeNumber(input: string): number {
  const cleaned = input.trim()
  if (!cleaned) return Number.NaN
  const parts = cleaned.split(/\s+/)
  let total = 0
  for (const part of parts) {
    const n = parseNumericToken(part)
    if (Number.isNaN(n)) return Number.NaN
    total += n
  }
  return total
}

function parseQuantityPrefix(line: string): { quantity: number; rest: string } {
  const tokens = line.split(' ')
  let quantity = 0
  let consumed = 0

  for (let i = 0; i < Math.min(3, tokens.length); i += 1) {
    const token = tokens[i] ?? ''
    if (token === '+' || token.toLowerCase() === 'and') {
      consumed = i + 1
      continue
    }

    if (token.includes('-') && /^\d+(\.\d+)?-\d+(\.\d+)?$/.test(token)) {
      const [start = Number.NaN, end = Number.NaN] = token.split('-').map(Number)
      if (Number.isFinite(start) && Number.isFinite(end)) {
        quantity = (start + end) / 2
        consumed = i + 1
        break
      }
    }

    if (/^\d+(\.\d+)?$/.test(token) && ['to', '-', 'or'].includes(tokens[i + 1]?.toLowerCase() ?? '')) {
      const nextToken = tokens[i + 2] ?? ''
      const endRange = Number(nextToken)
      if (Number.isFinite(endRange)) {
        quantity = (Number(token) + endRange) / 2
        consumed = i + 3
        break
      }
    }

    const numeric = parseNumericToken(token)
    if (!Number.isNaN(numeric)) {
      quantity += numeric
      consumed = i + 1
      continue
    }

    break
  }

  if (quantity <= 0) {
    return { quantity: 1, rest: line }
  }

  return { quantity, rest: tokens.slice(consumed).join(' ').trim() }
}

function extractEmbeddedMetric(text: string): { quantity: number; unit: string } | null {
  const match = text.match(/\((\d+(?:\.\d+)?)\s*(g|kg|ml|l)\b/i)
  if (!match) return null
  const unit = (match[2] ?? '').toLowerCase()
  if (!unit) return null
  return {
    quantity: Number(match[1]),
    unit
  }
}

function splitNameAndNote(text: string): { core: string; note?: string } {
  const parts = text.split(',')
  const core = parts.shift()?.trim() ?? text
  const note = parts.join(',').trim()
  return { core, note: note || undefined }
}

function cleanIngredientName(text: string): string {
  const cleaned = text
    .replace(/\([^)]*\)/g, ' ')
    .replace(
      /^\d+(?:\.\d+)?\s*(?:g|kg|ml|l)\s*(?:\/\s*\d+(?:\.\d+)?\s*(?:tsp|tbsp|cup|oz|lb))?\b/i,
      ' '
    )
    .replace(/^(?:\/\s*)?\d+(?:\.\d+)?\s*(?:tsp|tbsp|cup|oz|lb)\b/i, ' ')
    .replace(/^(?:of\s+)+/i, ' ')
    .replace(/\bsemi-sweet\b/gi, ' ')
    .replace(/\bpacked\b/gi, ' ')
    .replace(/\blight or dark\b/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/\bspooned\s*&\s*leveled\b/gi, ' ')
    .replace(/\bmelted\s*&\s*cooled(?:\s+for\s+\d+\s+\w+)?\b/gi, ' ')
    .replace(/\s+or\s+[^,]+$/i, ' ')
    .replace(/,\s*(?:at|for|to)\b.*$/i, ' ')
    .replace(/\*+/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  return cleaned
}

function isLikelyLiquid(name: string): boolean {
  const lower = name.toLowerCase()
  return liquidKeywords.some((keyword) => lower.includes(keyword))
}

function isTspDefaultIngredient(name: string): boolean {
  const lower = name.toLowerCase()
  return tspDefaultKeywords.some((keyword) => lower.includes(keyword))
}

function normalizeToTsp(quantity: number, unit: string): { quantity: number; unit: string } {
  if (unit === 'tsp') return { quantity, unit }
  if (unit === 'tbsp') return { quantity: quantity * 3, unit: 'tsp' }
  if (unit === 'ml') return { quantity: quantity / 5, unit: 'tsp' }
  if (unit === 'l') return { quantity: quantity * 200, unit: 'tsp' }
  if (unit === 'cup') return { quantity: quantity * 48, unit: 'tsp' }
  return { quantity, unit: 'tsp' }
}

function parseEggMeasurement(raw: string): { quantity: number; name: string } | null {
  const lower = normalizeText(raw).toLowerCase()
  if (!/\begg(?:s)?\b|\byolk(?:s)?\b/.test(lower)) {
    return null
  }

  const matches = [
    ...lower.matchAll(
      /(\d+(?:\.\d+)?(?:\s+\d+\/\d+)?|\d+\/\d+)\s*(?:large|medium|small)?\s*(egg(?:s)?|yolk(?:s)?)/g
    )
  ]

  if (!matches.length) {
    return { quantity: 1, name: 'egg' }
  }

  let total = 0
  let hasEgg = false
  let hasYolk = false

  for (const match of matches) {
    const qty = parseCompositeNumber(match[1] ?? '')
    if (!Number.isNaN(qty)) total += qty
    const kind = match[2] ?? ''
    if (kind.startsWith('egg')) hasEgg = true
    if (kind.startsWith('yolk')) hasYolk = true
  }

  if (total <= 0) total = 1

  if (hasEgg && hasYolk) return { quantity: total, name: 'egg + egg yolk' }
  if (hasYolk) return { quantity: total, name: 'egg yolk' }
  return { quantity: total, name: 'egg' }
}

function normalizeUnit(unitToken: string): string {
  const token = unitToken.toLowerCase().replace(/\./g, '')
  return unitAliases[token] ?? ''
}

function convertForMetricPreference(quantity: number, unit: string): { quantity: number; unit: string } {
  if (metricPreferredUnits.has(unit)) {
    return { quantity, unit }
  }

  if (unit === 'oz') {
    return { quantity: quantity * 28.3495, unit: 'g' }
  }

  if (unit === 'lb') {
    return { quantity: quantity * 453.592, unit: 'g' }
  }

  return { quantity, unit: 'each' }
}

function convertForImperialPreference(quantity: number, unit: string): { quantity: number; unit: string } {
  if (unit === 'g') {
    return { quantity: quantity / 28.3495, unit: 'oz' }
  }

  if (unit === 'kg') {
    return { quantity: quantity * 2.20462, unit: 'lb' }
  }

  if (unit === 'ml') {
    return { quantity: quantity / 29.5735, unit: 'oz' }
  }

  if (unit === 'l') {
    return { quantity: quantity * 33.814, unit: 'oz' }
  }

  return { quantity, unit }
}

export function parseIngredientLine(raw: string, unitSystem: UnitSystem): ParsedIngredient {
  const normalized = normalizeText(raw).replace(/\s+,/g, ',').trim()
  const embeddedMetric = extractEmbeddedMetric(raw)
  const { quantity, rest } = parseQuantityPrefix(normalized)
  const parts = rest.split(' ')

  const firstTokenUnit = normalizeUnit(parts[0] ?? '')
  const secondTokenUnit = normalizeUnit(parts[1] ?? '')

  let unit = firstTokenUnit
  let consumedTokens = 1

  if (!unit && secondTokenUnit) {
    unit = secondTokenUnit
    consumedTokens = 2
  }

  const remaining = unit ? parts.slice(consumedTokens).join(' ').trim() : rest
  const { core, note } = splitNameAndNote(remaining)
  const cleanedName = cleanIngredientName(core || raw)

  let adjusted = { quantity, unit: unit || 'each' }
  if (unitSystem === 'metric' && embeddedMetric) {
    adjusted = embeddedMetric
  } else if (unitSystem === 'metric') {
    adjusted = convertForMetricPreference(quantity, adjusted.unit)
  } else {
    adjusted = convertForImperialPreference(quantity, adjusted.unit)
  }

  if (unitSystem === 'metric' && adjusted.unit === 'cup' && !isLikelyLiquid(cleanedName) && embeddedMetric) {
    adjusted = embeddedMetric
  }

  if (unitSystem === 'metric' && isTspDefaultIngredient(cleanedName)) {
    adjusted = normalizeToTsp(adjusted.quantity, adjusted.unit)
  }

  const lowerName = cleanedName.toLowerCase()
  if (unitSystem === 'metric' && lowerName.includes('butter')) {
    if (embeddedMetric?.unit === 'g') {
      adjusted = { quantity: embeddedMetric.quantity, unit: 'g' }
    } else if (embeddedMetric?.unit === 'kg') {
      adjusted = { quantity: embeddedMetric.quantity * 1000, unit: 'g' }
    }
  }

  const eggMeasurement = parseEggMeasurement(raw)
  const finalName = eggMeasurement ? eggMeasurement.name : cleanedName
  if (eggMeasurement) {
    adjusted = { quantity: eggMeasurement.quantity, unit: 'each' }
  }

  const confidence = Math.max(
    0,
    Math.min(1, (unit ? 0.6 : 0.35) + (core.length > 2 ? 0.25 : 0) + (normalized !== raw ? 0.05 : 0))
  )

  return {
    rawText: raw,
    name: finalName || raw,
    quantity: Number(adjusted.quantity.toFixed(3)),
    unit: adjusted.unit,
    note,
    confidence
  }
}

export function parseIngredients(lines: string[], unitSystem: UnitSystem): ParsedIngredient[] {
  return lines
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => parseIngredientLine(line, unitSystem))
}
