<template>
  <div class="mt-4 flex justify-center gap-2">
    <button
      type="button"
      @click="$emit('save')"
      :disabled="disabled"
      :class="[
        'px-4 py-2 rounded flex items-center gap-2 transition-colors',
        disabled 
          ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
          : 'bg-green-500 text-white hover:bg-green-600'
      ]"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M5 13l4 4L19 7"
        />
      </svg>
      Save
    </button>

    <button
      type="button"
      @click="$emit('cancel')"
      class="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 flex items-center gap-2 transition-colors"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
      Cancel
    </button>
  </div>
</template>

<script setup>
defineProps({
  disabled: { type: Boolean, default: false }
})

defineEmits(['save', 'cancel'])
</script>