<template>
  <div class="filters-container" :class="{ 'is-expanded': isExpanded }">
    <!-- Main Filter Header with Collapse/Expand -->
    <div class="filters-main-header" @click="toggleExpanded">
      <div class="header-content">
        <!-- Changed from Filter to Sliders icon -->
        <Sliders :size="18" class="header-icon" />
        <h3 class="header-title">Filters</h3>
        
        <!-- Active filters count badge with enhanced animation -->
        <span v-if="totalActiveFilters > 0" class="active-count-badge">
          {{ totalActiveFilters }} active
        </span>
        
        <!-- Enhanced Expand/Collapse indicator with rotation animation -->
        <button class="expand-toggle" :class="{ expanded: isExpanded }" @click="handleToggleClick">
          <ChevronDown :size="16" />
        </button>
      </div>
    </div>

    <!-- Collapsible Content with modern slide animation -->
    <div class="filters-content" :class="{ expanded: isExpanded }">
      <div class="filters-sections">
        <!-- Additional Filters Section -->
        <FiltersSection 
          :model-value="localFilters"
          @update:model-value="updateFilters"
          :origins="origins"
          :shops="shops"
        />

        <!-- Container Quick Filters -->
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

    <!-- Always Visible Active Filters Section -->
    <div v-if="totalActiveFilters > 0" class="active-filters-always-visible">
      <div class="active-filters-header">
        <span class="active-filters-title">Active Filters:</span>
        <button 
          class="clear-all-active-btn"
          @click="$emit('clear-filters')"
        >
          Clear All
        </button>
      </div>
      
      <div class="active-filters-pills">
        <!-- Favorites pill -->
        <div v-if="showFavorites" class="filter-pill favorites-pill">
          <Heart :size="12" class="pill-dot" />
          Favorites
          <button 
            class="pill-remove" 
            @click="$emit('toggle-favorites', false)"
            aria-label="Remove favorites filter"
          >
            <X :size="12" />
          </button>
        </div>
        
        <!-- Origin filter pill -->
        <div v-if="localFilters.origin" class="filter-pill additional-pill">
          <MapPin :size="12" class="pill-dot" />
          {{ localFilters.origin }}
          <button 
            class="pill-remove" 
            @click="clearOriginFilter"
            aria-label="Remove origin filter"
          >
            <X :size="12" />
          </button>
        </div>
        
        <!-- Shop filter pill -->
        <div v-if="localFilters.shop" class="filter-pill additional-pill">
          <Store :size="12" class="pill-dot" />
          {{ localFilters.shop }}
          <button 
            class="pill-remove" 
            @click="clearShopFilter"
            aria-label="Remove shop filter"
          >
            <X :size="12" />
          </button>
        </div>
        
        <!-- Container filter pills -->
        <div 
          v-for="container in localActiveContainers" 
          :key="container.id"
          class="filter-pill container-pill"
        >
          <div 
            class="pill-dot" 
            :style="{ backgroundColor: container.color || '#6b7280' }"
          ></div>
          {{ container.name }}
          <button 
            class="pill-remove" 
            @click="removeContainerFilter(container)"
            aria-label="`Remove ${container.name} filter`"
          >
            <X :size="12" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { Sliders, ChevronDown, Heart, MapPin, Store, X } from 'lucide-vue-next'
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
const toggleExpanded = (event) => {
  // Prevent expansion/collapse if clicking on the expand button directly
  // (since it has its own click handler)
  if (event?.target?.closest('.expand-toggle')) {
    return
  }
  isExpanded.value = !isExpanded.value
}

const handleToggleClick = (event) => {
  // Stop propagation to prevent the header click from also triggering
  event.stopPropagation()
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

// REMOVED: Auto-expand behavior when filters are applied
// The container should only expand/collapse when explicitly toggled by user interaction
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
  max-height: 2000px;
  opacity: 1;
  transform: translateY(0);
}

.filters-sections {
  padding: 0.75rem;
  background: linear-gradient(180deg, rgba(248, 250, 252, 0.5) 0%, rgba(255, 255, 255, 0.8) 100%);
}

/* Always Visible Active Filters with modern styling - more compact */
.active-filters-always-visible {
  padding: 0.75rem;
  background: linear-gradient(135deg, #f1f5f9 0%, #f8fafc 100%);
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  animation: slideInUp 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.active-filters-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.active-filters-title {
  font-size: 0.75rem;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.clear-all-active-btn {
  background: linear-gradient(135deg, #ef4444, #dc2626);
  border: none;
  color: white;
  padding: 0.25rem 0.625rem;
  border-radius: 6px;
  font-size: 0.6875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 4px rgba(239, 68, 68, 0.3);
}

.clear-all-active-btn:hover {
  background: linear-gradient(135deg, #dc2626, #b91c1c);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(239, 68, 68, 0.4);
}

.clear-all-active-btn:active {
  transform: translateY(0);
}

/* Modern filter pills - smaller and more discrete */
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
  padding: 0.25rem 0.5rem;
  border-radius: 16px;
  font-size: 0.75rem;
  font-weight: 500;
  border: 1px solid currentColor;
  position: relative;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(10px);
  animation: slideInScale 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes slideInScale {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.filter-pill:hover {
  transform: translateY(-2px) scale(1.05);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

.favorites-pill {
  background: linear-gradient(135deg, #fef7e7, #fef3c7);
  color: #d97706;
  border-color: #f59e0b;
}

.additional-pill {
  background: linear-gradient(135deg, #eff6ff, #dbeafe);
  color: #2563eb;
  border-color: #3b82f6;
}

.container-pill {
  background: linear-gradient(135deg, #f8fafc, #f1f5f9);
  border-color: #94a3b8;
  color: #475569;
}

.pill-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.8);
}

.pill-remove {
  background: rgba(255, 255, 255, 0.8);
  border: none;
  margin-left: 0.125rem;
  padding: 0.125rem;
  cursor: pointer;
  border-radius: 50%;
  color: currentColor;
  opacity: 0.7;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(10px);
}

.pill-remove:hover {
  opacity: 1;
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  transform: scale(1.2) rotate(90deg);
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
  .filter-pill,
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
  
  .pill-remove:hover {
    transform: none;
  }
}

/* High Contrast Mode */
@media (prefers-contrast: high) {
  .filters-container {
    border-width: 2px;
    box-shadow: none;
  }
  
  .active-count-badge,
  .filter-pill {
    border-width: 2px;
    font-weight: 700;
  }
  
  .expand-toggle {
    border-width: 2px;
  }
}

/* Deep selector overrides for child components to make them more compact */
.filters-container :deep(.filter-header) {
  padding: 0.5rem 0.75rem; /* Reduced from 1rem */
  font-size: 0.875rem;
}

.filters-container :deep(.filter-content) {
  padding: 0.5rem 0.75rem; /* Reduced from 1rem */
}

.filters-container :deep(.filters-grid) {
  padding: 0.5rem 0.75rem; /* Reduced from 1rem */
  gap: 0.75rem; /* Reduced from 1rem */
}

.filters-container :deep(.filter-group) {
  margin-bottom: 0.5rem; /* Add some spacing between groups */
}

.filters-container :deep(.filter-label) {
  margin-bottom: 0.375rem; /* Reduced from 0.5rem */
  font-size: 0.8125rem; /* Slightly smaller */
}

.filters-container :deep(.filter-select) {
  padding: 0.5rem; /* Reduced from 0.75rem */
}

.filters-container :deep(.container-tags),
.filters-container :deep(.action-buttons) {
  gap: 0.375rem; /* Reduced from 0.5rem */
}

.filters-container :deep(.filter-tag) {
  padding: 0.375rem 0.5rem; /* Reduced from 0.5rem 0.75rem */
  font-size: 0.8125rem; /* Reduced from 0.875rem */
}

.filters-container :deep(.action-btn) {
  padding: 0.375rem 0.625rem; /* Reduced from 0.5rem 1rem */
  font-size: 0.8125rem; /* Reduced from 0.875rem */
}

.filters-container :deep(.quick-filters-section) {
  gap: 0.5rem; /* Reduced from 1rem */
  margin-bottom: 0.5rem; /* Reduced from 1rem */
}
.filters-main-header:focus {
  outline: 3px solid #22c55e;
  outline-offset: -3px;
}

.expand-toggle:focus {
  outline: 3px solid #22c55e;
  outline-offset: 2px;
}

.pill-remove:focus {
  outline: 2px solid #ef4444;
  outline-offset: 2px;
}

.clear-all-active-btn:focus {
  outline: 3px solid #ef4444;
  outline-offset: 2px;
}
</style>