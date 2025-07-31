<template>
  <div>
    <div v-if="showForm" class="relative m-4 p-4 rounded-xl border-2 border-dashed border-blue-300 bg-blue-50 text-gray-900 space-y-4 flex flex-col h-full">
      
      <!-- Top-right close button -->
      <button
        @click="cancel"
        class="absolute top-4 right-4 p-2 text-red-600 hover:text-red-800 dark:text-red-300 dark:hover:text-white"
        title="Close"
      >
        <CircleX class="w-6 h-6" />
      </button>
      
      <!-- Header -->
      <div class="relative flex items-start m-4">
        <!-- 1) Favicon (left zone) -->
        <div class="flex-shrink-0">
          <img
            :src="form.shop_logo || 'https://www.google.com/s2/favicons?domain=example.com'"
            alt="shop logo"
            width="48"
            height="48"
            class="rounded"
          />
        </div>

        <!-- 2) Title & Shop name (middle zone) -->
        <div class="flex-1 min-w-0 ml-4 mr-2">
          <div class="transition-all duration-300 ease-in-out">
            <!-- Coffee name input -->
            <input
              v-model="form.name"
              placeholder="Coffee Name *" 
              required 
              :class="{ 'border-red-500': !form.name }"
              class="block text-3xl font-bold leading-tight w-full bg-transparent border-b-2 border-gray-300 focus:border-blue-500 focus:outline-none mb-2"
            />
            
            <!-- Shop name input -->
            <input
              id="shop_name"
              v-model="form.shop_name"
              list="shops"
              placeholder="Start typing shop name... *" 
              required 
              :class="{ 'border-red-500': !form.shop_name }"
              class="text-xl text-gray-500 block w-full bg-transparent border-b border-gray-300 focus:border-blue-500 focus:outline-none"
            />
            <datalist id="shops">
              <option
                v-for="shop in shopNameOptions"
                :key="shop"
                :value="shop"
              />
            </datalist>

            <!-- Shop URL input -->
            <input
              v-model="form.shop_url"
              @input="deriveShopLogo"
              placeholder="Shop URL *" 
              required 
              :class="{ 'border-red-500': !validUrl(form.shop_url) }"
              class="text-lg text-gray-400 block w-full bg-transparent border-b border-gray-300 focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>        
      </div>

      <div class="space-y-4">
        <!-- Info Grid -->
        <div class="grid rounded-md grid-cols-1 md:grid-cols-2 gap-3 md:gap-2 text-base border-l-4 border-blue-300 pl-3 md:pl-2">
          <div>
            <strong>Origin: </strong>
            <label for="origin">Origin</label>
            <input
              id="origin" 
              v-model="form.origin"
              list="origins" 
              placeholder="Start typing country... *" 
              required 
              :class="{ 'border-red-500': !form.origin }" 
              class="input" 
            />
            <datalist id="origins">
              <option
                v-for="o in originOptions"
                :key="o"
                :value="o"
              />
            </datalist>
          </div>
          <div>
            <strong>Region: </strong>
            <input v-model="form.region" placeholder="Region" class="input" />
          </div>
          <div>
            <strong>Altitude (m): </strong>
            <input v-model="form.altitude_meters" placeholder="Altitude" class="input" />
          </div>
          <div>
            <strong>Variety: </strong>
            <input v-model="form.botanic_variety" placeholder="Variety" class="input" />
          </div>
          <div>
            <strong>Farm/Producer: </strong>
            <input v-model="form.farm_producer" placeholder="Farm/Producer" class="input" />
          </div>
          <div>
            <strong>Processing: </strong>
            <input v-model="form.processing_method" placeholder="Processing" class="input" />
          </div>
          <div>
            <strong>SCA Score: </strong>
            <input
              v-model.number="form.sca"
              type="number"
              step="0.1"
              placeholder="SCA Score"
              class="input"
            />
          </div>
        </div>

        <!-- Flavor Profile -->
        <div class="bg-blue-50 rounded-md p-4 md:p-3 border-l-4 border-blue-300">
          <h4 class="uppercase text-base font-semibold text-blue-700 mb-1">
            Flavor Profile
          </h4>
          <textarea 
            v-model="form.flavor" 
            placeholder="Describe the flavor profile..."
            rows="3"
            class="input w-full resize-none"
          ></textarea>
        </div>

        <!-- Notes -->
        <div class="bg-gray-50 rounded-md p-4 md:p-3 border-l-4 border-gray-300">
          <h4 class="uppercase text-base font-semibold text-gray-700 mb-1">
            Notes
          </h4>
          <textarea 
            v-model="form.notes" 
            placeholder="Add your notes here..."
            rows="3"
            class="input w-full resize-none"
          ></textarea>
        </div>

        <!-- Espresso Recipe -->
        <div class="bg-orange-50 rounded-md p-4 md:p-3 border-l-4 border-orange-400">
          <h4 class="uppercase text-base font-semibold text-orange-700 mb-3 md:mb-2">
            Espresso Recipe
          </h4>
          <div class="grid grid-cols-2 gap-2 text-sm">
            <input
              v-model.number="form.recipe_in_grams"
              type="number"
              step="0.1"
              placeholder="In (g)"
              class="input"
            />
            <input
              v-model.number="form.recipe_out_grams"
              type="number"
              step="0.1"
              placeholder="Out (g)"
              class="input"
            />
            <input
              v-model="form.recipe_time_seconds"
              placeholder="Time (s)"
              class="input"
            />
            <input
              v-model.number="form.recipe_temperature_c"
              type="number"
              step="0.1"
              placeholder="Temp (°C)"
              class="input"
            />
          </div>
        </div>

        <!-- Containers -->
        <Container
          mode="form"
          :form="form"
          :coffees="coffees"
          @form-container-change="handleFormContainerChange"
        />

        <!-- Action buttons -->
        <SaveCancelButtons
          :disabled="!isFormValid"
          @save="save"
          @cancel="cancel"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { supabase } from '../lib/supabase'
import { useToast } from '../composables/useToast'
import Container from './Container.vue'
import SaveCancelButtons from './SaveCancelButtons.vue'
import { useCoffeeForm } from '../composables/useCoffeeForm'

// Toast composable
const { success, error, warning, info } = useToast()

const props = defineProps({
  fetchCoffees: {
    type: Function,
    default: null
  }
})

const emit = defineEmits(['coffee-saved', 'cancel'])

const showForm = ref(true)
const coffees = ref([])

const fetchCoffees = async () => {
  try {
    const { data, error: fetchError } = await supabase
      .from('coffee_beans')
      .select('*')
    
    if (fetchError) {
      throw fetchError
    }
    
    coffees.value = data || []
    
    // Optional: Show feedback when data loads successfully
    // info('Data loaded', 'Coffee database updated')
    
  } catch (err) {
    console.error('Error fetching coffees:', err)
    error('Failed to load data', 'Could not refresh coffee list')
    coffees.value = []
  }
}

// Enhanced form handlers
const handleSave = async () => {
  try {
    // Show immediate feedback that save is starting
    info('Saving coffee...', 'Adding to your collection')
    
    await save()
    
    // Success is handled by the composable or parent component
    // so we don't need to show it here to avoid duplication
    
  } catch (err) {
    console.error('Save error in CoffeeForm:', err)
    error('Save failed', 'Please check your information and try again')
  }
}

const handleCancel = () => {
  // Check if form has unsaved changes
  const hasChanges = Object.values(form).some(value => 
    value !== '' && value !== false && value !== null && value !== undefined
  )
  
  if (hasChanges) {
    const confirmDiscard = confirm('You have unsaved changes. Are you sure you want to cancel?')
    if (!confirmDiscard) {
      return
    }
    warning('Changes discarded', 'Form was cancelled without saving')
  }
  
  cancel()
}

// Enhanced form validation feedback
const validateAndShowFeedback = () => {
  if (!isFormValid.value) {
    const missingFields = []
    
    // Check required fields (adjust based on your form requirements)
    if (!form.name?.trim()) missingFields.push('Coffee name')
    if (!form.origin?.trim()) missingFields.push('Origin')
    if (!form.shop_name?.trim()) missingFields.push('Shop name')
    
    if (missingFields.length > 0) {
      warning(
        'Required fields missing', 
        `Please fill in: ${missingFields.join(', ')}`
      )
      return false
    }
    
    // Check for other validation issues
    if (form.price && (isNaN(form.price) || form.price <= 0)) {
      warning('Invalid price', 'Price must be a positive number')
      return false
    }
    
    if (form.shop_url && !validUrl.value) {
      warning('Invalid URL', 'Please enter a valid shop website URL')
      return false
    }
  }
  
  return true
}

// Initialize composable with enhanced handlers
const { 
  form, 
  isFormValid, 
  save, 
  cancel, 
  validUrl, 
  deriveShopLogo, 
  shopNameOptions, 
  originOptions 
} = useCoffeeForm({
  initialData: {},   
  mode: 'add', 
  emit,
  onClose: () => {
    showForm.value = false
    info('Form closed', 'Add coffee form was closed')
  },
  fetchCoffees: props.fetchCoffees || fetchCoffees,
  // Pass validation handler to composable if it supports it
  onValidationError: () => validateAndShowFeedback()
})

// Auto-save draft functionality (optional enhancement)
const saveDraft = () => {
  const draftData = { ...form }
  localStorage.setItem('coffee-form-draft', JSON.stringify(draftData))
  info('Draft saved', 'Your progress has been saved locally')
}

const loadDraft = () => {
  try {
    const draft = localStorage.getItem('coffee-form-draft')
    if (draft) {
      const draftData = JSON.parse(draft)
      Object.assign(form, draftData)
      success('Draft loaded', 'Your previous progress has been restored')
      localStorage.removeItem('coffee-form-draft')
    }
  } catch (err) {
    console.error('Error loading draft:', err)
    warning('Draft error', 'Could not restore previous progress')
  }
}

// Shop logo derivation with feedback
const handleShopLogoDerivation = async () => {
  try {
    info('Generating logo...', 'Creating shop logo from URL')
    await deriveShopLogo()
    success('Logo generated', 'Shop logo has been created automatically')
  } catch (err) {
    console.error('Logo derivation error:', err)
    warning('Logo generation failed', 'Could not automatically create shop logo')
  }
}

// Form submission with comprehensive validation
const handleFormSubmit = async () => {
  if (!validateAndShowFeedback()) {
    return
  }
  
  await handleSave()
}

// Initialize and load any saved draft
fetchCoffees()

// Optional: Load draft on mount
// loadDraft()
</script>

<style scoped>
.input {
  @apply w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500;
}
</style>