<template>
  <div class="shops-list-view">
    <!-- Results Counter -->
    <ResultsCounter 
      :showing="filteredShops.length" 
      :total="shops.length" 
      item-name="shop"
    />

    <!-- Search Section -->
    <SearchSection 
      v-model="searchQuery"
      placeholder="Search shops..."
      @clear="clearSearch"
    />

    <!-- Main Content -->
    <div v-if="loading" class="loading-section">
      <div class="loading-spinner">
        <div class="spinner" />
      </div>
      <p class="loading-text">Loading shops...</p>
    </div>

    <div v-else-if="shops.length === 0" class="empty-state">
      <div class="empty-state-icon">
        <Store :size="48" />
      </div>
      <h3 class="empty-state-title">No Shops Yet</h3>
      <p class="empty-state-description">
        Start by adding coffee shops and roasters to your collection.
      </p>
    </div>

    <div v-else-if="filteredShops.length === 0" class="empty-state">
      <div class="empty-state-icon">
        <Search :size="48" />
      </div>
      <h3 class="empty-state-title">No Shops Found</h3>
      <p class="empty-state-description">
        Try adjusting your search to find shops.
      </p>
    </div>

    <!-- Shops Card Grid -->
    <ShopsCard 
      v-else
      :shops="filteredShops"
      :highlighted-shop-id="props.highlightedShopId"
      @edit-shop="$emit('edit-shop', $event)"
      @view-coffees="handleViewCoffees"
    />

    <!-- Load More Section -->
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

    <!-- Info Section -->
    <div v-if="!loading && shops.length > 0" class="info-section">
      <div class="info-card">
        <div class="info-icon">
          <Store :size="24" />
        </div>
        <div class="info-content">
          <h4 class="info-title">Coffee Shop Directory</h4>
          <p class="info-description">
            Discover coffee roasters and shops from your collection. Each shop shows 
            the coffees you have from them, making it easy to explore your favorite roasters.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Store, Search } from 'lucide-vue-next'
import ResultsCounter from '../filters/ResultsCounter.vue'
import SearchSection from '../coffee/SearchSection.vue'
import ShopsCard from './ShopsCard.vue'
import { useShops } from '../../composables/useShops'
import { useToast } from '../../composables/useToast'

// Props
const props = defineProps({
  highlightedShopId: {
    type: [String, Number],
    default: null
  }
})

// Events
const emit = defineEmits(['edit-shop', 'trigger-add-form'])

const route = useRoute()
const router = useRouter()
const { error, success, info, warning } = useToast()

// Composables
const { 
  shops, 
  loading, 
  fetchShops,
  highlightShop,
  clearHighlight
} = useShops()

// Local state
const searchQuery = ref('')
const loadingMore = ref(false)
const itemsToShow = ref(12)

// Computed properties
const filteredShops = computed(() => {
  if (!searchQuery.value.trim()) {
    return shops.value.slice(0, itemsToShow.value)
  }
  
  const query = searchQuery.value.toLowerCase().trim()
  return shops.value
    .filter(shop => 
      shop.name.toLowerCase().includes(query) ||
      (shop.url && shop.url.toLowerCase().includes(query)) ||
      (shop.description && shop.description.toLowerCase().includes(query))
    )
    .slice(0, itemsToShow.value)
})

const hasMoreToLoad = computed(() => {
  const totalFiltered = searchQuery.value.trim() 
    ? shops.value.filter(shop => 
        shop.name.toLowerCase().includes(searchQuery.value.toLowerCase().trim()) ||
        (shop.url && shop.url.toLowerCase().includes(searchQuery.value.toLowerCase().trim()))
      ).length
    : shops.value.length
  
  return itemsToShow.value < totalFiltered
})

const remainingCount = computed(() => {
  const totalFiltered = searchQuery.value.trim() 
    ? shops.value.filter(shop => 
        shop.name.toLowerCase().includes(searchQuery.value.toLowerCase().trim()) ||
        (shop.url && shop.url.toLowerCase().includes(searchQuery.value.toLowerCase().trim()))
      ).length
    : shops.value.length
  
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

const handleViewCoffees = (shop) => {
  // Navigate to coffee view with shop filter
  router.push({
    path: '/coffee',
    query: { shop: shop.name }
  })
}

const initializeData = async () => {
  try {
    await fetchShops()
    console.log('Shops loaded:', shops.value?.length || 0)
  } catch (error) {
    console.error('Error fetching shops:', error)
    warning('Load Error', 'Could not load shops from database')
  }
}

// Watch for prop changes to highlight shop
watch(() => props.highlightedShopId, (newId, oldId) => {
  if (newId && newId !== oldId) {
    highlightShop(newId)
  }
})

// Reset pagination when search changes
watch(searchQuery, () => {
  itemsToShow.value = 12
})

// Initialize data when component mounts
onMounted(async () => {
  console.log('ShopsListView onMounted - loading data')
  
  try {
    await initializeData()
    
    // If there's a highlighted shop ID prop, highlight it
    if (props.highlightedShopId) {
      highlightShop(props.highlightedShopId)
    }
  } catch (error) {
    console.error('Error in onMounted:', error)
  }
})
</script>

<style scoped>
.shops-list-view {
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

/* Info Section */
.info-section {
  margin-top: 2rem;
}

.info-card {
  background: #faf5ff;
  border-radius: 12px;
  padding: 1.5rem;
  border-left: 4px solid #8b5cf6;
  display: flex;
  align-items: flex-start;
  gap: 1rem;
}

.info-icon {
  color: #8b5cf6;
  flex-shrink: 0;
  margin-top: 0.125rem;
}

.info-content {
  flex: 1;
}

.info-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #7c3aed;
  margin: 0 0 0.5rem 0;
}

.info-description {
  color: #7c3aed;
  line-height: 1.5;
  margin: 0;
  opacity: 0.9;
}

/* Mobile responsiveness */
@media (max-width: 640px) {
  .shops-list-view {
    padding: 0 0.5rem;
  }
  
  .info-card {
    padding: 1rem;
  }
  
  .info-title {
    font-size: 1rem;
  }
}
</style>