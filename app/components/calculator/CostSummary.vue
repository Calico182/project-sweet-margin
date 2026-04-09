<template>
  <aside class="summary">
    <h2 class="summary__title">Cost summary</h2>
    <p v-if="!isActive" class="empty-state">Select a saved recipe to view the cost summary.</p>
    <div v-else class="mode">
      <label for="price-mode">Pricing strategy</label>
      <select id="price-mode" v-model="priceMode">
        <option value="conservative">Conservative</option>
        <option value="standard">Standard</option>
        <option value="aggressive">Aggressive</option>
      </select>
    </div>
    <dl v-if="isActive" class="rows">
      <div class="row"><dt>Ingredients</dt><dd>{{ formatCurrency(summary.ingredientsCost) }}</dd></div>
      <div class="row"><dt>Labor</dt><dd>{{ formatCurrency(summary.laborCost) }}</dd></div>
      <div class="row"><dt>Overhead</dt><dd>{{ formatCurrency(summary.overheadCost) }}</dd></div>
      <div class="row row--strong"><dt>Base cost</dt><dd>{{ formatCurrency(summary.baseCost) }}</dd></div>
      <div class="row"><dt>Profit</dt><dd>{{ formatCurrency(summary.profitAmount) }}</dd></div>
      <div class="row row--strong"><dt>Total price</dt><dd>{{ formatCurrency(summary.totalPrice) }}</dd></div>
      <div class="row row--strong"><dt>Recommended selling price</dt><dd>{{ recommendedLabel }}</dd></div>
      <div class="row"><dt>Cost / serving</dt><dd>{{ formatCurrency(summary.costPerServing) }}</dd></div>
      <div class="row"><dt>Price / serving</dt><dd>{{ formatCurrency(summary.pricePerServing) }}</dd></div>
    </dl>

    <ul v-if="summary.warnings.length" class="warnings">
      <li v-for="warning in summary.warnings" :key="warning">{{ warning }}</li>
    </ul>
  </aside>
</template>

<script setup lang="ts">
import type { RecipeCostSummary } from '~/types/calculator'
import { formatCurrency } from '~/utils/costing'

const props = defineProps<{
  summary: RecipeCostSummary
  isActive: boolean
}>()

const priceMode = ref<'conservative' | 'standard' | 'aggressive'>('standard')

function recommendSellingPrice(totalPrice: number): number {
  const base = Math.max(0, totalPrice)
  const markup =
    priceMode.value === 'conservative' ? 1.05 : priceMode.value === 'aggressive' ? 1.12 : 1.08
  const buffered = base * markup

  let step = 5
  if (buffered >= 2000) step = 50
  else if (buffered >= 500) step = 20
  else if (buffered >= 100) step = 10

  return Math.ceil(buffered / step) * step
}

const recommendedLabel = computed(() => {
  return formatCurrency(recommendSellingPrice(props.summary.totalPrice))
})
</script>

<style scoped>
.summary { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 0.75rem; padding: 1rem; position: sticky; top: 5rem; }
.summary__title { margin: 0 0 0.75rem; font-size: 1.1rem; }
.empty-state { margin: 0; color: var(--color-text-muted); font-size: 0.9rem; }
.mode { display: flex; gap: 0.55rem; align-items: center; margin-bottom: 0.7rem; }
.mode label { color: var(--color-text-muted); font-size: 0.82rem; }
.mode select { border: 1px solid var(--color-border); border-radius: 0.4rem; padding: 0.3rem 0.45rem; background: #fff; }
.rows { margin: 0; }
.row { display: flex; justify-content: space-between; gap: 0.75rem; padding: 0.35rem 0; border-bottom: 1px dashed var(--color-border); }
.row dt { color: var(--color-text-muted); }
.row dd { margin: 0; font-weight: 600; }
.row--strong dd, .row--strong dt { color: var(--color-text); font-weight: 700; }
.warnings { margin: 0.75rem 0 0; padding-left: 1rem; color: #9f3447; font-size: 0.85rem; }
</style>
