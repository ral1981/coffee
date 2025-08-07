<template>
  <div class="filters-section">
    <div class="filters-header">
      <strong>Additional Filters</strong>
    </div>
    <div class="filters-grid">
      <div class="filter-group">
        <label class="filter-label">Origin</label>
        <select class="filter-select" :value="modelValue.origin" @change="updateOrigin">
          <option value="">All Origins</option>
          <option v-for="origin in origins" :key="origin" :value="origin">
            {{ origin }}
          </option>
        </select>
      </div>
      <div class="filter-group">
        <label class="filter-label">Shop</label>
        <select class="filter-select" :value="modelValue.shop" @change="updateShop">
          <option value="">All Shops</option>
          <option v-for="shop in shops" :key="shop" :value="shop">
            {{ shop }}
          </option>
        </select>
      </div>
    </div>
    <div class="filters-actions">
      <button class="clear-filters-btn" @click="$emit('clear-all')">
        Clear All Filters
      </button>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  modelValue: { type: Object, default: () => ({ origin: '', shop: '' }) },
  origins: { type: Array, default: () => [] },
  shops: { type: Array, default: () => [] }
})

const emit = defineEmits(['update:modelValue', 'clear-all'])

const updateOrigin = (event) => {
  emit('update:modelValue', { ...props.modelValue, origin: event.target.value })
}

const updateShop = (event) => {
  emit('update:modelValue', { ...props.modelValue, shop: event.target.value })
}
</script>

<style scoped>
.filters-section {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}
.filters-header {
  padding: 1rem;
  border-bottom: 1px solid #f0f0f0;
  background: #f8f9fa;
}
.filters-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  padding: 1rem;
}
.filter-group { display: flex; flex-direction: column; }
.filter-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #666;
  margin-bottom: 0.5rem;
}
.filter-select {
  padding: 0.75rem;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  background: white;
}
.filters-actions { padding: 0 1rem 1rem 1rem; }
.clear-filters-btn {
  padding: 0.5rem 0.75rem;
  background: none;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  color: #666;
  cursor: pointer;
}
</style>