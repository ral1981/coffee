<template>
  <div class="shops-view">
    <!-- Results Counter -->
    <div class="results-counter">
      <span class="counter-text">
        <strong>{{ shops.length }}</strong> Coffee Shops
      </span>
    </div>

    <!-- Search Section -->
    <div class="search-section">
      <input 
        v-model="searchQuery"
        type="text"
        class="search-input"
        placeholder="Search shops..."
      />
      <button 
        v-if="searchQuery"
        class="clear-btn"
        @click="clearSearch"
      >
        Clear
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-section">
      <div class="loading-spinner">
        <svg class="spinner" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none" />
        </svg>
      </div>
      <p class="loading-text">Loading coffee shops...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredShops.length === 0" class="empty-state">
      <div class="empty-state-icon">
        <Store :size="48" />
      </div>
      <h3 class="empty-state-title">
        {{ searchQuery ? 'No shops match your search' : 'No coffee shops found' }}
      </h3>
      <p class="empty-state-description">
        {{ searchQuery ? 'Try adjusting your search terms.' : 'Coffee shops will be extracted from your coffee collection.' }}
      </p>
      <button v-if="searchQuery" @click="clearSearch" class="clear-search-btn">
        Clear Search
      </button>
    </div>

    <!-- Shops Grid -->
    <div v-else class="shops-grid">
      <div
        v-for="shop in paginatedShops"
        :key="shop.id || shop.name"
        class="shop-card"
        @click="viewShop(shop)"
      >
        <div class="shop-header">
          <div class="shop-logo">
            <LogoImage
              v-if="shop.url"
              :url="shop.url"
              :custom-logo="shop.logo"
              :size="56"
              alt="shop logo"
              class-name="rounded-lg"
            />
            <div v-else class="shop-logo-fallback">
              {{ getShopInitials(shop.name) }}
            </div>
          </div>
          <div class="shop-info">
            <h3 class="shop-name">{{ shop.name }}</h3>
            <p v-if="shop.url" class="shop-url">{{ getDomain(shop.url) }}</p>
            <p class="shop-stats">{{ shop.coffeeCount }} coffee{{ shop.coffeeCount !== 1 ? 's' : '' }}</p>
          </div>
          <div class="shop-actions">
            <button
              v-if="shop.url"
              @click.stop="openShopWebsite(shop)"
              class="action-btn primary"
              title="Visit website"
            >
              <ExternalLink :size="16" />
            </button>
            <button
              @click.stop="viewCoffees(shop)"
              class="action-btn secondary"
              title="View coffees"
            >
              <Coffee :size="16" />
            </button>
          </div>
        </div>

        <div class="shop-details">
          <div class="detail-item">
            <div class="detail-label">Coffees</div>
            <div class="detail-value">{{ shop.coffeeCount }}</div>
          </div>
          <div v-if="shop.created_at" class="detail-item">
            <div class="detail-label">Added</div>
            <div class="detail-value">{{ formatDate(shop.created_at) }}</div>
          </div>
          <div v-if="shop.origins && shop.origins.length > 0" class="detail-item">
            <div class="detail-label">Origins</div>
            <div class="detail-value">{{ shop.origins.slice(0, 2).join(', ') }}{{ shop.origins.length > 2 ? '...' : '' }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Load More -->
    <div v-if="showLoadMore" class="load-more-section">
      <button 
        class="load-more-btn"
        :disabled="isLoadingMore"
        @click="loadMore"
      >
        <svg v-if="isLoadingMore" class="spinner-small" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none" />
        </svg>
        {{ isLoadingMore ? 'Loading...' : `Load More (${remainingCount} remaining)` }}
      </button>
    </div>

    <!-- Info Section -->
    <div class="info-section">
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

    <!-- Debug Section -->
    <div v-if="showDebug" class="debug-section">
      <h4>🔧 Debug Info</h4>
      <p><strong>Total shops:</strong> {{ shops.length }}</p>
      <p><strong>Filtered shops:</strong> {{ filteredShops.length }}</p>
      <p><strong>Search query:</strong> "{{ searchQuery }}"</p>
      <details>
        <summary>Shop data:</summary>
        <pre>{{ JSON.stringify(shops.slice(0, 3), null, 2) }}</pre>
      </details>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { Store, Coffee, ExternalLink } from 'lucide-vue-next'
import LogoImage from '../components/shared/LogoImage.vue'
import { useCoffeeData } from '../composables/useCoffeeData'
import { useToast } from '../composables/useToast'

const router = useRouter()
const { success, info, warning } = useToast()

// Get coffee data to extract shops
const { coffees, loading, fetchCoffees } = useCoffeeData()

// Local state
const searchQuery = ref('')
const itemsToShow = ref(12)
const isLoadingMore = ref(false)

// Extract unique shops from coffee data
const shops = computed(() => {
  const shopMap = new Map()
  
  coffees.value.forEach(coffee => {
    // Handle both new relationship structure and legacy fields
    const shopName = coffee.shops?.name || coffee.shop_name || coffee.shop
    const shopUrl = coffee.shops?.url || coffee.bean_url
    const shopLogo = coffee.shops?.logo
    const shopId = coffee.shops?.id || shopName
    
    if (shopName && shopId) {
      if (shopMap.has(shopId)) {
        // Increment coffee count and add origins
        const existingShop = shopMap.get(shopId)
        existingShop.coffeeCount++
        if (coffee.origin && !existingShop.origins.includes(coffee.origin)) {
          existingShop.origins.push(coffee.origin)
        }
      } else {
        // Create new shop entry
        shopMap.set(shopId, {
          id: shopId,
          name: shopName,
          url: shopUrl,
          logo: shopLogo,
          coffeeCount: 1,
          origins: coffee.origin ? [coffee.origin] : [],
          created_at: coffee.shops?.created_at || coffee.created_at
        })
      }
    }
  })
  
  return Array.from(shopMap.values()).sort((a, b) => b.coffeeCount - a.coffeeCount)
})

// Filtered shops based on search
const filteredShops = computed(() => {
  if (!searchQuery.value) return shops.value
  
  const query = searchQuery.value.toLowerCase()
  return shops.value.filter(shop =>
    shop.name.toLowerCase().includes(query) ||
    (shop.url && shop.url.toLowerCase().includes(query)) ||
    shop.origins.some(origin => origin.toLowerCase().includes(query))
  )
})

// Paginated shops
const paginatedShops = computed(() => {
  return filteredShops.value.slice(0, itemsToShow.value)
})

// Pagination helpers
const showLoadMore = computed(() => {
  return itemsToShow.value < filteredShops.value.length
})

const remainingCount = computed(() => {
  return filteredShops.value.length - itemsToShow.value
})

// Helper functions
const getShopInitials = (name) => {
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('')
}

const getDomain = (url) => {
  try {
    const fullUrl = url.startsWith('http') ? url : `https://${url}`
    return new URL(fullUrl).hostname.replace('www.', '')
  } catch {
    return url
  }
}

const formatDate = (dateString) => {
  if (!dateString) return 'Unknown'
  try {
    return new Date(dateString).toLocaleDateString()
  } catch {
    return 'Invalid date'
  }
}

const clearSearch = () => {
  searchQuery.value = ''
}

const loadMore = () => {
  if (isLoadingMore.value) return
  
  isLoadingMore.value = true
  setTimeout(() => {
    itemsToShow.value += 12
    isLoadingMore.value = false
  }, 300)
}

const viewShop = (shop) => {
  info('Shop Details', `Viewing details for ${shop.name}`)
  console.log('View shop:', shop)
}

const openShopWebsite = (shop) => {
  if (shop.url) {
    const fullUrl = shop.url.startsWith('http') ? shop.url : `https://${shop.url}`
    window.open(fullUrl, '_blank', 'noopener,noreferrer')
    success('Opening website', `Opening ${shop.name} in new tab`)
  }
}

const viewCoffees = (shop) => {
  // Navigate to coffee tab filtered by this shop
  router.push({
    path: '/coffee',
    query: { shop: shop.name }
  })
  success('Filtering coffees', `Showing coffees from ${shop.name}`)
}

// Reset pagination when search changes
const resetPagination = () => {
  itemsToShow.value = 12
}

// Watch search query
import { watch } from 'vue'
watch(searchQuery, resetPagination)

// Initialize data
onMounted(async () => {
  try {
    await fetchCoffees()
  } catch (error) {
    console.error('Error loading coffee data:', error)
    warning('Load Error', 'Could not load coffee data to extract shops')
  }
})
</script>

<style scoped>
.shops-view {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-height: 100%;
}

/* Results Counter */
.results-counter {
  background: white;
  border-radius: 12px;
  padding: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.counter-text {
  font-size: 1rem;
  color: #666;
}

/* Search Section */
.search-section {
  background: white;
  border-radius: 12px;
  padding: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  gap: 0.5rem;
}

.search-input {
  flex: 1;
  padding: 0.75rem;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  font-size: 1rem;
  background: #f8f9fa;
}

.search-input:focus {
  outline: none;
  border-color: #8b5cf6;
  background: white;
}

.clear-btn {
  padding: 0.5rem 1rem;
  background: #f0f0f0;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s;
}

.clear-btn:hover {
  background: #e5e7eb;
}

/* Loading Section */
.loading-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  text-align: center;
}

.loading-spinner {
  margin-bottom: 1rem;
}

.spinner {
  width: 2rem;
  height: 2rem;
  color: #8b5cf6;
  animation: spin 1s linear infinite;
}

.spinner circle {
  stroke-dasharray: 31.416;
  stroke-dashoffset: 31.416;
  animation: spinner-dash 1.5s ease-in-out infinite;
}

.loading-text {
  color: #666;
  font-size: 0.875rem;
  margin: 0;
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  text-align: center;
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.empty-state-icon {
  margin-bottom: 1rem;
  color: #999;
}

.empty-state-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #333;
  margin: 0 0 0.5rem 0;
}

.empty-state-description {
  color: #666;
  margin: 0 0 1rem 0;
  max-width: 24rem;
  line-height: 1.5;
}

.clear-search-btn {
  background: #8b5cf6;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.75rem 1.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.clear-search-btn:hover {
  background: #7c3aed;
  transform: translateY(-1px);
}

/* Shops Grid */
.shops-grid {
  display: grid;
  gap: 1rem;
}

@media (min-width: 768px) {
  .shops-grid {
    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  }
}

.shop-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border-left: 4px solid #8b5cf6;
  cursor: pointer;
  transition: all 0.2s ease;
}

.shop-card:hover {
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.15);
  transform: translateY(-2px);
  border-left-color: #7c3aed;
}

.shop-header {
  display: flex;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.shop-logo {
  width: 56px;
  height: 56px;
  margin-right: 1rem;
  flex-shrink: 0;
}

.shop-logo-fallback {
  width: 56px;
  height: 56px;
  border-radius: 8px;
  background: linear-gradient(135deg, #8b5cf6, #a855f7);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 1.25rem;
}

.shop-info {
  flex: 1;
  min-width: 0;
}

.shop-name {
  font-size: 1.25rem;
  font-weight: 600;
  color: #333;
  margin: 0 0 0.25rem 0;
}

.shop-url {
  color: #8b5cf6;
  font-size: 0.875rem;
  margin: 0 0 0.25rem 0;
  word-break: break-word;
}

.shop-stats {
  color: #666;
  font-size: 0.875rem;
  margin: 0;
}

.shop-actions {
  display: flex;
  gap: 0.5rem;
  margin-left: 1rem;
}

.action-btn {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn.primary {
  background: #8b5cf6;
  color: white;
}

.action-btn.primary:hover {
  background: #7c3aed;
  transform: scale(1.05);
}

.action-btn.secondary {
  background: #f3f4f6;
  color: #374151;
}

.action-btn.secondary:hover {
  background: #e5e7eb;
  transform: scale(1.05);
}

.shop-details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 1rem;
  background: #faf5ff;
  padding: 1rem;
  border-radius: 8px;
}

.detail-item {
  text-align: center;
}

.detail-label {
  font-size: 0.75rem;
  color: #7c3aed;
  text-transform: uppercase;
  font-weight: 600;
  letter-spacing: 0.5px;
  margin-bottom: 0.25rem;
}

.detail-value {
  font-size: 0.875rem;
  color: #333;
  font-weight: 500;
}

/* Load More Section */
.load-more-section {
  display: flex;
  justify-content: center;
  padding: 1rem 0;
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
  animation: spin 1s linear infinite;
}

/* Info Section */
.info-section {
  margin-top: 1rem;
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

/* Debug Section - Removed for production */

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
  .shop-card {
    padding: 1rem;
  }
  
  .shop-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .shop-actions {
    margin-left: 0;
    margin-top: 0.75rem;
    align-self: flex-end;
  }
  
  .shop-details {
    grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
  }
  
  .info-card {
    padding: 1rem;
  }
  
  .search-section {
    flex-direction: column;
  }
}

/* Reduced Motion */
@media (prefers-reduced-motion: reduce) {
  .spinner,
  .spinner-small {
    animation: none;
  }
  
  .shop-card:hover,
  .action-btn:hover,
  .load-more-btn:hover {
    transform: none;
  }
}
</style>