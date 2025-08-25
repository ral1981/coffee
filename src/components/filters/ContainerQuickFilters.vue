<template>
  <div class="quick-filters-section">
    <!-- Favorites Filter (if user is logged in) -->
    <div v-if="showFavoritesFilter" class="favorites-filter">
      <div class="filter-header">
        <Heart :size="16" class="header-icon" />
        <strong>Favorites</strong>
        <span v-if="isShowingFavorites" class="selection-count-badge">
          1 selected
        </span>
        <button
          v-if="isShowingFavorites"
          @click="clearFavoritesFilter"
          class="clear-btn"
          title="Clear favorites filter"
        >
          <X :size="12" />
        </button>
      </div>
      <div class="filter-content">
        <button
          class="filter-tag favorites-tag"
          :class="{ active: isShowingFavorites }"
          @click="toggleFavoritesFilter"
          :disabled="favoritesCount === 0"
        >
          <Heart :size="14" :class="{ filled: isShowingFavorites }" />
          <span>{{ isShowingFavorites ? 'All Coffee' : 'My Favorites' }}</span>
        </button>
      </div>
    </div>

    <!-- Container Filters -->
    <div v-if="containers.length > 0" class="container-filters">
      <div class="filter-header">
        <Box :size="16" class="header-icon" />
        <strong>Containers</strong>
        <!-- Selection count -->
        <span v-if="hasActiveContainers" class="selection-count-badge">
          {{ activeContainers.length }} selected
        </span>
        <!-- Clear button with count -->
        <button
          v-if="hasActiveContainers"
          @click="clearContainerFilters"
          class="clear-btn"
          :title="`Clear ${activeContainers.length} container filter${activeContainers.length > 1 ? 's' : ''}`"
        >
          <X :size="12" />
        </button>
      </div>
      
      <div class="filter-content">
        <div class="container-tags">
          <button
            v-for="container in containers"
            :key="container.id"
            class="filter-tag container-tag"
            :class="{ 
              active: isContainerActive(container),
              'multi-selected': hasActiveContainers && isContainerActive(container)
            }"
            @click="handleContainerClick(container)"
            :title="getContainerTooltip(container)"
          >
            <div 
              class="container-dot" 
              :style="{ background: container.color }"
            ></div>
            {{ container.name }}
            <!-- Show checkmark for selected containers -->
            <div v-if="isContainerActive(container)" class="selection-indicator">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                <polyline points="20,6 9,17 4,12"/>
              </svg>
            </div>
          </button>
        </div>
      </div>
    </div>

    <!-- Quick Actions (if user is logged in) -->
    <div v-if="isLoggedIn && (hasActiveFilters || isShowingFavorites || hasAdditionalFilters)" class="quick-actions">
      <div class="filter-header">
        <Filter :size="16" class="header-icon" />
        <strong>Quick Actions</strong>
      </div>
      <div class="filter-content">
        <div class="action-buttons">
          <button
            v-if="isShowingFavorites"
            @click="exportFavorites"
            class="action-btn export-btn"
            :disabled="favoritesCount === 0"
          >
            <Download :size="14" />
            Export Favorites
          </button>
          
          <button
            v-if="hasActiveFilters || hasAdditionalFilters"
            @click="clearAllFilters"
            class="action-btn clear-all-btn"
          >
            <RotateCcw :size="14" />
            Clear All Filters
          </button>
          
          <button
            v-if="filteredCount > 0 && !isShowingFavorites"
            @click="addAllToFavorites"
            class="action-btn add-favorites-btn"
            :disabled="addingAllToFavorites"
          >
            <Heart :size="14" />
            {{ addingAllToFavorites ? 'Adding...' : `Add All to Favorites (${filteredCount})` }}
          </button>
        </div>
      </div>
    </div>

    <!-- Debug info (remove in production) -->
    <div v-if="showDebug" class="debug-info">
      <details>
        <summary>Debug Info</summary>
        <pre>{{ debugInfo }}</pre>
      </details>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { Heart, Box, X, Filter, Download, RotateCcw, MapPin, Store } from 'lucide-vue-next'
import { useAuth } from '../../composables/useAuth'
import { useFavorites } from '../../composables/useFavorites'
import { useToast } from '../../composables/useToast'

const props = defineProps({
  modelValue: { 
    type: Array, 
    default: () => [] 
  },
  containers: { 
    type: Array, 
    default: () => [],
    validator: (containers) => {
      return containers.length === 0 || containers.every(c => 
        c && typeof c === 'object' && c.id && c.name
      )
    }
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
  additionalFilters: {
    type: Object,
    default: () => ({ origin: '', shop: '' })
  },
  showDebug: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits([
  'update:modelValue', 
  'toggle-favorites', 
  'clear-filters', 
  'export-favorites', 
  'add-all-to-favorites',
  'clear-origin-filter',
  'clear-shop-filter'
])

// Composables
const { isLoggedIn } = useAuth()
const { favoriteIds, getFavoriteCoffees } = useFavorites()
const { info } = useToast()

// Internal state
const internalSelectedContainers = ref([])
const isShowingFavorites = ref(false)
const addingAllToFavorites = ref(false)

// Computed properties
const showFavoritesFilter = computed(() => isLoggedIn.value)

const favoritesCount = computed(() => {
  return favoriteIds.value.length
})

const activeContainers = computed(() => internalSelectedContainers.value)

const hasActiveContainers = computed(() => activeContainers.value.length > 0)

const hasAdditionalFilters = computed(() => {
  return props.additionalFilters.origin !== '' || props.additionalFilters.shop !== ''
})

const hasActiveFilters = computed(() => {
  return hasActiveContainers.value || isShowingFavorites.value || hasAdditionalFilters.value
})

const debugInfo = computed(() => ({
  modelValue: props.modelValue?.map(c => c.name) || [],
  internalSelectedContainers: internalSelectedContainers.value?.map(c => c.name) || [],
  isShowingFavorites: isShowingFavorites.value,
  hasActiveFilters: hasActiveFilters.value,
  additionalFilters: props.additionalFilters
}))

// Methods
const isContainerActive = (container) => {
  return internalSelectedContainers.value.some(c => c.id === container.id)
}

const getContainerCount = (containerId) => {
  return props.containerCounts[containerId] || 0
}

const getContainerTooltip = (container) => {
  const count = getContainerCount(container.id)
  const baseTooltip = `${container.name} Container`
  return count > 0 ? `${baseTooltip} (${count} coffee${count === 1 ? '' : 's'})` : baseTooltip
}

const handleContainerClick = (container) => {
  console.log('🔄 Container clicked:', container.name)
  
  let newSelection
  if (isContainerActive(container)) {
    // Remove container
    newSelection = internalSelectedContainers.value.filter(c => c.id !== container.id)
    console.log('➖ Removing container from selection:', container.name)
  } else {
    // Add container
    newSelection = [...internalSelectedContainers.value, container]
    console.log('➕ Adding container to selection:', container.name)
  }
  
  // Update internal state
  internalSelectedContainers.value = newSelection
  
  // Emit the change to parent via v-model
  emit('update:modelValue', newSelection)
  
  console.log('📤 Emitted selection update:', newSelection.map(c => c.name))
}

const toggleFavoritesFilter = () => {
  const newValue = !isShowingFavorites.value
  isShowingFavorites.value = newValue
  emit('toggle-favorites', newValue)
}

const clearFavoritesFilter = () => {
  isShowingFavorites.value = false
  emit('toggle-favorites', false)
}

const clearContainerFilters = () => {
  console.log('🧹 Clearing all container filters')
  internalSelectedContainers.value = []
  emit('update:modelValue', [])
}

const removeOriginFilter = () => {
  emit('clear-origin-filter')
}

const removeShopFilter = () => {
  emit('clear-shop-filter')
}

const clearAllFilters = () => {
  console.log('🧹 Clearing ALL filters')
  isShowingFavorites.value = false
  internalSelectedContainers.value = []
  emit('update:modelValue', [])
  emit('toggle-favorites', false)
  emit('clear-filters')
}

const exportFavorites = () => {
  emit('export-favorites')
}

const addAllToFavorites = async () => {
  if (addingAllToFavorites.value) return
  
  addingAllToFavorites.value = true
  
  try {
    emit('add-all-to-favorites')
    info('Adding to Favorites', `Adding ${props.filteredCount} coffees to your favorites...`)
  } finally {
    // Reset after a delay to give the parent time to process
    setTimeout(() => {
      addingAllToFavorites.value = false
    }, 2000)
  }
}

// Sync internal state with modelValue prop changes
watch(() => props.modelValue, (newValue) => {
  console.log('🔄 modelValue prop changed:', {
    previous: internalSelectedContainers.value.map(c => c.name),
    incoming: newValue.map(c => c.name),
    hasChanged: JSON.stringify(newValue) !== JSON.stringify(internalSelectedContainers.value)
  })
  
  // Only update if actually different to avoid infinite loops
  if (JSON.stringify(newValue) !== JSON.stringify(internalSelectedContainers.value)) {
    internalSelectedContainers.value = [...newValue]
    console.log('✅ Updated internal state to match modelValue')
  }
}, { immediate: true, deep: true })

// Watch for external changes to favorites filter
watch(() => props.showFavorites, (newValue) => {
  isShowingFavorites.value = newValue
}, { immediate: true })

// Emit favorites filter changes
watch(isShowingFavorites, (newValue) => {
  console.log('🔄 ContainerQuickFilters - isShowingFavorites changed:', newValue)
  emit('toggle-favorites', newValue)
})

// Debug logging for multiple selection
watch(internalSelectedContainers, (newValue, oldValue) => {
  console.log('🔄 Internal container selection changed:', {
    previous: oldValue?.map(c => c.name) || [],
    current: newValue.map(c => c.name),
    count: newValue.length
  })
}, { deep: true })
</script>

<style scoped>
.quick-filters-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1rem;
}

/* Filter sections */
.favorites-filter,
.container-filters,
.quick-actions {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.filter-header {
  padding: 1rem;
  border-bottom: 1px solid #f0f0f0;
  font-weight: 600;
  color: #333;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #f8f9fa;
}

.header-icon {
  color: #6b7280;
}

.count-badge {
  background: #22c55e;
  color: white;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.125rem 0.5rem;
  border-radius: 12px;
  margin-left: auto;
}

/* Selection count badge */
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
}

.filter-content {
  padding: 1rem;
}

/* Filter tags */
.container-tags,
.action-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.filter-tag {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: #f8f9fa;
  border: 2px solid transparent;
  border-radius: 20px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  color: #6b7280;
  font-weight: 500;
  position: relative;
}

.filter-tag:hover {
  background: #e5e7eb;
  transform: translateY(-1px);
}

.filter-tag.active {
  background: #22c55e20;
  border-color: #22c55e;
  color: #22c55e;
  font-weight: 600;
}

.filter-tag.active:hover {
  background: #22c55e30;
}

/* Multi-selected styling */
.filter-tag.multi-selected {
  background: #22c55e25;
  border-color: #22c55e;
  box-shadow: 0 2px 4px rgba(34, 197, 94, 0.2);
}

.filter-tag:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

/* Selection indicator */
.selection-indicator {
  margin-left: 0.25rem;
  color: #22c55e;
  display: flex;
  align-items: center;
}

/* Favorites specific styling */
.favorites-tag.active {
  background: #fef7e7;
  border-color: #f59e0b;
  color: #d97706;
}

.favorites-tag.active:hover {
  background: #fef3c7;
}

.heart-icon.filled {
  fill: currentColor;
}

/* Container specific styling */
.container-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ccc;
  flex-shrink: 0;
}

.container-tag.active .container-dot {
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.8);
}

/* Tag counts */
.tag-count {
  font-size: 0.75rem;
  opacity: 0.8;
  font-weight: 400;
}

/* Action buttons */
.action-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s;
}

.action-btn:hover:not(:disabled) {
  background: #f9fafb;
  border-color: #9ca3af;
  transform: translateY(-1px);
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.export-btn:hover:not(:disabled) {
  border-color: #3b82f6;
  color: #3b82f6;
}

.clear-all-btn:hover:not(:disabled) {
  border-color: #ef4444;
  color: #ef4444;
}

.add-favorites-btn:hover:not(:disabled) {
  border-color: #f59e0b;
  color: #d97706;
}





/* Debug info */
.debug-info {
  background: #fee;
  padding: 1rem;
  border-radius: 8px;
  font-size: 0.875rem;
  color: #dc2626;
}

.debug-info pre {
  background: #fff;
  padding: 0.5rem;
  border-radius: 4px;
  overflow: auto;
  max-height: 200px;
  margin-top: 0.5rem;
  font-size: 0.75rem;
}

/* Responsive */
@media (max-width: 640px) {
  .filter-content {
    padding: 0.75rem;
  }
  
  .container-tags,
  .action-buttons {
    gap: 0.375rem;
  }
  
  .filter-tag {
    padding: 0.375rem 0.625rem;
    font-size: 0.8125rem;
  }
  
  .action-btn {
    padding: 0.375rem 0.75rem;
    font-size: 0.8125rem;
  }
}

/* Animation for selection changes */
@keyframes containerSelect {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

.filter-tag.active {
  animation: containerSelect 0.3s ease-out;
}

/* High contrast support */
@media (prefers-contrast: high) {
  .filter-tag {
    border-width: 2px;
  }
  
  .selection-indicator {
    filter: contrast(2);
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .filter-tag,
  .action-btn {
    transition: none;
  }
  
  .filter-tag:hover,
  .action-btn:hover {
    transform: none;
  }
  
  .filter-tag.active {
    animation: none;
  }
}
</style>