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
        {{ searchQuery ? 'Try adjusting your search terms.' : 'Add your first coffee shop to get started!' }}
      </p>
      <button 
        v-if="searchQuery" 
        @click="clearSearch" 
        class="clear-search-btn"
      >
        Clear Search
      </button>
      <button 
        v-else 
        @click="triggerAddShop" 
        class="add-shop-btn"
        :disabled="!isLoggedIn"
        :class="{ 'btn-disabled': !isLoggedIn }"
      >
        <Plus :size="20" />
        Add Your First Shop
      </button>
    </div>

    <!-- Shops Grid -->
    <div v-else class="shops-grid">
      <div
        v-for="shop in paginatedShops"
        :key="shop.id || shop.name"
        :data-shop-id="shop.id"
        class="shop-card"
        :class="{ 
          'highlighted': highlightedShopId === shop.id,
          'new-shop': highlightedShopId === shop.id 
        }"
        @click="viewShop(shop)"
      >
        <div class="shop-header">
          <!-- Left side: Logo and Info -->
          <div class="shop-main">
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
              <a 
                v-if="shop.url" 
                :href="shop.url.startsWith('http') ? shop.url : `https://${shop.url}`"
                target="_blank"
                rel="noopener noreferrer"
                class="shop-url"
                @click.stop="handleUrlClick(shop)"
              >
                {{ getDomain(shop.url) }}
              </a>
            </div>
          </div>
          
          <!-- Right side: Action buttons -->
          <div class="shop-actions">
            <button
              @click.stop="viewCoffees(shop)"
              class="action-btn secondary coffee-btn"
              title="View coffees"
            >
              <Coffee :size="20" />
              <span 
                class="coffee-badge"
                :class="{ 'coffee-badge--empty': shop.coffeeCount === 0 }"
              >
                {{ shop.coffeeCount }}
              </span>
            </button>
            
            <!-- Three-dot menu -->
            <div class="shop-menu-container">
              <button
                @click.stop="toggleShopMenu(shop.id)"
                class="shop-menu-btn"
                :class="{ 'active': openMenuId === shop.id }"
                aria-label="Shop options"
              >
                <MoreVertical :size="16" />
              </button>
              
              <!-- Dropdown menu -->
              <Transition name="dropdown">
                <div 
                  v-if="openMenuId === shop.id"
                  class="shop-dropdown"
                  @click.stop
                >
                  <button 
                    @click="editShop(shop)"
                    class="dropdown-item"
                  >
                    <Edit :size="16" />
                    Edit Shop
                  </button>
                  <button 
                    @click="deleteShop(shop)"
                    class="dropdown-item delete"
                  >
                    <Trash2 :size="16" />
                    Delete Shop
                  </button>
                </div>
              </Transition>
            </div>
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
import { Store, Coffee, Plus, MoreVertical, Edit, Trash2 } from 'lucide-vue-next'
import LogoImage from '../components/shared/LogoImage.vue'
import { useCoffeeData } from '../composables/useCoffeeData'
import { useShops } from '../composables/useShops'
import { useToast } from '../composables/useToast'
import { useAuth } from '../composables/useAuth'

const router = useRouter()
const { success, info, warning } = useToast()

// Emit events to parent (AppLayout)
const emit = defineEmits(['trigger-add-shop', 'edit-shop'])

// Get coffee data to extract shops
const { coffees, loading, fetchCoffees } = useCoffeeData()
const { 
  shops: rawShops, 
  loading: shopsLoading, 
  fetchShops,
  highlightedShopId: globalHighlightedShopId 
} = useShops()

// Authentication status
const { isLoggedIn } = useAuth()

// Local state
const searchQuery = ref('')
const itemsToShow = ref(12)
const isLoadingMore = ref(false)
const openMenuId = ref(null)

// Enhance shops with coffee count data
const shops = computed(() => {
  return rawShops.value.map(shop => {
    const relatedCoffees = coffees.value.filter(coffee => 
      coffee.shops?.id === shop.id || 
      coffee.shop_name === shop.name
    )
    
    const origins = [...new Set(
      relatedCoffees.map(coffee => coffee.origin).filter(Boolean)
    )]
    
    return {
      ...shop,
      coffeeCount: relatedCoffees.length,
      origins: origins
    }
  })
})

const highlightedShopId = computed(() => {
  return props.highlightedShopId || globalHighlightedShopId.value
})

const props = defineProps({
  highlightedShopId: {
    type: [String, Number],
    default: null
  }
})

// Menu management functions
const toggleShopMenu = (shopId) => {
  openMenuId.value = openMenuId.value === shopId ? null : shopId
}

const closeAllMenus = () => {
  openMenuId.value = null
}

const editShop = (shop) => {
  console.log('Edit shop:', shop)
  closeAllMenus()
  emit('edit-shop', shop)
  info('Edit Shop', `Opening edit form for ${shop.name}`)
}

const deleteShop = async (shop) => {
  closeAllMenus()
  
  // Confirm deletion
  const confirmMessage = shop.coffeeCount > 0 
    ? `Are you sure you want to delete "${shop.name}"? This shop has ${shop.coffeeCount} coffee${shop.coffeeCount !== 1 ? 's' : ''} associated with it.`
    : `Are you sure you want to delete "${shop.name}"?`
  
  if (!confirm(confirmMessage)) {
    return
  }
  
  try {
    const { supabase } = await import('../lib/supabase')
    
    // Check if shop has associated coffees
    if (shop.coffeeCount > 0) {
      warning(
        'Cannot delete shop', 
        `"${shop.name}" has ${shop.coffeeCount} coffee${shop.coffeeCount !== 1 ? 's' : ''} associated with it. Please remove or reassign the coffees first.`
      )
      return
    }
    
    const { error } = await supabase
      .from('shops')
      .delete()
      .eq('id', shop.id)
    
    if (error) {
      throw error
    }
    
    // Remove from local list
    await fetchShops()
    
    success('Shop deleted', `"${shop.name}" has been deleted successfully`)
    
  } catch (err) {
    console.error('Error deleting shop:', err)
    error('Delete failed', `Could not delete "${shop.name}". Please try again.`)
  }
}

const handleUrlClick = (shop) => {
  success('Opening website', `Opening ${shop.name} in new tab`)
}

// Add click outside handler
const handleClickOutside = () => {
  closeAllMenus()
}

// Update onMounted and onUnmounted
onMounted(async () => {
  try {
    await Promise.all([
      fetchCoffees(),
      fetchShops()
    ])
  } catch (error) {
    console.error('Error loading data:', error)
    warning('Load Error', 'Could not load data')
  }
  
  // Add click outside listener
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  // Remove click outside listener
  document.removeEventListener('click', handleClickOutside)
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

const viewCoffees = (shop) => {
  // Navigate to coffee tab filtered by this shop
  router.push({
    path: '/coffee',
    query: { shop: shop.name }
  })
  success('Filtering coffees', `Showing coffees from ${shop.name}`)
}

// Trigger add shop form
const triggerAddShop = () => {
  if (!isLoggedIn.value) {
    warning('Login Required', 'Please log in to add coffee shops')
    return
  }
  emit('trigger-add-shop')
}

// Reset pagination when search changes
const resetPagination = () => {
  itemsToShow.value = 12
}

// Watch search query
import { watch } from 'vue'
watch(searchQuery, resetPagination)

// Watch for highlighted shop prop changes
watch(() => props.highlightedShopId, (newId) => {
  if (newId) {
    highlightedShopId.value = newId
    // Auto-clear highlight after 3 seconds
    setTimeout(() => {
      highlightedShopId.value = null
    }, 3000)
  }
})

// Initialize data
onMounted(async () => {
  try {
    await Promise.all([
      fetchCoffees(),
      fetchShops()
    ])
  } catch (error) {
    console.error('Error loading data:', error)
    warning('Load Error', 'Could not load data')
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

.coffee-btn {
  position: relative;
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #8b5cf6, #a855f7);
  border: none;
  color: white;
  transition: all 0.2s ease;
  z-index: 1;
}

.coffee-btn:hover {
  background: linear-gradient(135deg, #7c3aed, #9333ea);
  transform: scale(1.05);
}

/* Default green badge (count > 0) */
.coffee-badge {
  position: absolute;
  top: -6px;
  right: -6px;
  background: transparent;
  color: #16a34a;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.125rem 0.375rem;
  border-radius: 10px;
  min-width: 18px;
  text-align: center;
  line-height: 1.2;
  border: 2px solid #16a34a;
  z-index: 1;
}

/* Red badge when count is 0 */
.coffee-badge--empty {
  color: #dc2626;
  border-color: #dc2626;
}

/* Shop menu styles */
.shop-menu-container {
  position: relative;
  display: flex;
  align-items: center;
  z-index: 200;
}

.shop-menu-btn {
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 6px;
  background: #f3f4f6;
  color: #6b7280;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  z-index: 1;
}

.shop-menu-btn:hover,
.shop-menu-btn.active {
  background: #e5e7eb;
  color: #374151;
}

.shop-dropdown {
  position: absolute;
  top: calc(100% + 0.5rem);
  right: 0;
  min-width: 140px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  z-index: 300;
}

.dropdown-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border: none;
  background: none;
  color: #374151;
  font-size: 0.875rem;
  text-align: left;
  cursor: pointer;
  transition: background-color 0.2s;
  z-index: 200;
}

.dropdown-item:hover {
  background: #f9fafb;
}

.dropdown-item.delete {
  color: #ef4444;
}

.dropdown-item.delete:hover {
  background: #fef2f2;
}

/* Dropdown animation */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.95);
}

/* Update shop actions layout */
.shop-actions {
  display: flex;
  gap: 0.5rem;
  margin-left: 1rem;
  align-items: center;
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

.add-shop-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: var(--primary-green, #22c55e);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.75rem 1.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.add-shop-btn:hover:not(:disabled) {
  background: var(--primary-green-hover, #16a34a);
  transform: translateY(-1px);
}

.add-shop-btn:disabled,
.add-shop-btn.btn-disabled {
  background: #e5e7eb;
  color: #9ca3af;
  cursor: not-allowed;
  opacity: 0.6;
}

.add-shop-btn:disabled:hover,
.add-shop-btn.btn-disabled:hover {
  transform: none;
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
  transition: all 0.3s ease;
  position: relative;
  z-index: 1;
}

.shop-card:hover {
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.15);
  transform: translateY(-2px);
  border-left-color: #7c3aed;
  z-index: 2;
}

.shop-card.menu-open {
  z-index: 100; /* Higher than hover */
}

/* Ensure cards with open menus stay above other hovered cards */
.shop-card:has(.shop-dropdown) {
  z-index: 50;
}

.shop-card.highlighted,
.shop-card.new-shop {
  border-left-color: #22c55e;
  box-shadow: 0 4px 20px rgba(34, 197, 94, 0.3);
  transform: scale(1.02);
  animation: highlight-pulse 2s ease-in-out;
}

@keyframes highlight-pulse {
  0%, 100% {
    box-shadow: 0 4px 20px rgba(34, 197, 94, 0.3);
  }
  50% {
    box-shadow: 0 8px 30px rgba(34, 197, 94, 0.5);
  }
}

/* Smooth transition for highlighting */
.shop-card {
  transition: all 0.3s ease;
}

.shop-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  width: 100%;
}

.shop-main {
  display: flex;
  align-items: flex-start;
  flex: 1;
  min-width: 0;
}

.shop-logo {
  width: 56px;
  height: 56px;
  margin-right: 1rem;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
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
  word-wrap: break-word;
}

.shop-url {
  color: #8b5cf6;
  font-size: 0.875rem;
  margin: 0 0 0.25rem 0;
  word-break: break-word;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-block;
  border-radius: 4px;
  padding: 0.125rem 0.25rem;
  margin-left: -0.25rem;
}

.shop-url:hover {
  color: #7c3aed;
  background-color: rgba(139, 92, 246, 0.1);
  text-decoration: underline;
  transform: translateY(-1px);
}

.shop-url:active {
  transform: translateY(0);
}

/* Ensure the URL doesn't interfere with card click */
.shop-url:focus {
  outline: 2px solid #8b5cf6;
  outline-offset: 2px;
}

.shop-stats {
  color: #666;
  font-size: 0.875rem;
  margin: 0;
}

/* Update shop actions to be in top-right corner */
.shop-actions {
  display: flex;
  gap: 0.5rem;
  align-items: flex-start;
  flex-shrink: 0;
  margin-left: 1rem;
}

.action-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
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

/* Mobile responsive design */
@media (max-width: 640px) {
  .shop-card {
    padding: 1rem;
  }
  
  /* Keep the same layout on mobile - no column switch */
  .shop-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
  }
  
  .shop-main {
    display: flex;
    align-items: flex-start;
    flex: 1;
    min-width: 0;
  }

  .shop-url {
    font-size: 0.8125rem;
    padding: 0.25rem 0.375rem;
    margin-left: -0.375rem;
  }
  
  .shop-actions {
    display: flex;
    gap: 0.375rem;
    align-items: flex-start;
    flex-shrink: 0;
    margin-left: 0.75rem;
  }
  
  .action-btn {
    width: 28px;
    height: 28px;
  }
  
  .shop-menu-btn {
    width: 28px;
    height: 28px;
  }
  
  .shop-logo {
    width: 48px;
    height: 48px;
    margin-right: 0.75rem;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .shop-logo-fallback {
    width: 48px;
    height: 48px;
    font-size: 1rem;
  }
  
  .shop-name {
    font-size: 1.125rem;
  }
  
  .shop-dropdown {
    right: -0.5rem;
    min-width: 160px;
  }
  
  .dropdown-item {
    padding: 1rem;
    font-size: 1rem;
  }

  .coffee-btn {
    width: 28px;
    height: 28px;
  }
  
  .coffee-badge {
    font-size: 0.625rem;
    padding: 0.125rem 0.25rem;
    min-width: 14px;
    top: -6px;
    right: -6px;
    border-width: 1.5px;
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