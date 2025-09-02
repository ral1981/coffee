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

  // Shared state
  const selectedContainers = ref([])
  const containerLoadingStates = reactive({})

  // Check if container is assigned to a coffee (for data objects)
  const isContainerAssigned = (coffee, containerId) => {
    if (!coffee || !coffee.coffee_container_assignments) return false
    return coffee.coffee_container_assignments.some(assignment => 
      assignment.container_id === containerId
    )
  }

  // Check if container ID is in selected containers array
  const isContainerSelected = (containerId, selectedList = null) => {
    const list = selectedList || selectedContainers.value
    return list.some(item => {
      if (typeof item === 'object') {
        return item.id === containerId
      }
      return item === containerId
    })
  }

  // Get container loading state
  const isContainerLoading = (containerId, coffeeId = null) => {
    if (coffeeId) {
      return containerLoadingStates[`${coffeeId}-${containerId}`] || false
    }
    return containerLoadingStates[containerId] || false
  }

  // MAIN METHOD: Toggle container assignment with proper conflict detection
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

      // Load conflict detection data if not already loaded
      await loadCoffeesForConflictDetection()

      // Handle removal
      if (mode === 'remove' || isContainerSelected(containerId)) {
        selectedContainers.value = selectedContainers.value.filter(item => {
          const id = typeof item === 'object' ? item.id : item
          return id !== containerId
        })
        console.log('Container removed:', containerId)
        return { success: true, action: 'removed' }
      }

      // Handle assignment with conflict detection
      const result = await handleContainerAssignmentWithConflict(
        containerId,
        currentCoffeeId,
        currentCoffeeName,
        availableContainers
      )

      console.log('Conflict check result:', result)

      if (result.cancelled) {
        console.log('Assignment cancelled due to conflict')
        return { success: false, cancelled: true }
      }

      // Add container to selection
      selectedContainers.value.push(containerId)
      console.log('Container added:', containerId, 'Total selected:', selectedContainers.value.length)
      
      return { 
        success: true, 
        action: 'assigned', 
        conflictingCoffee: result.conflictingCoffee 
      }

    } catch (err) {
      console.error('Container assignment error:', err)
      error('Assignment Failed', 'Could not assign container')
      return { success: false, error: err.message }
    } finally {
      containerLoadingStates[loadingKey] = false
    }
  }

  // DIRECT DATABASE ASSIGNMENT: For immediate coffee-container assignments
  const assignContainerToDatabase = async (coffeeId, containerId, userId, availableContainers = []) => {
    const loadingKey = `${coffeeId}-${containerId}`
    containerLoadingStates[loadingKey] = true

    try {
      // Check for conflicts first
      await loadCoffeesForConflictDetection()
      
      const coffee = { id: coffeeId, name: 'this coffee' }
      const result = await handleContainerAssignmentWithConflict(
        containerId,
        coffeeId,
        coffee.name,
        availableContainers
      )

      if (result.cancelled) {
        return { success: false, cancelled: true }
      }

      // Perform the database assignment
      const { supabase } = await import('../lib/supabase')
      
      // Remove any existing assignment for this container (conflict resolution)
      await supabase
        .from('coffee_container_assignments')
        .delete()
        .eq('container_id', containerId)

      // Add the new assignment
      const { error: insertError } = await supabase
        .from('coffee_container_assignments')
        .insert({
          coffee_id: coffeeId,
          container_id: containerId,
          assigned_by: userId
        })

      if (insertError) throw insertError

      success('Container Assigned', 'Container assignment updated successfully')
      
      return { 
        success: true, 
        action: 'assigned',
        conflictingCoffee: result.conflictingCoffee 
      }

    } catch (err) {
      console.error('Database assignment error:', err)
      error('Assignment Failed', 'Could not update container assignment')
      return { success: false, error: err.message }
    } finally {
      containerLoadingStates[loadingKey] = false
    }
  }

  // REMOVE FROM DATABASE: Direct removal of coffee-container assignment
  const removeContainerFromDatabase = async (coffeeId, containerId) => {
    const loadingKey = `${coffeeId}-${containerId}`
    containerLoadingStates[loadingKey] = true

    try {
      const { supabase } = await import('../lib/supabase')
      
      const { error: deleteError } = await supabase
        .from('coffee_container_assignments')
        .delete()
        .eq('coffee_id', coffeeId)
        .eq('container_id', containerId)

      if (deleteError) throw deleteError

      success('Container Removed', 'Container assignment removed successfully')
      return { success: true, action: 'removed' }

    } catch (err) {
      console.error('Database removal error:', err)
      error('Removal Failed', 'Could not remove container assignment')
      return { success: false, error: err.message }
    } finally {
      containerLoadingStates[loadingKey] = false
    }
  }

  // GRID-SPECIFIC TOGGLE: For coffee card container buttons with immediate database updates
  const toggleContainerForGrid = async (coffee, container, availableContainers = []) => {
    const loadingKey = `${coffee.id}-${container.id}`
    containerLoadingStates[loadingKey] = true

    try {
      console.log('Grid container toggle:', {
        coffeeId: coffee.id,
        containerId: container.id,
        currentlyAssigned: isContainerAssigned(coffee, container.id)
      })

      // Load conflict detection data
      await loadCoffeesForConflictDetection()

      const isCurrentlyAssigned = isContainerAssigned(coffee, container.id)

      if (isCurrentlyAssigned) {
        // Remove assignment - no conflict check needed
        const result = await removeContainerFromDatabase(coffee.id, container.id)
        return { 
          success: result.success, 
          action: 'remove',
          coffee,
          container,
          error: result.error
        }
      }

      // Adding assignment - check for conflicts
      const result = await handleContainerAssignmentWithConflict(
        container.id,
        coffee.id,
        coffee.name,
        availableContainers
      )

      console.log('Grid conflict check result:', result)

      if (result.cancelled) {
        console.log('Grid assignment cancelled due to conflict')
        return { success: false, cancelled: true }
      }

      // Proceed with database assignment
      const assignResult = await assignContainerToDatabase(
        coffee.id, 
        container.id, 
        null, // userId will be handled by auth context
        availableContainers
      )

      return { 
        success: assignResult.success, 
        action: 'assign',
        coffee,
        container,
        conflictingCoffee: result.conflictingCoffee,
        error: assignResult.error
      }

    } catch (err) {
      console.error('Grid container assignment error:', err)
      return { success: false, error: err.message }
    } finally {
      containerLoadingStates[loadingKey] = false
    }
  }

  // FORM SAVE: Save all selected containers for a coffee (used by forms)
  const saveContainerAssignments = async (coffeeId, userId) => {
    try {
      console.log('Saving container assignments:', {
        coffeeId,
        selectedContainers: selectedContainers.value
      })
      
      // Convert selected containers to IDs if they're objects
      const containerIds = selectedContainers.value.map(item => 
        typeof item === 'object' ? item.id : item
      )
      
      const result = await assignContainersWithConflictResolution(
        coffeeId, 
        containerIds, 
        userId
      )
      
      if (result.success) {
        success('Containers Saved', `Container assignments updated for coffee`)
      }
      
      return result
    } catch (err) {
      console.error('Error saving container assignments:', err)
      error('Save Failed', 'Could not save container assignments')
      return { success: false, error: err.message }
    }
  }

  // BULK ASSIGNMENT: Assign multiple containers at once
  const assignMultipleContainers = async (coffeeId, containerIds, userId, availableContainers = []) => {
    try {
      const results = []
      
      for (const containerId of containerIds) {
        const result = await assignContainerToDatabase(coffeeId, containerId, userId, availableContainers)
        results.push({ containerId, ...result })
        
        // Small delay to prevent overwhelming the database
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      
      const successCount = results.filter(r => r.success).length
      const failCount = results.length - successCount
      
      if (successCount > 0 && failCount === 0) {
        success('All Containers Assigned', `Successfully assigned ${successCount} containers`)
      } else if (successCount > 0) {
        warning('Partial Success', `Assigned ${successCount} containers, ${failCount} failed`)
      } else {
        error('Assignment Failed', 'Could not assign any containers')
      }
      
      return {
        success: successCount > 0,
        results,
        successCount,
        failCount
      }
    } catch (err) {
      console.error('Bulk assignment error:', err)
      return { success: false, error: err.message }
    }
  }

  // RESET STATE: Clear all selections and loading states
  const resetContainerAssignment = () => {
    selectedContainers.value = []
    Object.keys(containerLoadingStates).forEach(key => {
      delete containerLoadingStates[key]
    })
    console.log('Container assignment state reset')
  }

  // LOAD EXISTING: Load existing assignments for edit mode
  const loadExistingAssignments = async (coffeeId) => {
    try {
      const { supabase } = await import('../lib/supabase')
      const { data, error: fetchError } = await supabase
        .from('coffee_container_assignments')
        .select(`
          container_id,
          containers (
            id,
            name,
            color
          )
        `)
        .eq('coffee_id', coffeeId)
      
      if (fetchError) {
        console.error('Error loading existing assignments:', fetchError)
        return false
      }
      
      // Store as container objects for form compatibility
      selectedContainers.value = data?.map(assignment => ({
        id: assignment.container_id,
        name: assignment.containers?.name || 'Unknown',
        color: assignment.containers?.color || '#6b7280'
      })) || []
      
      console.log('Loaded existing assignments:', selectedContainers.value.length)
      return true
    } catch (err) {
      console.error('Error loading existing assignments:', err)
      return false
    }
  }

  // GET ASSIGNED CONTAINERS: Extract assigned containers from coffee object
  const getAssignedContainers = (coffee) => {
    if (!coffee || !coffee.coffee_container_assignments) return []
    return coffee.coffee_container_assignments.map(assignment => ({
      id: assignment.container_id,
      name: assignment.containers?.name || 'Unknown Container',
      color: assignment.containers?.color || '#6b7280'
    }))
  }

  // CONTAINER COUNTS: Get count of coffees per container
  const getContainerCounts = (coffees, containers) => {
    const counts = {}
    
    containers.forEach(container => {
      counts[container.id] = 0
    })
    
    coffees.forEach(coffee => {
      if (coffee.coffee_container_assignments) {
        coffee.coffee_container_assignments.forEach(assignment => {
          if (counts[assignment.container_id] !== undefined) {
            counts[assignment.container_id]++
          }
        })
      }
    })
    
    return counts
  }

  // VALIDATION: Check if assignments are valid
  const validateAssignments = (assignments) => {
    if (!Array.isArray(assignments)) return false
    return assignments.every(assignment => 
      assignment && (typeof assignment === 'string' || assignment.id)
    )
  }

  return {
    // State
    selectedContainers,
    containerLoadingStates,
    
    // Core Methods
    isContainerAssigned,
    isContainerSelected,
    isContainerLoading,
    toggleContainerAssignment,
    
    // Database Operations
    assignContainerToDatabase,
    removeContainerFromDatabase,
    toggleContainerForGrid,
    saveContainerAssignments,
    assignMultipleContainers,
    
    // State Management
    resetContainerAssignment,
    loadExistingAssignments,
    
    // Utility Methods
    getAssignedContainers,
    getContainerCounts,
    validateAssignments
  }
}