<template>
  <div v-if="props.container" :data-container-id="props.container.id" class="container-card-wrapper">
    <div :class="cardClasses">
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
          <!-- View Coffees (available to all users) -->
          <button
            type="button"
            @click="viewCoffees"
            class="block w-full text-left px-3 py-2 hover:bg-gray-100 text-sm"
          >
            <Coffee class="inline-block mr-2 w-4 h-4" /> View Coffees ({{ coffeeCount }})
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
            @click.stop="isLoggedIn && !isSystemContainer ? confirmDelete() : showLoginPrompt('delete')"
            :class="[
              'block w-full text-left px-3 py-2 text-sm transition-colors duration-200',
              isLoggedIn && !isSystemContainer
                ? 'hover:bg-gray-100 text-red-600 cursor-pointer' 
                : 'text-gray-300 cursor-not-allowed bg-gray-50'
            ]"
          >
            <Trash2 
              :class="[
                'inline-block mr-2 w-4 h-4',
                isLoggedIn && !isSystemContainer ? 'text-red-600' : 'text-gray-300'
              ]" 
            /> 
            <span>Delete</span>
            <span v-if="isSystemContainer" class="text-xs text-gray-400 ml-1">(default)</span>
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
            <h3 class="text-xl font-bold text-gray-900">
              {{ container.name }}
              <span v-if="isSystemContainer" class="text-xs font-normal text-gray-500 ml-2">(default)</span>
            </h3>
            <p class="text-sm text-gray-600">
              {{ coffeeCount }} {{ coffeeCount === 1 ? 'coffee' : 'coffees' }}
            </p>
          </div>
        </div>

        <!-- Coffee count details -->
        <div class="bg-gray-50 rounded-lg p-4 border-l-4" :style="{ borderLeftColor: container.color }">
          <div class="flex items-center justify-between">
            <span class="text-sm font-medium text-gray-700">Current Status</span>
            <span 
              :class="[
                'px-2 py-1 rounded-full text-xs font-medium',
                coffeeCount > 0 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-600'
              ]"
            >
              {{ coffeeCount > 0 ? 'In Use' : 'Empty' }}
            </span>
          </div>
          <p class="text-sm text-gray-600 mt-2">
            {{ coffeeCount > 0 
              ? `Contains ${coffeeCount} coffee${coffeeCount > 1 ? 's' : ''} ready for brewing` 
              : 'No coffees assigned to this container yet' 
            }}
          </p>
        </div>

        <!-- Quick actions (if has coffees) -->
        <div v-if="coffeeCount > 0" class="flex gap-2">
          <button
            @click="viewCoffees"
            class="flex-1 bg-blue-50 text-blue-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors flex items-center justify-center gap-2"
          >
            <Coffee class="w-4 h-4" />
            View All Coffees
          </button>
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
    'relative w-full p-6 rounded-xl border-2 shadow-sm text-gray-900 space-y-4 flex flex-col h-full transition-all duration-200 hover:shadow-md'
  ]
  
  if (isEditing.value) {
    baseClasses.push('bg-blue-50 border-blue-300')
  } else {
    baseClasses.push('bg-white border-gray-200')
  }
  
  return baseClasses
})

const isSystemContainer = computed(() => {
  return ['Green', 'Grey'].includes(props.container.name)
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

// Load coffee count for this container
const loadCoffeeCount = async () => {
  try {
    const { count, error: countError } = await supabase
      .from('coffee_container_assignments')
      .select('*', { count: 'exact', head: true })
      .eq('container_id', props.container.id)
    
    if (countError) {
      throw countError
    }
    
    coffeeCount.value = count || 0
    
  } catch (err) {
    console.error('Error loading coffee count:', err)
    coffeeCount.value = 0
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
  
  if (isSystemContainer.value) {
    warning('Cannot delete', 'Default containers cannot be deleted')
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
    
    // Then delete the container (soft delete)
    const { error: deleteError } = await supabase
      .from('containers')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', props.container.id)
    
    if (deleteError) throw deleteError
    
    success('Container deleted', `${props.container.name} has been removed`)
    emit('deleted', props.container.id)
    
  } catch (err) {
    error('Delete failed', 'Please try again')
    console.error('Delete error:', err)
  }
}

const viewCoffees = () => {
  closeMenu()
  emit('view-coffees', props.container)
  info('Viewing coffees', `Showing coffees in ${props.container.name} container`)
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
  min-width: 280px;
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