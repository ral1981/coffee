<template>
  <div class="results-counter">
    <span class="counter-text">
      Showing <strong>{{ showing }} of {{ total }}</strong> Coffees
      <span v-if="isFiltered" class="filtered-indicator">(filtered)</span>
    </span>
  </div>
</template>

<script setup>
defineProps({
  showing: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  isFiltered: { type: Boolean, default: false }
})
</script>

<style scoped>
.results-counter {
  background: white;
  border-radius: 12px;
  padding: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  text-align: center;
}
.counter-text { font-size: 1rem; color: #666; }
.filtered-indicator { color: #22c55e; font-weight: 500; }
</style>