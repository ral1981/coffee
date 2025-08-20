<template>
  <div class="shops-card-grid">
    <div
      v-for="shop in shops"
      :key="shop.id"
      class="shop-card"
      :class="{ 
        'highlighted': isHighlighted(shop.id),
        'new-shop': isNewlyAdded(shop.id),
        'menu-open': activeMenuId === shop.id
      }"
      @click="handleCardClick(shop)"
    >
      <!-- Header with logo, name, and actions -->
      <div class="shop-header">
        <div class="shop-main">
          <!-- Shop logo -->
          <div class="shop-logo">
            <LogoImage
              :url="shop.url"
              :custom-logo="shop.logo"
              :size="56"
              :alt="`${shop.name} logo`"
              class-name="rounded-lg"
              fallback-class="shop-logo-fallback"
              :fallback-text="getInitials(shop.name)"
            />
          </div>
          
          <!-- Shop info -->
          <div class="shop-info">
            <h3 class="shop-name">{{ shop.name }}</h3>
            <a 
              v-if="shop.url"
              :href="getFullUrl(shop.url)" 
              target="_blank" 
              rel="noopener noreferrer"
              class="shop-url"
              @click.stop
            >
              {{ getDomain(shop.url) }}
            </a>
            <div class="shop-stats">
              {{ getCoffeeCount(shop.id) }} coffee{{ getCoffeeCount(shop.id) === 1 ? '' : 's' }}
            </div>
          </div>
        </div>
        
        <!-- Actions -->
        <div class="shop-actions">
          <button
            @click.stop="handleViewCoffees(shop)"
            class="action-btn coffee-btn"
            :class="getCoffeeCount(shop.id) > 0 ? 'primary' : 'outline'"
            :title="getCoffeeCount(shop.id) > 0 
              ? `View ${getCoffeeCount(shop.id)} coffee${getCoffeeCount(shop.id) === 1 ? '' : 's'} from ${shop.name}`
              : `No coffees from ${shop.name}`"
          >
            <Coffee :size="16" />
            <span 
              class="coffee-badge"
              :class="getCoffeeCount(shop.id) > 0 ? 'badge-green' : 'badge-red'"
            >
              {{ getCoffeeCount(shop.id) }}
            </span>
          </button>
          
          <!-- Three dots menu -->
          <div class="menu-container">
            <button 
              type="button"
              class="action-btn shop-menu-btn secondary"
              @click.stop="toggleMenu(shop.id)"
              :class="{ active: activeMenuId === shop.id }"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="5" r="2" fill="currentColor"/>
                <circle cx="12" cy="12" r="2" fill="currentColor"/>
                <circle cx="12" cy="19" r="2" fill="currentColor"/>
              </svg>
            </button>
            
            <!-- Dropdown menu -->
            <div v-if="activeMenuId === shop.id" class="shop-dropdown">
              <button 
                type="button" 
                class="dropdown-item"
                @click="handleViewCoffees(shop)"
              >
                <Coffee :size="16" />
                View Coffees ({{ getCoffeeCount(shop.id) }})
                <span v-if="getCoffeeCount(shop.id) === 0" class="menu-disabled-hint">None available</span>
              </button>
              
              <button 
                type="button" 
                class="dropdown-item"
                @click="handleEditShop(shop)"
              >
                <Edit :size="16" />
                Edit Shop
              </button>
              
              <button 
                type="button" 
                class="dropdown-item dropdown-item-danger"
                @click="handleDeleteShop(shop)"
              >
                <Trash2 :size="16" />
                Delete Shop
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { Coffee, Edit, Trash2 } from 'lucide-vue-next'
import LogoImage from '../shared/LogoImage.vue'
import { useCoffeeData } from '../../composables/useCoffeeData'
import { useToast } from '../../composables/useToast'

// Props
const props = defineProps({
  shops: {
    type: Array,
    required: true,
    default: () => []
  },
  highlightedShopId: {
    type: [String, Number],
    default: null
  }
})

// Events
const emit = defineEmits(['edit-shop', 'view-coffees'])

const router = useRouter()
const { coffees, fetchCoffees } = useCoffeeData()
const { success, warning, info } = useToast()

// Local state
const activeMenuId = ref(null)

// Computed properties
const shopCoffeeCounts = computed(() => {
  const counts = {}
  
  if (!props.shops || !coffees.value) return counts
  
  // Initialize all shops with 0 count
  props.shops.forEach(shop => {
    counts[shop.id] = 0
  })
  
  // Count coffees for each shop
  if (Array.isArray(coffees.value)) {
    coffees.value.forEach(coffee => {
      if (coffee.shops && coffee.shops.id) {
        const shopId = coffee.shops.id
        if (counts.hasOwnProperty(shopId)) {
          counts[shopId]++
        }
      } else if (coffee.shop_id) {
        // Alternative shop relationship structure
        if (counts.hasOwnProperty(coffee.shop_id)) {
          counts[coffee.shop_id]++
        }
      }
    })
  }
  
  return counts
})

// Methods
const getCoffeeCount = (shopId) => {
  return shopCoffeeCounts.value[shopId] || 0
}

const isHighlighted = (shopId) => {
  return props.highlightedShopId && 
         String(props.highlightedShopId) === String(shopId)
}

const isNewlyAdded = (shopId) => {
  // This could be enhanced with a prop or composable for newly added items
  return false
}

const getInitials = (name) => {
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .join('')
    .substring(0, 2)
}

const getDomain = (url) => {
  try {
    const fullUrl = url.startsWith('http') ? url : `https://${url}`
    return new URL(fullUrl).hostname.replace('www.', '')
  } catch {
    return url
  }
}

const getFullUrl = (url) => {
  return url.startsWith('http') ? url : `https://${url}`
}

const toggleMenu = (shopId) => {
  activeMenuId.value = activeMenuId.value === shopId ? null : shopId
}

const closeMenu = () => {
  activeMenuId.value = null
}

const handleCardClick = (shop) => {
  if (activeMenuId.value === shop.id) {
    closeMenu()
  } else {
    handleViewCoffees(shop)
  }
}

const handleViewCoffees = (shop) => {
  console.log('View coffees for shop:', shop.name)
  closeMenu()
  
  const coffeeCount = getCoffeeCount(shop.id)
  
  if (coffeeCount === 0) {
    info('No Coffees', `There are no coffees associated with ${shop.name}`)
    return
  }
  
  // Navigate to coffee view with shop filter
  router.push({
    path: '/coffee',
    query: { shop: shop.name }
  })
  
  emit('view-coffees', shop)
}

const handleEditShop = (shop) => {
  console.log('Edit shop:', shop)
  closeMenu()
  emit('edit-shop', shop)
}

const handleDeleteShop = async (shop) => {
  const coffeeCount = getCoffeeCount(shop.id)
  
  if (coffeeCount > 0) {
    const confirmMessage = `"${shop.name}" has ${coffeeCount} coffee${coffeeCount === 1 ? '' : 's'} associated with it. Deleting this shop will remove these associations. Are you sure you want to continue?`
    if (!confirm(confirmMessage)) return
  } else {
    if (!confirm(`Are you sure you want to delete "${shop.name}"?`)) return
  }

  try {
    // This would need to be implemented with actual delete logic
    warning('Delete Feature', 'Delete functionality coming soon!')
    closeMenu()
  } catch (error) {
    console.error('Error deleting shop:', error)
    warning('Delete Error', 'Could not delete shop')
  }
}

const handleClickOutside = (event) => {
  if (!event.target.closest('.menu-container')) {
    closeMenu()
  }
}

// Lifecycle
onMounted(async () => {
  document.addEventListener('click', handleClickOutside)
  
  // Fetch coffee data to determine shop coffee counts
  try {
    if (!coffees.value || coffees.value.length === 0) {
      await fetchCoffees()
    }
  } catch (error) {
    console.error('Error fetching coffee data:', error)
  }
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.shops-card-grid {
  display: grid;
  gap: 1rem;
  overflow: visible;
}

@media (min-width: 768px) {
  .shops-card-grid {
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
  z-index: 100;
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

.shop-url:focus {
  outline: 2px solid #8b5cf6;
  outline-offset: 2px;
}

.shop-stats {
  color: #666;
  font-size: 0.875rem;
  margin: 0;
}

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
  position: relative;
}

.action-btn:focus {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

.action-btn.primary {
  background: #8b5cf6;
  color: white;
}

.action-btn.primary:hover {
  background: #7c3aed;
  transform: scale(1.05);
}

.action-btn.primary:focus {
  outline-color: #8b5cf6;
}

.action-btn.secondary {
  background: #f3f4f6;
  color: #374151;
}

.action-btn.secondary:hover {
  background: #e5e7eb;
  transform: scale(1.05);
}

.action-btn.outline {
  background: transparent;
  border: 2px solid #8b5cf6;
  color: #8b5cf6;
}

.action-btn.outline:hover {
  background: rgba(139, 92, 246, 0.1);
  transform: scale(1.05);
}

.coffee-badge {
  position: absolute;
  top: -8px;
  right: -8px;
  background: transparent;
  border: 2px solid;
  border-radius: 10px;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.125rem 0.375rem;
  min-width: 18px;
  text-align: center;
  border: 2px solid white;
  line-height: 1;
  pointer-events: none;
}

.coffee-badge.badge-green {
  border-color: #22c55e;
  color: #22c55e;
}

.coffee-badge.badge-red {
  border-color: #ef4444;
  color: #ef4444;
}

/* Menu */
.menu-container {
  position: relative;
}

.menu-disabled-hint {
  margin-left: auto;
  font-size: 0.75rem;
  color: #9ca3af;
}

.shop-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border: 1px solid #e5e7eb;
  min-width: 180px;
  z-index: 10;
  overflow: hidden;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 1rem;
  border: none;
  background: none;
  font-size: 0.875rem;
  color: #374151;
  cursor: pointer;
  transition: background-color 0.2s;
  text-align: left;
}

.dropdown-item:hover:not(:disabled) {
  background: #f9fafb;
}

.dropdown-item:focus {
  background: #f3f4f6;
  outline: none;
}

.dropdown-item:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.dropdown-item-danger {
  color: #ef4444;
}

.dropdown-item-danger:hover:not(:disabled) {
  background: #fef2f2;
  color: #dc2626;
}

.dropdown-item-danger:focus {
  background: #fef2f2;
  color: #dc2626;
}

/* Mobile responsive design */
@media (max-width: 640px) {
  .shop-card {
    padding: 1rem;
  }
  
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
  
  .shop-logo {
    width: 48px;
    height: 48px;
    margin-right: 0.75rem;
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
    padding: 0.75rem;
    font-size: 0.8125rem;
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
  .shop-card:hover,
  .action-btn:hover {
    transform: none;
  }
  
  .shop-card.highlighted,
  .shop-card.new-shop {
    animation: none;
    transform: none;
  }
  
  .shop-url:hover {
    transform: none;
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .shop-card {
    border: 2px solid #000;
  }
  
  .action-btn.primary {
    background: #000;
    color: #fff;
  }
  
  .action-btn.secondary {
    background: #fff;
    color: #000;
    border: 2px solid #000;
  }
  
  .coffee-badge {
    background: #000;
    color: #fff;
    border-color: #fff;
  }
  
  .shop-dropdown {
    border: 2px solid #000;
  }
}

/* Print styles */
@media print {
  .shop-card {
    break-inside: avoid;
    box-shadow: none;
    border: 1px solid #ccc;
  }
  
  .shop-actions,
  .shop-dropdown {
    display: none;
  }
  
  .shop-url {
    text-decoration: underline;
    color: #000;
  }
}

/* Dark mode support (if implemented) */
@media (prefers-color-scheme: dark) {
  .shop-card {
    background: #1f2937;
    color: #f9fafb;
    border-left-color: #a855f7;
  }
  
  .shop-name {
    color: #f9fafb;
  }
  
  .shop-stats {
    color: #9ca3af;
  }
  
  .action-btn.secondary {
    background: #374151;
    color: #f9fafb;
  }
  
  .action-btn.secondary:hover {
    background: #4b5563;
  }
  
  .shop-dropdown {
    background: #1f2937;
    border-color: #374151;
  }
  
  .dropdown-item {
    color: #f9fafb;
  }
  
  .dropdown-item:hover:not(:disabled) {
    background: #374151;
  }
  
  .dropdown-item:focus {
    background: #374151;
  }
}

/* Loading states */
.shop-card.loading {
  opacity: 0.7;
  pointer-events: none;
}

.shop-card.loading .shop-logo {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

/* Error states */
.shop-card.error {
  border-left-color: #ef4444;
  background-color: #fef2f2;
}

.shop-card.error .shop-name {
  color: #dc2626;
}

/* Success states */
.shop-card.success {
  border-left-color: #22c55e;
  background-color: #f0fdf4;
}
</style>