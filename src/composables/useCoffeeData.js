import { ref, computed } from 'vue'
import { supabase } from '../lib/supabase'
import { useToast } from './useToast'

// GLOBAL STATE - shared across all components that use this composable
const coffees = ref([])
const containers = ref([])
const loading = ref(false)
const highlightedCoffeeId = ref(null)
const expandedCards = ref(new Set()) // Add this to global state

// Only initialize once
let isInitialized = false

export function useCoffeeData() {
  const { success, error, info } = useToast()
  
  const fetchCoffees = async () => {
    loading.value = true
    try {
      console.log('🔄 Fetching coffees from database...')
      
      const { data, error: fetchError } = await supabase
        .from('coffee_beans')
        .select(`
          *,
          shops (
            id,
            name,
            url,
            logo
          )
        `)
        .order('created_at', { ascending: false })
      
      if (fetchError) {
        throw fetchError
      }
      
      // Update the global state
      coffees.value = data || []
      console.log(`✅ Fetched ${coffees.value.length} coffees - updating global state`)
      
    } catch (err) {
      console.error('❌ Error fetching coffees:', err)
      error('Failed to load data', 'Could not refresh coffee list')
      coffees.value = []
    } finally {
      loading.value = false
    }
  }

  // Enhanced add coffee to list - check for duplicates
  const addCoffeeToList = (newCoffee) => {
    console.log('➕ Adding coffee to GLOBAL list:', newCoffee.name, 'ID:', newCoffee.id)
    
    // Remove any existing coffee with the same ID (in case of duplicate)
    const existingIndex = coffees.value.findIndex(coffee => coffee.id === newCoffee.id)
    if (existingIndex !== -1) {
      console.log('🔄 Replacing existing coffee in GLOBAL list')
      coffees.value[existingIndex] = newCoffee
    } else {
      // Add to beginning of list (most recent first)
      coffees.value.unshift(newCoffee)
    }
    
    console.log(`📊 Total coffees in GLOBAL list: ${coffees.value.length}`)
    
    // Force reactivity update
    coffees.value = [...coffees.value]
    
    // Debug: log first few coffees to verify
    console.log('🔍 First 3 coffees in list:', coffees.value.slice(0, 3).map(c => ({ id: c.id, name: c.name })))
  }

  // Enhanced update coffee in list
  const updateCoffeeInList = (updatedCoffee) => {
    console.log('🔄 Updating coffee in GLOBAL list:', updatedCoffee.name)
    
    const index = coffees.value.findIndex(coffee => coffee.id === updatedCoffee.id)
    if (index !== -1) {
      coffees.value[index] = updatedCoffee
      // Force reactivity
      coffees.value = [...coffees.value]
      console.log('✅ Coffee updated in GLOBAL list')
    } else {
      console.warn('⚠️ Coffee not found in GLOBAL list for update, adding it')
      addCoffeeToList(updatedCoffee)
    }
  }

  // Remove coffee from list
  const removeCoffeeFromList = (coffeeId) => {
    const index = coffees.value.findIndex(coffee => coffee.id === coffeeId)
    if (index !== -1) {
      const removedCoffee = coffees.value.splice(index, 1)[0]
      console.log('🗑️ Removed coffee from GLOBAL list:', removedCoffee.name)
      // Force reactivity
      coffees.value = [...coffees.value]
    }
  }

  // Enhanced highlighting functionality
  const highlightCoffee = (coffeeId) => {
    console.log('✨ Highlighting coffee in GLOBAL state:', coffeeId)
    highlightedCoffeeId.value = coffeeId
    
    // Auto-clear highlight after 3 seconds
    setTimeout(() => {
      if (highlightedCoffeeId.value === coffeeId) {
        console.log('🔄 Auto-clearing highlight for:', coffeeId)
        highlightedCoffeeId.value = null
      }
    }, 3000)
  }

  // Clear highlight manually
  const clearHighlight = () => {
    console.log('🧹 Clearing highlight manually')
    highlightedCoffeeId.value = null
  }

  // Check if a coffee is highlighted
  const isCoffeeHighlighted = (coffeeId) => {
    return highlightedCoffeeId.value === coffeeId
  }

  // Enhanced refresh function
  const refreshCoffees = async () => {
    console.log('🔄 Refreshing GLOBAL coffee data...')
    await fetchCoffees()
  }

  // Card expansion functionality
  const toggleCardExpansion = (coffeeId) => {
    console.log('🔄 Toggling card expansion for:', coffeeId)
    
    if (expandedCards.value.has(coffeeId)) {
      expandedCards.value.delete(coffeeId)
      console.log('📝 Card collapsed:', coffeeId)
    } else {
      expandedCards.value.add(coffeeId)
      console.log('📖 Card expanded:', coffeeId)
    }
    
    // Force reactivity for Set changes
    expandedCards.value = new Set(expandedCards.value)
    
    console.log('📊 Currently expanded cards:', Array.from(expandedCards.value))
  }

  // Check if a card is expanded
  const isCardExpanded = (coffeeId) => {
    return expandedCards.value.has(coffeeId)
  }

  // Collapse all cards
  const collapseAllCards = () => {
    console.log('📝 Collapsing all cards')
    expandedCards.value.clear()
    expandedCards.value = new Set()
  }

  // Force refresh with loading indicator
  const forceRefreshCoffees = async () => {
    console.log('🔄 Force refreshing GLOBAL coffee data...')
    loading.value = true
    try {
      await fetchCoffees()
      info('Data refreshed', 'Coffee list has been updated')
    } catch (err) {
      error('Refresh failed', 'Could not refresh coffee list')
    }
  }

  // Delete coffee
  const deleteCoffee = async (coffeeId) => {
    try {
      const { error: deleteError } = await supabase
        .from('coffee_beans')
        .delete()
        .eq('id', coffeeId)

      if (deleteError) {
        throw deleteError
      }

      // Remove from GLOBAL list
      removeCoffeeFromList(coffeeId)
      
      success('Coffee deleted', 'Coffee has been removed from your collection')

    } catch (err) {
      console.error('Error deleting coffee:', err)
      error('Delete failed', 'Could not delete coffee')
    }
  }

  // Existing container functions...
  const fetchContainers = async () => {
    try {
      console.log('Fetching containers from database...')
      
      const { data, error: fetchError } = await supabase
        .from('containers')
        .select('*')
        .order('display_order', { ascending: true })
      
      if (fetchError) {
        console.warn('Database fetch failed, using fallback:', fetchError.message)
        return {
          success: false,
          error: fetchError.message,
          data: getFallbackContainers()
        }
      }
      
      console.log('Containers fetched from database:', data)
      containers.value = data || []
      
      return {
        success: true,
        data: data || [],
        error: null
      }
      
    } catch (err) {
      console.error('Error fetching containers:', err)
      console.log('Using fallback container data')
      
      return {
        success: false,
        error: err.message,
        data: getFallbackContainers()
      }
    }
  }

  const getFallbackContainers = () => {
    return [
      {
        id: 'green',
        name: 'Green Container',
        color: '#22c55e',
        display_order: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'grey',
        name: 'Gray Container', 
        color: '#6b7280',
        display_order: 2,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'blue',
        name: 'Blue Container',
        color: '#3b82f6', 
        display_order: 3,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ]
  }

  const assignContainers = async (coffeeId, containerIds, userId) => {
    try {
      console.log('Assigning containers:', { coffeeId, containerIds, userId })
      
      const updates = {
        in_green_container: containerIds.includes('green') || containerIds.includes(1),
        in_grey_container: containerIds.includes('grey') || containerIds.includes(2),
        updated_at: new Date().toISOString()
      }
      
      const { data, error: updateError } = await supabase
        .from('coffee_beans')
        .update(updates)
        .eq('id', coffeeId)
        .eq('user_id', userId)
        .select()
      
      if (updateError) {
        throw updateError
      }
      
      success('Container updated', 'Coffee container assignment updated successfully')
      
      return {
        success: true,
        data: data,
        error: null
      }
      
    } catch (err) {
      console.error('Error assigning containers:', err)
      error('Update failed', 'Could not update container assignment')
      
      return {
        success: false,
        data: null,
        error: err.message
      }
    }
  }

  // Search and filter functionality
  const searchQuery = ref('')
  const selectedOrigin = ref('')
  const selectedShop = ref('')
  const activeContainers = ref([])

  const filteredCoffees = computed(() => {
    let filtered = coffees.value

    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase()
      filtered = filtered.filter(coffee =>
        coffee.name?.toLowerCase().includes(query) ||
        coffee.origin?.toLowerCase().includes(query) ||
        coffee.shops?.name?.toLowerCase().includes(query) ||
        coffee.flavor?.toLowerCase().includes(query)
      )
    }

    if (selectedOrigin.value) {
      filtered = filtered.filter(coffee => 
        coffee.origin === selectedOrigin.value
      )
    }

    if (selectedShop.value) {
      filtered = filtered.filter(coffee => 
        coffee.shops?.name === selectedShop.value
      )
    }

    if (activeContainers.value.length > 0) {
      filtered = filtered.filter(coffee => {
        return activeContainers.value.some(container => {
          switch (container.id) {
            case 'green':
            case 1:
              return coffee.in_green_container
            case 'grey':
            case 2:
              return coffee.in_grey_container
            default:
              return false
          }
        })
      })
    }

    return filtered
  })

  const availableOrigins = computed(() => {
    const origins = coffees.value
      .map(coffee => coffee.origin)
      .filter(Boolean)
    return [...new Set(origins)].sort()
  })

  const availableShops = computed(() => {
    const shops = coffees.value
      .map(coffee => coffee.shops?.name)
      .filter(Boolean)
    return [...new Set(shops)].sort()
  })

  const clearAllFilters = () => {
    searchQuery.value = ''
    selectedOrigin.value = ''
    selectedShop.value = ''
    activeContainers.value = []
  }

  const totalCoffees = computed(() => coffees.value.length)
  const filteredCount = computed(() => filteredCoffees.value.length)

  // Mark as initialized
  if (!isInitialized) {
    isInitialized = true
    console.log('🚀 useCoffeeData initialized with GLOBAL state')
  }

  return {
    // GLOBAL Data - same references across all components
    coffees,
    containers,
    filteredCoffees,
    loading,
    highlightedCoffeeId,
    expandedCards, // Add this
    
    // Actions
    fetchCoffees,
    fetchContainers,
    assignContainers,
    refreshCoffees,
    forceRefreshCoffees,
    addCoffeeToList,
    updateCoffeeInList,
    removeCoffeeFromList,
    deleteCoffee,
    
    // Card expansion
    toggleCardExpansion, // Add this
    isCardExpanded, // Add this
    collapseAllCards, // Add this
    
    // Highlighting
    highlightCoffee,
    clearHighlight,
    isCoffeeHighlighted,
    
    // Filtering
    searchQuery,
    selectedOrigin,
    selectedShop,
    activeContainers,
    availableOrigins,
    availableShops,
    clearAllFilters,
    
    // Stats
    totalCoffees,
    filteredCount,
    
    // Utilities
    getFallbackContainers
  }
}