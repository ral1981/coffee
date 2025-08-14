import { reactive, ref, watch, computed, onMounted } from 'vue'
import { supabase } from '../lib/supabase'
import { useToast } from './useToast'
import { useLogo } from './useLogo'

export function useCoffeeForm({
  initialData = {},
  mode = 'add',
  emit,
  onClose,
  fetchCoffees,
}) {
  const { success, error, warning, info } = useToast()
  const { getLogoUrl } = useLogo()

  // Form state
  const form = reactive({
    name: '',
    bean_url: '',
    shop_name: '',
    origin: '',
    region: '',
    altitude_meters: '',
    botanic_variety: '',
    farm_producer: '',
    processing_method: '',
    sca: '',
    flavor: '',
    recipe_ratio: '',
    recipe_in_grams: null,
    recipe_out_grams: null,
    recipe_time_seconds: '',
    recipe_temperature_c: null,
    notes: '',
    ...initialData
  })

  // Container-related state
  const availableContainers = ref([])
  const selectedContainers = ref([])
  const containerLoading = ref(false)
  const allCoffees = ref([])
  
  // Suggestions
  const shopNameOptions = ref([])
  const originOptions = ref([])

  // NEW: Container status tracking (similar to App.vue)
  const containerStatus = computed(() => {
    const status = {}
    
    // Initialize status for all containers
    availableContainers.value.forEach(container => {
      status[container.id] = null
    })
    
    // Find assigned coffees
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

  const toggleContainer = async (eventOrContainerId, containerId = null) => {
    let actualContainerId
    
    if (eventOrContainerId && typeof eventOrContainerId === 'object' && eventOrContainerId.preventDefault) {
      eventOrContainerId.preventDefault()
      actualContainerId = containerId
    } else {
      actualContainerId = eventOrContainerId
    }
    
    console.log('🔄 toggleContainer called with:', { actualContainerId, isCurrentlySelected: selectedContainers.value.includes(actualContainerId) })
    
    const isCurrentlySelected = selectedContainers.value.includes(actualContainerId)
    
    if (isCurrentlySelected) {
      selectedContainers.value = selectedContainers.value.filter(id => id !== actualContainerId)
      console.log('✅ Container removed:', actualContainerId, 'Selected:', selectedContainers.value)
      return
    }
    
    // Check for conflicts when adding a container
    const conflictingCoffee = checkContainerConflict(actualContainerId, mode === 'edit' ? initialData.id : null)
    console.log('🔍 Conflict check result:', { actualContainerId, conflictingCoffee })
    
    if (conflictingCoffee) {
      const container = availableContainers.value.find(c => c.id === actualContainerId)
      console.log('⚠️ Showing conflict dialog for:', container?.name)
      
      const confirmed = confirm(
        `⚠️ Container Conflict\n\n` +
        `The ${container?.name || 'selected container'} already contains:\n` +
        `"${conflictingCoffee.name}"\n\n` +
        `Do you want to remove "${conflictingCoffee.name}" and assign "${form.name || 'this coffee'}" to this container instead?`
      )
      
      if (!confirmed) {
        console.log('❌ Container assignment cancelled by user due to conflict')
        return // Early return prevents adding to selectedContainers
      }
      
      console.log('✅ User confirmed container conflict resolution')
      info(
        'Container Conflict Noted',
        `"${conflictingCoffee.name}" will be removed from ${container?.name || 'the container'} when you save`
      )
    }
    
    // Add container to selection
    selectedContainers.value.push(actualContainerId)
    console.log('✅ Container added:', actualContainerId, 'Final selected:', selectedContainers.value)
  }

  // Load all coffees for conflict detection
  const loadAllCoffeesForConflictCheck = async () => {
    try {
      console.log('🔄 Loading all coffees for conflict detection...')
      
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
        return
      }
      
      allCoffees.value = data || []
      console.log('✅ Loaded coffees for conflict detection:', allCoffees.value.length)
      
    } catch (err) {
      console.error('Error loading coffees for conflict detection:', err)
    }
  }

  // Load available containers
  const loadContainers = async () => {
    containerLoading.value = true
    try {
      console.log('🔄 Loading containers for form...')
      
      const { data, error: fetchError } = await supabase
        .from('containers')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true })
      
      if (fetchError) {
        console.error('Container fetch error:', fetchError)
        // Use fallback containers
        availableContainers.value = [
          {
            id: 'green',
            name: 'Green Container',
            color: '#22c55e'
          },
          {
            id: 'grey', 
            name: 'Gray Container',
            color: '#6b7280'
          }
        ]
      } else {
        availableContainers.value = data || []
      }
      
      console.log('✅ Containers loaded:', availableContainers.value.length)
      
      // Load all coffees for conflict detection
      await loadAllCoffeesForConflictCheck()
      
      // If editing, load existing container assignments
      if (mode === 'edit' && initialData.id) {
        await loadExistingContainerAssignments(initialData.id)
      }
      
    } catch (err) {
      console.error('Error loading containers:', err)
      availableContainers.value = []
    } finally {
      containerLoading.value = false
    }
  }

  // Load existing container assignments for edit mode
  const loadExistingContainerAssignments = async (coffeeId) => {
    try {
      const { data, error } = await supabase
        .from('coffee_container_assignments')
        .select('container_id')
        .eq('coffee_id', coffeeId)
      
      if (error) {
        console.error('Error loading existing assignments:', error)
        return
      }
      
      selectedContainers.value = data?.map(a => a.container_id) || []
      console.log('Loaded existing assignments:', selectedContainers.value)
      
    } catch (err) {
      console.error('Error loading existing assignments:', err)
    }
  }

  // Enhanced save with conflict resolution
  const saveContainerAssignments = async (coffeeId, userId) => {
    try {
      console.log('💾 Saving container assignments with conflict resolution:', { 
        coffeeId, 
        containers: selectedContainers.value 
      })
      
      // Handle conflicts by removing other coffees from conflicting containers
      for (const containerId of selectedContainers.value) {
        const conflictingCoffee = checkContainerConflict(containerId, coffeeId)
        
        if (conflictingCoffee) {
          console.log(`🔄 Resolving conflict: Removing "${conflictingCoffee.name}" from container ${containerId}`)
          
          // Remove the conflicting coffee from this container
          const { error: removeError } = await supabase
            .from('coffee_container_assignments')
            .delete()
            .eq('coffee_id', conflictingCoffee.id)
            .eq('container_id', containerId)
          
          if (removeError) {
            console.error('Error removing conflicting assignment:', removeError)
            // Continue anyway - will be resolved when we delete all assignments
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
      if (selectedContainers.value.length > 0) {
        const assignments = selectedContainers.value.map(containerId => ({
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
        
        console.log('✅ Container assignments saved with conflict resolution')
      }
      
      return true
    } catch (err) {
      console.error('Error saving container assignments:', err)
      return false
    }
  }

  // Fetch suggestions for autocomplete
  const fetchSuggestions = async () => {
    try {
      // Fetch shop names
      const { data: shops, error: shopErr } = await supabase
        .from('coffee_beans')
        .select('shop_name')
        .neq('shop_name', '')
      
      if (!shopErr) {
        shopNameOptions.value = Array.from(
          new Set(shops.map(r => r.shop_name).filter(Boolean))
        )
      }

      // Fetch origins
      const { data: origins, error: originErr } = await supabase
        .from('coffee_beans')
        .select('origin')
        .neq('origin', '')
      
      if (!originErr) {
        originOptions.value = Array.from(
          new Set(origins.map(r => r.origin).filter(Boolean))
        )
      }
    } catch (err) {
      console.error('Error in fetchSuggestions:', err)
    }
  }

  // Enhanced save function
  const save = async () => {
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        error('Authentication required', 'Please log in to save coffee')
        return
      }

      // Prepare coffee data
      const coffeeData = {
        name: form.name?.trim(),
        bean_url: form.bean_url?.trim() || null,
        shop_name: form.shop_name?.trim() || null,
        origin: form.origin?.trim() || null,
        region: form.region?.trim() || null,
        altitude_meters: form.altitude_meters?.trim() || null,
        botanic_variety: form.botanic_variety?.trim() || null,
        farm_producer: form.farm_producer?.trim() || null,
        processing_method: form.processing_method?.trim() || null,
        sca: form.sca?.trim() || null,
        flavor: form.flavor?.trim() || null,
        recipe_ratio: form.recipe_ratio?.trim() || null,
        recipe_in_grams: form.recipe_in_grams || null,
        recipe_out_grams: form.recipe_out_grams || null,
        recipe_time_seconds: form.recipe_time_seconds?.trim() || null,
        recipe_temperature_c: form.recipe_temperature_c || null,
        notes: form.notes?.trim() || null,
        user_id: user.id,
        updated_at: new Date().toISOString()
      }

      let coffeeId
      let isUpdate = false

      if (mode === 'edit' && initialData.id) {
        // Update existing coffee
        isUpdate = true
        coffeeId = initialData.id
        
        const { data, error: updateError } = await supabase
          .from('coffee_beans')
          .update(coffeeData)
          .eq('id', coffeeId)
          .eq('user_id', user.id)
          .select()
        
        if (updateError) {
          throw updateError
        }
        
        console.log('✅ Coffee updated successfully')
        
      } else {
        // Create new coffee
        const { data, error: insertError } = await supabase
          .from('coffee_beans')
          .insert([coffeeData])
          .select()
        
        if (insertError) {
          throw insertError
        }
        
        if (!data || data.length === 0) {
          throw new Error('No data returned from insert')
        }
        
        coffeeId = data[0].id
        console.log('✅ Coffee created successfully:', coffeeId)
      }

      // Save container assignments with conflict resolution
      const containerSuccess = await saveContainerAssignments(coffeeId, user.id)
      
      if (!containerSuccess) {
        warning('Partial save', 'Coffee saved but container assignments may have failed')
      }

      // Success handling
      if (isUpdate) {
        success('Coffee Updated', 'Your coffee entry has been updated successfully')
        emit('coffee-updated', { id: coffeeId, ...coffeeData })
      } else {
        success('Coffee Saved', 'New coffee entry has been added successfully')
        emit('coffee-saved', { id: coffeeId, ...coffeeData })
      }

      // Refresh parent data if callback provided
      if (fetchCoffees && typeof fetchCoffees === 'function') {
        await fetchCoffees()
      }

      // Close the form
      if (onClose) {
        onClose()
      }

    } catch (err) {
      console.error('Save error:', err)
      
      if (err.message.includes('duplicate key')) {
        error('Duplicate Entry', 'A coffee with this name already exists')
      } else if (err.message.includes('permission')) {
        error('Permission Denied', 'You do not have permission to save this coffee')
      } else if (err.message.includes('network')) {
        error('Network Error', 'Please check your connection and try again')
      } else {
        error('Save Failed', `Could not save coffee: ${err.message}`)
      }
    }
  }

  // Cancel function
  const cancel = () => {
    Object.assign(form, {
      name: '',
      bean_url: '',
      shop_name: '',
      origin: '',
      region: '',
      altitude_meters: '',
      botanic_variety: '',
      farm_producer: '',
      processing_method: '',
      sca: '',
      flavor: '',
      recipe_ratio: '',
      recipe_in_grams: null,
      recipe_out_grams: null,
      recipe_time_seconds: '',
      recipe_temperature_c: null,
      notes: ''
    })
    selectedContainers.value = []
    
    if (onClose) {
      onClose()
    }
    
    emit('cancel')
  }

  // Computed properties
  const isFormValid = computed(() => {
    return form.name?.trim().length > 0
  })

  const getValidationErrors = () => {
    const errors = []
    if (!form.name?.trim()) {
      errors.push('Coffee name is required')
    }
    return errors
  }

  const recipeRatio = computed(() => {
    if (form.recipe_in_grams && form.recipe_out_grams && form.recipe_in_grams > 0) {
      return (form.recipe_out_grams / form.recipe_in_grams).toFixed(1)
    }
    return null
  })

  // URL validation
  const validUrl = (url) => {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  // Derive shop logo from URL
  const deriveShopLogo = (url) => {
    if (validUrl(url)) {
      return getLogoUrl(url)
    }
    return null
  }

  // Initialize data when composable is created
  onMounted(async () => {
    console.log('🔄 Initializing coffee form with conflict detection...')
    await Promise.all([
      fetchSuggestions(),
      loadContainers()
    ])
    console.log('✅ Coffee form initialized with conflict detection')
  })

  // Return all needed properties and methods
  return {
    // Form data
    form,
    
    // Container functionality with conflict detection
    availableContainers,
    selectedContainers,
    toggleContainer,
    containerLoading,
    containerStatus,
    
    // Suggestions
    shopNameOptions,
    originOptions,
    
    // Computed
    isFormValid,
    recipeRatio,
    
    // Methods
    save,
    cancel,
    getValidationErrors,
    validUrl,
    deriveShopLogo
  }
}