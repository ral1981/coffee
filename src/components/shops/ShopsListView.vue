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
      @edit-shop="handleEditShop"
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
            the coffees you have from them.
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

// FIXED: Separate edit and view actions properly
const handleEditShop = (shop) => {
  console.log('📝 ShopsListView: Handling edit shop request for:', shop.name)
  // Only emit the edit-shop event - don't navigate anywhere
  emit('edit-shop', shop)
}

const handleViewCoffees = (shop) => {
  console.log('👀 ShopsListView: Handling view coffees request for:', shop.name)
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
    
    // Highlight shop if specified in props
    if (props.highlightedShopId) {
      highlightShop(props.highlightedShopId)
    }
    
  } catch (err) {
    console.error('Error during ShopsListView initialization:', err)
  }
})
</script>

<style scoped>
.shops-list-view {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-height: 100%;
}

/* Loading States */
.loading-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
}

.loading-spinner {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
}

.spinner {
  width: 2rem;
  height: 2rem;
  border: 2px solid #e5e7eb;
  border-top: 2px solid #22c55e;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-text {
  color: #6b7280;
  font-size: 0.875rem;
}

/* Empty States */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  text-align: center;
}

.empty-state-icon {
  color: #d1d5db;
  margin-bottom: 1rem;
}

.empty-state-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #374151;
  margin: 0 0 0.5rem 0;
}

.empty-state-description {
  color: #6b7280;
  font-size: 0.875rem;
  margin: 0;
  max-width: 320px;
}

/* Load More Section */
.load-more-section {
  display: flex;
  justify-content: center;
  padding: 1rem;
}

.load-more-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #22c55e;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.load-more-btn:hover:not(:disabled) {
  background: #16a34a;
  transform: translateY(-1px);
}

.load-more-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.spinner-small {
  width: 1rem;
  height: 1rem;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

/* Info Section */
.info-section {
  padding: 1rem;
  margin-top: auto;
}

.info-card {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1.5rem;
}

.info-icon {
  color: #22c55e;
  flex-shrink: 0;
}

.info-content {
  flex: 1;
}

.info-title {
  font-size: 1rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 0.5rem 0;
}

.info-description {
  font-size: 0.875rem;
  color: #64748b;
  line-height: 1.5;
  margin: 0;
}

/* Responsive Design */
@media (max-width: 640px) {
  .shops-list-view {
    gap: 0.75rem;
  }
  
  .info-card {
    padding: 1rem;
  }
  
  .info-title {
    font-size: 0.875rem;
  }
  
  .info-description {
    font-size: 0.8125rem;
  }
}
</style>