<template>
  <div class="filters-container">
    <!-- Main Filter Header with Collapse/Expand -->
    <div class="filters-main-header" @click="toggleExpanded">
      <div class="header-content">
        <Filter :size="18" class="header-icon" />
        <h3 class="header-title">Filters</h3>
        
        <!-- Active filters count badge -->
        <span v-if="totalActiveFilters > 0" class="active-count-badge">
          {{ totalActiveFilters }} active
        </span>
        
        <!-- Expand/Collapse indicator -->
        <button class="expand-toggle" :class="{ expanded: isExpanded }">
          <ChevronDown :size="16" />
        </button>
      </div>
    </div>

    <!-- Collapsible Content -->
    <div class="filters-content" :class="{ expanded: isExpanded }">
      <div class="filters-sections">
        <!-- Additional Filters Section -->
        <FiltersSection 
          :model-value="localFilters"
          @update:model-value="updateFilters"
          :origins="origins"
          :shops="shops"
        />

        <!-- Container Quick Filters (includes Favorites, Containers, Quick Actions, Active Filters) -->
        <ContainerQuickFilters 
          :model-value="localActiveContainers"
          @update:model-value="updateActiveContainers"
          :containers="containers"
          :container-counts="containerCounts"
          :filtered-count="filteredCount"
          :show-favorites="showFavorites"
          :additional-filters="localFilters"
          @toggle-favorites="$emit('toggle-favorites', $event)"
          @clear-filters="$emit('clear-filters')"
          @clear-origin-filter="clearOriginFilter"
          @clear-shop-filter="clearShopFilter"
          @export-favorites="$emit('export-favorites')"
          @add-all-to-favorites="$emit('add-all-to-favorites')"
        />
      </div>
    </div>

    <!-- Always Visible Active Filters Section (when filters are active) -->
    <div v-if="totalActiveFilters > 0" class="active-filters-always-visible">
      <div class="active-filters-header">
        <span class="active-filters-title">Active Filters:</span>
        <button 
          @click="$emit('clear-filters')" 
          class="clear-all-active-btn"
          title="Clear all filters"
        >
          Clear All
        </button>
      </div>
      <div class="active-filters-pills">
        <!-- Favorites pill -->
        <span v-if="showFavorites" class="filter-pill favorites-pill">
          <Heart :size="12" />
          Favorites
          <button @click="$emit('toggle-favorites', false)" class="pill-remove">
            <X :size="10" />
          </button>
        </span>
        
        <!-- Origin filter pill -->
        <span v-if="localFilters.origin" class="filter-pill additional-pill">
          <MapPin :size="12" />
          {{ localFilters.origin }}
          <button @click="clearOriginFilter" class="pill-remove" title="Remove origin filter">
            <X :size="10" />
          </button>
        </span>
        
        <!-- Shop filter pill -->
        <span v-if="localFilters.shop" class="filter-pill additional-pill">
          <Store :size="12" />
          {{ localFilters.shop }}
          <button @click="clearShopFilter" class="pill-remove" title="Remove shop filter">
            <X :size="10" />
          </button>
        </span>
        
        <!-- Container filter pills -->
        <span 
          v-for="container in localActiveContainers" 
          :key="container.id"
          class="filter-pill container-pill"
          :style="{ 
            backgroundColor: container.color + '20', 
            borderColor: container.color,
            color: container.color 
          }"
        >
          <div 
            class="pill-dot" 
            :style="{ backgroundColor: container.color }"
          ></div>
          {{ container.name }}
          <button @click="removeContainerFilter(container)" class="pill-remove" :title="`Remove ${container.name} filter`">
            <X :size="10" />
          </button>
        </span>
      </div>
    </div>

</div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { Filter, ChevronDown, Heart, MapPin, Store, X } from 'lucide-vue-next'
import FiltersSection from './FiltersSection.vue'
import ContainerQuickFilters from './ContainerQuickFilters.vue'

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
  defaultExpanded: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits([
  'update:filters',
  'update:activeContainers',
  'toggle-favorites',
  'clear-filters',
  'export-favorites',
  'add-all-to-favorites'
])

// Local state
const isExpanded = ref(props.defaultExpanded)
const localFilters = ref({ ...props.filters })
const localActiveContainers = ref([...props.activeContainers])

// Computed properties
const totalActiveFilters = computed(() => {
  let count = 0
  
  // Count additional filters
  if (localFilters.value.origin) count++
  if (localFilters.value.shop) count++
  
  // Count container filters
  count += localActiveContainers.value.length
  
  // Count favorites filter
  if (props.showFavorites) count++
  
  return count
})

// Methods
const toggleExpanded = () => {
  isExpanded.value = !isExpanded.value
}

const updateFilters = (newFilters) => {
  localFilters.value = newFilters
  emit('update:filters', newFilters)
}

const updateActiveContainers = (newContainers) => {
  localActiveContainers.value = newContainers
  emit('update:activeContainers', newContainers)
}

const clearOriginFilter = () => {
  const updatedFilters = { ...localFilters.value, origin: '' }
  updateFilters(updatedFilters)
}

const clearShopFilter = () => {
  const updatedFilters = { ...localFilters.value, shop: '' }
  updateFilters(updatedFilters)
}

const removeContainerFilter = (container) => {
  const updatedContainers = localActiveContainers.value.filter(c => c.id !== container.id)
  updateActiveContainers(updatedContainers)
}

// Watch for external prop changes and sync with local state
watch(() => props.filters, (newFilters) => {
  localFilters.value = { ...newFilters }
}, { deep: true, immediate: true })

watch(() => props.activeContainers, (newContainers) => {
  localActiveContainers.value = [...newContainers]
}, { deep: true, immediate: true })

// Watch for external filter changes and auto-expand if filters are applied
watch(() => totalActiveFilters.value, (newCount, oldCount) => {
  // Auto-expand when filters are first applied
  if (newCount > 0 && oldCount === 0 && !isExpanded.value) {
    isExpanded.value = true
  }
}, { immediate: true })
</script>

<style scoped>
.filters-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #f0f0f0;
  overflow: hidden;
  transition: all 0.2s ease;
}

.filters-container:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
}

/* Always Visible Active Filters */
.active-filters-always-visible {
  padding: 0.875rem 1rem;
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
}

.active-filters-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}

.active-filters-title {
  font-size: 0.8125rem;
  font-weight: 600;
  color: #495057;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.clear-all-active-btn {
  background: none;
  border: 1px solid #dc3545;
  color: #dc3545;
  padding: 0.25rem 0.625rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.clear-all-active-btn:hover {
  background: #dc3545;
  color: white;
}

.active-filters-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
}

.filter-pill {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.625rem;
  border-radius: 16px;
  font-size: 0.75rem;
  font-weight: 500;
  border: 1px solid currentColor;
  position: relative;
  transition: all 0.2s ease;
}

.filter-pill:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.favorites-pill {
  background: #fef7e7;
  color: #d97706;
  border-color: #f59e0b;
}

.additional-pill {
  background: #eff6ff;
  color: #2563eb;
  border-color: #3b82f6;
}

.container-pill {
  background: var(--pill-bg, #f3f4f6);
  border: 1px solid var(--pill-border, #d1d5db);
}

.pill-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.pill-remove {
  background: none;
  border: none;
  margin-left: 0.25rem;
  padding: 0.125rem;
  cursor: pointer;
  border-radius: 50%;
  color: currentColor;
  opacity: 0.7;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pill-remove:hover {
  opacity: 1;
  background: rgba(0, 0, 0, 0.1);
  transform: scale(1.1);
}

/* Main Header */
.filters-main-header {
  padding: 1rem;
  background: #f8f9fa;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background-color 0.2s ease;
  user-select: none;
}

.filters-main-header:hover {
  background: #f1f3f4;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.header-icon {
  color: #6b7280;
  flex-shrink: 0;
}

.header-title {
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
  margin: 0;
  flex: 1;
}

.active-count-badge {
  background: #3b82f6;
  color: white;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.25rem 0.625rem;
  border-radius: 12px;
  white-space: nowrap;
}

.expand-toggle {
  background: none;
  border: none;
  padding: 0.25rem;
  cursor: pointer;
  border-radius: 4px;
  color: #6b7280;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.expand-toggle:hover {
  background: rgba(0, 0, 0, 0.05);
  color: #374151;
}

.expand-toggle.expanded {
  transform: rotate(180deg);
}

/* Collapsible Content */
.filters-content {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s ease-out;
}

.filters-content.expanded {
  max-height: 2000px; /* Large enough to accommodate all filter content */
}

.filters-sections {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
}

/* Remove individual component shadows since they're now inside a container */
.filters-sections :deep(.filters-section),
.filters-sections :deep(.quick-filters-section > div) {
  box-shadow: none;
  border: 1px solid #e5e7eb;
}

/* Responsive Design */
@media (max-width: 768px) {
  .active-filters-always-visible {
    padding: 0.75rem 0.875rem;
  }
  
  .active-filters-pills {
    gap: 0.375rem;
  }
  
  .filter-pill {
    padding: 0.3125rem 0.5rem;
    font-size: 0.6875rem;
  }
  
  .clear-all-active-btn {
    font-size: 0.6875rem;
    padding: 0.1875rem 0.5rem;
  }
  
  .filters-main-header {
    padding: 0.875rem;
  }
  
  .header-title {
    font-size: 0.9375rem;
  }
  
  .filters-sections {
    gap: 0.75rem;
    padding: 0.875rem;
  }
}

@media (max-width: 640px) {
  .active-filters-always-visible {
    padding: 0.625rem 0.75rem;
  }
  
  .active-filters-title {
    font-size: 0.75rem;
  }
  
  .active-filters-pills {
    gap: 0.3125rem;
  }
  
  .filter-pill {
    padding: 0.25rem 0.4375rem;
    font-size: 0.625rem;
    gap: 0.25rem;
  }
  
  .clear-all-active-btn {
    font-size: 0.625rem;
    padding: 0.125rem 0.4375rem;
  }
  
  .filters-main-header {
    padding: 0.75rem;
  }
  
  .header-content {
    gap: 0.5rem;
  }
  
  .header-title {
    font-size: 0.875rem;
  }
  
  .active-count-badge {
    font-size: 0.6875rem;
    padding: 0.1875rem 0.5rem;
  }
  
  .filters-sections {
    gap: 0.5rem;
    padding: 0.75rem;
  }
}

/* Dark Mode Support */
@media (prefers-color-scheme: dark) {
  .active-filters-always-visible {
    background: #111827;
    border-color: #374151;
  }
  
  .active-filters-title {
    color: #d1d5db;
  }
  
  .clear-all-active-btn {
    border-color: #ef4444;
    color: #ef4444;
  }
  
  .clear-all-active-btn:hover {
    background: #ef4444;
    color: white;
  }
  
  .favorites-pill {
    background: #451a03;
    color: #fbbf24;
    border-color: #d97706;
  }
  
  .additional-pill {
    background: #1e3a8a;
    color: #60a5fa;
    border-color: #3b82f6;
  }
  
  .container-pill {
    background: #374151;
    border-color: #6b7280;
    color: #d1d5db;
  }
  
  .filters-container {
    background: #1f2937;
    border-color: #374151;
  }
  
  .filters-main-header {
    background: #111827;
    border-color: #374151;
  }
  
  .filters-main-header:hover {
    background: #0f172a;
  }
  
  .header-icon {
    color: #9ca3af;
  }
  
  .header-title {
    color: #f9fafb;
  }
  
  .expand-toggle {
    color: #9ca3af;
  }
  
  .expand-toggle:hover {
    background: rgba(255, 255, 255, 0.05);
    color: #f3f4f6;
  }
  
  .filters-sections :deep(.filters-section),
  .filters-sections :deep(.quick-filters-section > div) {
    border-color: #4b5563;
  }
}

/* Reduced Motion */
@media (prefers-reduced-motion: reduce) {
  .filters-container,
  .filters-main-header,
  .expand-toggle,
  .filters-content {
    transition: none;
  }
  
  .expand-toggle.expanded {
    transform: none;
  }
}

/* High Contrast Mode */
@media (prefers-contrast: high) {
  .filters-container {
    border-width: 2px;
  }
  
  .active-count-badge {
    font-weight: 700;
    border: 1px solid currentColor;
  }
  
  .expand-toggle {
    border: 1px solid transparent;
  }
  
  .expand-toggle:focus {
    border-color: currentColor;
  }
}

/* Animation for smooth expand/collapse */
@keyframes slideDown {
  from {
    max-height: 0;
    opacity: 0;
  }
  to {
    max-height: 2000px;
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    max-height: 2000px;
    opacity: 1;
  }
  to {
    max-height: 0;
    opacity: 0;
  }
}

/* Focus states for accessibility */
.filters-main-header:focus {
  outline: 2px solid #3b82f6;
  outline-offset: -2px;
}

.expand-toggle:focus {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

/* Loading state */
.filters-container.loading {
  pointer-events: none;
  opacity: 0.7;
}

.filters-container.loading .filters-main-header {
  cursor: not-allowed;
}
</style>