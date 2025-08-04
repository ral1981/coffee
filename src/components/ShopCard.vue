<template>
  <div class="shop-card-wrapper relative" :data-shop-id="shop.id">
    <!-- Three dots menu - positioned at card level -->
    <div class="absolute top-2 right-2 flex flex-col items-center space-y-1 flex-shrink-0 z-10">
      <button
        ref="menuButton"
        type="button"
        @click.stop="toggleMenu"
        class="p-1 text-gray-600 hover:text-black"
      >
        <EllipsisVertical class="w-4 h-4"/>
      </button>
    </div>

    <!-- Three dots menu dropdown -->
    <div
      v-if="showMenu"
      ref="menuPanel"
      class="absolute top-8 right-2 w-40 bg-white border border-gray-200 rounded shadow-md overflow-hidden z-20"
    >

      <!-- Visit Shop (available to all users) -->
      <button
        type="button"
        @click="visitShop"
        class="block w-full text-left px-3 py-2 hover:bg-gray-100 text-sm"
      >
        <Store class="inline-block mr-2 w-4 h-4" /> Visit Shop
      </button>

      <!-- Related Coffees (available to all users) -->
      <a
        :href="relatedCoffeesUrl"
        @click="handleMenuLinkClick"
        class="block w-full text-left px-3 py-2 hover:bg-gray-100 text-sm"
      >
        <Coffee class="inline-block mr-2 w-4 h-4" /> Related Coffees
      </a>

      <!-- Delete (disabled for guests) -->
      <button
        type="button"
        @click.stop="isLoggedIn ? confirmDelete() : showLoginPrompt('delete')"
        :class="[
          'block w-full text-left px-3 py-2 text-sm transition-colors duration-200',
          isLoggedIn 
            ? 'hover:bg-gray-100 text-red-600 cursor-pointer' 
            : 'text-gray-300 cursor-not-allowed bg-gray-50'
        ]"
      >
        <Trash2 
          :class="[
            'inline-block mr-2 w-4 h-4',
            isLoggedIn ? 'text-red-600' : 'text-gray-300'
          ]" 
        /> 
        <span>Delete</span>
      </button>
    </div>

    <a
      :href="homepage"
      target="_blank"
      rel="noopener noreferrer"
      class="shop-card block w-28 h-28 flex flex-col items-center justify-center border rounded-lg p-3 bg-white shadow hover:shadow-md transition-all cursor-pointer no-underline group"
      @click="handleCardClick"
    >
      <LogoImage
        :url="shopUrl"
        :custom-logo="shop.logo"
        :size="32"
        :alt="`${shopName} logo`"
        class-name="w-16 h-16 mb-1"
      />
      
      <span class="text-center text-sm font-medium whitespace-normal text-black">
        {{ shopName }}
      </span>
    </a>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { supabase } from '../lib/supabase'
import { useToast } from '../composables/useToast'
import { EllipsisVertical, Store, Trash2, Coffee } from 'lucide-vue-next'
import LogoImage from './LogoImage.vue'

// Toast composable
const { success, error, warning, info } = useToast()

const props = defineProps({
  shop: {
    type: Object,
    required: true
  },
  isLoggedIn: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['deleted'])

// Local UI state
const showMenu = ref(false)
const menuButton = ref(null)
const menuPanel = ref(null)

// Handle both old and new data structures
const shopName = computed(() => {
  return props.shop.name || props.shop.shop_name || 'Unknown Shop'
})

const relatedCoffeesUrl = computed(() => {
  // Use encodeURIComponent to handle special characters in the shop name
  return `/coffee/?shop=${encodeURIComponent(shopName.value)}`
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

// Menu handlers
function toggleMenu() {
  showMenu.value = !showMenu.value
}

function visitShop() {
  showMenu.value = false
  if (shopUrl.value) {
    window.open(homepage.value, '_blank', 'noopener,noreferrer')
    info('Opening shop page', `Redirecting to ${shopName.value} website`)
  } else {
    warning('No shop URL', 'This shop doesn\'t have a website linked')
  }
}

async function confirmDelete() {
  if (!props.isLoggedIn) {
    showLoginPrompt('delete')
    return
  }
  
  showMenu.value = false
  if (!confirm(`Delete "${shopName.value}" shop?\n\nNote: This will only delete the shop entry. Coffee beans from this shop will remain in your collection.`)) return
  
  try {
    const { error: deleteError } = await supabase
      .from('shops')
      .delete()
      .eq('id', props.shop.id)
    
    if (deleteError) {
      throw deleteError
    }
    
    success('Shop deleted', `${shopName.value} has been removed from your shops`)
    emit('deleted', props.shop.id)
    
  } catch (err) {
    error('Delete failed', 'Please try again')
    console.error('Delete error:', err)
  }
}

function showLoginPrompt(action) {
  const actionText = action === 'delete' ? 'delete this shop' : 'perform this action'
  warning('🔒 Please log in first', `Login required to ${actionText}`)
  showMenu.value = false
}

function handleCardClick(event) {
  // Prevent navigation if menu is open or if clicking on menu area
  if (showMenu.value) {
    event.preventDefault()
    showMenu.value = false
  }
}

function handleMenuLinkClick() {
  showMenu.value = false;
}

function onClickOutside(e) {
  if (
    showMenu.value &&
    menuButton.value && !menuButton.value.contains(e.target) &&
    menuPanel.value && !menuPanel.value.contains(e.target)
  ) {
    showMenu.value = false
  }
}

// Lifecycle hooks
onMounted(() => document.addEventListener('click', onClickOutside))
onBeforeUnmount(() => document.removeEventListener('click', onClickOutside))
</script>

<style scoped>
.shop-card {
  min-width: 0;
}
</style>