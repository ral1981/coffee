<template>
  <div class="relative m-4 p-4 rounded-xl border-2 border-dashed border-purple-300 bg-purple-50 text-gray-900 space-y-4 flex flex-col h-full">
    
    <!-- Top-right close button -->
    <button
      @click="cancel"
      class="absolute top-4 right-4 p-2 text-red-600 hover:text-red-800 dark:text-red-300 dark:hover:text-white"
      title="Close"
    >
      <CircleX class="w-6 h-6" />
    </button>

    <!-- Header with icon -->
    <div class="flex items-center gap-3 mb-4">
      <div class="p-2 bg-purple-100 rounded-lg">
        <Package class="w-8 h-8 text-purple-600" />
      </div>
      <div>
        <h2 class="text-2xl font-bold text-gray-900">Add New Container</h2>
        <p class="text-gray-600">Create a custom container to organize your coffee collection</p>
      </div>
    </div>

    <div class="space-y-6">
      <!-- Container Information -->
      <div class="bg-purple-50 rounded-md p-4 border-l-4 border-purple-300">
        <h4 class="uppercase text-base font-semibold text-purple-700 mb-4">
          Container Details
        </h4>
        
        <div class="space-y-4">
          <!-- Container Name -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Container Name *
            </label>
            <input
              v-model="form.name"
              type="text"
              placeholder="Enter container name (e.g., Blue, Premium, Daily Brew)"
              required
              :class="{ 'border-red-500': !form.name.trim() }"
              class="input w-full"
              maxlength="50"
            />
            <p class="text-xs text-gray-500 mt-1">Choose a memorable name for your container</p>
          </div>
          
          <!-- Color Selection -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Container Color *
            </label>
            <div class="space-y-3">
              <!-- Color picker and hex input -->
              <div class="flex items-center gap-4">
                <input
                  v-model="form.color"
                  type="color"
                  :class="{ 'border-red-500': !isValidHexColor(form.color) }"
                  class="w-16 h-16 rounded-lg border-2 border-gray-300 cursor-pointer shadow-sm"
                />
                <div class="flex-1">
                  <input
                    v-model="form.color"
                    type="text"
                    placeholder="#10b981"
                    pattern="^#[0-9A-Fa-f]{6}$"
                    :class="{ 'border-red-500': !isValidHexColor(form.color) }"
                    class="input w-full font-mono"
                  />
                  <p class="text-xs text-gray-500 mt-1">Enter a hex color code or use the color picker</p>
                </div>
              </div>
              
              <!-- Preset colors -->
              <div>
                <p class="text-sm text-gray-600 mb-2">Or choose a preset color:</p>
                <div class="flex flex-wrap gap-2">
                  <button
                    v-for="preset in presetColors"
                    :key="preset.color"
                    @click="form.color = preset.color"
                    type="button"
                    class="w-10 h-10 rounded-lg border-2 border-gray-300 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                    :style="{ backgroundColor: preset.color }"
                    :title="preset.name"
                    :class="{ 'ring-2 ring-purple-500': form.color === preset.color }"
                  ></button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Preview Section -->
      <div class="bg-white rounded-lg p-4 border border-gray-200">
        <h4 class="text-sm font-medium text-gray-700 mb-3">Preview</h4>
        
        <!-- Coffee card preview -->
        <div class="space-y-3">
          <p class="text-xs text-gray-500">Coffee card highlight:</p>
          <div 
            class="h-12 w-full rounded-lg border-l-4 flex items-center px-4 shadow-sm transition-all"
            :style="{ 
              borderLeftColor: form.color,
              backgroundColor: `${form.color}15` 
            }"
          >
            <div class="flex items-center gap-3">
              <div 
                class="w-3 h-3 rounded-full"
                :style="{ backgroundColor: form.color }"
              ></div>
              <span class="text-sm font-medium text-gray-700">
                {{ form.name || 'Container Name' }} Coffee Highlight
              </span>
            </div>
          </div>
          
          <!-- Filter tag preview -->
          <div class="flex items-center gap-2">
            <p class="text-xs text-gray-500">Filter tag:</p>
            <span 
              class="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium transition-all"
              :style="{ 
                backgroundColor: `${form.color}20`,
                color: form.color,
                borderColor: `${form.color}40`
              }"
              :class="`border-2`"
            >
              <div 
                class="w-2.5 h-2.5 rounded-full mr-1.5"
                :style="{ backgroundColor: form.color }"
              ></div>
              {{ form.name || 'Container' }}
            </span>
          </div>
        </div>
      </div>

      <!-- Action buttons -->
      <SaveCancelButtons
        :disabled="!isFormValid"
        @save="save"
        @cancel="cancel"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { supabase } from '../lib/supabase'
import { useToast } from '../composables/useToast'
import { CircleX, Package } from 'lucide-vue-next'
import SaveCancelButtons from './SaveCancelButtons.vue'

const { success, error, warning, info } = useToast()

const emit = defineEmits(['container-saved', 'cancel'])

const props = defineProps({
  fetchContainers: {
    type: Function,
    default: null
  }
})

// Form state
const form = ref({
  name: '',
  color: '#3b82f6' // Default blue color
})

// Preset color options
const presetColors = ref([
  { name: 'Blue', color: '#3b82f6' },
  { name: 'Green', color: '#10b981' },
  { name: 'Purple', color: '#8b5cf6' },
  { name: 'Pink', color: '#ec4899' },
  { name: 'Red', color: '#ef4444' },
  { name: 'Orange', color: '#f97316' },
  { name: 'Yellow', color: '#eab308' },
  { name: 'Indigo', color: '#6366f1' },
  { name: 'Teal', color: '#14b8a6' },
  { name: 'Cyan', color: '#06b6d4' },
  { name: 'Lime', color: '#84cc16' },
  { name: 'Emerald', color: '#059669' },
  { name: 'Rose', color: '#f43f5e' },
  { name: 'Violet', color: '#7c3aed' },
  { name: 'Amber', color: '#f59e0b' },
  { name: 'Slate', color: '#64748b' }
])

// Computed properties
const isFormValid = computed(() => {
  return form.value.name.trim().length > 0 && isValidHexColor(form.value.color)
})

// Helper functions
const isValidHexColor = (color) => {
  return /^#[0-9A-Fa-f]{6}$/.test(color)
}

// Form actions
const save = async () => {
  if (!isFormValid.value) {
    error('Validation failed', 'Please complete all required fields')
    return
  }

  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError) throw new Error('Authentication error: ' + userError.message)
    if (!user) {
      warning('Authentication required', 'Please log in to save container')
      return
    }

    info('Saving...', 'Creating new container')

    // Check for duplicate names
    const { data: existing, error: checkError } = await supabase
      .from('containers')
      .select('id')
      .eq('user_id', user.id)
      .eq('name', form.value.name.trim())
      .eq('is_active', true)
      .maybeSingle()

    if (checkError) throw checkError
    if (existing) {
      warning('Duplicate name', 'A container with this name already exists')
      return
    }

    // Get the highest display_order for this user
    const { data: orderData, error: orderError } = await supabase
      .from('containers')
      .select('display_order')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('display_order', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (orderError) throw orderError
    const nextOrder = orderData ? orderData.display_order + 1 : 1

    // Create the container
    const { data, error: insertError } = await supabase
      .from('containers')
      .insert({
        name: form.value.name.trim(),
        color: form.value.color,
        user_id: user.id,
        display_order: nextOrder
      })
      .select()
      .single()

    if (insertError) throw insertError

    success('Container created!', `${data.name} has been added to your containers`)
    emit('container-saved', data)
    
    if (props.fetchContainers) {
      await props.fetchContainers()
    }
    
  } catch (err) {
    console.error('Error creating container:', err)
    error('Save failed', `Could not create container: ${err.message}`)
  }
}

const cancel = () => {
  const hasChanges = form.value.name.trim() || form.value.color !== '#3b82f6'

  if (hasChanges) {
    if (!confirm('Are you sure you want to discard this container?')) {
      return
    }
    warning('Changes discarded', 'New container entry cancelled')
  } else {
    info('Form closed', 'Add container cancelled')
  }
  
  // Reset form
  form.value = {
    name: '',
    color: '#3b82f6'
  }
  
  emit('cancel')
}
</script>

<style scoped>
.input {
  @apply px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500;
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
  border-radius: 8px;
}
</style>