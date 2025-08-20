<template>
  <div class="containers-list-view">
    <!-- Results Counter -->
    <ResultsCounter 
      :showing="filteredContainers.length" 
      :total="containers.length" 
      item-name="container"
    />

    <!-- Search Section -->
    <SearchSection 
      v-model="searchQuery"
      placeholder="Search containers..."
      @clear="clearSearch"
    />

    <!-- Main Content -->
    <div v-if="loading" class="loading-section">
      <div class="loading-spinner">
        <div class="spinner" />
      </div>
      <p class="loading-text">Loading containers...</p>
    </div>

    <div v-else-if="containers.length === 0" class="empty-state">
      <div class="empty-state-icon">
        <Package :size="48" />
      </div>
      <h3 class="empty-state-title">No Containers Yet</h3>
      <p class="empty-state-description">
        Start by adding containers to organize your coffee collection.
      </p>
    </div>

    <div v-else-if="filteredContainers.length === 0" class="empty-state">
      <div class="empty-state-icon">
        <Search :size="48" />
      </div>
      <h3 class="empty-state-title">No Containers Found</h3>
      <p class="empty-state-description">
        Try adjusting your search to find containers.
      </p>
    </div>

    <!-- Containers Card Grid -->
    <ContainersCard 
      v-else
      :containers="filteredContainers"
      :highlighted-container-id="props.highlightedContainerId"
      @edit-container="$emit('edit-container', $event)"
      @view-coffee="handleViewCoffee"
    />

    <!-- Load More Section (if pagination needed) -->
    <div v-if="hasMoreToLoad" class="load-more-section">
      <button
        @click="loadMore"
        :disabled="loadingMore"
        class="load-more-btn"
      >
        <div v-if="loadingMore" class="spinner-small" />
        {{ loadingMore ? 'Loading...' : `Load More (${remainingCount} remaining)` }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Package, Search } from 'lucide-vue-next'
import ResultsCounter from '../filters/ResultsCounter.vue'
import SearchSection from '../coffee/SearchSection.vue'
import ContainersCard from './ContainersCard.vue'
import { useContainers } from '../../composables/useContainers'
import { useToast } from '../../composables/useToast'

// Props
const props = defineProps({
  highlightedContainerId: {
    type: [String, Number],
    default: null
  }
})

// Events
const emit = defineEmits(['edit-container', 'trigger-add-form'])

const route = useRoute()
const router = useRouter()
const { error, success, info, warning } = useToast()

// Composables
const { 
  containers, 
  loading, 
  fetchContainers,
  highlightContainer,
  clearHighlight
} = useContainers()

// Local state
const searchQuery = ref('')
const loadingMore = ref(false)
const itemsToShow = ref(12)

// Computed properties
const filteredContainers = computed(() => {
  if (!searchQuery.value.trim()) {
    return containers.value.slice(0, itemsToShow.value)
  }
  
  const query = searchQuery.value.toLowerCase().trim()
  return containers.value
    .filter(container => 
      container.name.toLowerCase().includes(query) ||
      (container.description && container.description.toLowerCase().includes(query))
    )
    .slice(0, itemsToShow.value)
})

const hasMoreToLoad = computed(() => {
  const totalFiltered = searchQuery.value.trim() 
    ? containers.value.filter(container => 
        container.name.toLowerCase().includes(searchQuery.value.toLowerCase().trim())
      ).length
    : containers.value.length
  
  return itemsToShow.value < totalFiltered
})

const remainingCount = computed(() => {
  const totalFiltered = searchQuery.value.trim() 
    ? containers.value.filter(container => 
        container.name.toLowerCase().includes(searchQuery.value.toLowerCase().trim())
      ).length
    : containers.value.length
  
  return Math.max(0, totalFiltered - itemsToShow.value)
})

// Methods
const clearSearch = () => {
  searchQuery.value = ''
}

const loadMore = () => {
  if (loadingMore.value || !hasMoreToLoad.value) return
  
  loadingMore.value = true
  setTimeout(() => {
    itemsToShow.value += 12
    loadingMore.value = false
  }, 300)
}

const handleViewCoffee = (container) => {
  // Navigate to coffee view with container filter
  router.push({
    path: '/coffee',
    query: { container: container.name }
  })
}

const initializeData = async () => {
  try {
    await fetchContainers()
    console.log('Containers loaded:', containers.value?.length || 0)
  } catch (error) {
    console.error('Error fetching containers:', error)
    warning('Load Error', 'Could not load containers from database')
  }
}

// Watch for prop changes to highlight container
watch(() => props.highlightedContainerId, (newId, oldId) => {
  if (newId && newId !== oldId) {
    highlightContainer(newId)
  }
})

// Reset pagination when search changes
watch(searchQuery, () => {
  itemsToShow.value = 12
})

// Initialize data when component mounts
onMounted(async () => {
  console.log('ContainersListView onMounted - loading data')
  
  try {
    await initializeData()
    
    // If there's a highlighted container ID prop, highlight it
    if (props.highlightedContainerId) {
      highlightContainer(props.highlightedContainerId)
    }
  } catch (error) {
    console.error('Error in onMounted:', error)
  }
})
</script>

<style scoped>
.containers-list-view {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4, 1rem);
  min-height: 100%;
}

/* Results Counter */
.results-counter {
  margin-bottom: 1.5rem;
}

/* Loading Section */
.loading-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  text-align: center;
}

.loading-spinner {
  margin-bottom: 1rem;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #f3f4f6;
  border-top: 3px solid #8b5cf6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.loading-text {
  font-size: 0.875rem;
  color: #6b7280;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 3rem 1rem;
}

.empty-state-icon {
  margin-bottom: 1rem;
  color: #9ca3af;
}

.empty-state-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.5rem;
}

.empty-state-description {
  font-size: 0.875rem;
  color: #6b7280;
  max-width: 400px;
  margin: 0 auto;
}

/* Load More Section */
.load-more-section {
  display: flex;
  justify-content: center;
  padding: 2rem 0;
  margin-top: 2rem;
}

.load-more-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: white;
  border: 2px solid #f0f0f0;
  border-radius: 8px;
  color: #333;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.load-more-btn:hover:not(:disabled) {
  border-color: #8b5cf6;
  background: #8b5cf6;
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
  border: 2px solid currentColor;
  border-top: 2px solid transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

/* Mobile responsiveness */
@media (max-width: 640px) {
  .containers-list-view {
    padding: 0 0.5rem;
  }
}
</style>