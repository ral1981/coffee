<template>
  <div class="relative m-4 p-4 rounded-xl border-2 border-dashed border-blue-300 bg-blue-50 text-gray-900 space-y-4 flex flex-col h-full">
    
    <!-- Top-right close button -->
    <button
      @click="cancel"
      class="absolute top-4 right-4 p-2 text-red-600 hover:text-red-800 dark:text-red-300 dark:hover:text-white"
      title="Close"
    >
      <CircleX class="w-6 h-6" />
    </button>

    <div class="space-y-4">
      <!-- Info Section -->
      <div class="bg-blue-50 rounded-md p-4 md:p-3 border-l-4 border-blue-300">
        <h4 class="uppercase text-base font-semibold text-blue-700 mb-3">
          Shop Information
        </h4>
        <div class="space-y-3">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Shop Name *
            </label>
            <input
              v-model="form.name"
              type="text"
              placeholder="Enter shop name"
              required
              :class="{ 'border-red-500': !form.name.trim() }"
              class="input w-full"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Shop URL *
            </label>
            <input
              v-model="form.url"
              type="url"
              placeholder="https://example.com"
              required
              :class="{ 'border-red-500': !validUrl(form.url) }"
              class="input w-full"
            />
          </div>
          
          <!-- Updated logo preview section -->
          <div v-if="form.url" class="flex items-center gap-2 text-sm text-gray-600">
            <span>Logo Preview:</span>
            <LogoImage
              :url="form.url"
              :custom-logo="form.logo"
              :size="24"
              alt="Logo Preview"
              class-name="w-6 h-6 rounded"
            />
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
import { defineProps } from 'vue';
import { useShopForm } from '../composables/useShopForm'
import { CircleX } from 'lucide-vue-next'
import SaveCancelButtons from './SaveCancelButtons.vue'
import LogoImage from '../components/shared/LogoImage.vue'

const emit = defineEmits(['shop-saved', 'cancel'])
const props = defineProps({ 
  fetchShops: Function, 
  onClose: Function 
})

const { form, isFormValid, save, cancel } = useShopForm({ 
  emit, 
  onClose: props.onClose, 
  fetchShops: props.fetchShops 
})

// Add validUrl function locally since it's used in template
const validUrl = (value) => {
  if (!value) return false
  try {
    new URL(value.startsWith('http') ? value : `https://${value}`)
    return true
  } catch {
    return false
  }
}
</script>

<style scoped>
.input {
  @apply px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500;
}
</style>