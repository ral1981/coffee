import { ref, computed } from 'vue'
import { useToast } from './useToast'

export function useContainerConflict() {
  const { info, error } = useToast()
  
  // Global coffee data for conflict detection
  const allCoffees = ref([])
  const loading = ref(false)

  // Container status tracking
  const containerStatus = computed(() => {
    const status = {}
    
    // Find assigned coffees for each container
    allCoffees.value.forEach(coffee => {
      if (coffee.coffee_container_assignments) {
        coffee.coffee_container_assignments.forEach(assignment => {
          if (!status[assignment.container_id]) {
            status[assignment.container_id] = coffee
          }
        })
      }
    })
    
    return status
  })

  // Load all coffees for conflict detection
  const loadCoffeesForConflictDetection = async () => {
    if (loading.value) return false
    
    loading.value = true
    try {
      const { supabase } = await import('../lib/supabase')
      
      const { data, error: fetchError } = await supabase
        .from('coffee_beans')
        .select(`
          id,
          name,
          coffee_container_assignments (
            container_id,
            containers (
              id,
              name,
              color
            )
          )
        `)
      
      if (fetchError) {
        console.error('Error loading coffees for conflict check:', fetchError)
        return false
      }
      
      allCoffees.value = data || []
      console.log('Loaded coffees for conflict detection:', allCoffees.value.length)
      return true
      
    } catch (err) {
      console.error('Error loading coffees for conflict detection:', err)
      return false
    } finally {
      loading.value = false
    }
  }

  // Check for container conflicts
  const checkContainerConflict = (containerId, currentCoffeeId = null) => {
    const assignedCoffee = containerStatus.value[containerId]
    
    // If no coffee assigned to this container, no conflict
    if (!assignedCoffee) return null
    
    // If the assigned coffee is the current coffee being edited, no conflict
    if (currentCoffeeId && assignedCoffee.id === currentCoffeeId) return null
    
    // Return the conflicting coffee
    return assignedCoffee
  }

  // Show conflict confirmation dialog
  const showConflictDialog = (container, conflictingCoffee, newCoffeeName) => {
    return confirm(
      `⚠️ Container Conflict\n\n` +
      `"${container?.name || 'selected container'}" already has ` + `"${conflictingCoffee.name}" inside. ` +
      `Are you sure you want to add "${newCoffeeName || 'this coffee'}" instead?`
    )
  }

  // Handle container assignment with conflict detection
  const handleContainerAssignmentWithConflict = async (
    containerId,
    currentCoffeeId,
    currentCoffeeName,
    availableContainers,
    onConfirm = null
  ) => {
    // Check for conflicts
    const conflictingCoffee = checkContainerConflict(containerId, currentCoffeeId)
    
    if (conflictingCoffee) {
      const container = availableContainers.find(c => c.id === containerId)
      
      const confirmed = showConflictDialog(container, conflictingCoffee, currentCoffeeName)
      
      if (!confirmed) {
        console.log('Container assignment cancelled by user due to conflict')
        return { success: false, cancelled: true }
      }
      
      // User confirmed - show notification
      info(
        'Container Conflict Noted',
        `"${conflictingCoffee.name}" will be removed from ${container?.name || 'the container'}`
      )
      
      // Call optional confirmation callback
      if (onConfirm) {
        onConfirm(conflictingCoffee, container)
      }
    }
    
    return { success: true, cancelled: false, conflictingCoffee }
  }

  // Enhanced container assignment with conflict resolution
  const assignContainersWithConflictResolution = async (coffeeId, containerIds, userId) => {
    try {
      const { supabase } = await import('../lib/supabase')
      
      console.log('Assigning containers with conflict resolution:', { 
        coffeeId, 
        containers: containerIds 
      })
      
      // Handle conflicts by removing other coffees from conflicting containers
      for (const containerId of containerIds) {
        const conflictingCoffee = checkContainerConflict(containerId, coffeeId)
        
        if (conflictingCoffee) {
          console.log(`Resolving conflict: Removing "${conflictingCoffee.name}" from container ${containerId}`)
          
          // Remove the conflicting coffee from this container
          const { error: removeError } = await supabase
            .from('coffee_container_assignments')
            .delete()
            .eq('coffee_id', conflictingCoffee.id)
            .eq('container_id', containerId)
          
          if (removeError) {
            console.error('Error removing conflicting assignment:', removeError)
          }
        }
      }
      
      // Remove all existing assignments for this coffee
      const { error: deleteError } = await supabase
        .from('coffee_container_assignments')
        .delete()
        .eq('coffee_id', coffeeId)
      
      if (deleteError) {
        console.error('Delete assignments error:', deleteError)
        throw deleteError
      }
      
      // Add new assignments if any containers are selected
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
          console.error('Insert assignments error:', insertError)
          throw insertError
        }
        
        console.log('Container assignments saved with conflict resolution')
      }
      
      // Refresh our local coffee data
      await loadCoffeesForConflictDetection()
      
      return {
        success: true,
        data: null,
        error: null
      }
      
    } catch (err) {
      console.error('Error saving container assignments:', err)
      error('Update failed', 'Could not update container assignment')
      
      return {
        success: false,
        data: null,
        error: err.message
      }
    }
  }

  // Refresh conflict data after changes
  const refreshConflictData = async () => {
    await loadCoffeesForConflictDetection()
  }

  return {
    // Data
    allCoffees,
    containerStatus,
    loading,
    
    // Core functions
    loadCoffeesForConflictDetection,
    checkContainerConflict,
    showConflictDialog,
    handleContainerAssignmentWithConflict,
    assignContainersWithConflictResolution,
    refreshConflictData
  }
}