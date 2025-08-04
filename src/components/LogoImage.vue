<template>
  <img
    :src="logoUrl"
    :alt="alt"
    :width="size"
    :height="size"
    :class="className"
    @error="handleError"
    @load="handleLoad"
  />
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useLogo } from '../composables/useLogo'

const props = defineProps({
  url: String,
  customLogo: String,
  size: {
    type: Number,
    default: 48
  },
  alt: {
    type: String,
    default: 'Logo'
  },
  className: {
    type: String,
    default: 'rounded'
  }
})

const { getLogoUrl, createLogoErrorHandler } = useLogo()

const logoUrl = computed(() => 
  getLogoUrl(props.url, props.customLogo, props.size)
)

const handleError = createLogoErrorHandler(
  props.url, 
  props.customLogo, 
  props.size
)

const handleLoad = () => {
  // Optional: track successful loads for analytics
  console.log('Logo loaded successfully:', logoUrl.value)
}

// Watch for URL changes and update logo
watch(() => [props.url, props.customLogo], () => {
  // Force re-evaluation when props change
}, { deep: true })
</script>