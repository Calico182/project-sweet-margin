<template>
  <aside class="summary">
    <h2 class="summary__title">Cost summary</h2>
    <dl class="rows">
      <div class="row"><dt>Ingredients</dt><dd>{{ formatCurrency(summary.ingredientsCost) }}</dd></div>
      <div class="row"><dt>Labor</dt><dd>{{ formatCurrency(summary.laborCost) }}</dd></div>
      <div class="row"><dt>Overhead</dt><dd>{{ formatCurrency(summary.overheadCost) }}</dd></div>
      <div class="row row--strong"><dt>Base cost</dt><dd>{{ formatCurrency(summary.baseCost) }}</dd></div>
      <div class="row"><dt>Profit</dt><dd>{{ formatCurrency(summary.profitAmount) }}</dd></div>
      <div class="row row--strong"><dt>Total price</dt><dd>{{ formatCurrency(summary.totalPrice) }}</dd></div>
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

defineProps<{
  summary: RecipeCostSummary
}>()
</script>

<style scoped>
.summary { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 0.75rem; padding: 1rem; position: sticky; top: 5rem; }
.summary__title { margin: 0 0 0.75rem; font-size: 1.1rem; }
.rows { margin: 0; }
.row { display: flex; justify-content: space-between; gap: 0.75rem; padding: 0.35rem 0; border-bottom: 1px dashed var(--color-border); }
.row dt { color: var(--color-text-muted); }
.row dd { margin: 0; font-weight: 600; }
.row--strong dd, .row--strong dt { color: var(--color-text); font-weight: 700; }
.warnings { margin: 0.75rem 0 0; padding-left: 1rem; color: #9f3447; font-size: 0.85rem; }
</style>
