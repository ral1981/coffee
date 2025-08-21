<template>
  <div class="shop-form">
    <!-- Form Header -->
    <div class="form-header">
      <div class="header-left">
        <div class="form-icon">
          <Store class="icon" />
        </div>
        <div>
          <h2 class="form-title">{{ mode === 'add' ? 'Add New Shop' : 'Edit Shop' }}</h2>
          <p class="form-subtitle">{{ mode === 'add' ? 'Add a new coffee shop' : 'Update shop information' }}</p>
        </div>
      </div>
    </div>

    <!-- Form Content -->
    <form @submit.prevent="handleSubmit" class="form-content">
      <!-- Shop Name -->
      <div class="form-group">
        <label for="shop-name" class="form-label">
          Shop Name <span class="required">*</span>
        </label>
        <input
          id="shop-name"
          v-model="form.name"
          type="text"
          class="form-input"
          :class="{ 'form-input--error': validationErrors.name }"
          placeholder="e.g., Blue Bottle Coffee"
          :disabled="loading"
          required
        />
        <div v-if="validationErrors.name" class="error-message">
          {{ validationErrors.name }}
        </div>
      </div>

      <!-- Shop URL -->
      <div class="form-group">
        <label for="shop-url" class="form-label">
          Website URL <span class="required">*</span>
        </label>
        <input
          id="shop-url"
          v-model="form.url"
          type="url"
          class="form-input"
          :class="{ 'form-input--error': validationErrors.url }"
          placeholder="e.g., https://bluebottlecoffee.com"
          :disabled="loading"
          required
        />
        <div class="form-hint">
          The website URL will be used to automatically fetch the shop logo
        </div>
        <div v-if="validationErrors.url" class="error-message">
          {{ validationErrors.url }}
        </div>
      </div>

      <!-- Logo Preview -->
      <div v-if="form.url && validUrl(form.url)" class="form-group">
        <div class="logo-preview-label">Logo Preview</div>
        <div class="logo-preview">
          <LogoImage
            :url="form.url"
            :custom-logo="form.logo"
            :size="64"
            alt="Shop logo preview"
            class-name="rounded-lg"
          />
          <div class="logo-info">
            <div class="logo-text">
              Logo will be automatically fetched from the website
            </div>
            <div class="logo-domain">{{ getDomain(form.url) }}</div>
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
            {{ mode === 'add' ? 'Add Shop' : 'Update Shop' }}
          </span>
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { Store } from 'lucide-vue-next'
import LogoImage from '../shared/LogoImage.vue'
import { useShopForm } from '../../composables/useShopForm'
import { useToast } from '../../composables/useToast'

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
  fetchShops: {
    type: Function,
    default: null
  }
})

// Emits
const emit = defineEmits(['shop-saved', 'shop-updated', 'cancel', 'close'])

// Composables
const { info } = useToast()

// Use shop form composable
const {
  form,
  isFormValid,
  save,
  cancel,
  validUrl,
  resetOriginalValues
} = useShopForm({
  initialData: props.initialData,
  mode: props.mode,
  emit,
  onClose: () => emit('close'),
  fetchShops: props.fetchShops
})

// Local state
const loading = ref(false)
const validationErrors = ref({})

// Computed properties
const getDomain = (url) => {
  try {
    const fullUrl = url.startsWith('http') ? url : `https://${url}`
    return new URL(fullUrl).hostname.replace('www.', '')
  } catch {
    return url
  }
}

// Validation
watch(() => form.name, (newName) => {
  if (validationErrors.value.name && newName?.trim()) {
    delete validationErrors.value.name
  }
})

watch(() => form.url, (newUrl) => {
  if (validationErrors.value.url && validUrl(newUrl)) {
    delete validationErrors.value.url
  }
})

// Event handlers
const handleSubmit = async () => {
  // Clear previous errors
  validationErrors.value = {}
  
  // Validate form
  if (!form.name?.trim()) {
    validationErrors.value.name = 'Shop name is required'
    return
  }
  
  if (!form.url?.trim()) {
    validationErrors.value.url = 'Website URL is required'
    return
  }
  
  if (!validUrl(form.url)) {
    validationErrors.value.url = 'Please enter a valid URL'
    return
  }
  
  loading.value = true
  
  try {
    await save()
    // Success is handled by the composable
  } catch (error) {
    console.error('Error saving shop:', error)
  } finally {
    loading.value = false
  }
}

const handleCancel = () => {
  info('Form cancelled', 'Shop form was cancelled')
  cancel()
}

// Lifecycle
onMounted(() => {
  // Reset original values baseline for change detection
  resetOriginalValues()
  
  console.log('ShopForm mounted:', {
    mode: props.mode,
    initialData: props.initialData,
    formData: { ...form }
  })
})
</script>

<style scoped>
/* Remove overlay styles - make form inline like CoffeeForm and ContainerForm */
.shop-form {
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  width: 100%;
  max-width: 600px;
  margin: 0 auto 2rem auto;
  overflow: hidden;
}

/* Header - updated to match CoffeeForm/ContainerForm pattern */
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
}

/* Content */
.form-content {
  padding: 1rem 2rem 2rem 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-label {
  font-weight: 500;
  color: #374151;
  font-size: 0.875rem;
}

.required {
  color: #ef4444;
}

.form-input {
  padding: 0.75rem 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s;
  background: white;
}

.form-input:focus {
  outline: none;
  border-color: var(--primary-green, #22c55e);
  box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.1);
}

.form-input--error {
  border-color: #ef4444;
}

.form-input:disabled {
  background: #f9fafb;
  cursor: not-allowed;
  opacity: 0.6;
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
}

/* Logo Preview */
.logo-preview-label {
  font-weight: 500;
  color: #374151;
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
}

.logo-preview {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.logo-info {
  flex: 1;
}

.logo-text {
  font-size: 0.875rem;
  color: #374151;
  margin-bottom: 0.25rem;
}

.logo-domain {
  font-size: 0.75rem;
  color: #8b5cf6;
  font-weight: 500;
}

/* Form Actions */
.form-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  margin-top: 1rem;
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
  border: none;
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
  background: var(--primary-green, #22c55e);
  color: white;
  border: 1px solid var(--primary-green, #22c55e);
}

.btn-primary:hover:not(:disabled) {
  background: var(--primary-green-hover, #16a34a);
  border-color: var(--primary-green-hover, #16a34a);
}

.btn-spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Responsive Design */
@media (max-width: 768px) {
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

  .form-actions {
    flex-direction: column;
  }

  .btn {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .shop-form {
    border-radius: 12px;
    margin: 0 auto 1rem auto;
  }

  .form-header {
    padding: 1rem;
  }

  .form-content {
    padding: 1rem;
    gap: 1rem;
  }

  .logo-preview {
    flex-direction: column;
    text-align: center;
    gap: 0.75rem;
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .shop-form {
    background: #1f2937;
    color: #f9fafb;
  }
  
  .form-title {
    color: #f9fafb;
  }
  
  .form-label {
    color: #d1d5db;
  }
  
  .form-input {
    background: #374151;
    border-color: #4b5563;
    color: #f9fafb;
  }
  
  .form-input:focus {
    border-color: var(--primary-green, #22c55e);
  }
  
  .form-hint {
    color: #9ca3af;
  }
  
  .logo-preview {
    background: #374151;
    border-color: #4b5563;
  }
  
  .logo-text {
    color: #d1d5db;
  }
  
  .btn-secondary {
    background: #374151;
    color: #d1d5db;
    border-color: #4b5563;
  }
  
  .btn-secondary:hover:not(:disabled) {
    background: #4b5563;
    border-color: #6b7280;
  }
}
</style>