<template>
  <a
    :href="homepage"
    target="_blank"
    rel="noopener noreferrer"
    class="shop-card block w-24 h-24 flex flex-col items-center justify-center border rounded-lg p-3 bg-white shadow hover:shadow-md transition-all cursor-pointer no-underline"
  >
    <img
      :src="faviconUrl"
      alt="shop logo"
      class="w-8 h-8 mb-1"
    />

    <span class="text-center text-sm font-medium whitespace-normal text-black">
      {{ shop.shop_name }}
    </span>
  </a>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  shop: {
    type: Object,
    required: true,
    validator: s =>
      typeof s.shop_name === 'string' && typeof s.shop_url === 'string'
  }
})

const domain = computed(() => {
  try {
    return new URL(props.shop.shop_url).hostname
  } catch {
    return props.shop.shop_url
  }
})

const homepage = computed(() => {
  try {
    return new URL(props.shop.shop_url).origin
  } catch {
    return props.shop.shop_url
  }
})

const faviconUrl = computed(() =>
  `https://www.google.com/s2/favicons?domain=${domain.value}`
)
</script>

<style scoped>
.shop-card {
  min-width: 0;
}
</style>
