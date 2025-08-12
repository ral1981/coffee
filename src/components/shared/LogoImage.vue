<template>
  <div class="logo-container" :class="className" :style="containerStyle">
    <img
      :src="currentSrc"
      :alt="alt"
      :style="imageStyle"
      @error="handleError"
      @load="handleLoad"
      class="logo-image"
      :class="{ 'loading': isLoading, 'error': hasError }"
    />
    
    <!-- Fallback placeholder when all sources fail -->
    <div 
      v-if="hasError && !currentSrc" 
      class="logo-fallback"
      :style="imageStyle"
    >
      <svg 
        :width="size" 
        :height="size" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        stroke-width="2"
      >
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
        <circle cx="9" cy="9" r="2"/>
        <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
      </svg>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useLogo } from '../../composables/useLogo'

const props = defineProps({
  // URL to derive logo from
  url: {
    type: String,
    default: ''
  },
  
  // Custom logo URL (highest priority)
  customLogo: {
    type: String,
    default: null
  },
  
  // Image alt text
  alt: {
    type: String,
    default: 'Logo'
  },
  
  // Logo size
  size: {
    type: [String, Number],
    default: 48
  },
  
  // Additional CSS classes
  className: {
    type: String,
    default: ''
  },
  
  // Shape of the logo container
  shape: {
    type: String,
    default: 'square', // 'square', 'circle', 'rounded'
    validator: (value) => ['square', 'circle', 'rounded'].includes(value)
  },
  
  // Loading placeholder
  showLoading: {
    type: Boolean,
    default: true
  }
})

const { getLogoSources } = useLogo()

// Reactive state
const currentSrc = ref('')
const currentSourceIndex = ref(0)
const isLoading = ref(true)
const hasError = ref(false)
const logoSources = ref([])

// Computed styles
const containerStyle = computed(() => ({
  width: `${props.size}px`,
  height: `${props.size}px`,
  borderRadius: getShapeRadius()
}))

const imageStyle = computed(() => ({
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  borderRadius: getShapeRadius()
}))

// Helper functions
const getShapeRadius = () => {
  switch (props.shape) {
    case 'circle': return '50%'
    case 'rounded': return '8px'
    default: return '4px'
  }
}

const initializeLogoSources = () => {
  logoSources.value = getLogoSources(props.url, props.customLogo, props.size)
  currentSourceIndex.value = 0
  loadNextSource()
}

const loadNextSource = () => {
  if (currentSourceIndex.value < logoSources.value.length) {
    const source = logoSources.value[currentSourceIndex.value]
    console.log(`Loading logo source ${currentSourceIndex.value}:`, source)
    currentSrc.value = source
    isLoading.value = true
    hasError.value = false
  } else {
    // All sources failed
    console.warn('All logo sources failed for:', props.url)
    currentSrc.value = ''
    isLoading.value = false
    hasError.value = true
  }
}

const handleLoad = () => {
  console.log('Logo loaded successfully:', currentSrc.value)
  isLoading.value = false
  hasError.value = false
}

const handleError = (event) => {
  console.log(`Logo source ${currentSourceIndex.value} failed:`, currentSrc.value)
  currentSourceIndex.value++
  loadNextSource()
}

// Watch for prop changes
watch([() => props.url, () => props.customLogo, () => props.size], () => {
  if (props.url || props.customLogo) {
    initializeLogoSources()
  }
}, { immediate: true })

</script>

<style scoped>
.logo-container {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  overflow: hidden;
  position: relative;
}

.logo-image {
  transition: opacity 0.2s ease;
}

.logo-image.loading {
  opacity: 0.7;
}

.logo-image.error {
  opacity: 0;
}

.logo-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6c757d;
  background: #f8f9fa;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

/* Shape variants */
.rounded {
  border-radius: 8px;
}

.rounded .logo-image,
.rounded .logo-fallback {
  border-radius: 8px;
}

/* Loading animation */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.logo-image.loading {
  animation: pulse 1.5s ease-in-out infinite;
}

/* Error state */
.logo-container:has(.logo-image.error) {
  background: #f8f9fa;
}

/* Hover effect */
.logo-container:hover {
  transform: scale(1.02);
  transition: transform 0.2s ease;
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .logo-image,
  .logo-container {
    animation: none;
    transition: none;
  }
  
  .logo-container:hover {
    transform: none;
  }
}
</style>