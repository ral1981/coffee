<template>
  <div class="container-form">
    <!-- Header -->
    <div class="form-header">
      <div class="header-left">
        <div class="form-icon">
          <Package class="icon" />
        </div>
        <div class="header-text">
          <h2 class="form-title">
            {{ mode === 'edit' ? 'Edit Container' : 'Add New Container' }}
          </h2>
          <p class="form-subtitle">
            {{ mode === 'edit' ? 'Update your container details' : 'Create a custom container to organize your coffee collection' }}
          </p>
        </div>
      </div>
      <button type="button" @click="handleCancel" class="close-btn">
        <X :size="20" />
      </button>
    </div>

    <!-- Form Content -->
    <form @submit.prevent="handleSubmit" class="form-content">
      <div class="form-section">
        <h3 class="section-title">Container Details</h3>
        
        <!-- Container Name -->
        <div class="form-group">
          <label for="container-name" class="form-label">
            Container Name <span class="required">*</span>
          </label>
          <input
            id="container-name"
            v-model="form.name"
            type="text"
            class="form-input"
            :class="{ 'error': validationErrors.name }"
            placeholder="Enter container name"
            maxlength="100"
            :disabled="loading"
          />
          <div v-if="validationErrors.name" class="error-message">
            {{ validationErrors.name }}
          </div>
          <div v-else class="form-hint">
            Choose a memorable name for your container
          </div>
        </div>

        <!-- Container Color -->
        <div class="form-group">
          <label for="container-color" class="form-label">
            Container Color <span class="required">*</span>
          </label>
          
          <div class="color-input-section">
            <div class="color-preview" :style="{ backgroundColor: form.color }"></div>
            <input
              id="container-color"
              v-model="form.color"
              type="text"
              class="form-input color-input"
              :class="{ 'error': validationErrors.color }"
              placeholder="#ef4444"
              pattern="^#[0-9A-Fa-f]{6}$"
              maxlength="7"
              :disabled="loading"
            />
          </div>
          
          <div v-if="validationErrors.color" class="error-message">
            {{ validationErrors.color }}
          </div>
          <div v-else class="form-hint">
            Enter a hex color code or use the color picker
          </div>
          
          <!-- Preset Colors -->
          <div class="preset-colors-section">
            <label class="preset-label">Or choose a preset color:</label>
            <div class="preset-colors">
              <button
                v-for="color in presetColors"
                :key="color"
                type="button"
                class="color-preset"
                :class="{ 'selected': form.color === color }"
                :style="{ backgroundColor: color }"
                @click="selectColor(color)"
                :disabled="loading"
                :title="`Select ${color}`"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Preview Section -->
      <div class="form-section">
        <h3 class="section-title">Preview</h3>
        <div class="preview-section">
          <label class="preview-label">Coffee card highlight:</label>
          <div 
            class="preview-tag-container"
            :style="{ '--highlight-color': form.color, borderLeftColor: form.color }"
          >
            <div class="preview-tag">
              <div class="tag-dot" :style="{ backgroundColor: form.color }"></div>
              <span class="tag-text" :style="{ color: form.color }">{{ form.name || 'Container' }} Coffee Highlight</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Form Actions -->
      <div class="form-actions">
        <button
          type="button"
          @click="handleCancel"
          class="btn btn-secondary"
          :disabled="loading"
        >
          Cancel
        </button>
        <button
          type="submit"
          class="btn btn-primary"
          :disabled="!isFormValid || loading"
        >
          <div v-if="loading" class="btn-spinner">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" opacity="0.25"/>
              <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </div>
          <span v-else>
            <Check class="btn-icon" />
            {{ mode === 'edit' ? 'Update Container' : 'Add Container' }}
          </span>
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { X, Package, Check } from 'lucide-vue-next'
import { useToast } from '../../composables/useToast'
import { useContainers } from '../../composables/useContainers'

// Props
const props = defineProps({
  mode: {
    type: String,
    default: 'add',
    validator: (value) => ['add', 'edit'].includes(value)
  },
  initialData: {
    type: Object,
    default: () => ({})
  },
  fetchContainers: {
    type: Function,
    default: null
  }
})

// Emits
const emit = defineEmits(['container-saved', 'container-updated', 'cancel', 'close'])

// Composables
const { success, error: showError, info } = useToast()
const { addContainer, updateContainer, presetColors: containerPresetColors } = useContainers()

// Form state
const form = ref({
  name: '',
  color: '#3b82f6'
})

const loading = ref(false)
const validationErrors = ref({})

// Preset colors - hardcoded array to ensure they always load
const presetColors = ref([
  '#3b82f6', // Blue
  '#10b981', // Emerald
  '#8b5cf6', // Violet
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#f97316', // Orange
  '#06b6d4', // Cyan
  '#84cc16', // Lime
  '#ec4899', // Pink
  '#22c55e', // Green
  '#6366f1', // Indigo
  '#a855f7', // Purple
  '#0ea5e9', // Sky
  '#6b7280'  // Gray
])

// Computed properties
const isFormValid = computed(() => {
  return form.value.name?.trim() && 
         form.value.color && 
         /^#[0-9A-Fa-f]{6}$/.test(form.value.color)
})

// Methods
const selectColor = (colorHex) => {
  form.value.color = colorHex
  if (validationErrors.value.color) {
    delete validationErrors.value.color
  }
}

const validateForm = () => {
  validationErrors.value = {}
  
  if (!form.value.name?.trim()) {
    validationErrors.value.name = 'Container name is required'
  }
  
  if (!form.value.color) {
    validationErrors.value.color = 'Container color is required'
  } else if (!/^#[0-9A-Fa-f]{6}$/.test(form.value.color)) {
    validationErrors.value.color = 'Please enter a valid hex color code (e.g., #3b82f6)'
  }
  
  return Object.keys(validationErrors.value).length === 0
}

const handleSubmit = async () => {
  if (!validateForm()) {
    return
  }
  
  loading.value = true
  
  try {
    const containerData = {
      name: form.value.name.trim(),
      color: form.value.color
    }
    
    let result
    if (props.mode === 'edit' && props.initialData?.id) {
      // Update existing container
      result = await updateContainer(props.initialData.id, containerData)
      if (result.success) {
        emit('container-updated', result.data)
      }
    } else {
      // Create new container
      result = await addContainer(containerData)
      if (result.success) {
        emit('container-saved', result.data)
      }
    }
    
    if (result.success) {
      // Refresh containers list if function provided
      if (props.fetchContainers) {
        await props.fetchContainers()
      }
      
      // Close form
      emit('close')
    }
    
  } catch (err) {
    console.error('Error saving container:', err)
    showError('Save Failed', err.message || 'Failed to save container. Please try again.')
  } finally {
    loading.value = false
  }
}

const handleCancel = () => {
  info('Form cancelled', 'Container form was cancelled')
  emit('cancel')
  emit('close')
}

// Validation watchers
watch(() => form.value.name, (newName) => {
  if (validationErrors.value.name && newName?.trim()) {
    delete validationErrors.value.name
  }
})

watch(() => form.value.color, (newColor) => {
  if (validationErrors.value.color && /^#[0-9A-Fa-f]{6}$/.test(newColor)) {
    delete validationErrors.value.color
  }
})

// Lifecycle
onMounted(() => {
  if (props.mode === 'edit' && props.initialData) {
    form.value = {
      name: props.initialData.name || '',
      color: props.initialData.color || '#3b82f6'
    }
  }
  
  console.log('ContainerForm mounted:', {
    mode: props.mode,
    initialData: props.initialData,
    formData: { ...form.value }
  })
})
</script>

<style scoped>
/* Remove overlay styles, make form inline like CoffeeForm */
.container-form {
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
  overflow: hidden;
}

/* Header */
.form-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 2rem 2rem 1rem 2rem;
  border-bottom: 1px solid #f0f0f0;
}

.header-left {
  display: flex;
  gap: 1rem;
  flex: 1;
}

.form-icon {
  background: #8b5cf6;
  border-radius: 12px;
  padding: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.icon {
  width: 24px;
  height: 24px;
  color: white;
}

.form-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 0.25rem 0;
}

.form-subtitle {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
  line-height: 1.4;
}

.close-btn {
  background: #f3f4f6;
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  color: #6b7280;
  flex-shrink: 0;
}

.close-btn:hover {
  background: #e5e7eb;
  color: #374151;
}

/* Form Content */
.form-content {
  padding: 1.5rem 2rem 2rem 2rem;
}

.form-section {
  margin-bottom: 2rem;
}

.section-title {
  font-size: 1rem;
  font-weight: 600;
  color: #8b5cf6;
  margin: 0 0 1.5rem 0;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-label {
  display: block;
  font-weight: 500;
  color: #374151;
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
}

.required {
  color: #ef4444;
}

.form-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.875rem;
  transition: border-color 0.2s, box-shadow 0.2s;
  background: white;
}

.form-input:focus {
  outline: none;
  border-color: #8b5cf6;
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
}

.form-input:disabled {
  background: #f9fafb;
  opacity: 0.6;
}

.form-input.error {
  border-color: #ef4444;
}

.form-hint {
  font-size: 0.8125rem;
  color: #6b7280;
  margin-top: 0.25rem;
}

.error-message {
  color: #ef4444;
  font-size: 0.8125rem;
  font-weight: 500;
  margin-top: 0.25rem;
}

/* Color Input Section */
.color-input-section {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.color-preview {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  border: 2px solid #e5e7eb;
  flex-shrink: 0;
}

.color-input {
  flex: 1;
  padding: 0.75rem 1rem;
  font-family: monospace;
  text-transform: uppercase;
}

/* Preset Colors */
.preset-colors-section {
  margin-top: 1rem;
}

.preset-label {
  display: block;
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 0.75rem;
}

.preset-colors {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 0.5rem;
}

.color-preset {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}

.color-preset:hover {
  transform: scale(1.1);
  border-color: #d1d5db;
}

.color-preset.selected {
  border-color: #374151;
  transform: scale(1.1);
}

.color-preset.selected::after {
  content: '✓';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-weight: bold;
  font-size: 14px;
  text-shadow: 0 0 2px rgba(0, 0, 0, 0.5);
}

/* Preview Section */
.preview-section {
  padding: 1.5rem;
  background: #f9fafb;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
}

.preview-label {
  display: block;
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 1rem;
}

.preview-tag-container {
  background: white;
  border-radius: 12px;
  padding: 1rem;
  border: 1px solid #e5e7eb;
  border-left: 4px solid var(--highlight-color, #ef4444);
  display: flex;
  align-items: center;
  gap: 0.75rem;
  position: relative;
}

.highlight-bar {
  display: none; /* Hide since we're using border-left instead */
}

.preview-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 20px;
  background: white;
  font-size: 0.875rem;
}

.tag-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.tag-text {
  font-weight: 500;
}

/* Form Actions */
.form-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  padding-top: 1rem;
  border-top: 1px solid #f0f0f0;
}

.btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 100px;
  min-height: 44px;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
}

.btn-secondary:hover:not(:disabled) {
  background: #e5e7eb;
  border-color: #9ca3af;
}

.btn-primary {
  background: #22c55e;
  color: white;
  border: 1px solid #22c55e;
}

.btn-primary:hover:not(:disabled) {
  background: #16a34a;
  border-color: #16a34a;
}

.btn-spinner {
  animation: spin 1s linear infinite;
}

.btn-icon {
  width: 16px;
  height: 16px;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* Responsive Design */
@media (max-width: 640px) {
  .container-form {
    border-radius: 12px;
    margin: 0;
  }
  
  .form-header {
    padding: 1.5rem 1.5rem 1rem 1.5rem;
  }
  
  .form-content {
    padding: 1rem 1.5rem 1.5rem 1.5rem;
  }
  
  .header-left {
    gap: 0.75rem;
  }
  
  .form-title {
    font-size: 1.25rem;
  }
  
  .preset-colors {
    grid-template-columns: repeat(6, 1fr);
  }
  
  .color-preset {
    width: 32px;
    height: 32px;
  }
  
  .form-actions {
    flex-direction: column;
  }
  
  .btn {
    width: 100%;
  }
}
</style>