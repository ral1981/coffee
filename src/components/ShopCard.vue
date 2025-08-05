<template>
  <div class="shop-card-wrapper relative" :data-shop-id="shop.id">
    <!-- Three dots menu - positioned at card level -->
    <div class="absolute top-2 right-0 flex flex-col items-center space-y-1 flex-shrink-0 z-10">
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
        :href="hasRelatedCoffees ? relatedCoffeesUrl : '#'"
        @click="handleRelatedCoffeesClick"
        :class="[
          'block w-full text-left px-3 py-2 text-sm transition-colors duration-200',
          hasRelatedCoffees 
            ? 'hover:bg-gray-100 text-gray-900 cursor-pointer' 
            : 'text-gray-300 cursor-not-allowed bg-gray-50'
        ]"
      >
        <Coffee 
          :class="[
            'inline-block mr-2 w-4 h-4',
            hasRelatedCoffees ? 'text-gray-700' : 'text-gray-300'
          ]" 
        /> 
        Related Coffees
      </a>

      <!-- Edit (disabled for guests) -->
      <button
        type="button"
        @click="isLoggedIn ? enterEditMode() : showLoginPrompt('edit')"
        :class="[
          'block w-full text-left px-3 py-2 text-sm transition-colors duration-200',
          isLoggedIn 
            ? 'hover:bg-gray-100 text-gray-900 cursor-pointer' 
            : 'text-gray-400 cursor-not-allowed bg-gray-50'
        ]"
      >
        <Pencil 
          :class="[
            'inline-block mr-2 w-4 h-4',
            isLoggedIn ? 'text-gray-600' : 'text-gray-300'
          ]" 
        /> 
        <span>Edit</span>
      </button>

      <!-- Delete (disabled for guests) -->
      <button
        type="button"
        @click.stop="handleDeleteClick"
        :disabled="!isLoggedIn"
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

    <!-- Edit mode card -->
    <div v-if="isEditing" class="shop-card w-28 h-auto flex flex-col items-center justify-start border-l-4 border-l-blue-500 border rounded-lg p-2 bg-blue-50 shadow relative min-h-28">
      <!-- Edit mode icon -->
      <div class="absolute top-1 right-1">
        <Pencil class="w-3 h-3 text-blue-500" />
      </div>

      <div class="flex flex-col items-center space-y-2 w-full">
        <!-- Logo preview -->
        <LogoImage
          :url="form.url"
          :custom-logo="form.logo"
          :size="24"
          :alt="`${form.name} logo`"
          class-name="w-8 h-8 mt-1"
        />

        <!-- Shop name input -->
        <input
          v-model="form.name"
          type="text"
          placeholder="Shop name *"
          required
          :class="{ 'border-red-500': !form.name.trim() }"
          class="input-edit-small text-center font-medium text-xs w-full"
          @click.stop
        />

        <!-- Shop URL input -->
        <input
          v-model="form.url"
          type="url"
          placeholder="Shop URL *"
          required
          :class="{ 'border-red-500': !validUrl(form.url) }"
          class="input-edit-small text-center text-xs w-full"
          @click.stop
        />

        <!-- Save/Cancel buttons -->
        <div class="w-full">
          <SaveCancelButtons
            :disabled="!isFormValid"
            :compact="true"
            @save="save"
            @cancel="cancel"
          />
        </div>
      </div>
    </div>

    <!-- Normal card view -->
    <a
      v-if="!isEditing"
      :href="homepage"
      target="_blank"
      rel="noopener noreferrer"
      :class="['shop-card block w-28 h-28 flex flex-col items-center justify-center border-l-4 border rounded-lg p-3 bg-white shadow hover:shadow-md transition-all cursor-pointer no-underline group', cardBorderClass]"
      @click="handleCardClick"
    >
      <LogoImage
        :url="shopUrl"
        :custom-logo="localShop.logo"
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
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { supabase } from '../lib/supabase'
import { useToast } from '../composables/useToast'
import { useShopForm } from '../composables/useShopForm'
import { EllipsisVertical, Store, Trash2, Coffee, Pencil } from 'lucide-vue-next'
import LogoImage from './LogoImage.vue'
import SaveCancelButtons from './SaveCancelButtons.vue'

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
  },
  fetchShops: {
    type: Function,
    default: null
  }
})

const emit = defineEmits(['deleted', 'shop-updated'])

// Create a reactive copy of the shop data
const localShop = ref({ ...props.shop })

// Local UI state
const showMenu = ref(false)
const menuButton = ref(null)
const menuPanel = ref(null)
const hasRelatedCoffees = ref(false)
const isDeleting = ref(false)
const isEditing = ref(false)

// Shop form composable (only initialize when editing)
let shopForm = null

const getShopForm = () => {
  if (!shopForm) {
    shopForm = useShopForm({
      initialData: localShop.value,
      mode: 'edit',
      emit: (event, data) => {
        if (event === 'shop-updated') {
          // Update local shop data immediately
          Object.assign(localShop.value, data)
          emit('shop-updated', data)
        } else {
          emit(event, data)
        }
      },
      onClose: () => {
        isEditing.value = false
      },
      fetchShops: props.fetchShops
    })
  }
  return shopForm
}

// Computed properties that conditionally use the form
const form = computed(() => isEditing.value ? getShopForm().form : {})
const isFormValid = computed(() => isEditing.value ? getShopForm().isFormValid : true)
const save = () => isEditing.value && getShopForm().save()
const cancel = () => {
  if (isEditing.value) {
    getShopForm().cancel()
  }
}

// URL validation helper
const validUrl = (value) => {
  if (!value) return false
  try {
    new URL(value.startsWith('http') ? value : `https://${value}`)
    return true
  } catch {
    return false
  }
}

// Handle both old and new data structures
const shopName = computed(() => {
  return localShop.value.name || localShop.value.shop_name || 'Unknown Shop'
})

const cardBorderClass = computed(() => {
  return hasRelatedCoffees.value ? 'border-l-purple-500' : 'border-l-red-500'
})

const relatedCoffeesUrl = computed(() => {
  // Use encodeURIComponent to handle special characters in the shop name
  return `/coffee/?shop=${encodeURIComponent(shopName.value)}`
})

const shopUrl = computed(() => {
  return localShop.value.url || localShop.value.bean_url || ''
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

// Function to check if the shop has related coffees
async function checkRelatedCoffees() {
  try {
    const { count, error } = await supabase
      .from('coffee_beans')
      .select('*', { count: 'exact', head: true })
      .eq('shop_id', localShop.value.id);

    if (error) {
      throw error;
    }

    // Update the ref based on the count
    hasRelatedCoffees.value = count > 0;
  } catch (err) {
    console.error('Error checking for related coffees:', err);
    // Default to false on error
    hasRelatedCoffees.value = false;
  }
}

function enterEditMode() {
  if (!props.isLoggedIn) {
    showLoginPrompt('edit')
    return
  }
  
  isEditing.value = true
  showMenu.value = false
  // Reset the form with current shop data
  Object.assign(getShopForm().form, localShop.value)
}

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

// Fixed delete handler
function handleDeleteClick(event) {
  event.preventDefault()
  event.stopPropagation()
  
  if (!props.isLoggedIn) {
    showLoginPrompt('delete')
    return
  }
  
  confirmDelete()
}

async function confirmDelete() {
  if (isDeleting.value) return // Prevent multiple delete attempts
  
  showMenu.value = false
  
  const confirmed = confirm(`Delete "${shopName.value}" shop?\n\nNote: This will only delete the shop entry. Coffee beans from this shop will remain in your collection.`)
  
  if (!confirmed) return
  
  isDeleting.value = true
  
  try {
    console.log('Attempting to delete shop with ID:', localShop.value.id)
    
    const { error: deleteError } = await supabase
      .from('shops')
      .delete()
      .eq('id', localShop.value.id)
    
    if (deleteError) {
      console.error('Supabase delete error:', deleteError)
      throw deleteError
    }
    
    console.log('Shop deleted successfully')
    success('Shop deleted', `${shopName.value} has been removed from your shops`)
    emit('deleted', localShop.value.id)
    
  } catch (err) {
    console.error('Delete operation failed:', err)
    error('Delete failed', `Failed to delete ${shopName.value}. Please try again.`)
  } finally {
    isDeleting.value = false
  }
}

function showLoginPrompt(action) {
  const actionText = action === 'edit' ? 'edit this shop' : action === 'delete' ? 'delete this shop' : 'perform this action'
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

function handleRelatedCoffeesClick(event) {
  if (!hasRelatedCoffees.value) {
    event.preventDefault()
    warning('No related coffees', `No coffee beans found from ${shopName.value}`)
  }
  showMenu.value = false
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
onMounted(() => {
  document.addEventListener('click', onClickOutside);
  checkRelatedCoffees();
})

onBeforeUnmount(() => {
  document.removeEventListener('click', onClickOutside)
})

// Watch for prop changes and update local data
watch(() => props.shop, (newShop) => {
  Object.assign(localShop.value, newShop)
}, { deep: true })
</script>

<style scoped>
.shop-card {
  min-width: 0;
}

.input-edit {
  @apply w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500;
}

.input-edit-small {
  @apply w-full px-1 py-0.5 border border-gray-300 rounded text-xs focus:outline-none focus:border-blue-500;
}
</style>