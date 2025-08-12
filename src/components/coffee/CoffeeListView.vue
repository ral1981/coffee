<template>
  <div class="coffee-list-view">
    <!-- Test Toast Button - Remove after testing -->
    <button @click="testToast" style="position: fixed; top: 100px; right: 20px; z-index: 1000; background: red; color: white; padding: 10px;">
      Test Toast
    </button>

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
        {{ hasActiveFilters ? 'Try adjusting your search or filters.' : 'No coffee data available.' }}
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
      :available-containers="availableContainers"
      :highlighted-coffee-id="highlightedCoffeeId"
      @card-expand="toggleCardExpansion"
      @card-action="handleCardAction"
      @container-assignment-changed="handleContainerAssignment"
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
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Coffee } from 'lucide-vue-next'
import ResultsCounter from '../filters/ResultsCounter.vue'
import SearchSection from './SearchSection.vue'
import FiltersSection from '../filters/FiltersSection.vue'
import ContainerQuickFilters from '../filters/ContainerQuickFilters.vue'
import CoffeeGrid from '../coffee/CoffeeGrid.vue'
import { useCoffeeData } from '../../composables/useCoffeeData'
import { useFilters } from '../../composables/useFilters'
import { useToast } from '../../composables/useToast'

// Props - Added highlighting support
const props = defineProps({
  highlightedCoffeeId: {
    type: [String, Number],
    default: null
  }
})

// Events
const emit = defineEmits(['edit-coffee', 'trigger-add-form'])

const route = useRoute()
const router = useRouter()
const { error, success, info, warning } = useToast()

console.log('CoffeeListView - Starting without auth dependencies')

// Composables - Enhanced with highlighting
const { 
  coffees, 
  loading, 
  loadingMore,
  expandedCards,
  toggleCardExpansion,
  fetchCoffees,
  refreshCoffees,
  assignContainers,
  fetchContainers,
  // Highlighting functionality
  highlightedCoffeeId: internalHighlightedId,
  highlightCoffee,
  clearHighlight,
  isCoffeeHighlighted
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

// FIX: Add missing pagination state
const itemsPerPage = ref(12)
const itemsToShow = ref(12) // THIS WAS MISSING!
const isLoadingMore = ref(false)

// All available containers (fetched separately)
const allContainers = ref([])

// Highlighting - combine prop and internal state
const highlightedCoffeeId = computed(() => {
  const propId = props.highlightedCoffeeId
  const internalId = internalHighlightedId.value
  const finalId = propId || internalId
  
  console.log('🎯 Computing highlightedCoffeeId:', {
    propId,
    internalId, 
    finalId
  })
  
  return finalId
})

// Load all containers (no user restriction)
const loadAllContainers = async () => {
  try {
    console.log('Loading all available containers...')
    const result = await fetchContainers() // No userId - gets all containers
    if (result.success) {
      allContainers.value = result.data || []
      console.log('Containers loaded:', allContainers.value.length)
    }
  } catch (error) {
    console.error('Failed to load containers:', error)
  }
}

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
    // Check both relationship and direct field for backwards compatibility
    const shopName = coffee.shops?.name || coffee.shop_name || coffee.shop
    if (shopName) shops.add(shopName)
  })
  return Array.from(shops).sort()
})

const availableContainers = computed(() => {
  // Use all containers from the separate fetch, not just assigned ones
  return allContainers.value.sort((a, b) => 
    (a.display_order || 0) - (b.display_order || 0)
  )
})

// Methods
const loadMoreCoffees = () => {
  console.log('🔄 Loading more coffees...')
  
  if (isLoadingMore.value) {
    console.log('⏳ Already loading, skip')
    return
  }
  
  isLoadingMore.value = true
  
  // Add 12 more items
  setTimeout(() => {
    itemsToShow.value += 12
    isLoadingMore.value = false
    console.log(`✅ Now showing ${itemsToShow.value} items`)
  }, 300)
}

const handleCardAction = async (action, coffee) => {
  console.log('🎯 CoffeeListView handleCardAction:', action, coffee)
  
  switch (action) {
    case 'edit':
      // If coffee has updates (from inline edit), handle the update
      if (coffee.name && coffee.origin && coffee.shop_name) {
        await handleUpdateCoffee(coffee)
      } else {
        // Otherwise, trigger the form (existing behavior)
        emit('edit-coffee', coffee)
      }
      break
    case 'delete':
      handleDeleteCoffee(coffee)
      break
    case 'duplicate':
      console.log('Duplicate coffee:', coffee.id)
      break
    default:
      console.log('Unknown action:', action, coffee)
  }
}

const handleUpdateCoffee = async (updatedCoffee) => {
  try {
    console.log('🔄 Updating coffee:', updatedCoffee.name)
    
    // Show loading toast
    info('Saving...', 'Updating coffee details...')
    
    // Use the existing useCoffeeData composable for updates
    const { updateCoffeeInList, highlightCoffee } = useCoffeeData()
    
    // Import what we need
    const { supabase } = await import('../../lib/supabase')
    const { useAuth } = await import('../../composables/useAuth')
    const { userId } = useAuth()
    
    if (!userId.value) {
      error('Authentication required', 'Please log in to save changes')
      return
    }

    // Prepare the update payload
    const payload = {
      name: updatedCoffee.name.trim(),
      origin: updatedCoffee.origin.trim(),
      region: updatedCoffee.region || '',
      altitude_meters: updatedCoffee.altitude_meters || '',
      botanic_variety: updatedCoffee.botanic_variety || '',
      farm_producer: updatedCoffee.farm_producer || '',
      processing_method: updatedCoffee.processing_method || '',
      sca: updatedCoffee.sca || null,
      flavor: updatedCoffee.flavor || '',
      notes: updatedCoffee.notes || '',
      recipe_in_grams: updatedCoffee.recipe_in_grams || null,
      recipe_out_grams: updatedCoffee.recipe_out_grams || null,
      recipe_time_seconds: updatedCoffee.recipe_time_seconds || '',
      recipe_temperature_c: updatedCoffee.recipe_temperature_c || null,
      updated_at: new Date().toISOString()
    }

    // Handle shop updates if shop name or URL changed
    const shopName = updatedCoffee.shop_name?.trim()
    const shopUrl = updatedCoffee.bean_url?.trim()
    
    if (shopName && shopUrl) {
      // Normalize URL
      const normalizedUrl = shopUrl.startsWith('http') ? shopUrl : `https://${shopUrl}`
      
      // Check if shop exists
      const { data: existingShop, error: shopError } = await supabase
        .from('shops')
        .select('id')
        .eq('name', shopName)
        .maybeSingle()
      
      if (shopError) {
        console.error('Shop lookup error:', shopError)
        throw new Error(`Shop lookup failed: ${shopError.message}`)
      }
      
      let shopId
      if (existingShop) {
        shopId = existingShop.id
        // Update existing shop URL if needed
        const { error: shopUpdateError } = await supabase
          .from('shops')
          .update({ 
            url: normalizedUrl,
            updated_at: new Date().toISOString()
          })
          .eq('id', shopId)
          
        if (shopUpdateError) {
          console.error('Shop update error:', shopUpdateError)
          warning('Shop update failed', 'Coffee updated but shop URL may not be current')
        }
      } else {
        // Create new shop
        const { useLogo } = await import('../../composables/useLogo')
        const { getLogoUrl } = useLogo()
        
        const { data: newShop, error: createError } = await supabase
          .from('shops')
          .insert({ 
            name: shopName, 
            url: normalizedUrl,
            logo: getLogoUrl(normalizedUrl, null, 128)
          })
          .select('id')
          .single()
        
        if (createError) {
          console.error('Shop creation error:', createError)
          throw new Error(`Shop creation failed: ${createError.message}`)
        }
        shopId = newShop.id
        info('New shop created', `Added ${shopName} to shop directory`)
      }
      
      payload.shop_id = shopId
    }

    // Update the coffee
    const { data, error: updateError } = await supabase
      .from('coffee_beans')
      .update(payload)
      .eq('id', updatedCoffee.id)
      .eq('user_id', userId.value)
      .select(`
        *,
        shops (
          id,
          name,
          url,
          logo
        )
      `)
      
    if (updateError) {
      console.error('Coffee update error:', updateError)
      throw new Error(`Update failed: ${updateError.message}`)
    }
    
    if (data && data.length > 0) {
      // Update the coffee in the global list
      updateCoffeeInList(data[0])
      highlightCoffee(data[0].id)
      
      // Success notification with details
      success(
        'Coffee updated successfully', 
        `${data[0].name} has been saved with your changes`
      )
      
      console.log('✅ Coffee updated successfully:', data[0].name)
    } else {
      warning('No changes detected', 'Coffee was not updated - no changes were made')
    }
    
  } catch (err) {
    console.error('❌ Failed to update coffee:', err)
    
    // Detailed error notification
    if (err.message.includes('authentication')) {
      error('Authentication Error', 'Please log in again to save changes')
    } else if (err.message.includes('permission')) {
      error('Permission Denied', 'You do not have permission to edit this coffee')
    } else if (err.message.includes('network')) {
      error('Network Error', 'Please check your connection and try again')
    } else {
      error('Update Failed', `Could not save changes: ${err.message}`)
    }
  }
}

const handleDeleteCoffee = async (coffee) => {
  try {
    // Import the delete function from the composable
    const { useCoffeeData } = await import('../../composables/useCoffeeData')
    const { deleteCoffee } = useCoffeeData()
    
    // Call the delete function
    await deleteCoffee(coffee.id)
    
    // The coffee will be automatically removed from the list by the composable
    console.log('Coffee deleted successfully:', coffee.name)
    
  } catch (error) {
    console.error('Failed to delete coffee:', error)
    error('Delete failed', 'Could not delete coffee entry')
  }
}

const handleContainerAssignment = async ({ coffee, container, action }) => {
  try {
    // Import auth only when needed for container assignments
    const { useAuth } = await import('../../composables/useAuth')
    const { userId } = useAuth()
    
    if (!userId.value) {
      console.log('Container assignment requires authentication')
      router.push('/login')
      return
    }

    // Get current container IDs
    const currentContainerIds = coffee.containers?.map(c => c.id) || []
    
    let newContainerIds
    if (action === 'assign') {
      // Add container if not already assigned
      newContainerIds = currentContainerIds.includes(container.id) 
        ? currentContainerIds 
        : [...currentContainerIds, container.id]
    } else {
      // Remove container
      newContainerIds = currentContainerIds.filter(id => id !== container.id)
    }
    
    // Update via the composable
    const result = await assignContainers(coffee.id, newContainerIds, userId.value)
    
    if (result.success) {
      // Refresh the coffee data to get updated container assignments
      await refreshCoffees()
      
      // Highlight the updated coffee
      highlightCoffee(coffee.id)
    } else {
      console.error('Failed to update container assignment:', result.error)
    }
  } catch (error) {
    console.error('Container assignment error:', error)
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

// Initialize data function - no auth required
const initializeData = async () => {
  console.log('initializeData called - loading all coffees')

  try {
    console.log('Fetching all coffees...')
    await fetchCoffees() // No userId parameter - fetch all coffees
    
    console.log('Loading all containers...')
    await loadAllContainers() // Load all containers
    
    console.log(`Data loaded successfully - ${coffees.value.length} coffees found`)
    
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
  } catch (error) {
    console.error('Error initializing data:', error)
  }
}

// Watch for prop changes to highlight coffee
watch(() => props.highlightedCoffeeId, (newId, oldId) => {
  if (newId && newId !== oldId) {
    // Trigger internal highlighting when prop changes
    highlightCoffee(newId)
  }
})

// Reset pagination when filters change
watch([searchQuery, filters, activeContainers], () => {
  console.log('🔄 Filters changed, resetting pagination')
  itemsToShow.value = 12
}, { deep: true })

// Sync filters with URL query parameters
watch([searchQuery, filters, activeContainers], () => {
  updateRoute()
}, { deep: true, flush: 'post' })

// Initialize data when component mounts (no auth required)
onMounted(async () => {
  console.log('CoffeeListView onMounted - loading data immediately')
  
  try {
    await initializeData()
    console.log('Data initialization completed successfully')
    
    // If there's a highlighted coffee ID prop, highlight it
    if (props.highlightedCoffeeId) {
      highlightCoffee(props.highlightedCoffeeId)
    }
  } catch (error) {
    console.error('Error in onMounted:', error)
  }
})

// Refresh data when route changes
watch(() => route.path, (newPath, oldPath) => {
  if (newPath === '/coffee' && oldPath?.startsWith('/coffee/')) {
    refreshCoffees()
  }
})

// Expose highlighting methods to parent components
defineExpose({
  highlightCoffee,
  clearHighlight,
  isCoffeeHighlighted
})

// Debug watchers
watch(coffees, (newCoffees, oldCoffees) => {
  console.log('☕ CoffeeListView - coffees array changed:', {
    oldCount: oldCoffees?.length || 0,
    newCount: newCoffees?.length || 0,
    newCoffees: newCoffees?.slice(0, 3).map(c => ({ id: c.id, name: c.name })) // Show first 3
  })
}, { immediate: true })

watch(() => props.highlightedCoffeeId, (newId, oldId) => {
  console.log('✨ CoffeeListView - highlightedCoffeeId prop changed:', {
    oldId,
    newId
  })
  
  if (newId && newId !== oldId) {
    // Trigger internal highlighting when prop changes
    highlightCoffee(newId)
  }
}, { immediate: true })

watch(internalHighlightedId, (newId, oldId) => {
  console.log('🎯 CoffeeListView - internal highlighted ID changed:', {
    oldId,
    newId
  })
}, { immediate: true })

watch(filteredCoffees, (newFiltered, oldFiltered) => {
  console.log('🔍 CoffeeListView - filtered coffees changed:', {
    oldCount: oldFiltered?.length || 0,
    newCount: newFiltered?.length || 0
  })
}, { immediate: true })

// Add test function
const testToast = () => {
  success('Test Success', 'This is a test success message')
  setTimeout(() => error('Test Error', 'This is a test error message'), 1000)
  setTimeout(() => warning('Test Warning', 'This is a test warning message'), 2000)
  setTimeout(() => info('Test Info', 'This is a test info message'), 3000)
}
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