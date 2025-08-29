<template>
  <div class="filters-container" :class="{ 'is-expanded': isExpanded }">
    <!-- Main Filter Header with Collapse/Expand -->
    <div class="filters-main-header" @click="toggleExpanded">
      <div class="header-content">
        <Sliders :size="18" class="header-icon" />
        <h3 class="header-title">Filters</h3>
        
        <!-- Active filters count badge -->
        <span v-if="totalActiveFilters > 0" class="active-count-badge">
          {{ totalActiveFilters }} active
        </span>
        
        <!-- Expand/Collapse toggle -->
        <button class="expand-toggle" :class="{ expanded: isExpanded }" @click="handleToggleClick">
          <ChevronDown :size="16" />
        </button>
      </div>
    </div>

    <!-- Collapsible Content -->
    <div class="filters-content" :class="{ expanded: isExpanded }">
      <div class="filters-sections">
        <!-- Additional Filters Section -->
        <AdditionalFilters 
          v-model="localFilters"
          :origins="origins"
          :shops="shops"
        />

        <!-- Quick Filters (formerly ContainerQuickFilters) -->
        <QuickFilters 
          v-model:active-containers="localActiveContainers"
          v-model:show-favorites="localShowFavorites"
          :containers="containers"
          :container-counts="containerCounts"
          :filtered-count="filteredCount"
          :favorite-count="favoriteCount"
          :additional-filters="localFilters"
          @export-favorites="$emit('export-favorites')"
          @clear-filters="handleClearAllFilters"
          @add-all-to-favorites="$emit('add-all-to-favorites')"
        />
      </div>
    </div>

    <!-- Always Visible Active Filters Section -->
    <div v-if="totalActiveFilters > 0" class="active-filters-always-visible">
      <div class="active-filters-header">
        <span class="active-filters-title">Active Filters:</span>
        <button 
          class="clear-all-active-btn"
          @click="handleClearAllFilters"
        >
          Clear All
        </button>
      </div>
      
      <div class="active-filters-pills">
        <!-- Favorites pill -->
        <BaseFilterTag
          v-if="localShowFavorites"
          label="Favorites"
          variant="favorites"
          icon="Heart"
          removable
          @remove="localShowFavorites = false"
        />
        
        <!-- Additional filter pills -->
        <BaseFilterTag
          v-if="localFilters.origin"
          :label="localFilters.origin"
          variant="additional"
          icon="MapPin"
          removable
          @remove="clearOriginFilter"
        />
        
        <BaseFilterTag
          v-if="localFilters.shop"
          :label="localFilters.shop"
          variant="additional"
          icon="Store"
          removable
          @remove="clearShopFilter"
        />
        
        <!-- Container filter pills -->
        <BaseFilterTag 
          v-for="container in localActiveContainers" 
          :key="container.id"
          :label="container.name"
          :color-dot="container.color || '#6b7280'"
          variant="container"
          removable
          @remove="removeContainerFilter(container)"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { Sliders, ChevronDown } from 'lucide-vue-next'
import AdditionalFilters from './AdditionalFilters.vue'
import QuickFilters from './QuickFilters.vue'
import BaseFilterTag from './shared/BaseFilterTag.vue'

const props = defineProps({
  filters: {
    type: Object,
    default: () => ({ origin: '', shop: '' })
  },
  activeContainers: {
    type: Array,
    default: () => []
  },
  origins: {
    type: Array,
    default: () => []
  },
  shops: {
    type: Array,
    default: () => []
  },
  containers: {
    type: Array,
    default: () => []
  },
  containerCounts: {
    type: Object,
    default: () => ({})
  },
  filteredCount: {
    type: Number,
    default: 0
  },
  showFavorites: {
    type: Boolean,
    default: false
  },
  favoriteCount: {
    type: Number,
    default: 0
  },
  defaultExpanded: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits([
  'update:filters',
  'update:activeContainers',
  'update:showFavorites',
  'export-favorites',
  'clear-filters',
  'add-all-to-favorites'
])

// Local state
const isExpanded = ref(props.defaultExpanded)
const localFilters = ref({ ...props.filters })
const localActiveContainers = ref([...props.activeContainers])
const localShowFavorites = ref(props.showFavorites)

// Computed properties
const totalActiveFilters = computed(() => {
  let count = 0
  
  // Count additional filters
  if (localFilters.value.origin) count++
  if (localFilters.value.shop) count++
  
  // Count container filters
  count += localActiveContainers.value.length
  
  // Count favorites filter
  if (localShowFavorites.value) count++
  
  return count
})

// Methods
const toggleExpanded = (event) => {
  if (event?.target?.closest('.expand-toggle')) {
    return
  }
  isExpanded.value = !isExpanded.value
}

const handleToggleClick = (event) => {
  event.stopPropagation()
  isExpanded.value = !isExpanded.value
}

const handleClearAllFilters = () => {
  console.log('🧹 FiltersContainer - handleClearAllFilters')
  
  // Clear all filter states
  localFilters.value = { origin: '', shop: '' }
  localActiveContainers.value = []
  localShowFavorites.value = false
  
  // Emit clear event for any external cleanup
  emit('clear-filters')
}

const clearOriginFilter = () => {
  localFilters.value = { ...localFilters.value, origin: '' }
}

const clearShopFilter = () => {
  localFilters.value = { ...localFilters.value, shop: '' }
}

const removeContainerFilter = (container) => {
  localActiveContainers.value = localActiveContainers.value.filter(c => c.id !== container.id)
}

// Watch for external prop changes and sync with local state
watch(() => props.filters, (newFilters) => {
  localFilters.value = { ...newFilters }
}, { deep: true, immediate: true })

watch(() => props.activeContainers, (newContainers) => {
  localActiveContainers.value = [...newContainers]
}, { deep: true, immediate: true })

watch(() => props.showFavorites, (newValue) => {
  localShowFavorites.value = newValue
}, { immediate: true })

// Emit changes back to parent
watch(localFilters, (newFilters) => {
  emit('update:filters', newFilters)
}, { deep: true })

watch(localActiveContainers, (newContainers) => {
  emit('update:activeContainers', newContainers)
}, { deep: true })

watch(localShowFavorites, (newValue) => {
  emit('update:showFavorites', newValue)
})
</script>

<style scoped>
.filters-container {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  border: 1px solid rgba(0, 0, 0, 0.05);
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(10px);
  background: rgba(255, 255, 255, 0.95);
}

/* Modern glassmorphism effect on hover */
.filters-container:hover {
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  transform: translateY(-2px);
  border-color: rgba(34, 197, 94, 0.2);
}

/* Enhanced expanded state with subtle glow */
.filters-container.is-expanded {
  box-shadow: 0 25px 50px -12px rgba(34, 197, 94, 0.25), 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  border-color: rgba(34, 197, 94, 0.3);
}

/* Main Header with modern gradient */
.filters-main-header {
  padding: 1.25rem;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  user-select: none;
  position: relative;
  overflow: hidden;
}

/* Shimmer effect on header hover */
.filters-main-header::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
  transition: left 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.filters-main-header:hover::before {
  left: 100%;
}

.filters-main-header:hover {
  background: linear-gradient(135deg, #e9ecef 0%, #dee2e6 100%);
  transform: scale(1.01);
}

.filters-main-header:active {
  transform: scale(0.99);
  transition: transform 0.1s ease;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  position: relative;
  z-index: 1;
}

.header-icon {
  color: #22c55e;
  flex-shrink: 0;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  filter: drop-shadow(0 2px 4px rgba(34, 197, 94, 0.3));
  transform: rotate(90deg); /* Start vertical when collapsed */
}

.filters-container.is-expanded .header-icon {
  transform: rotate(0deg); /* Horizontal when expanded */
}

.filters-main-header:hover .header-icon {
  color: #16a34a;
  scale: 1.1;
}

.header-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
  flex: 1;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
  letter-spacing: -0.025em;
}

/* Animated active count badge */
.active-count-badge {
  background: linear-gradient(135deg, #22c55e, #16a34a);
  color: white;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.375rem 0.75rem;
  border-radius: 20px;
  white-space: nowrap;
  box-shadow: 0 4px 6px -1px rgba(34, 197, 94, 0.3);
  animation: pulseGlow 2s ease-in-out infinite alternate;
  transition: all 0.3s ease;
}

.active-count-badge:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 10px -1px rgba(34, 197, 94, 0.4);
}

@keyframes pulseGlow {
  from {
    box-shadow: 0 4px 6px -1px rgba(34, 197, 94, 0.3);
  }
  to {
    box-shadow: 0 4px 12px -1px rgba(34, 197, 94, 0.5);
  }
}

/* Modern expand toggle with smooth rotation */
.expand-toggle {
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(0, 0, 0, 0.1);
  padding: 0.5rem;
  cursor: pointer;
  border-radius: 12px;
  color: #6b7280;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  backdrop-filter: blur(10px);
}

.expand-toggle:hover {
  background: rgba(255, 255, 255, 0.95);
  color: #22c55e;
  transform: scale(1.1);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.expand-toggle.expanded {
  transform: rotate(180deg) scale(1.1);
  color: #22c55e;
  background: rgba(34, 197, 94, 0.1);
  border-color: rgba(34, 197, 94, 0.2);
}

.expand-toggle.expanded:hover {
  transform: rotate(180deg) scale(1.15);
}

/* Modern collapsible content with enhanced animation */
.filters-content {
  max-height: 0;
  overflow: hidden;
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  opacity: 0;
  transform: translateY(-10px);
}

.filters-content.expanded {
  max-height: 1000px;
  opacity: 1;
  transform: translateY(0);
}

/* Filter sections */
.filters-sections {
  padding: 1.5rem;
  background: linear-gradient(180deg, rgba(248, 250, 252, 0.8) 0%, rgba(241, 245, 249, 0.9) 100%);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* Always visible active filters section */
.active-filters-always-visible {
  padding: 1rem 1.5rem;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-top: 1px solid rgba(0, 0, 0, 0.05);
}

.active-filters-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}

.active-filters-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.clear-all-active-btn {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  padding: 0.375rem 0.75rem;
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: 600;
  color: #dc2626;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.clear-all-active-btn:hover {
  background: rgba(239, 68, 68, 0.15);
  border-color: rgba(239, 68, 68, 0.3);
  color: #991b1b;
  transform: scale(1.05);
}

.active-filters-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

/* Focus styles for accessibility */
.filters-main-header:focus {
  outline: 3px solid #22c55e;
  outline-offset: -3px;
}

.expand-toggle:focus {
  outline: 3px solid #22c55e;
  outline-offset: 2px;
}

.clear-all-active-btn:focus {
  outline: 3px solid #ef4444;
  outline-offset: 2px;
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .filters-container {
    background: rgba(31, 41, 55, 0.95);
    border-color: #374151;
  }
  
  .filters-main-header {
    background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
    border-color: #374151;
  }
  
  .filters-main-header:hover {
    background: linear-gradient(135deg, #111827 0%, #0f172a 100%);
  }
  
  .header-title {
    color: #f9fafb;
  }
  
  .filters-sections {
    background: linear-gradient(180deg, rgba(31, 41, 55, 0.5) 0%, rgba(17, 24, 39, 0.8) 100%);
  }
  
  .active-filters-always-visible {
    background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
    border-color: #374151;
  }
  
  .active-filters-title {
    color: #9ca3af;
  }
  
  .expand-toggle {
    background: rgba(31, 41, 55, 0.8);
    border-color: #4b5563;
    color: #9ca3af;
  }
  
  .expand-toggle:hover {
    background: rgba(31, 41, 55, 0.95);
    color: #22c55e;
  }
}

/* Reduced Motion */
@media (prefers-reduced-motion: reduce) {
  .filters-container,
  .filters-main-header,
  .expand-toggle,
  .filters-content,
  .active-count-badge {
    animation: none;
    transition: none;
  }
  
  .expand-toggle.expanded {
    transform: rotate(180deg);
  }
  
  .filters-main-header:hover .header-icon {
    transform: none;
  }
}

/* High Contrast Mode */
@media (prefers-contrast: high) {
  .filters-container {
    border-width: 2px;
    box-shadow: none;
  }
  
  .active-count-badge {
    border: 2px solid white;
    font-weight: 700;
  }
  
  .expand-toggle {
    border-width: 2px;
  }
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .filters-main-header {
    padding: 1rem;
  }
  
  .filters-sections {
    padding: 1rem;
  }
  
  .active-filters-always-visible {
    padding: 0.75rem 1rem;
  }
  
  .header-title {
    font-size: 1rem;
  }
}
</style>