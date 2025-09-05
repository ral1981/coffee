<template>
  <div v-if="showForm" class="coffee-form">
    <!-- Close Button -->
    <button
      @click="cancel"
      class="close-btn"
      title="Close"
    >
      <X class="w-5 h-5" />
    </button>

    <!-- Form Header -->
    <div class="form-header">
      <div class="form-logo">
        <LogoImage
          :url="form.bean_url"
          :size="48"
          alt="shop logo"
          class-name="rounded-lg"
        />
      </div>
      <div class="form-info">
        <input
          v-model="form.name"
          placeholder="Coffee Name *"
          required
          :class="{ 'border-red-500': !form.name && showValidation }"
          class="form-input coffee-name"
        />
        <input
          v-model="form.shop_name"
          list="shops"
          placeholder="Shop Name *"
          required
          :class="{ 'border-red-500': !form.shop_name && showValidation }"
          class="form-input shop-name"
        />
        <datalist id="shops">
          <option
            v-for="shop in shopNameOptions"
            :key="shop"
            :value="shop"
          />
        </datalist>
        <input
          v-model="form.bean_url"
          @input="deriveShopLogo"
          placeholder="Shop URL *"
          required
          :class="{ 'border-red-500': !validUrl(form.bean_url) && showValidation }"
          class="form-input shop-url"
        />
      </div>
    </div>

    <!-- Coffee Details Section -->
    <div class="form-section">
      <div class="section-title">Coffee Details</div>
      <div class="details-grid">
        <div class="detail-item">
          <div class="detail-label">Origin</div>
          <input
            v-model="form.origin"
            list="origins"
            placeholder="Country *"
            required
            :class="{ 'border-red-500': !form.origin && showValidation }"
            class="detail-input"
          />
          <datalist id="origins">
            <option
              v-for="origin in originOptions"
              :key="origin"
              :value="origin"
            />
          </datalist>
        </div>
        <div class="detail-item">
          <div class="detail-label">Region</div>
          <input
            v-model="form.region"
            placeholder="Region"
            class="detail-input"
          />
        </div>
        <div class="detail-item">
          <div class="detail-label">Altitude</div>
          <input
            v-model="form.altitude_meters"
            placeholder="1200-1400m"
            class="detail-input"
          />
        </div>
        <div class="detail-item">
          <div class="detail-label">Variety</div>
          <input
            v-model="form.botanic_variety"
            list="varieties"
            placeholder="Bourbon, Typica"
            class="detail-input"
          />
          <datalist id="varieties">
            <option
              v-for="variety in commonVarieties"
              :key="variety"
              :value="variety"
            />
          </datalist>
        </div>
        <div class="detail-item">
          <div class="detail-label">Farm/Producer</div>
          <input
            v-model="form.farm_producer"
            placeholder="Farm/Producer"
            class="detail-input"
          />
        </div>
        <div class="detail-item">
          <div class="detail-label">Processing</div>
          <input
            v-model="form.processing_method"
            list="processing"
            placeholder="Washed, Natural"
            class="detail-input"
          />
          <datalist id="processing">
            <option
              v-for="method in commonProcessingMethods"
              :key="method"
              :value="method"
            />
          </datalist>
        </div>
        <div class="detail-item">
          <div class="detail-label">SCA Score</div>
          <input
            v-model.number="form.sca"
            type="number"
            min="0"
            max="100"
            step="0.1"
            placeholder="85"
            class="detail-input"
          />
        </div>
      </div>
    </div>

    <!-- Flavor Profile Section -->
    <div class="form-section">
      <div class="flavor-section">
        <div class="flavor-title">Flavor Profile</div>
        <textarea
          v-model="form.flavor"
          placeholder="Describe the flavor notes, body, acidity..."
          class="flavor-input"
          rows="3"
        ></textarea>
      </div>
    </div>

    <!-- Notes Section -->
    <div class="form-section">
      <div class="notes-section">
        <div class="notes-title">Notes</div>
        <textarea
          v-model="form.notes"
          placeholder="Add your brewing notes, observations..."
          class="notes-input"
          rows="3"
        ></textarea>
      </div>
    </div>

    <!-- Espresso Recipe Section -->
    <div class="form-section">
      <div class="recipe-section">
        <div class="recipe-title">Espresso Recipe</div>
        <div class="recipe-grid">
          <div class="recipe-item">
            <div class="recipe-label">In (g)</div>
            <input
              v-model.number="form.recipe_in_grams"
              type="number"
              step="0.1"
              placeholder="18"
              class="recipe-input"
            />
          </div>
          <div class="recipe-item">
            <div class="recipe-label">Out (g)</div>
            <input
              v-model.number="form.recipe_out_grams"
              type="number"
              step="0.1"
              placeholder="36"
              class="recipe-input"
            />
          </div>
          <div class="recipe-item">
            <div class="recipe-label">Time</div>
            <input
              v-model="form.recipe_time_seconds"
              placeholder="28s or 2:30"
              class="recipe-input"
            />
          </div>
          <div class="recipe-item">
            <div class="recipe-label">Temp (°C)</div>
            <input
              v-model.number="form.recipe_temperature_c"
              type="number"
              step="0.1"
              placeholder="93"
              class="recipe-input"
            />
          </div>
        </div>
        <div v-if="recipeRatio" class="recipe-ratio">
          Ratio: 1:{{ recipeRatio }}
        </div>
      </div>
    </div>

    <!-- Container Assignment Section -->
    <div class="form-section">
      <ContainerAssignmentGrid
        :available-containers="availableContainers"
        :selected-containers="selectedContainers"
        :container-loading="containerLoading"
        :disabled="!isLoggedIn"
        variant="form"
        title="Container Assignment"
        :show-title="true"
        :context-coffee="contextCoffee"
        :context-mode="'toggle'"
        @update:selectedContainers="handleSelectedContainersUpdate"
        @container-changed="handleContainerChange"
      />
    </div>

    <!-- Action Buttons -->
    <div class="form-actions">
      <button
        @click="cancel"
        class="btn btn-secondary"
        type="button"
      >
        Cancel
      </button>
      <button
        @click="save"
        :disabled="!isFormValid"
        class="btn btn-primary"
        type="button"
      >
        {{ mode === 'add' ? 'Save Coffee' : 'Update Coffee' }}
      </button>
    </div>

    <CoffeeForm
      v-if="showAddCoffeeForm && activeTab === 'coffee'"
      :mode="editingCoffee ? 'edit' : 'add'"
      :initial-data="editingCoffee || {}"
      :fetchCoffees="fetchCoffees"
      @coffee-saved="handleCoffeeSaved"
      @coffee-updated="handleCoffeeUpdated"
      @shop-created="handleShopCreated"
      @close="handleFormClose"
      @cancel="handleFormClose"
    />

    <!-- Validation Errors -->
    <div v-if="showValidation && getValidationErrors().length > 0" class="validation-errors">
      <div class="error-title">Please fix the following:</div>
      <ul>
        <li v-for="error in getValidationErrors()" :key="error">{{ error }}</li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { X } from 'lucide-vue-next'
import LogoImage from '../shared/LogoImage.vue'
import ContainerAssignmentGrid from '../shared/ContainerAssignmentGrid.vue'
import { useAuth } from '../../composables/useAuth'
import { useToast } from '../../composables/useToast'
import { useCoffeeEdit } from '../../composables/useCoffeeEdit'
import { useContainerAssignment } from '../../composables/useContainerAssignment'
import { useCoffeeFormOptions } from '../../composables/useCoffeeFormOptions'

const props = defineProps({
  initialData: {
    type: Object,
    default: () => ({})
  },
  mode: {
    type: String,
    default: 'add', // 'add' or 'edit'
    validator: (value) => ['add', 'edit'].includes(value)
  }
})

const emit = defineEmits(['coffee-saved', 'coffee-updated', 'cancel', 'close', 'shop-created'])

// Composables
const { userId, isLoggedIn } = useAuth()
const { success, error, warning, info } = useToast()

// Shared composables
const {
  form,
  isFormValid,
  getValidationErrors,
  recipeRatio,
  isValidUrl: validUrl,
  deriveShopLogo,
  populateForm,
  resetForm,
  saveCoffee
} = useCoffeeEdit()

const {
  selectedContainers,
  toggleContainerAssignment,
  assignContainersToDatabase,
  resetContainerSelection,
  setInitialContainers
} = useContainerAssignment()

const {
  shopNameOptions,
  originOptions,
  commonProcessingMethods,
  commonVarieties
} = useCoffeeFormOptions()

// Local state
const showForm = ref(true)
const showValidation = ref(false)
const availableContainers = ref([])
const containerLoading = ref(false)

// ContextCoffee for conflict detection
const contextCoffee = computed(() => {
  if (props.mode === 'edit' && props.initialData) {
    return {
      id: props.initialData.id,
      name: form.name || props.initialData.name || 'this coffee'
    }
  }
  return {
    id: null,
    name: form.name || 'this coffee'
  }
})

// Computed property to format selected containers for the grid
const selectedContainersForGrid = computed(() => {
  return selectedContainers.value
})

// Handle container selection updates from the grid
const handleSelectedContainersUpdate = (updatedSelection) => {
  selectedContainers.value = Array.isArray(updatedSelection) 
    ? updatedSelection.map(item => typeof item === 'object' ? item.id : item)
    : []
}

// Handle individual container changes
const handleContainerChange = (data) => {
  const { action, container } = data
  console.log(`Container ${action}:`, container.name)
}

// Add new shop
const handleShopCreated = async (newShop) => {
  console.log('🏪 New shop created via coffee form:', newShop)
  
  try {
    // Refresh the shops list to include the newly created shop
    await fetchShops()
    console.log('✅ Shops list refreshed after shop creation')
    
    // Store the newly created shop ID for potential highlighting
    if (newShop.id) {
      newlyAddedShopId.value = newShop.id
      
      // Highlight the shop if user switches to shops tab
      setTimeout(() => {
        highlightShop(newShop.id)
      }, 500)
    }
    
  } catch (error) {
    console.error('❌ Failed to refresh shops list after creation:', error)
    // Don't show error to user since coffee was saved successfully
  }
}

// Load available containers
const loadContainers = async () => {
  containerLoading.value = true
  try {
    console.log('Loading containers for form...')
    
    const { supabase } = await import('../../lib/supabase')
    
    // FIXED: Use the same query as the coffee card and main app
    const { data, error: fetchError } = await supabase
      .from('containers')
      .select('*')
      .order('display_order', { ascending: true })  // Removed .eq('is_active', true)
    
    if (fetchError) {
      console.error('Container fetch error:', fetchError)
      // Use fallback containers that match what the coffee card shows
      availableContainers.value = [
        { id: 'green', name: 'GREEN', color: '#22c55e' },
        { id: 'red', name: 'RED', color: '#ef4444' },
        { id: 'grey', name: 'GREY', color: '#6b7280' }
      ]
    } else {
      availableContainers.value = data || []
    }
    
    console.log('Containers loaded:', availableContainers.value.length)
    console.log('Available containers:', availableContainers.value.map(c => ({ id: c.id, name: c.name, color: c.color })))
    
    // If editing, load existing container assignments
    if (props.mode === 'edit' && props.initialData.id) {
      await loadExistingAssignments(props.initialData.id)
    }
    
  } catch (err) {
    console.error('Error loading containers:', err)
    // Use the same fallback as the coffee card
    availableContainers.value = [
      { id: 'green', name: 'GREEN', color: '#22c55e' },
      { id: 'red', name: 'RED', color: '#ef4444' }, 
      { id: 'grey', name: 'GREY', color: '#6b7280' }
    ]
  } finally {
    containerLoading.value = false
  }
}

// Enhanced save with validation feedback
const save = async () => {
  console.log('🎯 Save button clicked')
  showValidation.value = true
  
  if (!isFormValid.value) {
    const errors = getValidationErrors()
    console.log('❌ Validation errors:', errors)
    error('Validation Failed', 'Please fix the validation errors before saving')
    return
  }

  if (!userId.value) {
    console.log('❌ No user ID found')
    error('Authentication required', 'Please log in to save coffee')
    return
  }

  console.log('💾 Starting save process...', {
    mode: props.mode,
    userId: userId.value,
    existingId: props.initialData?.id
  })

  try {
    // Check if shop exists before saving (to detect new shop creation)
    const shopName = form.shop_name?.trim()
    let shopExistedBefore = false
    
    if (shopName) {
      try {
        const { supabase } = await import('../../lib/supabase')
        const { data: existingShop } = await supabase
          .from('shops')
          .select('id')
          .eq('name', shopName)
          .maybeSingle()
        
        shopExistedBefore = !!existingShop
        console.log('🏪 Shop existence check:', { shopName, existed: shopExistedBefore })
      } catch (err) {
        console.warn('⚠️ Could not check shop existence:', err)
      }
    }

    // Save the coffee (this may create a new shop)
    const coffeeResult = await saveCoffee(
      props.mode === 'edit' ? props.initialData.id : null,
      userId.value
    )

    console.log('📊 Coffee save result:', coffeeResult)

    if (!coffeeResult || !coffeeResult.success) {
      console.error('❌ Coffee save failed:', coffeeResult)
      return
    }

    const coffeeId = coffeeResult.data.id
    console.log('✅ Coffee saved with ID:', coffeeId)

    // Check if a new shop was created during the save
    if (!shopExistedBefore && coffeeResult.data.shops) {
      console.log('🆕 New shop was created:', coffeeResult.data.shops)
      emit('shop-created', coffeeResult.data.shops)
    }

    // Save container assignments
    console.log('Saving container assignments...')
    const containerResult = await assignContainersToDatabase(coffeeId, selectedContainers.value, userId.value)
    console.log('Container save result:', containerResult)

    if (!containerResult.success) {
      console.warn('Container assignment failed but coffee saved')
      warning('Partial save', 'Coffee saved but container assignments may have failed')
    }

    // Success handling
    if (coffeeResult.isUpdate) {
      console.log('🎉 Coffee updated successfully')
      success('Coffee Updated', 'Your coffee entry has been updated successfully')
      emit('coffee-updated', coffeeResult.data)
    } else {
      console.log('🎉 Coffee created successfully')
      success('Coffee Saved', 'New coffee entry has been added successfully')
      emit('coffee-saved', coffeeResult.data)
    }

    // Close the form
    showForm.value = false
    emit('close')

  } catch (err) {
    console.error('💥 Unexpected error in save function:', err)
    error('Save Failed', 'An unexpected error occurred while saving the coffee')
  }
}

// Enhanced cancel with validation reset
const cancel = () => {
  showValidation.value = false
  resetForm()
  resetContainerAssignment()
  
  showForm.value = false
  emit('close')
  emit('cancel')
}

// Watch for URL changes to update logo
watch(
  () => form.bean_url,
  (newUrl) => {
    if (newUrl && validUrl(newUrl)) {
      deriveShopLogo()
    }
  }
)

// Initialize data when component mounts
onMounted(async () => {
  console.log('Initializing coffee form...')
  
  // Populate form if editing
  if (props.mode === 'edit' && props.initialData) {
    populateForm(props.initialData)
    // Initialize container assignments for editing
    setInitialContainers(props.initialData)
  }
  
  await loadContainers()
  console.log('Coffee form initialized')
})
</script>

<style scoped>
.coffee-form {
  background: white;
  border-radius: 12px;
  padding: 1rem;
  margin-bottom: 1rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  border-left: 4px solid #3b82f6;
  position: relative;
}

.close-btn {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  padding: 0.5rem;
  cursor: pointer;
  color: #ef4444;
  border-radius: 4px;
  transition: background-color 0.2s;
  z-index: 10;
}

.close-btn:hover {
  background: #fee2e2;
}

.form-header {
  display: flex;
  align-items: flex-start;
  margin-bottom: 1.5rem;
  margin-right: 3rem; /* Space for close button */
}

.form-logo {
  width: 48px;
  height: 48px;
  margin-right: 1rem;
  flex-shrink: 0;
}

.form-info {
  flex: 1;
  min-width: 0;
}

.form-input {
  width: 100%;
  border: none;
  background: transparent;
  font-size: inherit;
  font-weight: inherit;
  color: inherit;
  outline: none;
  border-bottom: 2px solid transparent;
  padding: 0.25rem 0;
  transition: border-color 0.2s;
}

.form-input:focus {
  border-bottom-color: #3b82f6;
}

.form-input.coffee-name {
  font-size: 1.25rem;
  font-weight: 600;
  border-bottom-color: #d1d5db;
  margin-bottom: 0.5rem;
}

.form-input.shop-name {
  font-size: 1rem;
  color: #666;
  border-bottom-color: #d1d5db;
  margin-bottom: 0.5rem;
}

.form-input.shop-url {
  font-size: 0.875rem;
  color: #999;
  border-bottom-color: #d1d5db;
}

.form-section {
  margin-bottom: 1.5rem;
}

.section-title {
  font-size: 0.75rem;
  color: #666;
  text-transform: uppercase;
  font-weight: 600;
  letter-spacing: 0.5px;
  margin-bottom: 0.75rem;
}

.details-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
}

@media (min-width: 768px) {
  .details-grid {
    grid-template-columns: 1fr 1fr 1fr;
  }
}

@media (max-width: 640px) {
  .details-grid {
    grid-template-columns: 1fr;
  }
}

.detail-item {
  display: flex;
  flex-direction: column;
}

.detail-label {
  font-size: 0.75rem;
  color: #666;
  text-transform: uppercase;
  font-weight: 600;
  letter-spacing: 0.5px;
  margin-bottom: 0.25rem;
}

.detail-input {
  font-size: 0.875rem;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  padding: 0.5rem;
  background: white;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.detail-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

.flavor-section {
  background: #f0fdf4;
  border-radius: 8px;
  padding: 1rem;
  border-left: 3px solid #22c55e;
}

.flavor-title {
  font-size: 0.75rem;
  color: #22c55e;
  text-transform: uppercase;
  font-weight: 600;
  letter-spacing: 0.5px;
  margin-bottom: 0.5rem;
}

.flavor-input {
  width: 100%;
  border: 1px solid #d1fae5;
  border-radius: 4px;
  padding: 0.75rem;
  font-size: 0.875rem;
  background: white;
  resize: vertical;
  min-height: 80px;
  transition: border-color 0.2s, box-shadow 0.2s;
  box-sizing: border-box;
}

.flavor-input:focus {
  outline: none;
  border-color: #22c55e;
  box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.1);
}

.notes-section {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 1rem;
  border-left: 3px solid #64748b;
}

.notes-title {
  font-size: 0.75rem;
  color: #64748b;
  text-transform: uppercase;
  font-weight: 600;
  letter-spacing: 0.5px;
  margin-bottom: 0.5rem;
}

.notes-input {
  width: 100%;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  padding: 0.75rem;
  font-size: 0.875rem;
  background: white;
  resize: vertical;
  min-height: 80px;
  transition: border-color 0.2s, box-shadow 0.2s;
  box-sizing: border-box;
}

.notes-input:focus {
  outline: none;
  border-color: #64748b;
  box-shadow: 0 0 0 2px rgba(100, 116, 139, 0.1);
}

.recipe-section {
  background: #fff7ed;
  border-radius: 8px;
  padding: 1rem;
  border-left: 3px solid #f97316;
  overflow: hidden;
}

.recipe-title {
  font-size: 0.75rem;
  color: #ea580c;
  text-transform: uppercase;
  font-weight: 600;
  letter-spacing: 0.5px;
  margin-bottom: 0.75rem;
}

.recipe-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
  width: 100%;
}

@media (max-width: 640px) {
  .recipe-grid {
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
  }
}

@media (min-width: 768px) {
  .recipe-grid {
    grid-template-columns: repeat(4, 1fr);
    gap: 0.75rem;
  }
}

.recipe-item {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.recipe-label {
  font-size: 0.625rem;
  color: #9a3412;
  text-transform: uppercase;
  font-weight: 600;
  letter-spacing: 0.5px;
  margin-bottom: 0.25rem;
  white-space: nowrap;
}

.recipe-input {
  border: 1px solid #fed7aa;
  border-radius: 4px;
  padding: 0.5rem;
  font-size: 0.875rem;
  background: white;
  text-align: center;
  transition: border-color 0.2s, box-shadow 0.2s;
  width: 100%;
  box-sizing: border-box;
}

.recipe-input:focus {
  outline: none;
  border-color: #f97316;
  box-shadow: 0 0 0 2px rgba(249, 115, 22, 0.1);
}

.recipe-ratio {
  font-size: 0.875rem;
  color: #ea580c;
  font-weight: 600;
  text-align: center;
  background: white;
  padding: 0.5rem;
  border-radius: 4px;
  border: 1px solid #fed7aa;
  margin-top: 0.5rem;
}

.form-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
}

.btn {
  flex: 1;
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: #22c55e;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #16a34a;
  transform: translateY(-1px);
}

.btn-primary:disabled {
  background: #d1d5db;
  cursor: not-allowed;
  transform: none;
}

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
}

.btn-secondary:hover {
  background: #e5e7eb;
  transform: translateY(-1px);
}

.validation-errors {
  margin-top: 1rem;
  padding: 1rem;
  background: #fef2f2;
  border-radius: 8px;
  border-left: 3px solid #ef4444;
}

.error-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #dc2626;
  margin-bottom: 0.5rem;
}

.validation-errors ul {
  list-style: none;
  margin: 0;
  padding: 0;
}

.validation-errors li {
  font-size: 0.875rem;
  color: #dc2626;
  margin-bottom: 0.25rem;
}

.validation-errors li:before {
  content: '• ';
  margin-right: 0.5rem;
}

.border-red-500 {
  border-bottom-color: #ef4444 !important;
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .coffee-form {
    background: #1f2937;
    border-color: #3b82f6;
    color: #f9fafb;
  }
  
  .close-btn {
    color: #ef4444;
  }
  
  .close-btn:hover {
    background: #7f1d1d;
  }
  
  .form-input {
    color: #f9fafb;
  }
  
  .form-input.coffee-name {
    border-bottom-color: #4b5563;
  }
  
  .form-input.shop-name,
  .form-input.shop-url {
    border-bottom-color: #4b5563;
  }
  
  .details-grid {
    background: #374151;
  }
  
  .detail-input {
    background: #1f2937;
    border-color: #4b5563;
    color: #f9fafb;
  }
  
  .detail-input:focus {
    border-color: #3b82f6;
  }
  
  .flavor-section {
    background: #064e3b;
    border-color: #10b981;
  }
  
  .flavor-input {
    background: #1f2937;
    border-color: #059669;
    color: #f9fafb;
  }
  
  .flavor-input:focus {
    border-color: #10b981;
  }
  
  .notes-section {
    background: #374151;
    border-color: #64748b;
  }
  
  .notes-input {
    background: #1f2937;
    border-color: #64748b;
    color: #f9fafb;
  }
  
  .notes-input:focus {
    border-color: #64748b;
  }
  
  .recipe-section {
    background: #451a03;
    border-color: #ea580c;
  }
  
  .recipe-input {
    background: #1f2937;
    border-color: #ea580c;
    color: #f9fafb;
  }
  
  .recipe-input:focus {
    border-color: #f97316;
  }
  
  .recipe-ratio {
    background: #1f2937;
    border-color: #ea580c;
    color: #f97316;
  }
  
  .btn-secondary {
    background: #374151;
    color: #f9fafb;
    border-color: #4b5563;
  }
  
  .btn-secondary:hover {
    background: #4b5563;
  }
  
  .validation-errors {
    background: #7f1d1d;
  }
}

/* Print styles */
@media print {
  .coffee-form {
    box-shadow: none;
    border: 1px solid #000;
    background: white !important;
    color: #000 !important;
  }
  
  .close-btn {
    display: none;
  }
  
  .form-actions {
    display: none;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .btn {
    transition: none;
  }
  
  .btn:hover {
    transform: none;
  }
  
  .form-input,
  .detail-input,
  .flavor-input,
  .notes-input,
  .recipe-input {
    transition: none;
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .coffee-form {
    border: 2px solid #000;
  }
  
  .form-input,
  .detail-input,
  .flavor-input,
  .notes-input,
  .recipe-input {
    border-width: 2px;
  }
  
  .btn {
    border: 2px solid currentColor;
  }
}
</style>