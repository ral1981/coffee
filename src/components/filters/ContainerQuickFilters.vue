<template>
  <div class="quick-filters-section">
    <!-- Favorites Filter (if user is logged in) -->
    <div v-if="showFavoritesFilter" class="favorites-filter">
      <div class="filter-header">
        <Heart :size="16" class="header-icon" />
        <strong>Favorites</strong>
        <span v-if="favoritesCount > 0" class="count-badge">{{ favoritesCount }}</span>
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
          <span v-if="favoritesCount > 0" class="tag-count">({{ favoritesCount }})</span>
        </button>
      </div>
    </div>

    <!-- Container Filters -->
    <div v-if="containers.length > 0" class="container-filters">
      <div class="filter-header">
        <Box :size="16" class="header-icon" />
        <strong>Containers</strong>
        <button
          v-if="hasActiveContainers"
          @click="clearContainerFilters"
          class="clear-btn"
          title="Clear container filters"
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
            :class="{ active: isContainerActive(container) }"
            @click="handleContainerClick(container)"
          >
            <div 
              class="container-dot" 
              :style="{ background: container.color }"
            ></div>
            {{ container.name }}
            <span v-if="getContainerCount(container.id)" class="tag-count">
              ({{ getContainerCount(container.id) }})
            </span>
          </button>
        </div>
      </div>
    </div>

    <!-- Quick Actions (if user is logged in) -->
    <div v-if="isLoggedIn && (hasActiveFilters || isShowingFavorites)" class="quick-actions">
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
            v-if="hasActiveFilters"
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

    <!-- Filter Summary -->
    <div v-if="hasActiveFilters || isShowingFavorites" class="filter-summary">
      <div class="summary-text">
        <span v-if="isShowingFavorites" class="filter-pill favorites-pill">
          <Heart :size="12" />
          Favorites
        </span>
        <span 
          v-for="container in activeContainers" 
          :key="container.id"
          class="filter-pill container-pill"
          :style="{ 
            backgroundColor: container.color + '20', 
            borderColor: container.color,
            color: container.color 
          }"
        >
          {{ container.name }}
        </span>
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
import { ref, computed, watch } from 'vue'
import { Heart, Box, X, Filter, Download, RotateCcw } from 'lucide-vue-next'
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
  showDebug: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits([
  'update:modelValue', 
  'container-click', 
  'toggle-favorites',
  'clear-filters',
  'export-favorites',
  'add-all-to-favorites'
])

// Composables
const { isLoggedIn } = useAuth()
const { favoritesCount, isFavorited } = useFavorites()
const { success, error, info } = useToast()

// Local state
const isShowingFavorites = ref(false)
const addingAllToFavorites = ref(false)

// Computed properties
const showFavoritesFilter = computed(() => isLoggedIn.value)

const hasActiveContainers = computed(() => props.modelValue.length > 0)

const hasActiveFilters = computed(() => 
  hasActiveContainers.value || isShowingFavorites.value
)

const activeContainers = computed(() => props.modelValue)

const debugInfo = computed(() => ({
  containers: props.containers.length,
  activeContainers: props.modelValue.length,
  isShowingFavorites: isShowingFavorites.value,
  favoritesCount: favoritesCount.value,
  filteredCount: props.filteredCount
}))

// Methods
const isContainerActive = (container) => {
  return props.modelValue.some(c => c.id === container.id)
}

const getContainerCount = (containerId) => {
  return props.containerCounts[containerId] || 0
}

const handleContainerClick = (container) => {
  emit('container-click', container)
}

const toggleFavoritesFilter = () => {
  const newValue = !isShowingFavorites.value
  isShowingFavorites.value = newValue
  emit('toggle-favorites', newValue)
}

const clearContainerFilters = () => {
  emit('update:modelValue', [])
}

const clearAllFilters = () => {
  isShowingFavorites.value = false
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

// Watch for external changes to favorites filter
watch(() => props.showFavorites, (newValue) => {
  isShowingFavorites.value = newValue
}, { immediate: true })

// Emit favorites filter changes
watch(isShowingFavorites, (newValue) => {
  console.log('🔍 ContainerQuickFilters - isShowingFavorites changed:', newValue)
  emit('toggle-favorites', newValue)
})

// Debug logging
console.log('ContainerQuickFilters - Enhanced with favorites', {
  containers: props.containers.length,
  modelValue: props.modelValue.length,
  favoritesCount: favoritesCount.value
})
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

.clear-btn {
  background: none;
  border: none;
  padding: 0.25rem;
  cursor: pointer;
  border-radius: 4px;
  color: #6b7280;
  margin-left: auto;
  transition: all 0.2s;
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

.filter-tag:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
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

/* Filter summary */
.filter-summary {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 0.75rem;
  border: 1px solid #e5e7eb;
}

.summary-text {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
}

.filter-pill {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
  border: 1px solid currentColor;
}

.favorites-pill {
  background: #fef7e7;
  color: #d97706;
  border-color: #f59e0b;
}

.container-pill {
  background: var(--pill-bg, #f3f4f6);
  border: 1px solid var(--pill-border, #d1d5db);
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
</style>