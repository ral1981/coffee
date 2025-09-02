import { ref, computed } from 'vue'
import { supabase } from '../lib/supabase'
import { useToast } from './useToast'

// GLOBAL STATE - shared across all components that use this composable
const coffees = ref([])
const containers = ref([])
const loading = ref(false)
const highlightedCoffeeId = ref(null)
const expandedCards = ref(new Set())

// Only initialize once
let isInitialized = false

export function useCoffeeData() {
  const { success, error, info } = useToast()
  
  const fetchCoffees = async () => {
    loading.value = true
    try {
      console.log('🔄 Fetching coffees with container assignments...')
      
      const { data, error: fetchError } = await supabase
        .from('coffee_beans')
        .select(`
          *,
          shops (
            id,
            name,
            url,
            logo
          ),
          coffee_container_assignments (
            container_id,
            containers (
              id,
              name,
              color
            )
          )
        `)
        .order('created_at', { ascending: false })
      
      if (fetchError) {
        throw fetchError
      }
      
      // Update the global state with properly mapped data
      coffees.value = (data || []).map(coffee => ({
        ...coffee,
        // Add convenience properties for easier access
        containerIds: coffee.coffee_container_assignments?.map(a => a.container_id) || [],
        containers: coffee.coffee_container_assignments?.map(a => a.containers).filter(Boolean) || []
      }))
      
      console.log(`✅ Fetched ${coffees.value.length} coffees with container data`)
      
      // Debug: Log first coffee's container assignments
      if (coffees.value.length > 0) {
        console.log('First coffee container data:', {
          name: coffees.value[0].name,
          assignments: coffees.value[0].coffee_container_assignments,
          containerIds: coffees.value[0].containerIds,
          containers: coffees.value[0].containers
        })
      }
      
    } catch (err) {
      console.error('❌ Error fetching coffees:', err)
      error('Failed to load data', 'Could not refresh coffee list')
      coffees.value = []
    } finally {
      loading.value = false
    }
  }

  // DELETE COFFEE - Added missing method
  const deleteCoffee = async (coffeeId) => {
    try {
      console.log('🗑️ Deleting coffee:', coffeeId)
      
      const { error: deleteError } = await supabase
        .from('coffee_beans')
        .delete()
        .eq('id', coffeeId)
      
      if (deleteError) {
        throw deleteError
      }
      
      // Remove from local state immediately
      const originalLength = coffees.value.length
      coffees.value = coffees.value.filter(coffee => coffee.id !== coffeeId)
      
      console.log(`✅ Coffee deleted. Removed ${originalLength - coffees.value.length} coffee(s) from local state`)
      
      return {
        success: true,
        data: null,
        error: null
      }
      
    } catch (err) {
      console.error('❌ Error deleting coffee:', err)
      error('Delete failed', 'Could not delete coffee entry')
      
      return {
        success: false,
        data: null,
        error: err.message
      }
    }
  }

  // AssignContainers
  const assignContainers = async (coffeeId, containerIds, userId) => {
    try {
      console.log('🔄 Assigning containers:', { coffeeId, containerIds, userId })
      
      // First, remove all existing assignments for this coffee
      const { error: deleteError } = await supabase
        .from('coffee_container_assignments')
        .delete()
        .eq('coffee_id', coffeeId)
      
      if (deleteError) {
        console.error('Delete error:', deleteError)
        throw deleteError
      }
      
      // Then add new assignments if any containers are selected
      if (containerIds.length > 0) {
        const assignments = containerIds.map(containerId => ({
          coffee_id: coffeeId,
          container_id: containerId,
          assigned_by: userId
        }))
        
        const { error: insertError } = await supabase
          .from('coffee_container_assignments')
          .insert(assignments)
        
        if (insertError) {
          console.error('Insert error:', insertError)
          throw insertError
        }
      }
      
      success('Container updated', 'Coffee container assignment updated successfully')
      
      return {
        success: true,
        data: null,
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

  // FilteredCoffees
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

    // Container filtering logic
    if (activeContainers.value.length > 0) {
      filtered = filtered.filter(coffee => {
        // Check if coffee has container assignments
        if (!coffee.coffee_container_assignments || !Array.isArray(coffee.coffee_container_assignments)) {
          return false
        }
        
        // Check if any of the active containers match the coffee's assignments
        return activeContainers.value.some(activeContainer => {
          return coffee.coffee_container_assignments.some(assignment => {
            const assignmentContainerId = assignment.container_id || assignment.containers?.id
            return assignmentContainerId === activeContainer.id
          })
        })
      })
    }

    return filtered
  })

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
      }
    ]
  }

  // Add other missing methods...
  const refreshCoffees = async () => {
    await fetchCoffees()
  }

  const addCoffeeToList = (newCoffee) => {
    console.log('➕ Adding coffee to global list:', newCoffee.name)
    
    const existingIndex = coffees.value.findIndex(coffee => coffee.id === newCoffee.id)
    if (existingIndex !== -1) {
      // Update existing coffee
      coffees.value[existingIndex] = {
        ...newCoffee,
        // Ensure container data is properly formatted
        containerIds: newCoffee.coffee_container_assignments?.map(a => a.container_id) || [],
        containers: newCoffee.coffee_container_assignments?.map(a => a.containers).filter(Boolean) || []
      }
      console.log('✅ Updated existing coffee in list')
    } else {
      // Add new coffee to the beginning
      coffees.value.unshift({
        ...newCoffee,
        // Ensure container data is properly formatted
        containerIds: newCoffee.coffee_container_assignments?.map(a => a.container_id) || [],
        containers: newCoffee.coffee_container_assignments?.map(a => a.containers).filter(Boolean) || []
      })
      console.log('✅ Added new coffee to list, total:', coffees.value.length)
    }
  }

  const removeCoffeeFromList = (coffeeId) => {
    const originalLength = coffees.value.length
    coffees.value = coffees.value.filter(coffee => coffee.id !== coffeeId)
    const removed = originalLength - coffees.value.length
    console.log(`🗑️ Removed ${removed} coffee(s) from list`)
    return removed > 0
  }

  const highlightCoffee = (coffeeId) => {
    console.log('✨ Highlighting coffee:', coffeeId)
    highlightedCoffeeId.value = coffeeId
    
    // Auto-clear highlight after 5 seconds
    setTimeout(() => {
      if (highlightedCoffeeId.value === coffeeId) {
        highlightedCoffeeId.value = null
        console.log('🧹 Auto-cleared coffee highlight')
      }
    }, 5000)
  }

  const clearHighlight = () => {
    highlightedCoffeeId.value = null
  }

  const toggleCardExpansion = (coffeeId) => {
    if (expandedCards.value.has(coffeeId)) {
      expandedCards.value.delete(coffeeId)
      console.log('📉 Collapsed card:', coffeeId)
    } else {
      expandedCards.value.add(coffeeId)
      console.log('📈 Expanded card:', coffeeId)
    }
  }

  const expandAllCards = () => {
    coffees.value.forEach(coffee => {
      expandedCards.value.add(coffee.id)
    })
    console.log('📈 Expanded all cards')
  }

  const collapseAllCards = () => {
    expandedCards.value.clear()
    console.log('📉 Collapsed all cards')
  }

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
    // GLOBAL Data
    coffees,
    containers,
    filteredCoffees,
    loading,
    highlightedCoffeeId,
    expandedCards,
    
    // Actions
    fetchCoffees,
    fetchContainers,
    assignContainers,
    deleteCoffee, // Added missing method
    refreshCoffees,
    addCoffeeToList,
    removeCoffeeFromList, // Added missing method
    
    // Card expansion
    toggleCardExpansion,
    expandAllCards, // Added missing method
    collapseAllCards, // Added missing method
    
    // Highlighting
    highlightCoffee,
    clearHighlight,
    
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