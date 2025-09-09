<template>
  <div class="coffee-list-view">
    <!-- Results Counter -->
    <ResultsCounter 
      :showing="filteredCount" 
      :total="totalCount"
      :is-filtered="hasActiveFilters"
    />

    <!-- Search Section -->
    <SearchSection 
      v-model="searchQuery"
      :placeholder="searchPlaceholder"
      @clear="clearSearch"
    />

    <!-- FiltersContainer -->
    <FiltersContainer 
      :filters="filters"
      :active-container-ids="activeContainerIds"
      :active-containers="activeContainersForDisplay"
      :show-favorites="showFavoritesOnly"
      :origins="availableOrigins"
      :shops="availableShops"
      :containers="availableContainers"
      :container-counts="containerCounts"
      :filtered-count="filteredCount"
      :favorite-count="favoriteCount"
      :default-expanded="false"
      @update:filters="filters = $event"
      @update:activeContainerIds="activeContainerIds = $event"
      @update:showFavorites="showFavoritesOnly = $event"
      @clear-filters="clearAllFilters"
      @export-favorites="handleExportFavorites"
      @add-all-to-favorites="handleAddAllToFavorites"
    />

    <!-- Loading State -->
    <div v-if="loading" class="loading-section">
      <div class="loading-spinner">
        <svg class="spinner" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none" />
        </svg>
      </div>
      <p class="loading-text">Loading coffee collection...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredCoffees.length === 0 && !loading" class="empty-state">
      <div class="empty-state-icon">
        <Coffee :size="48" />
      </div>
      <h3 class="empty-state-title">
        {{ hasActiveFilters ? 'No coffees match your filters' : 'No coffees found' }}
      </h3>
      <p class="empty-state-description">
        {{ hasActiveFilters ? 'Try adjusting your search or filters.' : 'No coffee data available.' }}
      </p>
    </div>

    <!-- Coffee Cards -->
    <CoffeeCard 
      v-else
      :coffees="paginatedCoffees"
      :expanded-cards="expandedCards"
      :available-containers="availableContainers"
      :highlighted-coffee-id="highlightedCoffeeId"
      @card-expand="toggleCardExpansion"
      @card-action="handleCardAction"
      @edit-coffee="$emit('edit-coffee', $event)"
      @container-assignment-changed="handleContainerAssignmentChanged"
      @delete-coffee="handleDeleteCoffee"
    />

    <!-- Load More / Pagination -->
    <div v-if="showLoadMore" class="load-more-section">
      <button 
        class="load-more-btn"
        :disabled="isLoadingMore"
        @click="loadMoreCoffees"
      >
        <svg v-if="isLoadingMore" class="spinner-small" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none" />
        </svg>
        {{ isLoadingMore ? 'Loading...' : `Load More (${remainingCount} remaining)` }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Coffee } from 'lucide-vue-next'
import ResultsCounter from '../filters/ResultsCounter.vue'
import SearchSection from './SearchSection.vue'
import FiltersContainer from '../filters/FiltersContainer.vue'
import CoffeeCard from '../coffee/CoffeeCard.vue'
import { useCoffeeData } from '../../composables/useCoffeeData'
import { useFilters } from '../../composables/useFilters'
import { useToast } from '../../composables/useToast'
import { useContainerConflict } from '../../composables/useContainerConflict'
import { useAuth } from '../../composables/useAuth'
import { useContainers } from '../../composables/useContainers'
import { useFavorites } from '../../composables/useFavorites'

// Props
const props = defineProps({
  highlightedCoffeeId: {
    type: [String, Number],
    default: null
  }
})

// Events
const emit = defineEmits(['edit-coffee', 'trigger-add-form'])

// Composables
const route = useRoute()
const router = useRouter()
const { userId, isLoggedIn } = useAuth()
const { error, success, info, warning } = useToast()

// FIXED: Ensure containers are fetched
const { containers, fetchContainers } = useContainers()
const { favoriteIds } = useFavorites()

const { 
  coffees, 
  loading, 
  expandedCards,
  toggleCardExpansion,
  fetchCoffees,
  refreshCoffees,
  highlightedCoffeeId: internalHighlightedId,
  highlightCoffee,
  clearHighlight,
  isCoffeeHighlighted
} = useCoffeeData()

// Use the fixed useFilters
const {
  searchQuery,
  filters,
  activeContainerIds,
  activeContainers,
  filteredCoffees,
  hasActiveFilters,
  filteredCount,
  totalCount,
  availableOrigins,
  availableShops,
  containerCounts,
  showFavoritesOnly,
  clearAllFilters,
  clearSearch,
  syncFiltersWithRoute,
  updateRoute,
  toggleFavoritesFilter,
  addAllFilteredToFavorites,
  exportFavoritesData,
  ensureFavoritesLoaded
} = useFilters(coffees)

// DEBUGGING
watch(filters, (newFilters) => {
  console.log('🔍 CoffeeListView - filters changed:', newFilters)
  console.log('🔍 CoffeeListView - filteredCoffees length:', filteredCoffees.value?.length)
}, { deep: true, immediate: true })

// DEBUGGING
watch(filteredCoffees, (newFiltered) => {
  console.log('🔍 CoffeeListView - filteredCoffees changed:', newFiltered?.length)
}, { immediate: true })

const {
  assignContainersWithConflictResolution,
  refreshConflictData
} = useContainerConflict()

// Local state
const itemsToShow = ref(12)
const isLoadingMore = ref(false)

// Computed properties
const favoriteCount = computed(() => favoriteIds.value?.length || 0)

const paginatedCoffees = computed(() => {
  return filteredCoffees.value.slice(0, itemsToShow.value)
})

const showLoadMore = computed(() => {
  return itemsToShow.value < filteredCoffees.value.length
})

const remainingCount = computed(() => {
  return filteredCoffees.value.length - itemsToShow.value
})

const searchPlaceholder = computed(() => {
  return `Search ${totalCount.value} coffees...`
})

const highlightedCoffeeId = computed(() => {
  return props.highlightedCoffeeId || internalHighlightedId.value
})

// FIXED: Compute active containers properly for display
const activeContainersForDisplay = computed(() => {
  if (!containers.value || !activeContainerIds.value.length) return []
  
  return activeContainerIds.value.map(id => {
    const container = containers.value.find(c => c.id === id)
    return container || { id, name: 'Unknown Container', color: '#6b7280' }
  }).filter(Boolean)
})

// FIXED: Ensure containers are available for FiltersContainer
const availableContainers = computed(() => containers.value || [])

// Methods
const loadMoreCoffees = () => {
  if (isLoadingMore.value) return
  
  isLoadingMore.value = true
  
  setTimeout(() => {
    itemsToShow.value += 12
    isLoadingMore.value = false
  }, 300)
}

const handleToggleFavoritesFilter = async (show) => {
  console.log('CoffeeListView - handleToggleFavoritesFilter called with:', show)
  
  if (show && isLoggedIn.value) {
    console.log('User is logged in, ensuring favorites are loaded...')
    await ensureFavoritesLoaded()
  }
  
  await toggleFavoritesFilter(show)
}

const handleCardAction = async (action, coffee) => {
  console.log('CoffeeListView handleCardAction:', action, coffee)
  
  switch (action) {
    case 'edit':
      emit('edit-coffee', coffee)
      break
    case 'delete':
      await handleDeleteCoffee(coffee)
      break
    case 'duplicate':
      console.log('Duplicate coffee:', coffee.id)
      break
    default:
      console.log('Unknown action:', action, coffee)
  }
}

const handleDeleteCoffee = async (coffee) => {
  try {
    if (!userId.value) {
      error('Authentication required', 'Please log in to delete coffee entries')
      return
    }

    const { deleteCoffee } = useCoffeeData()
    const result = await deleteCoffee(coffee.id, userId.value)
    
    if (result.success) {
      console.log('Coffee deleted successfully:', coffee.name)
      success('Coffee deleted', `${coffee.name} has been removed`)
    } else {
      throw new Error(result.error || 'Delete failed')
    }
  } catch (error) {
    console.error('Failed to delete coffee:', error)
    error('Delete failed', 'Could not delete coffee entry')
  }
}

const handleContainerAssignmentChanged = async (data) => {
  const { coffeeId, containerId, action, needsRefresh } = data
  
  console.log('Container assignment changed:', data)
  
  if (needsRefresh) {
    await refreshCoffees()
  }
}

const handleExportFavorites = async () => {
  try {
    await exportFavoritesData()
    success('Export Complete', 'Your favorites have been exported successfully!')
  } catch (err) {
    error('Export Failed', 'Could not export favorites')
  }
}

const handleAddAllToFavorites = async () => {
  try {
    const result = await addAllFilteredToFavorites()
    if (result.success) {
      success('Favorites Updated', `${result.addedCount} coffees added to favorites!`)
    } else {
      throw new Error(result.error || 'Failed to add favorites')
    }
  } catch (err) {
    console.error('Add all to favorites error:', err)
    error('Add to Favorites Failed', err.message)
  }
}

// Apply container filter from URL
const applyContainerFilter = async (containerName) => {
  if (!containerName || !containers.value) return
  
  const container = containers.value.find(c => 
    c.name.toLowerCase() === containerName.toLowerCase()
  )
  if (container) {
    activeContainerIds.value = [container.id]
  }
}

// FIXED: Initialize data with proper container loading
const initializeData = async () => {
  try {
    console.log('Fetching all coffees and containers...')
    
    // Ensure both data sources are loaded
    await Promise.all([
      fetchCoffees(),
      fetchContainers()
    ])
    
    console.log(`Data loaded successfully:`, {
      coffees: coffees.value?.length || 0,
      containers: containers.value?.length || 0
    })
    
    // Sync with route after data is loaded
    syncFiltersWithRoute(route.query)
    
    if (route.query.container) {
      const containerName = route.query.container
      const matchingContainer = containers.value?.find(
        c => c.name.toLowerCase() === containerName.toLowerCase()
      )
      if (matchingContainer) {
        activeContainerIds.value = [matchingContainer.id]
      }
    }

    // Handle favorites filter from URL
    if (route.query.favorites === 'true' && isLoggedIn.value) {
      await handleToggleFavoritesFilter(true)
    }
  } catch (error) {
    console.error('Error initializing data:', error)
    error('Data Loading Failed', 'Could not load coffee data')
  }
}

// Watchers
watch(() => props.highlightedCoffeeId, (newId, oldId) => {
  if (newId && newId !== oldId) {
    highlightCoffee(newId)
  }
})

watch([searchQuery, filters, activeContainerIds, showFavoritesOnly], () => {
  itemsToShow.value = 12
}, { deep: true })

/* watch([searchQuery, filters, activeContainerIds, showFavoritesOnly], () => {
  updateRoute()
}, { deep: true, flush: 'post' }) */

watch(() => route.query.container, (newContainerName) => {
  if (newContainerName) {
    applyContainerFilter(newContainerName)
  } else {
    activeContainerIds.value = []
  }
})

// Lifecycle
onMounted(async () => {
  console.log('CoffeeListView onMounted - initializing data')
  
  try {
    await initializeData()
    
    if (props.highlightedCoffeeId) {
      highlightCoffee(props.highlightedCoffeeId)
    }
  } catch (error) {
    console.error('Error in onMounted:', error)
  }

  // Handle container query parameter
  if (route.query.container) {
    await nextTick()
    if (!containers.value || containers.value.length === 0) {
      watch(containers, (newContainers) => {
        if (newContainers && newContainers.length > 0) {
          applyContainerFilter(route.query.container)
        }
      }, { once: true })
    } else {
      applyContainerFilter(route.query.container)
    }
  }
})

// Expose methods for parent components
defineExpose({
  highlightCoffee,
  clearHighlight,
  isCoffeeHighlighted
})
</script>

<style scoped>
/* Base Layout */
.coffee-list-view {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4, 1rem);
  min-height: 100%;
}

/* Loading Section */
.loading-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-8, 2rem);
  text-align: center;
}

.loading-spinner {
  margin-bottom: var(--spacing-4, 1rem);
}

.spinner {
  width: 2rem;
  height: 2rem;
  color: var(--primary-green, #22c55e);
  animation: spin 1s linear infinite;
}

.spinner circle {
  stroke-dasharray: 31.416;
  stroke-dashoffset: 31.416;
  animation: spinner-dash 1.5s ease-in-out infinite;
}

.loading-text {
  color: var(--text-secondary, #666);
  font-size: var(--text-sm, 0.875rem);
  margin: 0;
  animation: pulse 1.5s ease-in-out infinite;
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-8, 2rem);
  text-align: center;
  background: var(--card-background, #ffffff);
  border-radius: var(--card-radius, 12px);
  box-shadow: var(--card-shadow, 0 1px 3px rgba(0, 0, 0, 0.1));
  transition: all 0.3s ease;
}

.empty-state:hover {
  box-shadow: var(--card-shadow-hover, 0 4px 12px rgba(0, 0, 0, 0.15));
}

.empty-state-icon {
  margin-bottom: var(--spacing-4, 1rem);
  color: var(--text-tertiary, #999);
}

.empty-state-title {
  font-size: var(--text-xl, 1.25rem);
  font-weight: 600;
  color: var(--text-primary, #333);
  margin: 0 0 var(--spacing-2, 0.5rem) 0;
}

.empty-state-description {
  color: var(--text-secondary, #666);
  margin: 0 0 var(--spacing-4, 1rem) 0;
  max-width: 24rem;
  line-height: 1.5;
}

/* Load More Section */
.load-more-section {
  display: flex;
  justify-content: center;
  padding: var(--spacing-6, 1.5rem) 0;
}

.load-more-btn {
  display: flex;
  align-items: center;
  gap: var(--spacing-2, 0.5rem);
  padding: 0.75rem 1.5rem;
  background: var(--card-background, #ffffff);
  border: 2px solid var(--border-light, #f0f0f0);
  border-radius: 8px;
  color: var(--text-primary, #333);
  font-size: var(--text-sm, 0.875rem);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
}

.load-more-btn:hover:not(:disabled) {
  border-color: var(--primary-green, #22c55e);
  background: var(--primary-green, #22c55e);
  color: white;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(34, 197, 94, 0.15);
}

.load-more-btn:focus {
  outline: 2px solid var(--primary-green, #22c55e);
  outline-offset: 2px;
}

.load-more-btn:disabled {
  cursor: not-allowed;
  opacity: 0.6;
  transform: none;
}

.load-more-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s;
}

.load-more-btn:hover::before {
  left: 100%;
}

.spinner-small {
  width: 1rem;
  height: 1rem;
  animation: spin 1s linear infinite;
}

/* Animations */
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes spinner-dash {
  0% { stroke-dashoffset: 31.416; }
  50% { 
    stroke-dashoffset: 7.854;
    transform: rotate(135deg);
  }
  100% { 
    stroke-dashoffset: 31.416;
    transform: rotate(450deg);
  }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.coffee-list-view > * {
  animation: fadeIn 0.3s ease-out;
}

/* Filter Container Integration */
.coffee-list-view :deep(.filters-container) {
  margin-bottom: 0;
}

.coffee-list-view :deep(.filters-container .filters-content.expanded) {
  background: linear-gradient(135deg, #fafbfc 0%, #ffffff 100%);
}

.coffee-list-view :deep(.filters-container .filters-main-header) {
  border-bottom: 2px solid #f0f2f5;
}

.coffee-list-view :deep(.filters-sections .filters-section),
.coffee-list-view :deep(.filters-sections .quick-filters-section > div) {
  box-shadow: none;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: white;
  transition: all 0.2s ease;
}

.coffee-list-view :deep(.filters-sections .filters-section:hover),
.coffee-list-view :deep(.filters-sections .quick-filters-section > div:hover) {
  border-color: #d1d5db;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.coffee-list-view :deep(.filters-sections) {
  gap: 0.875rem;
}

.coffee-list-view :deep(.action-btn) {
  transition: all 0.2s ease;
}

.coffee-list-view :deep(.action-btn:hover) {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.coffee-list-view :deep(.active-count-badge) {
  box-shadow: 0 0 8px rgba(59, 130, 246, 0.3);
  animation: pulseGlow 2s ease-in-out infinite alternate;
}

.coffee-list-view :deep(.filters-container):hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.coffee-list-view :deep(.filters-main-header):active {
  transform: scale(0.98);
  transition: transform 0.1s ease;
}

@keyframes pulseGlow {
  from { box-shadow: 0 0 8px rgba(59, 130, 246, 0.3); }
  to { box-shadow: 0 0 12px rgba(59, 130, 246, 0.5); }
}

/* Focus States */
.coffee-list-view *:focus {
  outline: 2px solid var(--focus-color, #22c55e);
  outline-offset: 2px;
}

.coffee-list-view *:focus:not(:focus-visible) {
  outline: none;
}

/* Responsive Design */
@media (max-width: 768px) {
  .coffee-list-view {
    gap: var(--spacing-3, 0.75rem);
  }
  
  .empty-state {
    padding: var(--spacing-6, 1.5rem);
  }
  
  .empty-state-title {
    font-size: var(--text-lg, 1.125rem);
  }
  
  .empty-state-description {
    font-size: var(--text-sm, 0.875rem);
  }
  
  .load-more-btn {
    padding: 0.625rem 1.25rem;
    font-size: 0.8125rem;
  }
  
  .loading-section {
    padding: var(--spacing-6, 1.5rem);
  }
  
  .spinner {
    width: 1.5rem;
    height: 1.5rem;
  }

  .coffee-list-view :deep(.filters-sections) {
    gap: 0.75rem;
    padding: 0.875rem;
  }
  
  .coffee-list-view :deep(.filters-container .filters-main-header) {
    padding: 0.875rem;
  }
}

@media (max-width: 640px) {
  .coffee-list-view {
    gap: var(--spacing-2, 0.5rem);
  }
  
  .empty-state {
    padding: var(--spacing-4, 1rem);
    margin: var(--spacing-2, 0.5rem);
  }
  
  .empty-state-title {
    font-size: var(--text-base, 1rem);
  }
  
  .load-more-btn {
    padding: 0.5rem 1rem;
    font-size: 0.75rem;
  }
  
  .loading-section {
    padding: var(--spacing-4, 1rem);
  }

  .coffee-list-view :deep(.filters-sections) {
    gap: 0.5rem;
    padding: 0.75rem;
  }
  
  .coffee-list-view :deep(.filters-container .filters-main-header) {
    padding: 0.75rem;
  }
  
  .coffee-list-view :deep(.header-content) {
    gap: 0.5rem;
  }
  
  .coffee-list-view :deep(.header-title) {
    font-size: 0.875rem;
  }
}

@media (max-width: 480px) {
  .empty-state {
    padding: var(--spacing-3, 0.75rem);
  }
  
  .empty-state-icon {
    margin-bottom: var(--spacing-2, 0.5rem);
  }
  
  .load-more-section {
    padding: var(--spacing-4, 1rem) 0;
  }
  
  .load-more-btn {
    width: 100%;
    justify-content: center;
  }

  .coffee-list-view :deep(.filters-sections .filters-section),
  .coffee-list-view :deep(.filters-sections .quick-filters-section > div) {
    margin: 0 -0.25rem;
  }
}

/* Large screens */
@media (min-width: 1024px) {
  .coffee-list-view {
    gap: var(--spacing-6, 1.5rem);
  }
  
  .empty-state {
    padding: var(--spacing-12, 3rem);
  }
  
  .empty-state-title {
    font-size: var(--text-2xl, 1.5rem);
  }
  
  .loading-section {
    padding: var(--spacing-12, 3rem);
  }
  
  .spinner {
    width: 2.5rem;
    height: 2.5rem;
  }

  .coffee-list-view :deep(.filters-container) {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  }
  
  .coffee-list-view :deep(.filters-sections) {
    gap: 1.25rem;
    padding: 1.25rem;
  }
}

/* Dark Mode Support */
@media (prefers-color-scheme: dark) {
  .coffee-list-view {
    background: var(--background-dark, #0f172a);
  }
  
  .spinner {
    color: var(--primary-green-dark, #34d399);
  }
  
  .loading-text {
    color: var(--text-secondary-dark, #94a3b8);
  }
  
  .empty-state {
    background: var(--card-background-dark, #1e293b);
    border: 1px solid var(--border-dark, #334155);
  }
  
  .empty-state-icon {
    color: var(--text-tertiary-dark, #64748b);
  }
  
  .empty-state-title {
    color: var(--text-primary-dark, #f1f5f9);
  }
  
  .empty-state-description {
    color: var(--text-secondary-dark, #94a3b8);
  }
  
  .load-more-btn {
    background: var(--card-background-dark, #1e293b);
    border-color: var(--border-dark, #334155);
    color: var(--text-primary-dark, #f1f5f9);
  }
  
  .load-more-btn:hover:not(:disabled) {
    border-color: var(--primary-green-dark, #34d399);
    background: var(--primary-green-dark, #059669);
  }

  .coffee-list-view :deep(.filters-content.expanded) {
    background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  }
  
  .coffee-list-view :deep(.filters-sections .filters-section),
  .coffee-list-view :deep(.filters-sections .quick-filters-section > div) {
    background: var(--card-background-dark, #1e293b);
    border-color: var(--border-dark, #334155);
  }
}

/* High Contrast Mode */
@media (prefers-contrast: high) {
  .empty-state {
    border: 2px solid var(--text-primary, #000);
  }
  
  .load-more-btn {
    border-width: 2px;
    font-weight: 600;
  }
  
  .spinner {
    stroke-width: 3;
  }

  .coffee-list-view :deep(.filters-container) {
    border-width: 2px;
  }
  
  .coffee-list-view :deep(.filters-sections .filters-section),
  .coffee-list-view :deep(.filters-sections .quick-filters-section > div) {
    border-width: 2px;
  }
}

/* Reduced Motion */
@media (prefers-reduced-motion: reduce) {
  .spinner,
  .spinner-small {
    animation: none;
  }
  
  .coffee-list-view > * {
    animation: none;
  }
  
  .loading-text {
    animation: none;
  }
  
  .load-more-btn:hover {
    transform: none;
  }
  
  .empty-state {
    transition: none;
  }

  .coffee-list-view :deep(.filters-content) {
    transition: none !important;
  }
  
  .coffee-list-view :deep(.expand-toggle.expanded) {
    transform: none !important;
  }
  
  .coffee-list-view :deep(.action-btn:hover) {
    transform: none !important;
  }
  
  .coffee-list-view :deep(.filters-main-header):active {
    transform: none !important;
  }
  
  .coffee-list-view :deep(.active-count-badge) {
    animation: none !important;
  }
  
  .coffee-list-view :deep(.filters-container):hover {
    transform: none !important;
  }
}

/* Print Styles */
@media print {
  .loading-section,
  .load-more-section {
    display: none;
  }
  
  .empty-state {
    box-shadow: none;
    border: 1px solid #ccc;
  }
  
  .load-more-btn {
    display: none;
  }

  .coffee-list-view :deep(.filters-container) {
    box-shadow: none;
    border: 1px solid #000;
    page-break-inside: avoid;
  }
  
  .coffee-list-view :deep(.expand-toggle) {
    display: none;
  }
  
  .coffee-list-view :deep(.filters-content) {
    max-height: none !important;
  }
}

/* Touch Device Optimizations */
@media (hover: none) and (pointer: coarse) {
  .load-more-btn {
    min-height: 44px;
    padding: 0.75rem 1rem;
  }
  
  .load-more-btn:hover:not(:disabled) {
    transform: none;
    border-color: var(--primary-green, #22c55e);
    background: var(--primary-green, #22c55e);
    color: white;
  }
}

/* Utility Classes */
.is-loading {
  pointer-events: none;
  opacity: 0.7;
}

.is-hidden {
  display: none;
}

.is-visible {
  display: flex;
}

/* Custom Properties */
:root {
  --coffee-list-gap: 1rem;
  --coffee-list-padding: 2rem;
  --coffee-list-border-radius: 12px;
  --coffee-list-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  --coffee-list-shadow-hover: 0 4px 12px rgba(0, 0, 0, 0.15);
  --coffee-list-transition: all 0.2s ease;
  --coffee-list-focus-ring: 2px solid #22c55e;
}

.coffee-list-view {
  --focus-ring-color: var(--primary-green, #22c55e);
  --focus-ring-offset: 2px;
  --focus-ring-width: 2px;
}
</style>