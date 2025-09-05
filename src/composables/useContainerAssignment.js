import { ref, reactive } from 'vue'
import { useToast } from './useToast'
import { useContainerConflict } from './useContainerConflict'

export function useContainerAssignment() {
  const { info, warning, success, error } = useToast()
  const {
    handleContainerAssignmentWithConflict,
    assignContainersWithConflictResolution,
    loadCoffeesForConflictDetection
  } = useContainerConflict()

  const selectedContainers = ref([])
  const containerLoadingStates = reactive({})

  const isContainerAssigned = (coffee, containerId) => {
    if (!coffee?.coffee_container_assignments) return false
    return coffee.coffee_container_assignments.some(assignment => 
      assignment.container_id === containerId
    )
  }

  const isContainerSelected = (containerId) => {
    return selectedContainers.value.includes(containerId)
  }

  const isContainerLoading = (containerId, coffeeId = null) => {
    const key = coffeeId ? `${coffeeId}-${containerId}` : containerId
    return containerLoadingStates[key] || false
  }

  const toggleContainerAssignment = async (
    containerId, 
    currentCoffeeId = null, 
    currentCoffeeName = null, 
    availableContainers = [],
    mode = 'toggle'
  ) => {
    const loadingKey = currentCoffeeId ? `${currentCoffeeId}-${containerId}` : containerId
    containerLoadingStates[loadingKey] = true

    try {
      console.log('Container assignment called:', {
        containerId,
        currentCoffeeId,
        currentCoffeeName,
        mode,
        currentlySelected: isContainerSelected(containerId)
      })

      // Load conflict detection data
      await loadCoffeesForConflictDetection()

      const isCurrentlySelected = isContainerSelected(containerId)

      // For card context with coffee ID, perform immediate database operations
      if (currentCoffeeId && (mode === 'toggle' || mode === 'assign')) {
        const { supabase } = await import('../lib/supabase')
        const { user } = await import('./useAuth')
        
        if (mode === 'remove' || isCurrentlySelected) {
          // Remove from database
          const { error: deleteError } = await supabase
            .from('coffee_container_assignments')
            .delete()
            .eq('coffee_id', currentCoffeeId)
            .eq('container_id', containerId)
          
          if (deleteError) {
            console.error('Failed to remove container assignment:', deleteError)
            return { success: false, error: deleteError.message }
          }
          
          // Update local state
          selectedContainers.value = selectedContainers.value.filter(id => id !== containerId)
          console.log('Container removed from database:', containerId)
          return { success: true, action: 'removed' }
        }

        // Handle assignment with conflict detection
        const result = await handleContainerAssignmentWithConflict(
          containerId,
          currentCoffeeId,
          currentCoffeeName,
          availableContainers
        )

        if (result.cancelled) {
          console.log('Assignment cancelled due to conflict')
          return { success: false, cancelled: true }
        }

        // Remove conflicting assignments
        const { error: conflictError } = await supabase
          .from('coffee_container_assignments')
          .delete()
          .eq('container_id', containerId)
          .neq('coffee_id', currentCoffeeId)
        
        if (conflictError) {
          console.warn('Failed to remove conflicting assignments:', conflictError)
        }

        // Add new assignment to database
        const { error: insertError } = await supabase
          .from('coffee_container_assignments')
          .insert({
            coffee_id: currentCoffeeId,
            container_id: containerId,
            assigned_by: user.value?.id
          })
        
        if (insertError) {
          console.error('Failed to add container assignment:', insertError)
          return { success: false, error: insertError.message }
        }

        // Update local state
        selectedContainers.value.push(containerId)
        console.log('Container added to database:', containerId)
        
        return { 
          success: true, 
          action: 'assigned', 
          conflictingCoffee: result.conflictingCoffee 
        }
      }

      // For form context, just update local state (will be saved when form is saved)
      if (mode === 'remove' || isCurrentlySelected) {
        selectedContainers.value = selectedContainers.value.filter(id => id !== containerId)
        console.log('Container removed from selection:', containerId)
        return { success: true, action: 'removed' }
      }

      // Add container to selection
      selectedContainers.value.push(containerId)
      console.log('Container added to selection:', containerId)
      
      return { 
        success: true, 
        action: 'assigned'
      }

    } catch (err) {
      console.error('Container assignment error:', err)
      error('Assignment Failed', 'Could not assign container')
      return { success: false, error: err.message }
    } finally {
      containerLoadingStates[loadingKey] = false
    }
  }

  const assignContainersToDatabase = async (coffeeId, containerIds, userId) => {
    try {
      await loadCoffeesForConflictDetection()
      
      const result = await assignContainersWithConflictResolution(coffeeId, containerIds, userId)
      
      if (result.success) {
        // Update local state to match database
        selectedContainers.value = [...containerIds]
        success('Containers Updated', 'Container assignments saved successfully')
      }
      
      return result
      
    } catch (err) {
      console.error('Database assignment error:', err)
      error('Save Failed', 'Could not save container assignments')
      return { success: false, error: err.message }
    }
  }

  // Reset state
  const resetContainerSelection = () => {
    selectedContainers.value = []
  }

  // Set initial state from coffee data
  const setInitialContainers = (coffee) => {
    if (!coffee?.coffee_container_assignments) {
      selectedContainers.value = []
      return
    }
    
    selectedContainers.value = coffee.coffee_container_assignments.map(
      assignment => assignment.container_id
    )
  }

  return {
    // State
    selectedContainers,
    containerLoadingStates,
    
    // Computed helpers
    isContainerAssigned,
    isContainerSelected,
    isContainerLoading,
    
    // Main methods
    toggleContainerAssignment,
    assignContainersToDatabase,
    
    // Utilities
    resetContainerSelection,
    setInitialContainers
  }
}