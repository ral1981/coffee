<template>
  <div class="filters-section">
    <div class="filters-header">
      <strong>Additional Filters</strong>
      <span v-if="hasActiveFilters" class="selection-count-badge">
        {{ activeFiltersCount }} selected
      </span>
      <button
        v-if="hasActiveFilters"
        @click.stop="clearAdditionalFilters"
        class="clear-btn"
        :title="`Clear ${activeFiltersCount} filter${activeFiltersCount > 1 ? 's' : ''}`"
      >
        <X :size="12" />
      </button>
    </div>
    <div class="filters-grid">
      <div class="filter-group">
        <label class="filter-label" for="origin-select">Origin</label>
        <select 
          id="origin-select"
          class="filter-select" 
          :value="modelValue.origin" 
          @change.stop="updateOrigin"
          @click.stop
        >
          <option value="">All Origins</option>
          <option v-for="origin in origins" :key="origin" :value="origin">
            {{ origin }}
          </option>
        </select>
      </div>
      <div class="filter-group">
        <label class="filter-label" for="shop-select">Shop</label>
        <select 
          id="shop-select"
          class="filter-select" 
          :value="modelValue.shop" 
          @change.stop="updateShop"
          @click.stop
        >
          <option value="">All Shops</option>
          <option v-for="shop in shops" :key="shop" :value="shop">
            {{ shop }}
          </option>
        </select>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { X } from 'lucide-vue-next'

const props = defineProps({
  modelValue: { type: Object, default: () => ({ origin: '', shop: '' }) },
  origins: { type: Array, default: () => [] },
  shops: { type: Array, default: () => [] }
})

const emit = defineEmits(['update:modelValue'])

const hasActiveFilters = computed(() => {
  return props.modelValue.origin !== '' || props.modelValue.shop !== ''
})

const activeFiltersCount = computed(() => {
  let count = 0
  if (props.modelValue.origin) count++
  if (props.modelValue.shop) count++
  return count
})

const clearAdditionalFilters = () => {
  console.log('🧹 FiltersSection - clearAdditionalFilters')
  emit('update:modelValue', { origin: '', shop: '' })
}

const updateOrigin = (event) => {
  console.log('🔄 FiltersSection - updateOrigin:', event.target.value)
  emit('update:modelValue', { ...props.modelValue, origin: event.target.value })
}

const updateShop = (event) => {
  console.log('🔄 FiltersSection - updateShop:', event.target.value)
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
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  color: #333;
}

.filters-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  padding: 1rem;
}

.filter-group { 
  display: flex; 
  flex-direction: column; 
}

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
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.875rem;
  user-select: none;
}

.filter-select:hover {
  border-color: #22c55e;
  box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.1);
}

.filter-select:focus {
  outline: 2px solid #22c55e;
  outline-offset: 2px;
  border-color: #22c55e;
}

.selection-count-badge {
  background: #3b82f6;
  color: white;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.125rem 0.5rem;
  border-radius: 12px;
  margin-left: auto;
  margin-right: 0.5rem;
}

.clear-btn {
  background: none;
  border: none;
  padding: 0.25rem;
  cursor: pointer;
  border-radius: 4px;
  color: #6b7280;
  transition: all 0.2s;
  flex-shrink: 0;
}

.clear-btn:hover {
  background: #f3f4f6;
  color: #ef4444;
  transform: scale(1.1);
}

.clear-btn:focus {
  outline: 2px solid #ef4444;
  outline-offset: 2px;
}

/* Responsive design */
@media (max-width: 640px) {
  .filters-grid {
    grid-template-columns: 1fr;
    gap: 0.75rem;
    padding: 0.75rem;
  }
  
  .filters-header {
    padding: 0.75rem;
  }
  
  .filter-select {
    padding: 0.5rem;
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .filters-section {
    background: rgba(31, 41, 55, 0.95);
    border-color: #374151;
  }
  
  .filters-header {
    background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
    border-color: #374151;
    color: #f9fafb;
  }
  
  .filter-label {
    color: #9ca3af;
  }
  
  .filter-select {
    background: #1f2937;
    border-color: #4b5563;
    color: #f9fafb;
  }
  
  .filter-select:hover {
    border-color: #22c55e;
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .filter-select {
    border-width: 2px;
    font-weight: 600;
  }
  
  .selection-count-badge {
    border: 2px solid currentColor;
    font-weight: 700;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .filter-select,
  .clear-btn {
    transition: none;
  }
  
  .clear-btn:hover {
    transform: none;
  }
}
</style>