<template>
  <div class="quick-filters-section">
    <!-- Favorites Filter -->
    <div class="favorites-filter">
      <div class="filter-header">
        <Heart :size="16" class="header-icon" />
        <span>Show Favorites</span>
      </div>
      <div class="filter-content">
        <div class="container-tags">
          <div 
            :class="[
              'filter-tag', 
              'favorites-tag',
              { active: isShowingFavorites }
            ]"
            @click.stop="handleFavoritesToggle"
            role="button"
            tabindex="0"
            @keydown.enter.space.stop.prevent="handleFavoritesToggle"
          >
            <Heart :size="16" :class="{ filled: isShowingFavorites }" class="heart-icon" />
            <span>Favorites</span>
            <span v-if="favoriteCount > 0" class="tag-count">({{ favoriteCount }})</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Container Filters -->
    <div class="container-filters">
      <div class="filter-header">
        <Archive :size="16" class="header-icon" />
        <span>Container Filters</span>
        <span v-if="internalSelectedContainers.length > 0" class="selection-count-badge">
          {{ internalSelectedContainers.length }} selected
        </span>
        <button
          v-if="internalSelectedContainers.length > 0"
          @click.stop="clearAllContainerSelections"
          class="clear-btn"
          title="Clear all container selections"
        >
          <X :size="14" />
        </button>
      </div>
      <div class="filter-content">
        <div class="container-tags">
          <div
            v-for="container in containers"
            :key="container.id"
            :class="[
              'filter-tag',
              'container-tag',
              { 
                'active': isContainerSelected(container),
                'multi-selected': internalSelectedContainers.length > 1 && isContainerSelected(container)
              }
            ]"
            @click.stop="handleContainerToggle(container)"
            role="button"
            tabindex="0"
            @keydown.enter.space.stop.prevent="handleContainerToggle(container)"
          >
            <div
              class="container-dot"
              :style="{ backgroundColor: container.color || '#6b7280' }"
            ></div>
            <span>{{ container.name }}</span>
            <span class="tag-count">({{ containerCounts[container.id] || 0 }})</span>
            <div v-if="isContainerSelected(container)" class="selection-indicator">
              <Check :size="14" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="quick-actions">
      <div class="filter-header">
        <Zap :size="16" class="header-icon" />
        <span>Quick Actions</span>
        <span class="count-badge">{{ filteredCount }} results</span>
      </div>
      <div class="filter-content">
        <div class="action-buttons">
          <button 
            @click.stop="handleExportFavorites"
            @keydown.enter.space.stop.prevent="handleExportFavorites"
            :disabled="!hasAnyFavorites"
            class="action-btn export-btn"
            tabindex="0"
          >
            <Download :size="16" />
            Export Favorites
          </button>
          <button 
            @click.stop="handleClearFilters"
            @keydown.enter.space.stop.prevent="handleClearFilters"
            :disabled="!hasAnyFilters"
            class="action-btn clear-all-btn"
            tabindex="0"
          >
            <Trash2 :size="16" />
            Clear All Filters
          </button>
          <button
            @click.stop="handleAddAllToFavorites"
            @keydown.enter.space.stop.prevent="handleAddAllToFavorites"
            :disabled="filteredCount === 0"
            class="action-btn add-favorites-btn"
            tabindex="0"
          >
            <Heart :size="16" />
            Add All to Favorites
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { 
  Heart, Archive, Zap, Check, X, Download, Trash2
} from 'lucide-vue-next'

const props = defineProps({
  modelValue: {
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
  additionalFilters: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits([
  'update:modelValue',
  'toggle-favorites',
  'clear-filters',
  'clear-origin-filter',
  'clear-shop-filter',
  'export-favorites',
  'add-all-to-favorites'
])

// Internal state management
const internalSelectedContainers = ref([...props.modelValue])
const isShowingFavorites = ref(props.showFavorites)

// Computed properties
const favoriteCount = computed(() => {
  // This would need to be passed as a prop or computed based on actual favorites data
  return 0 // Placeholder
})

const hasAnyFavorites = computed(() => {
  return favoriteCount.value > 0
})

const hasAnyFilters = computed(() => {
  return internalSelectedContainers.value.length > 0 ||
         isShowingFavorites.value ||
         props.additionalFilters.origin ||
         props.additionalFilters.shop
})

// Methods
const isContainerSelected = (container) => {
  return internalSelectedContainers.value.some(c => c.id === container.id)
}

const handleContainerToggle = (container) => {
  console.log('🔄 ContainerQuickFilters - handleContainerToggle:', container.name)
  
  const isCurrentlySelected = isContainerSelected(container)
  
  if (isCurrentlySelected) {
    // Remove from selection
    internalSelectedContainers.value = internalSelectedContainers.value.filter(c => c.id !== container.id)
    console.log('➖ Removed container:', container.name)
  } else {
    // Add to selection
    internalSelectedContainers.value.push(container)
    console.log('➕ Added container:', container.name)
  }
  
  // Emit the updated selection
  emit('update:modelValue', [...internalSelectedContainers.value])
}

const clearAllContainerSelections = () => {
  console.log('🧹 ContainerQuickFilters - clearAllContainerSelections')
  internalSelectedContainers.value = []
  emit('update:modelValue', [])
}

const handleFavoritesToggle = () => {
  console.log('💖 ContainerQuickFilters - handleFavoritesToggle:', !isShowingFavorites.value)
  isShowingFavorites.value = !isShowingFavorites.value
}

const handleExportFavorites = () => {
  console.log('📤 ContainerQuickFilters - handleExportFavorites')
  emit('export-favorites')
}

const handleClearFilters = () => {
  console.log('🧹 ContainerQuickFilters - handleClearFilters')
  emit('clear-filters')
}

const handleAddAllToFavorites = () => {
  console.log('❤️ ContainerQuickFilters - handleAddAllToFavorites')
  emit('add-all-to-favorites')
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
  user-select: none;
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
  user-select: none;
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

/* Focus styles for accessibility */
.filter-tag:focus {
  outline: 2px solid #22c55e;
  outline-offset: 2px;
}

.action-btn:focus {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

.clear-btn:focus {
  outline: 2px solid #ef4444;
  outline-offset: 2px;
}
</style>