<template>
  <div class="additional-filters">
    <BaseFilterHeader 
      title="Additional Filters"
      icon="Sliders"
      :selection-count="activeFiltersCount"
      :has-clearable-content="hasActiveFilters"
      @clear="clearAdditionalFilters"
    />
    
    <div class="filter-content">
      <div class="filters-grid">
        <div class="filter-group">
          <label class="filter-label" for="origin-select">Origin</label>
          <select 
            id="origin-select"
            class="filter-select" 
            :value="modelValue.origin" 
            @change="updateOrigin"
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
            @change="updateShop"
            @click.stop
          >
            <option value="">All Shops</option>
            <option v-for="shop in shops" :key="shop" :value="shop">
              {{ shop }}
            </option>
          </select>
        </div>
      </div>
      
      <!-- Active filter pills (optional visual enhancement) -->
      <div v-if="hasActiveFilters" class="active-filters-pills">
        <BaseFilterTag
          v-if="modelValue.origin"
          :label="modelValue.origin"
          variant="additional"
          icon="MapPin"
          removable
          @remove="clearOriginFilter"
        />
        
        <BaseFilterTag
          v-if="modelValue.shop"
          :label="modelValue.shop"
          variant="additional"
          icon="Store"
          removable
          @remove="clearShopFilter"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import BaseFilterHeader from './shared/BaseFilterHeader.vue'
import BaseFilterTag from './shared/BaseFilterTag.vue'

const props = defineProps({
  modelValue: { 
    type: Object, 
    default: () => ({ origin: '', shop: '' }) 
  },
  origins: { 
    type: Array, 
    default: () => [] 
  },
  shops: { 
    type: Array, 
    default: () => [] 
  }
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
  console.log('🧹 AdditionalFilters - clearAdditionalFilters')
  emit('update:modelValue', { origin: '', shop: '' })
}

const clearOriginFilter = () => {
  console.log('🧹 AdditionalFilters - clearOriginFilter')
  emit('update:modelValue', { ...props.modelValue, origin: '' })
}

const clearShopFilter = () => {
  console.log('🧹 AdditionalFilters - clearShopFilter')
  emit('update:modelValue', { ...props.modelValue, shop: '' })
}

const updateOrigin = (event) => {
  console.log('📍 AdditionalFilters - updateOrigin:', event.target.value)
  emit('update:modelValue', { ...props.modelValue, origin: event.target.value })
}

const updateShop = (event) => {
  console.log('🏪 AdditionalFilters - updateShop:', event.target.value)
  emit('update:modelValue', { ...props.modelValue, shop: event.target.value })
}
</script>

<style scoped>
.additional-filters {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.filter-content {
  padding: 1rem;
}

.filters-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1rem;
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
  transition: all 0.2s ease;
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

/* Active filter pills */
.active-filters-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid #f0f0f0;
}

/* Responsive design */
@media (max-width: 640px) {
  .filters-grid {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }
  
  .filter-content {
    padding: 0.75rem;
  }
  
  .filter-select {
    padding: 0.5rem;
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .additional-filters {
    background: rgba(31, 41, 55, 0.95);
    border-color: #374151;
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
  
  .active-filters-pills {
    border-color: #374151;
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .filter-select {
    border-width: 2px;
    font-weight: 600;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .filter-select {
    transition: none;
  }
}
</style>