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

    <!-- Filters Section -->
    <FiltersSection 
      v-model="filters"
      :origins="availableOrigins"
      :shops="availableShops"
      @clear-all="clearAllFilters"
    />

    <!-- Container Quick Filters -->
    <ContainerQuickFilters 
      v-model="activeContainers"
      :containers="availableContainers"
      @container-click="handleContainerFilter"
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
        {{ hasActiveFilters ? 'Try adjusting your search or filters.' : 'Add your first coffee to get started.' }}
      </p>
      <button v-if="hasActiveFilters" @click="clearAllFilters" class="clear-filters-btn">
        Clear All Filters
      </button>
    </div>

    <!-- Coffee Grid -->
    <CoffeeGrid 
      v-else
      :coffees="paginatedCoffees"
      :expanded-cards="expandedCards"
      @card-expand="toggleCardExpansion"
      @card-action="handleCardAction"
    />

    <!-- Load More / Pagination -->
    <div v-if="showLoadMore" class="load-more-section">
      <button 
        class="load-more-btn"
        :disabled="loadingMore"
        @click="loadMoreCoffees"
      >
        <svg v-if="loadingMore" class="spinner-small" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none" />
        </svg>
        {{ loadingMore ? 'Loading...' : `Load More (${remainingCount} remaining)` }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Coffee } from 'lucide-vue-next'
/* import ResultsCounter from '../filters/ResultsCounter.vue'
import SearchSection from '../components/coffee/SearchSection.vue'
import FiltersSection from '../components/filters/FiltersSection.vue'
import ContainerQuickFilters from '../components/filters/ContainerQuickFilters.vue'
import CoffeeGrid from '../components/coffee/CoffeeGrid.vue'
import { useCoffeeData } from '../../composables/useCoffeeData'
import { useFilters } from '../../composables/useFilters' */

import ResultsCounter from '../filters/ResultsCounter.vue'
import SearchSection from './SearchSection.vue'
import FiltersSection from '../filters/FiltersSection.vue'
import ContainerQuickFilters from '../filters/ContainerQuickFilters.vue'
import CoffeeGrid from '../coffee/CoffeeGrid.vue'
import { useCoffeeData } from '../../composables/useCoffeeData'
import { useFilters } from '../../composables/useFilters'

const route = useRoute()
const router = useRouter()

// Composables
const { 
  coffees, 
  loading, 
  loadingMore,
  expandedCards,
  toggleCardExpansion,
  fetchCoffees,
  refreshCoffees 
} = useCoffeeData()

const {
  searchQuery,
  filters,
  activeContainers,
  filteredCoffees,
  clearAllFilters,
  clearSearch,
  syncFiltersWithRoute,
  updateRoute
} = useFilters(coffees)

// Pagination state
const itemsPerPage = ref(12)
const currentPage = ref(1)

// Computed properties
const totalCount = computed(() => coffees.value.length)
const filteredCount = computed(() => filteredCoffees.value.length)

const hasActiveFilters = computed(() => {
  return searchQuery.value || 
         filters.value.origin || 
         filters.value.shop || 
         activeContainers.value.length > 0
})

const paginatedCoffees = computed(() => {
  const start = 0
  const end = currentPage.value * itemsPerPage.value
  return filteredCoffees.value.slice(start, end)
})

const showLoadMore = computed(() => {
  return paginatedCoffees.value.length < filteredCoffees.value.length
})

const remainingCount = computed(() => {
  return filteredCoffees.value.length - paginatedCoffees.value.length
})

const searchPlaceholder = computed(() => {
  return `Search ${totalCount.value} coffees...`
})

// Available filter options (computed from data)
const availableOrigins = computed(() => {
  const origins = new Set()
  coffees.value.forEach(coffee => {
    if (coffee.origin) origins.add(coffee.origin)
  })
  return Array.from(origins).sort()
})

const availableShops = computed(() => {
  const shops = new Set()
  coffees.value.forEach(coffee => {
    if (coffee.shop) shops.add(coffee.shop)
  })
  return Array.from(shops).sort()
})

const availableContainers = computed(() => {
  const containers = new Map()
  coffees.value.forEach(coffee => {
    if (coffee.container) {
      containers.set(coffee.container.id, coffee.container)
    }
  })
  return Array.from(containers.values())
})

// Methods
const loadMoreCoffees = () => {
  if (loadingMore.value) return
  
  loadingMore.value = true
  currentPage.value++
  
  // Simulate network delay for smooth UX
  setTimeout(() => {
    loadingMore.value = false
  }, 300)
}

const handleCardAction = (action, coffee) => {
  switch (action) {
    case 'edit':
      router.push(`/coffee/${coffee.id}/edit`)
      break
    case 'delete':
      // Handle delete action
      console.log('Delete coffee:', coffee.id)
      break
    case 'duplicate':
      // Handle duplicate action
      console.log('Duplicate coffee:', coffee.id)
      break
    default:
      console.log('Unknown action:', action, coffee)
  }
}

const handleContainerFilter = (container) => {
  // Toggle container filter
  const index = activeContainers.value.findIndex(c => c.id === container.id)
  if (index > -1) {
    activeContainers.value.splice(index, 1)
  } else {
    activeContainers.value.push(container)
  }
}

// Reset pagination when filters change
watch([searchQuery, filters, activeContainers], () => {
  currentPage.value = 1
}, { deep: true })

// Sync filters with URL query parameters
watch([searchQuery, filters, activeContainers], () => {
  updateRoute()
}, { deep: true, flush: 'post' })

// Initialize filters from URL on mount
onMounted(async () => {
  // Load coffee data
  await fetchCoffees()
  
  // Sync filters with current route
  syncFiltersWithRoute(route.query)
  
  // Handle container parameter from legacy URLs
  if (route.query.container) {
    const containerName = route.query.container
    const matchingContainer = availableContainers.value.find(
      c => c.name.toLowerCase() === containerName.toLowerCase()
    )
    if (matchingContainer) {
      activeContainers.value = [matchingContainer]
    }
  }
})

// Refresh data when route changes (e.g., coming back from detail view)
watch(() => route.path, (newPath, oldPath) => {
  if (newPath === '/coffee' && oldPath?.startsWith('/coffee/')) {
    refreshCoffees()
  }
})
</script>

<style scoped>
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

.clear-filters-btn {
  background: var(--primary-green, #22c55e);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.75rem 1.5rem;
  font-size: var(--text-sm, 0.875rem);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.clear-filters-btn:hover {
  background: var(--primary-green-hover, #16a34a);
  transform: translateY(-1px);
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
}

.load-more-btn:hover:not(:disabled) {
  border-color: var(--primary-green, #22c55e);
  background: var(--primary-green, #22c55e);
  color: white;
  transform: translateY(-1px);
}

.load-more-btn:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.spinner-small {
  width: 1rem;
  height: 1rem;
  animation: spin 1s linear infinite;
}

/* Animations */
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes spinner-dash {
  0% {
    stroke-dashoffset: 31.416;
  }
  50% {
    stroke-dashoffset: 7.854;
    transform: rotate(135deg);
  }
  100% {
    stroke-dashoffset: 31.416;
    transform: rotate(450deg);
  }
}

/* Responsive Design */
@media (max-width: 640px) {
  .coffee-list-view {
    gap: var(--spacing-3, 0.75rem);
  }
  
  .empty-state {
    padding: var(--spacing-6, 1.5rem);
  }
  
  .empty-state-title {
    font-size: var(--text-lg, 1.125rem);
  }
  
  .load-more-btn {
    padding: 0.625rem 1.25rem;
    font-size: 0.8125rem;
  }
}

/* Dark Mode Support */
@media (prefers-color-scheme: dark) {
  .spinner {
    color: var(--primary-green, #22c55e);
  }
  
  .loading-text {
    color: var(--text-secondary-dark, #d1d5db);
  }
  
  .empty-state {
    background: var(--card-background-dark, #1f2937);
  }
  
  .empty-state-title {
    color: var(--text-primary-dark, #f9fafb);
  }
  
  .empty-state-description {
    color: var(--text-secondary-dark, #d1d5db);
  }
  
  .load-more-btn {
    background: var(--card-background-dark, #1f2937);
    border-color: var(--border-dark, #374151);
    color: var(--text-primary-dark, #f9fafb);
  }
}

/* Reduced Motion */
@media (prefers-reduced-motion: reduce) {
  .spinner,
  .spinner-small {
    animation: none;
  }
  
  .clear-filters-btn:hover,
  .load-more-btn:hover {
    transform: none;
  }
}
</style>