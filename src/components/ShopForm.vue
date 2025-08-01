<template>
  <div class="shop-form">
    <label>
      Shop Name
      <input v-model="form.name" type="text" placeholder="Enter shop name" />
    </label>

    <label>
      Shop URL
      <input v-model="form.url" type="url" placeholder="https://example.com" />
    </label>

    <div v-if="form.logo" class="logo-preview">
      <span>Favicon Preview:</span>
      <img :src="form.logo" alt="Favicon Preview" />
    </div>

    <div class="actions">
      <button :disabled="!isFormValid()" @click="save">Save Shop</button>
      <button @click="cancel">Cancel</button>
    </div>
  </div>
</template>

<script setup>
import { useShopForm } from '../composables/useShopForm'

const emit = defineEmits(['shop-saved', 'cancel'])
const props = defineProps({ fetchShops: Function, onClose: Function })

const { form, isFormValid, save, cancel } = useShopForm({ emit, onClose: props.onClose, fetchShops: props.fetchShops })
</script>

<style scoped>
.shop-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.logo-preview {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.logo-preview img {
  width: 24px;
  height: 24px;
}
.actions {
  display: flex;
  gap: 1rem;
}
</style>