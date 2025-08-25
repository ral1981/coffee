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

    <!-- All Filters in a Single Collapsible Container -->
    <FiltersContainer 
      v-model:filters="filters"
      v-model:active-containers="activeContainers"
      :origins="availableOrigins"
      :shops="availableShops"
      :containers="availableContainers"
      :container-counts="containerCounts"
      :filtered-count="filteredCount"
      :show-favorites="showFavoritesOnly"
      :default-expanded="false"
      @toggle-favorites="toggleFavoritesFilter"
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

const { userId } = useAuth()

// Props
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
const { containers } = useContainers()
const { error, success, info, warning } = useToast()

// Composables
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
  updateRoute,
  showFavoritesOnly,
  toggleFavoritesFilter,
  toggleContainerFilter,
  addAllFilteredToFavorites,
  exportFavoritesData,
  clearFilters
} = useFilters(coffees)

const {
  assignContainersWithConflictResolution,
  refreshConflictData
} = useContainerConflict()

const applyContainerFilter = async (containerId) => {
  if (!containerId || !containers.value) return
  
  // Find the container object by ID
  const container = containers.value.find(c => c.id === containerId)
  if (container) {
    // Apply the container filter
    activeContainers.value = [container]
    console.log('Applied container filter:', container.name)
  }
}

// Pagination state
const itemsPerPage = ref(12)
const itemsToShow = ref(12)
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
         activeContainers.value.length > 0 ||
         showFavoritesOnly.value
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

const availableContainers = computed(() => allContainers.value)

const containerCounts = computed(() => {
  const counts = {}
  const relevantCoffees = showFavoritesOnly.value 
    ? coffees.value.filter(coffee => {
        // Add your favorites logic here
        return true // placeholder
      })
    : filteredCoffees.value
  
  relevantCoffees.forEach(coffee => {
    if (coffee.containerIds) {
      coffee.containerIds.forEach(containerId => {
        counts[containerId] = (counts[containerId] || 0) + 1
      })
    }
  })
  
  return counts
})

// Methods
const loadMoreCoffees = () => {
  console.log('📄 Loading more coffees...')
  
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
    console.log('📝 Updating coffee:', updatedCoffee.name)
    
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
  console.log('🔍 CoffeeListView debugging info:', {
    hasAssignContainersWithConflictResolution: typeof assignContainersWithConflictResolution === 'function',
    hasRefreshCoffees: typeof refreshCoffees === 'function',
    hasRefreshConflictData: typeof refreshConflictData === 'function',
    hasHighlightCoffee: typeof highlightCoffee === 'function',
    userId: userId?.value
  })
  
  try {
    console.log('📝 CoffeeListView handling container assignment:', {
      coffeeId: coffee.id,
      containerId: container.id,
      action
    })

    const { useAuth } = await import('../../composables/useAuth')
    const { userId } = useAuth()
    
    if (!userId.value) {
      console.log('❌ Container assignment requires authentication')
      info('Authentication required', 'Please log in to assign containers')
      return
    }

    // Get current container IDs from the coffee object
    const currentContainerIds = coffee.coffee_container_assignments?.map(a => a.container_id) || []
    
    console.log('📊 Current container assignments:', {
      coffeeId: coffee.id,
      currentContainerIds,
      targetContainerId: container.id
    })
    
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
    
    console.log('🎯 New container assignments:', {
      coffeeId: coffee.id,
      oldContainerIds: currentContainerIds,
      newContainerIds
    })

    // Use the existing assignContainers method with conflict resolution
    const result = await assignContainersWithConflictResolution(
      coffee.id, 
      newContainerIds, 
      userId.value
    )
    
    if (result.success) {
      console.log('✅ Container assignment successful')
      
      await refreshCoffees()
      await refreshConflictData()
      
      // Highlight the updated coffee
      highlightCoffee(coffee.id)
      
      success('Container updated', 'Coffee container assignment updated successfully')
    } else {
      console.error('❌ Failed to update container assignment:', result.error)
      error('Update failed', 'Could not update container assignment')
    }
  } catch (error) {
    console.error('❌ Container assignment error:', error)
    error('Assignment failed', 'Could not update container assignment')
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
  console.log('📄 Filters changed, resetting pagination')
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

  // Check for container query parameter and apply filter
  if (route.query.container) {
    // Wait a bit for containers to load if needed
    await nextTick()
    if (containers.value.length === 0) {
      // Wait for containers to load
      watch(containers, (newContainers) => {
        if (newContainers.length > 0) {
          applyContainerFilter(route.query.container)
        }
      }, { once: true })
    } else {
      applyContainerFilter(route.query.container)
    }
  }
})

// Refresh data when route changes
watch(() => route.query.container, (newContainerId) => {
  if (newContainerId) {
    applyContainerFilter(newContainerId)
  } else {
    // Clear container filter if no container in URL
    activeContainers.value = []
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

.clear-filters-btn:active {
  transform: translateY(0);
}

.clear-filters-btn:focus {
  outline: 2px solid var(--primary-green, #22c55e);
  outline-offset: 2px;
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
  box-shadow: 0 4px 12px rgba(34, 197, 94, 0.15);
}

.load-more-btn:active:not(:disabled) {
  transform: translateY(0);
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

/* Fade in animation for content loading */
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

/* Pulse animation for loading state */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.loading-text {
  animation: pulse 1.5s ease-in-out infinite;
}

/* Hover effects and micro-interactions */
.empty-state {
  transition: all 0.3s ease;
}

.empty-state:hover {
  box-shadow: var(--card-shadow-hover, 0 4px 12px rgba(0, 0, 0, 0.15));
}

/* Focus states for accessibility */
.coffee-list-view *:focus {
  outline: 2px solid var(--focus-color, #22c55e);
  outline-offset: 2px;
}

.coffee-list-view *:focus:not(:focus-visible) {
  outline: none;
}

/* Loading state variants */
.loading-section.small {
  padding: var(--spacing-4, 1rem);
}

.loading-section.small .spinner {
  width: 1.5rem;
  height: 1.5rem;
}

.loading-section.large {
  padding: var(--spacing-12, 3rem);
}

.loading-section.large .spinner {
  width: 3rem;
  height: 3rem;
}

/* Empty state variants */
.empty-state.compact {
  padding: var(--spacing-6, 1.5rem);
}

.empty-state.compact .empty-state-title {
  font-size: var(--text-lg, 1.125rem);
}

.empty-state.compact .empty-state-description {
  font-size: var(--text-sm, 0.875rem);
}

/* Button states and variants */
.clear-filters-btn.secondary {
  background: var(--card-background, #ffffff);
  color: var(--primary-green, #22c55e);
  border: 2px solid var(--primary-green, #22c55e);
}

.clear-filters-btn.secondary:hover {
  background: var(--primary-green, #22c55e);
  color: white;
}

.load-more-btn.loading {
  pointer-events: none;
}

.load-more-btn.loading .spinner-small {
  color: var(--primary-green, #22c55e);
}

/* Filter Container Integration Styles */
.coffee-list-view :deep(.filters-container) {
  /* Ensure the filters container integrates well with the overall layout */
  margin-bottom: 0;
}

/* Adjust spacing when filters are expanded/collapsed */
.coffee-list-view :deep(.filters-container .filters-content.expanded) {
  /* Add subtle visual enhancement when filters are expanded */
  background: linear-gradient(135deg, #fafbfc 0%, #ffffff 100%);
}

/* Enhance the filter container's visual hierarchy */
.coffee-list-view :deep(.filters-container .filters-main-header) {
  /* Subtle border enhancement for better definition */
  border-bottom: 2px solid #f0f2f5;
}

/* Style adjustments for child filter components within the container */
.coffee-list-view :deep(.filters-sections .filters-section),
.coffee-list-view :deep(.filters-sections .quick-filters-section > div) {
  /* Remove conflicting shadows and borders since they're now in a container */
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

/* Ensure proper spacing between filter sections */
.coffee-list-view :deep(.filters-sections) {
  gap: 0.875rem;
}

/* Active filter pills styling within the container */
.coffee-list-view :deep(.filter-summary) {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  margin-top: 0.5rem;
}

/* Quick actions button styling within the container */
.coffee-list-view :deep(.action-btn) {
  transition: all 0.2s ease;
}

.coffee-list-view :deep(.action-btn:hover) {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
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

  /* Filter container mobile adjustments */
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
  
  .clear-filters-btn,
  .load-more-btn {
    padding: 0.5rem 1rem;
    font-size: 0.75rem;
  }
  
  .loading-section {
    padding: var(--spacing-4, 1rem);
  }

  /* Mobile-specific filter container styling */
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

/* Extra small screens */
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
  
  .clear-filters-btn,
  .load-more-btn {
    width: 100%;
    justify-content: center;
  }

  /* Extra small screen filter adjustments */
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

  /* Large screen filter enhancements */
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
  
  .clear-filters-btn {
    background: var(--primary-green-dark, #059669);
  }
  
  .clear-filters-btn:hover {
    background: var(--primary-green-dark-hover, #047857);
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

  /* Dark mode filter container styling */
  .coffee-list-view :deep(.filters-content.expanded) {
    background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  }
  
  .coffee-list-view :deep(.filters-sections .filters-section),
  .coffee-list-view :deep(.filters-sections .quick-filters-section > div) {
    background: var(--card-background-dark, #1e293b);
    border-color: var(--border-dark, #334155);
  }
  
  .coffee-list-view :deep(.filter-summary) {
    background: var(--card-background-dark, #111827);
    border-color: var(--border-dark, #374151);
  }
}

/* High Contrast Mode */
@media (prefers-contrast: high) {
  .empty-state {
    border: 2px solid var(--text-primary, #000);
  }
  
  .clear-filters-btn,
  .load-more-btn {
    border-width: 2px;
    font-weight: 600;
  }
  
  .spinner {
    stroke-width: 3;
  }

  /* High contrast filter styling */
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
  
  .clear-filters-btn:hover,
  .load-more-btn:hover {
    transform: none;
  }
  
  .empty-state {
    transition: none;
  }
  
  * {
    transition: none !important;
  }

  /* Reduced motion for filter container */
  .coffee-list-view :deep(.filters-content) {
    transition: none !important;
  }
  
  .coffee-list-view :deep(.expand-toggle.expanded) {
    transform: none !important;
  }
  
  .coffee-list-view :deep(.action-btn:hover) {
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
  
  .clear-filters-btn,
  .load-more-btn {
    display: none;
  }

  /* Print-specific filter container styling */
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

/* Custom Properties for Theming */
:root {
  --coffee-list-gap: 1rem;
  --coffee-list-padding: 2rem;
  --coffee-list-border-radius: 12px;
  --coffee-list-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  --coffee-list-shadow-hover: 0 4px 12px rgba(0, 0, 0, 0.15);
  --coffee-list-transition: all 0.2s ease;
  --coffee-list-focus-ring: 2px solid #22c55e;
  --coffee-list-filter-gap: 0.875rem;
  --coffee-list-filter-padding: 1rem;
}

/* Component-specific focus management */
.coffee-list-view {
  --focus-ring-color: var(--primary-green, #22c55e);
  --focus-ring-offset: 2px;
  --focus-ring-width: 2px;
}

/* Enhanced button styles */
.clear-filters-btn,
.load-more-btn {
  position: relative;
  overflow: hidden;
}

.clear-filters-btn::before,
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

.clear-filters-btn:hover::before,
.load-more-btn:hover::before {
  left: 100%;
}

/* Loading shimmer effect */
@keyframes shimmer {
  0% {
    background-position: -1000px 0;
  }
  100% {
    background-position: 1000px 0;
  }
}

.loading-section.shimmer {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 1000px 100%;
  animation: shimmer 2s infinite linear;
}

/* Success and error states */
.empty-state.success {
  border-color: var(--success-color, #10b981);
}

.empty-state.success .empty-state-icon {
  color: var(--success-color, #10b981);
}

.empty-state.error {
  border-color: var(--error-color, #ef4444);
}

.empty-state.error .empty-state-icon {
  color: var(--error-color, #ef4444);
}

/* Utility classes for state management */
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

/* Filter container specific animations and transitions */
@keyframes filterExpand {
  from {
    max-height: 0;
    opacity: 0;
  }
  to {
    max-height: 800px;
    opacity: 1;
  }
}

@keyframes filterCollapse {
  from {
    max-height: 800px;
    opacity: 1;
  }
  to {
    max-height: 0;
    opacity: 0;
  }
}

/* Smooth transitions for filter state changes */
.coffee-list-view :deep(.filters-content) {
  transition: max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1), 
              opacity 0.2s ease-in-out,
              background-color 0.2s ease;
}

.coffee-list-view :deep(.expand-toggle) {
  transition: transform 0.2s ease-in-out;
}

/* Enhanced visual feedback for interactive elements */
.coffee-list-view :deep(.filters-main-header):active {
  transform: scale(0.98);
  transition: transform 0.1s ease;
}

/* Subtle glow effect for active filters */
.coffee-list-view :deep(.active-count-badge) {
  box-shadow: 0 0 8px rgba(59, 130, 246, 0.3);
  animation: pulseGlow 2s ease-in-out infinite alternate;
}

@keyframes pulseGlow {
  from {
    box-shadow: 0 0 8px rgba(59, 130, 246, 0.3);
  }
  to {
    box-shadow: 0 0 12px rgba(59, 130, 246, 0.5);
  }
}

/* Container-specific hover states */
.coffee-list-view :deep(.filters-container):hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

/* Smooth transitions for all interactive filter elements */
.coffee-list-view :deep(.filter-tag),
.coffee-list-view :deep(.action-btn),
.coffee-list-view :deep(.pill-remove) {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}
</style>