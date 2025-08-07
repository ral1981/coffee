<template>
  <div class="bg-purple-50 rounded-md p-4 md:p-3 border-l-4 border-purple-300">
    <h4 class="uppercase text-base font-semibold text-purple-700 mb-3">
      Container{{ containers.length !== 1 ? 's' : '' }}
    </h4>
    
    <div v-if="isLoading" class="text-center py-4">
      <div class="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
      <span class="ml-2 text-sm text-gray-600">Loading containers...</span>
    </div>
    
    <div v-else-if="containers.length === 0" class="text-center py-4 text-gray-500">
      <p class="text-sm">No containers available</p>
      <p class="text-xs mt-1">
        {{ props.mode === 'card' && !isLoggedIn ? 'Log in to see your containers' : 'Create containers to organize your coffee' }}
      </p>
    </div>
    
    <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
      <div v-for="container in containers" :key="container.id" class="container-option">
        <button
          @click="handleContainerClick(container)"
          :class="[
            'container-button',
            { 
              'assigned': isContainerAssigned(container.id),
              'clickable': isLoggedIn || mode === 'form',
              'disabled': !isLoggedIn && mode === 'card'
            }
          ]"
          :style="{
            '--container-color': container.color,
            '--container-color-light': `${container.color}40`,
            '--container-color-dark': `${container.color}80`
          }"
        >
          <div class="container-circle" :style="{ backgroundColor: `${container.color}20`, borderColor: container.color }">
            <div class="container-icon" :style="{ backgroundColor: container.color }">
              <img src="../assets/icons/bean_01.svg" alt="bean icon" class="bean-icon" />
            </div>
          </div>
        </button>
        <span class="container-label" :style="{ color: container.color }">
          {{ container.name }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { supabase } from '../lib/supabase'
import { useToast } from '../composables/useToast'

const props = defineProps({
  // For CoffeeCard mode
  coffee: Object,
  isLoggedIn: { type: Boolean, default: true },
  
  // For CoffeeForm mode  
  form: Object,
  
  // Mode: 'card' or 'form'
  mode: { 
    type: String, 
    default: 'card',
    validator: value => ['card', 'form'].includes(value)
  }
})

const emit = defineEmits(['update-container', 'form-container-change'])

// Use toast system - only import what we need
const { success, warning, info } = useToast()

// Local state for containers and assignments
const containers = ref([])
const coffeeAssignments = ref([])
const isLoading = ref(false)

// Load all active containers for the current user
const loadContainers = async () => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (!user && props.mode === 'card') return

    let query = supabase
      .from('containers')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true })

    if (user) {
      query = query.in('user_id', [user.id, 'system'])
    } else {
      query = query.eq('user_id', 'system')
    }

    const { data, error } = await query
    if (error) throw error

    containers.value = data || []
  } catch (err) {
    console.error('Error loading containers:', err)
    containers.value = []
  }
}

// Load container assignments for the current coffee
const loadCoffeeAssignments = async () => {
  if (!props.coffee?.id) return

  try {
    const { data, error } = await supabase
      .from('coffee_container_assignments')
      .select('container_id')
      .eq('coffee_id', props.coffee.id)

    if (error) throw error

    coffeeAssignments.value = (data || []).map(a => a.container_id)
  } catch (err) {
    console.error('Error loading coffee assignments:', err)
    coffeeAssignments.value = []
  }
}

// Check if container is assigned to the coffee
const isContainerAssigned = (containerId) => {
  if (props.mode === 'form') {
    // For form mode, check form state
    return props.form?.containerAssignments?.includes(containerId) || false
  }
  return coffeeAssignments.value.includes(containerId)
}

// Get current coffee name for display
const currentCoffeeName = computed(() => {
  if (props.mode === 'form') {
    return props.form?.name || 'This coffee'
  }
  return props.coffee?.name || 'Coffee'
})

// Unified container click handler
const handleContainerClick = (container) => {
  if (props.mode === 'card') {
    handleCardMode(container)
  } else {
    handleFormMode(container)
  }
}

// Handle container operations in card mode
const handleCardMode = async (container) => {
  if (!props.isLoggedIn) {
    warning('🔒 Please log in first', 'Login required to assign containers')
    return
  }

  const isAssigned = isContainerAssigned(container.id)
  
  if (isAssigned) {
    await removeFromContainer(container)
  } else {
    await addToContainer(container)
  }
}

// Handle container operations in form mode
const handleFormMode = (container) => {
  // For form mode - you'll need to implement form state management
  // This is a placeholder for now
  const isAssigned = false // Get from form state
  
  if (isAssigned) {
    handleRemoveFromContainer(container.name, () => {
      // Remove from form state
      emit('form-container-change', { containerId: container.id, assign: false })
    })
  } else {
    handleAddToContainer(container.name, null, () => {
      // Add to form state
      emit('form-container-change', { containerId: container.id, assign: true })
    })
  }
}

// Add coffee to container (database operation)
const addToContainer = async (container) => {
  if (!props.coffee?.id) return

  isLoading.value = true
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) throw new Error('User not authenticated')

    // Check if assignment already exists
    const { data: existing } = await supabase
      .from('coffee_container_assignments')
      .select('id')
      .eq('coffee_id', props.coffee.id)
      .eq('container_id', container.id)
      .maybeSingle()

    if (existing) {
      warning('Already assigned', `${props.coffee.name} is already in ${container.name} container`)
      return
    }

    // Insert new assignment
    const { error: insertError } = await supabase
      .from('coffee_container_assignments')
      .insert({
        coffee_id: props.coffee.id,
        container_id: container.id,
        assigned_by: user.id
      })

    if (insertError) throw insertError

    // Reload assignments
    await loadCoffeeAssignments()

    success(
      `${container.name} container assigned`,
      `${props.coffee.name} added to ${container.name} container`
    )

    emit('update-container', { 
      coffee: props.coffee, 
      container: container, 
      assign: true 
    })

  } catch (err) {
    console.error('Error adding to container:', err)
    warning('Assignment failed', `Could not add to ${container.name} container`)
  } finally {
    isLoading.value = false
  }
}

// Remove coffee from container (database operation)
const removeFromContainer = async (container) => {
  if (!props.coffee?.id) return

  const confirmed = confirm(`Remove "${props.coffee.name}" from ${container.name} container?`)
  if (!confirmed) return

  isLoading.value = true
  try {
    const { error } = await supabase
      .from('coffee_container_assignments')
      .delete()
      .eq('coffee_id', props.coffee.id)
      .eq('container_id', container.id)

    if (error) throw error

    // Reload assignments
    await loadCoffeeAssignments()

    success(
      `${container.name} container cleared`,
      `${props.coffee.name} removed from ${container.name} container`
    )

    emit('update-container', { 
      coffee: props.coffee, 
      container: container, 
      assign: false 
    })

  } catch (err) {
    console.error('Error removing from container:', err)
    warning('Removal failed', `Could not remove from ${container.name} container`)
  } finally {
    isLoading.value = false
  }
}

// Load data when component mounts
onMounted(async () => {
  await loadContainers()
  if (props.mode === 'card') {
    await loadCoffeeAssignments()
  }
})
</script>

<style scoped>
/* Container Section Styles */
.container-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.container-button {
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  opacity: 1;
}

.container-button.clickable {
  cursor: pointer;
}

.container-button.assigned {
  transform: scale(1.05);
  border-radius: 50%;
}

.container-button.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.container-circle {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: all 0.3s ease;
  border: 2px solid;
  position: relative;
  padding: 4px;
}

.container-icon {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
}

/* Active (assigned) state with glow effect */
.container-button.assigned .container-circle {
  box-shadow: 
    0 0 0 2px var(--container-color),
    0 0 15px var(--container-color-light),
    0 0 25px var(--container-color-light);
}

/* Icon color matching for active state */
.container-button.assigned .bean-icon {
  filter: brightness(1.5) sepia(0.3) saturate(0.8);
}

.bean-icon {
  width: 20px;
  height: 20px;
  filter: brightness(0.7);
  transition: filter 0.3s ease;
}

.container-label {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  text-align: center;
  line-height: 1.2;
}

.container-button:hover:not(.disabled) .container-circle {
  transform: scale(1.05);
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
}

/* Loading animation */
@keyframes spin {
  to { transform: rotate(360deg); }
}

.animate-spin {
  animation: spin 1s linear infinite;
}
</style>