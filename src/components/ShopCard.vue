<template>
  <a
    :href="homepage"
    target="_blank"
    rel="noopener noreferrer"
    class="shop-card block w-24 h-24 flex flex-col items-center justify-center border rounded-lg p-3 bg-white shadow hover:shadow-md transition-all cursor-pointer no-underline"
  >
    <LogoImage
      :url="shopUrl"
      :custom-logo="shop.logo"
      :size="32"
      :alt="`${shopName} logo`"
      class-name="w-8 h-8 mb-1"
    />
    
    <span class="text-center text-sm font-medium whitespace-normal text-black">
      {{ shopName }}
    </span>
  </a>
</template>

<script setup>
import { computed } from 'vue'
import LogoImage from './LogoImage.vue'

const props = defineProps({
  shop: {
    type: Object,
    required: true
  }
})

// Handle both old and new data structures
const shopName = computed(() => {
  return props.shop.name || props.shop.shop_name || 'Unknown Shop'
})

const shopUrl = computed(() => {
  return props.shop.url || props.shop.bean_url || ''
})

const domain = computed(() => {
  if (!shopUrl.value) return 'example.com'
  try {
    const url = shopUrl.value.startsWith('http') ? shopUrl.value : `https://${shopUrl.value}`
    return new URL(url).hostname
  } catch (error) {
    console.error('Error parsing URL:', shopUrl.value, error)
    return 'example.com'
  }
})

const homepage = computed(() => {
  if (!shopUrl.value) return '#'
  try {
    const url = shopUrl.value.startsWith('http') ? shopUrl.value : `https://${shopUrl.value}`
    return new URL(url).origin
  } catch (error) {
    console.error('Error creating homepage URL:', shopUrl.value, error)
    return shopUrl.value
  }
})

/* const logoUrl = computed(() => {
  // Try stored logo first (new structure)
  if (props.shop.logo && props.shop.logo.trim()) {
    return props.shop.logo
  }
  
  // Fall back to favicon from domain
  return `https://www.google.com/s2/favicons?domain=${domain.value}&sz=32`
}) */

const onImageError = (event) => {
  console.error('Image failed to load:', event.target.src)
  
  // If the stored logo failed, try the favicon fallback
  if (props.shop.logo && event.target.src === props.shop.logo) {
    console.log('Stored logo failed, switching to favicon fallback')
    event.target.src = `https://www.google.com/s2/favicons?domain=${domain.value}&sz=32`
  }
}
</script>

<style scoped>
.shop-card {
  min-width: 0;
}
</style>