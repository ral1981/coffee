import { ref, reactive } from 'vue'
import { useToast } from './useToast'
import { useContainerConflict } from './useContainerConflict'

export function useContainerAssignment() {
  const { info, warning } = useToast()
  const {
    handleContainerAssignmentWithConflict,
    assignContainersWithConflictResolution,
    loadCoffeesForConflictDetection
  } = useContainerConflict()

  // Shared state
  const selectedContainers = ref([])
  const containerLoadingStates = reactive({})

  // Check if container is assigned to a coffee
  const isContainerAssigned = (coffee, containerId) => {
    if (!coffee.coffee_container_assignments) return false
    return coffee.coffee_container_assignments.some(assignment => 
      assignment.container_id === containerId
    )
  }

  // FIXED: Toggle container assignment with proper conflict detection
  const toggleContainerAssignment = async (
    containerId, 
    currentCoffeeId, 
    currentCoffeeName, 
    availableContainers,
    mode = 'toggle'
  ) => {
    const loadingKey = currentCoffeeId ? `${currentCoffeeId}-${containerId}` : containerId
    containerLoadingStates[loadingKey] = true

    try {
      console.log('🔄 toggleContainerAssignment called:', {
        containerId,
        currentCoffeeId,
        currentCoffeeName,
        mode,
        currentlySelected: selectedContainers.value.includes(containerId)
      })

      // Load conflict detection data if not already loaded
      await loadCoffeesForConflictDetection()

      if (mode === 'remove' || selectedContainers.value.includes(containerId)) {
        // Remove container
        selectedContainers.value = selectedContainers.value.filter(id => id !== containerId)
        console.log('✅ Container removed:', containerId)
        return { success: true, action: 'removed' }
      }

      // Use shared conflict detection - FIXED: await the result
      const result = await handleContainerAssignmentWithConflict(
        containerId,
        currentCoffeeId,
        currentCoffeeName,
        availableContainers
      )

      console.log('🔍 Conflict check result:', result)

      if (result.cancelled) {
        console.log('❌ Assignment cancelled due to conflict')
        return { success: false, cancelled: true }
      }

      // Add container to selection
      selectedContainers.value.push(containerId)
      console.log('✅ Container added:', containerId, 'Selected:', selectedContainers.value)
      return { 
        success: true, 
        action: 'assigned', 
        conflictingCoffee: result.conflictingCoffee 
      }

    } catch (error) {
      console.error('❌ Container assignment error:', error)
      return { success: false, error: error.message }
    } finally {
      containerLoadingStates[loadingKey] = false
    }
  }

  // FIXED: Grid-specific toggle for direct container buttons
  const toggleContainerForGrid = async (coffee, container, availableContainers) => {
    const loadingKey = `${coffee.id}-${container.id}`
    containerLoadingStates[loadingKey] = true

    try {
      console.log('🔄 toggleContainerForGrid called:', {
        coffeeId: coffee.id,
        containerId: container.id,
        currentlyAssigned: isContainerAssigned(coffee, container.id)
      })

      // Load conflict detection data
      await loadCoffeesForConflictDetection()

      const isCurrentlyAssigned = isContainerAssigned(coffee, container.id)

      if (isCurrentlyAssigned) {
        // Remove assignment - no conflict check needed
        console.log('🗑️ Removing container assignment')
        return { 
          success: true, 
          action: 'remove',
          coffee,
          container 
        }
      }

      // Adding assignment - check for conflicts
      const result = await handleContainerAssignmentWithConflict(
        container.id,
        coffee.id,
        coffee.name,
        availableContainers
      )

      console.log('🔍 Grid conflict check result:', result)

      if (result.cancelled) {
        console.log('❌ Grid assignment cancelled due to conflict')
        return { success: false, cancelled: true }
      }

      // Proceed with assignment
      console.log('✅ Proceeding with container assignment')
      return { 
        success: true, 
        action: 'assign',
        coffee,
        container,
        conflictingCoffee: result.conflictingCoffee 
      }

    } catch (error) {
      console.error('❌ Grid container assignment error:', error)
      return { success: false, error: error.message }
    } finally {
      containerLoadingStates[loadingKey] = false
    }
  }

  // Save container assignments (for forms)
  const saveContainerAssignments = async (coffeeId, userId) => {
    try {
      console.log('💾 Saving container assignments:', {
        coffeeId,
        selectedContainers: selectedContainers.value
      })
      
      const result = await assignContainersWithConflictResolution(
        coffeeId, 
        selectedContainers.value, 
        userId
      )
      return result
    } catch (error) {
      console.error('Error saving container assignments:', error)
      return { success: false, error: error.message }
    }
  }

  // Reset state
  const resetContainerAssignment = () => {
    selectedContainers.value = []
    Object.keys(containerLoadingStates).forEach(key => {
      delete containerLoadingStates[key]
    })
  }

  // Load existing assignments (for edit mode)
  const loadExistingAssignments = async (coffeeId) => {
    try {
      const { supabase } = await import('../lib/supabase')
      const { data, error } = await supabase
        .from('coffee_container_assignments')
        .select('container_id')
        .eq('coffee_id', coffeeId)
      
      if (error) {
        console.error('Error loading existing assignments:', error)
        return false
      }
      
      selectedContainers.value = data?.map(a => a.container_id) || []
      console.log('📝 Loaded existing assignments:', selectedContainers.value)
      return true
    } catch (err) {
      console.error('Error loading existing assignments:', err)
      return false
    }
  }

  return {
    // State
    selectedContainers,
    containerLoadingStates,
    
    // Methods
    isContainerAssigned,
    toggleContainerAssignment,
    toggleContainerForGrid, // NEW: Grid-specific method
    saveContainerAssignments,
    resetContainerAssignment,
    loadExistingAssignments
  }
}