<template>
  <div :class="containerClasses">
    <button
      type="button"
      @click="handleSaveClick"
      :disabled="disabled"
      :class="saveButtonClasses"
    >
      <svg :class="iconClasses" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M5 13l4 4L19 7"
        />
      </svg>
      <span v-if="!compact">Save</span>
    </button>

    <button
      type="button"
      @click="handleCancel"
      :class="cancelButtonClasses"
    >
      <svg :class="iconClasses" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
      <span v-if="!compact">Cancel</span>
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useToast } from '../composables/useToast'

const { warning } = useToast()

const props = defineProps({
  disabled: { type: Boolean, default: false },
  compact: { type: Boolean, default: false }
})

const emit = defineEmits(['save', 'cancel'])

const containerClasses = computed(() => {
  return props.compact 
    ? 'flex justify-center gap-1' 
    : 'mt-4 flex justify-center gap-2'
})

const iconClasses = computed(() => {
  return props.compact ? 'w-3 h-3' : 'w-4 h-4'
})

const saveButtonClasses = computed(() => {
  const base = 'rounded flex items-center justify-center gap-2 transition-colors'
  const size = props.compact ? 'px-2 py-1 text-xs' : 'px-4 py-2'
  const state = props.disabled 
    ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
    : 'bg-green-500 text-white hover:bg-green-600'
  
  return `${base} ${size} ${state}`
})

const cancelButtonClasses = computed(() => {
  const base = 'bg-red-500 text-white rounded hover:bg-red-600 flex items-center justify-center gap-2 transition-colors'
  const size = props.compact ? 'px-2 py-1 text-xs' : 'px-4 py-2'
  
  return `${base} ${size}`
})

const handleSaveClick = () => {
  if (props.disabled) {
    warning('Cannot save', 'Please complete all required fields')
    return
  }
  emit('save')
}

const handleCancel = () => {
  emit('cancel')
}
</script>