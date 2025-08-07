<template>
  <div v-if="props.container" :data-container-id="props.container.id" class="container-card-wrapper">
    <div :class="cardClasses" class="container-card-base">
      <!-- Three dots menu - positioned at card level -->
      <div class="absolute top-2 right-2 flex flex-col items-center space-y-1 flex-shrink-0">
        <button
          ref="menuButton"
          type="button"
          @click.stop="toggleMenu"
          class="p-1 text-gray-600 hover:text-black"
        >
          <EllipsisVertical class="w-6 h-6"/>
        </button>
      </div>
      
      <!-- Edit mode card -->
      <div v-if="isEditing" class="space-y-4" @click.stop>
        <!-- Edit mode icon -->
        <div class="absolute top-2 left-2">
          <Pencil class="w-5 h-5 text-blue-500" />
        </div>

        <div class="pt-8 space-y-4">
          <!-- Container name input -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Container Name *
            </label>
            <input
              v-model="form.name"
              type="text"
              placeholder="Container name"
              required
              :class="{ 'border-red-500': !form.name.trim() }"
              class="input w-full"
              @click.stop
            />
          </div>
          
          <!-- Color picker -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Container Color *
            </label>
            <div class="flex items-center gap-3">
              <input
                v-model="form.color"
                type="color"
                :class="{ 'border-red-500': !isValidHexColor(form.color) }"
                class="w-12 h-12 rounded border-2 border-gray-300 cursor-pointer"
                @click.stop
              />
              <input
                v-model="form.color"
                type="text"
                placeholder="#10b981"
                pattern="^#[0-9A-Fa-f]{6}$"
                :class="{ 'border-red-500': !isValidHexColor(form.color) }"
                class="input flex-1"
                @click.stop
              />
            </div>
          </div>

          <!-- Preview -->
          <div class="bg-gray-50 rounded-lg p-3 border">
            <p class="text-sm font-medium text-gray-700 mb-2">Preview:</p>
            <div 
              class="h-8 w-full rounded border-l-4 bg-white flex items-center px-3"
              :style="{ 
                borderLeftColor: form.color,
                backgroundColor: `${form.color}15` 
              }"
            >
              <span class="text-sm font-medium">{{ form.name || 'Container Name' }}</span>
            </div>
          </div>

          <!-- Save/Cancel buttons -->
          <SaveCancelButtons
            :disabled="!isFormValid"
            @save="save"
            @cancel="cancel"
          />
        </div>
      </div>

      <!-- Normal view -->
      <div v-else class="space-y-4">
        <!-- Three dots menu dropdown -->
        <div
          v-if="showMenu"
          ref="menuPanel"
          class="absolute top-8 right-2 w-40 bg-white border border-gray-200 rounded shadow-md overflow-hidden z-20"
        >
          <!-- View Coffee (available to all users) -->
          <button
            type="button"
            @click="viewCoffees"
            class="block w-full text-left px-3 py-2 hover:bg-gray-100 text-sm"
          >
            <Coffee class="inline-block mr-2 w-4 h-4" />View Coffee
          </button>

          <!-- Edit (disabled for guests) -->
          <button
            type="button"
            @click="isLoggedIn ? enterEditMode() : showLoginPrompt('edit')"
            :class="[
              'block w-full text-left px-3 py-2 text-sm transition-colors duration-200',
              isLoggedIn 
                ? 'hover:bg-gray-100 text-gray-900 cursor-pointer' 
                : 'text-gray-400 cursor-not-allowed bg-gray-50'
            ]"
          >
            <Pencil 
              :class="[
                'inline-block mr-2 w-4 h-4',
                isLoggedIn ? 'text-gray-600' : 'text-gray-300'
              ]" 
            /> 
            <span>Edit</span>
          </button>

          <!-- Delete (disabled for guests or system containers) -->
          <button
            type="button"
            @click.stop="isLoggedIn ? confirmDelete() : showLoginPrompt('delete')"
            :class="[
              'block w-full text-left px-3 py-2 text-sm transition-colors duration-200',
              isLoggedIn 
                ? 'hover:bg-gray-100 text-red-600 cursor-pointer' 
                : 'text-gray-300 cursor-not-allowed bg-gray-50'
            ]"
          >
            <Trash2 
              :class="[
                'inline-block mr-2 w-4 h-4',
                isLoggedIn ? 'text-red-600' : 'text-gray-300'
              ]" 
            /> 
            <span>Delete</span>
          </button>
        </div>

        <!-- Container Header -->
        <div class="flex items-center space-x-4">
          <!-- Color circle -->
          <div 
            class="w-16 h-16 rounded-full border-4 border-white shadow-lg flex items-center justify-center"
            :style="{ backgroundColor: container.color }"
          >
            <Package class="w-8 h-8 text-white" />
          </div>
          
          <!-- Container info -->
          <div class="flex-1">
            <h3 class="text-xl font-bold text-gray-900 leading-tight break-words">
              {{ container.name }}
            </h3>
          </div>
        </div>

        <!-- Coffee details -->
        <div class="bg-gray-50 rounded-lg p-4 border-l-4 flex-grow" :style="{ borderLeftColor: container.color }">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm font-medium text-gray-700">Current Status</span>
            <span 
              :class="[
                'px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap',
                coffeeCount > 0 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-600'
              ]"
            >
              {{ coffeeCount > 0 ? 'In Use' : 'Empty' }}
            </span>
          </div>
          <p class="text-sm text-gray-600 leading-snug break-words hyphens-auto">
            {{ getStatusText() }}
          </p>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { supabase } from '../lib/supabase'
import { useToast } from '../composables/useToast'
import { EllipsisVertical, Pencil, Trash2, Coffee, Package } from 'lucide-vue-next'
import SaveCancelButtons from './SaveCancelButtons.vue'
import { useSharedMenuState } from '../composables/useSharedMenuState'

// Toast composable
const { success, error, warning, info } = useToast()

// Props & Emits
const props = defineProps({
  container: { 
    type: Object, 
    required: true, 
    default: () => ({}) 
  },
  isLoggedIn: Boolean,
  fetchContainers: {
    type: Function,
    default: null
  }
})

const emit = defineEmits([
  'deleted',
  'container-updated',
  'view-coffees'
])

// Local UI state
const isEditing = ref(false)
const menuButton = ref(null)
const menuPanel = ref(null)
const coffeeCount = ref(0)
const coffeeNames = ref([])

// Form state for editing
const form = ref({
  name: '',
  color: '#10b981'
})

// Shared menu state
const { isOpen: showMenu, toggleMenu: toggleMenuState, closeMenu } = useSharedMenuState(`container-${props.container.id}`)

// Computed properties
const cardClasses = computed(() => {
  const baseClasses = [
    'relative p-6 rounded-xl border-2 shadow-sm text-gray-900 flex flex-col transition-all duration-200 hover:shadow-md container-card-base'
  ]
  
  if (isEditing.value) {
    baseClasses.push('bg-blue-50 border-blue-300')
  } else {
    baseClasses.push('bg-white border-gray-200')
  }
  
  return baseClasses
})

const isFormValid = computed(() => {
  return form.value.name.trim().length > 0 && isValidHexColor(form.value.color)
})

// Helper functions
const isValidHexColor = (color) => {
  return /^#[0-9A-Fa-f]{6}$/.test(color)
}

const toggleMenu = () => {
  toggleMenuState()
}

// Load coffee count and name for this container
const loadCoffeeCount = async () => {
  try {
    const { data, error: countError } = await supabase
      .from('coffee_container_assignments')
      .select(`
        container_id,
        coffee_beans!inner(
          id,
          name
        )
      `)
      .eq('container_id', props.container.id)
    
    if (countError) {
      throw countError
    }
    
    coffeeCount.value = data?.length || 0
    coffeeNames.value = data?.map(item => item.coffee_beans.name) || []
    
  } catch (err) {
    console.error('Error loading coffee count:', err)
    coffeeCount.value = 0
    coffeeNames.value = []
  }
}

const getStatusText = () => {
  if (coffeeCount.value === 0) {
    return 'No coffees assigned to this container yet'
  } else if (coffeeCount.value === 1) {
    return `Contains: ${coffeeNames.value[0] || 'coffee'}`
  } else {
    // For multiple coffees, show first one and count
    const firstName = coffeeNames.value[0] || 'coffee'
    return `Contains: ${firstName} and ${coffeeCount.value - 1} other${coffeeCount.value - 1 > 1 ? 's' : ''}`
  }
}

// Edit mode functions
const enterEditMode = () => {
  if (!props.isLoggedIn) {
    showLoginPrompt('edit')
    return
  }
  
  isEditing.value = true
  closeMenu()
  
  // Initialize form with current container data
  form.value = {
    name: props.container.name,
    color: props.container.color
  }
}

const save = async () => {
  if (!isFormValid.value) {
    error('Validation failed', 'Please check all required fields')
    return
  }

  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError) throw new Error('Authentication error: ' + userError.message)
    if (!user) {
      warning('Authentication required', 'Please log in to save changes')
      return
    }

    info('Saving...', 'Updating container')

    const { data, error: updateError } = await supabase
      .from('containers')
      .update({
        name: form.value.name.trim(),
        color: form.value.color,
        updated_at: new Date().toISOString()
      })
      .eq('id', props.container.id)
      .select()
      .single()

    if (updateError) throw updateError

    success('Container updated!', `${data.name} has been updated successfully`)
    
    emit('container-updated', data)
    isEditing.value = false
    
    if (props.fetchContainers) {
      await props.fetchContainers()
    }
    
  } catch (err) {
    console.error('Error updating container:', err)
    error('Update failed', `Could not update container: ${err.message}`)
  }
}

const cancel = () => {
  const hasChanges = form.value.name !== props.container.name || 
                     form.value.color !== props.container.color

  if (hasChanges) {
    if (!confirm('Discard all changes?')) {
      return
    }
    warning('Changes discarded', 'Container edit cancelled')
  } else {
    info('Edit cancelled', 'No changes were made')
  }
  
  isEditing.value = false
}

// Delete function
const confirmDelete = async () => {
  if (!props.isLoggedIn) {
    showLoginPrompt('delete')
    return
  }
  
  closeMenu()
  
  const confirmMessage = coffeeCount.value > 0 
    ? `Delete "${props.container.name}"?\n\nThis container has ${coffeeCount.value} coffee${coffeeCount.value > 1 ? 's' : ''} assigned. They will be unassigned but not deleted.`
    : `Delete "${props.container.name}"?`
    
  if (!confirm(confirmMessage)) return
  
  try {
    // First, remove all coffee assignments
    if (coffeeCount.value > 0) {
      const { error: assignmentError } = await supabase
        .from('coffee_container_assignments')
        .delete()
        .eq('container_id', props.container.id)
      
      if (assignmentError) throw assignmentError
    }
    
    // Then delete the container (hard delete)
    const { error: deleteError } = await supabase
      .from('containers')
      .delete()
      .eq('id', props.container.id)
    
    if (deleteError) throw deleteError
    
    success('Container deleted', `${props.container.name} has been removed`)
    emit('deleted', props.container.id)
    
  } catch (err) {
    error('Delete failed', `Failed to delete ${props.container.name}: ${err.message}`)
    console.error('Delete error:', err)
  }
}

const viewCoffees = () => {
  closeMenu()
  
  // Pass the container with coffee count
  const containerWithCount = {
    ...props.container,
    coffeeCount: coffeeCount.value
  }
  
  emit('view-coffees', containerWithCount)
}

const showLoginPrompt = (action) => {
  const actionText = action === 'edit' ? 'edit this container' : 'delete this container'
  warning('🔒 Please log in first', `Login required to ${actionText}`)
  closeMenu()
}

const onClickOutside = (e) => {
  if (
    showMenu.value &&
    menuButton.value && !menuButton.value.contains(e.target) &&
    menuPanel.value && !menuPanel.value.contains(e.target)
  ) {
    closeMenu()
  }
}

// Lifecycle hooks
onMounted(() => {
  document.addEventListener('click', onClickOutside)
  loadCoffeeCount()
})

onBeforeUnmount(() => {
  document.removeEventListener('click', onClickOutside)
})
</script>

<style scoped>
.input {
  @apply w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500;
}

.container-card-wrapper {
  width: 100%;
  max-width: 320px; /* Ensure consistent card width */
}

.container-card-base {
  width: 100%;
  min-height: 240px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* Color picker styling */
input[type="color"] {
  -webkit-appearance: none;
  border: none;
  cursor: pointer;
}

input[type="color"]::-webkit-color-swatch-wrapper {
  padding: 0;
}

input[type="color"]::-webkit-color-swatch {
  border: none;
  border-radius: 6px;
}
</style>