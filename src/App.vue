<template>
  <main class="min-h-screen bg-gray-35 dark:bg-white dark:text-gray-900 p-6 relative flex flex-col">
    <!-- Backdrop to close menu when clicking outside -->
    <div 
      v-if="showAuth"
      @click="closeAuth"
      class="fixed inset-0 z-40 bg-black bg-opacity-20"
    ></div>

    <!-- Coffee Form Overlay -->
    <div 
      v-if="selectedIndex === 0 && showCoffeeForm"
      @click="handleOverlayClick"
      class="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-start justify-center pt-8 px-4"
    >
      <div @click.stop class="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CoffeeForm
          :user="user"
          :fetchCoffees="loadCoffees"
          @coffee-added="handleNewCoffee"
          @cancel="showCoffeeForm = false"
        />
      </div>
    </div>

    <!-- Shop Form Overlay -->
    <div 
      v-if="selectedIndex === 2 && showShopForm"
      @click="handleOverlayClick"
      class="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-start justify-center pt-8 px-4"
    >
      <div @click.stop class="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <ShopForm
          :user="user"
          :fetchShops="loadShops"
          @shop-added="handleNewShop"
          @cancel="closeForms"
        />
      </div>
    </div>

    <!-- Unified Authentication Panel -->
    <div class="fixed top-4 right-4 z-50">
      <button 
        @click.stop="toggleAuth"
        class="p-3 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105"
        :class="{ 'bg-green-50 dark:bg-green-900': isLoggedIn }"
        :title="isLoggedIn ? 'Account Menu' : 'Login'"
      >
        <LockOpen v-if="isLoggedIn" class="w-6 h-6 text-green-600 dark:text-green-400" />
        <Lock v-else class="w-6 h-6 text-gray-700 dark:text-gray-300" />
      </button>
      <Transition name="slide-fade">
        <div 
          v-if="showAuth" 
          @click.stop
          data-auth-panel
          class="absolute top-16 right-0 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-600 overflow-hidden z-60"
        >
          <Authentication
            @user-changed="onUserChanged"
            @logout="attemptLogout"
            :show-toggle="false"
            @user-activity="resetActivityTimer"
          />
        </div>
      </Transition>
    </div>

    <!-- Main Content Area -->
    <div class="pt-10 pb-2 text-center">
      <router-link to="/" class="flex flex-col items-center mb-6 cursor-pointer">
        <svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 24 24" class="mb-2">
          <defs>
            <linearGradient id="coffeeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style="stop-color:#8D6E63;stop-opacity:1" />
              <stop offset="100%" style="stop-color:#000000;stop-opacity:1" />
            </linearGradient>
          </defs>
          <path fill="url(#coffeeGradient)" d="M13.325 0c-.907 1.116-2.442 2.302-.768 4.814.558.628.838 1.953.768 2.372 0 0 2.512-1.464.977-4.116-.907-1.395-1.326-2.582-.977-3.07zm-2.79 2.582c-.628.767-1.605 1.535-.489 3.279.35.349.489 1.256.489 1.535 0 0 1.673-.978.627-2.792-.628-.907-.906-1.743-.627-2.022zm-5.094 6a.699.699 0 0 0-.697.698c0 2.372.349 10.535 3.837 14.512.14.139.28.208.489.208h5.86c.21 0 .35-.069.489-.208 3.488-3.908 3.837-12.07 3.837-14.512a.7.7 0 0 0-.698-.699H12zm2.023 2.163h9.21c.349 0 .697.278.697.697 0 1.953-.348 7.465-2.72 10.326-.21.14-.35.208-.559.208H9.976a.633.633 0 0 1-.488-.208c-2.372-2.79-2.652-8.373-2.722-10.326 0-.35.28-.697.698-.697zm8.792 4.744s-.071.627-1.745 1.255c-2.303.837-6.348.28-6.348.28.349 1.465.906 2.86 1.743 3.907.07.14.28.209.419.209h3.489c.14 0 .279-.07.418-.209 1.186-1.395 1.745-3.558 2.024-5.442z"/>
        </svg>
        <div class="w-32 h-2 bg-gray-800 mb-4 rounded"></div>
        <h1 class="text-4xl font-bold gradient-text">Coffee Tracker</h1>
      </router-link>
    </div>

    <!-- Controls: Filter Panel Tabs -->
    <div class="flex flex-col lg:flex-row lg:items-stretch gap-4">
      <div class="flex-1">
        <div class="w-full bg-white dark:bg-gray-800 rounded-lg">
          <TabGroup as="div" :selectedIndex="selectedIndex" @change="handleTabChange" class="flex-1">
            <!-- Tab list -->
            <TabList class="flex w-full justify-center items-center p-1 rounded-t-lg bg-transparent">
              <Tab
                class="py-2 px-4 text-sm font-medium leading-5 text-gray-600 dark:text-gray-400 rounded-lg
                      ui-selected:bg-blue-600 ui-selected:text-white ui-selected:shadow-none focus:outline-none"
              >
                Coffees
              </Tab>
              <span class="mx-2 text-gray-400 select-none">|</span>
              <Tab
                class="py-2 px-4 text-sm font-medium leading-5 text-gray-600 dark:text-gray-400 rounded-lg
                      ui-selected:bg-blue-600 ui-selected:text-white ui-selected:shadow-none focus:outline-none"
              >
                Containers
              </Tab>
              <span class="mx-2 text-gray-400 select-none">|</span>
              <Tab
                class="py-2 px-4 text-sm font-medium leading-5 text-gray-600 dark:text-gray-400 rounded-lg
                      ui-selected:bg-blue-600 ui-selected:text-white ui-selected:shadow-none focus:outline-none"
              >
                Shops
              </Tab>
            </TabList>

            <!-- Tab panels -->
            <TabPanels class="p-4">
              
              <!-- Filters panel -->
              <TabPanel>
                <FilterPanel
                  :origins="uniqueOrigins"
                  :shops="uniqueShops"
                  :names="coffeeNames"
                  :filtered-count="filteredCoffees.length"
                  :total-count="totalCoffees"
                  @filter-change="handleFilterChange"
                />
                
                <!-- Coffee Cards Grid -->
                <div class="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 items-start">
                  <CoffeeCard
                    v-for="coffee in filteredCoffees"
                    :key="coffee.id"
                    :coffee="coffee"
                    :class="{ 'new-item': coffee.id === newlyAddedId }"
                    :isLoggedIn="isLoggedIn"
                    :containerStatus="containerStatus"
                    :initiallyExpanded="shouldExpandCards"
                    :forceExpandState="forceExpandState"
                    :fetchCoffees="loadCoffees"
                    @editing-changed="onEditingChanged"
                    @update-container="handleContainerUpdate"
                    @deleted="loadCoffees"
                    @saved="loadCoffees"
                    @coffee-updated="handleCoffeeUpdated"
                  />
                </div>
              </TabPanel>
              
              <!-- Containers panel (WIP) -->
              <TabPanel>
                <div class="flex justify-center items-center h-full text-gray-500 dark:text-gray-400 italic">
                  🚧 Work in progress…
                </div>
              </TabPanel>
              
              <!-- Shops panel (WIP) -->
              <TabPanel>
                <div class="flex flex-wrap justify-center gap-4">
                  <ShopCard
                    v-for="shop in shops"
                    :key="shop.bean_url"
                    :shop="shop"
                  />
                </div>
              </TabPanel>
            </TabPanels>
          </TabGroup>
        </div>
      </div>
    </div>

    <!-- Add Button -->
    <button
      @click="handleAddClick"
      :disabled="!isLoggedIn || showCoffeeForm || showShopForm || selectedIndex === 1"
      :class="[
        'floating-btn left-6 bottom-6 rounded-full shadow-lg p-3 transition-all duration-300',
        (!isLoggedIn || showCoffeeForm || showShopForm || selectedIndex === 1)
          ? 'z-10 floating-btn--disabled bg-gray-400'
          : 'z-50 bg-blue-600 hover:bg-blue-700 hover:shadow-xl hover:scale-110'
      ]"
      :title="!isLoggedIn 
        ? 'Please log in to add items' 
        : selectedIndex === 0 
          ? 'Add Coffee' 
          : selectedIndex === 2 
            ? 'Add Shop' 
            : ''"
    >
      <Plus :class="[
        'w-6 h-6',
        (!isLoggedIn || showCoffeeForm || showShopForm || selectedIndex === 1)
          ? 'text-gray-600'
          : 'text-white'
      ]" />
    </button>

    <Transition name="fade">
      <button
        v-if="showBackToTop"
        @click="scrollToTop"
        :disabled="showCoffeeForm"
        :class="[
          'floating-btn bottom-6 right-6',
          showCoffeeForm ? 'z-10 floating-btn--disabled' : 'z-50',
          'bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-all duration-300 hover:scale-110'
        ]"
        title="Back to top"
      >
        <ArrowUp class="w-6 h-6" />
      </button>
    </Transition>

    <!-- Expand/Collapse All Button -->
    <button
      @click="toggleExpandAll"
      :disabled="showCoffeeForm"
      :class="[
        'floating-btn left-6 bottom-24',
         showCoffeeForm ? 'z-10 floating-btn--disabled' : 'z-50',
         'bg-white dark:bg-gray-800 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 p-3 border border-gray-200 dark:border-gray-600'
      ]"
      :title="allExpanded ? 'Collapse All Cards' : 'Expand All Cards'"
    >
      <ChevronDown v-if="allExpanded" class="w-6 h-6 text-gray-700 dark:text-gray-300" />
      <ChevronRight v-else class="w-6 h-6 text-gray-700 dark:text-gray-300" />
    </button>

    <!-- Fixed Footer -->
    <footer class="mt-auto pt-8 pb-4 text-center text-sm text-gray-600 dark:text-gray-400">
      <p>© 2025 R.A., all rights reserved unless otherwise noted. This site is for personal, non-commercial use to catalog specialty coffee beans at home. QR codes are intended for private household use and should not be shared externally.</p>
      <p>
        Licensed under 
        <a href="https://creativecommons.org/licenses/by-nc/4.0/" target="_blank" rel="noopener" class="text-blue-600 dark:text-blue-400 hover:underline">
          CC BY-NC 4.0
        </a>.
      </p>
    </footer>

    <!-- Toast Notifications -->
    <ToastContainer />
  </main>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { TabGroup, TabList, Tab, TabPanels, TabPanel } from '@headlessui/vue'
import { supabase } from './lib/supabase'
import { useToast } from './composables/useToast'
import ToastContainer from './components/ToastContainer.vue'
import Authentication from './components/Authentication.vue'
import CoffeeForm from './components/CoffeeForm.vue'
import ShopForm from './components/ShopForm.vue'
import FilterPanel from './components/FilterPanel.vue'
import CoffeeCard from './components/CoffeeCard.vue'
import ShopCard from './components/ShopCard.vue'
import { ArrowUp, Lock, LockOpen, Plus, ChevronDown, ChevronRight } from 'lucide-vue-next'

// Reactive state
const user = ref(null)
const coffees = ref([])
const shops = ref([])
const isLoggedIn = ref(false)
const anyEditing = ref(false)
const filter = ref({ green: false, grey: false, origin: '', shop: '', name: '' })
const showBackToTop = ref(false)
const showAuth = ref(false)
const showCoffeeForm = ref(false)
const showShopForm = ref(false)
const autoCollapseTimer = ref(null)
const lastScrollY = ref(0)
const userActivityTimer = ref(null)
const lastActivityTime = ref(Date.now())
const allExpanded = ref(false)
const forceExpandState = ref(null)
const newlyAddedId = ref(null)
const coffeeNames = ref([])
const shouldExpandFromUrl = ref(false)
const isInitialUrlLoad = ref(true)
const { success, error, warning, info } = useToast()
const selectedIndex = ref(0)

// Authentication methods
const toggleAuth = () => {
  showAuth.value = !showAuth.value
  
  // Clear any existing timer when manually toggling
  clearAutoCollapseTimer()
  
  // If opening, set auto-collapse timer (for both logged in and logged out users)
  if (showAuth.value) {
    resetActivityTimer()
    startAutoCollapseTimer()
  }
}

const closeAuth = () => {
  showAuth.value = false
  clearAutoCollapseTimer()
}

const clearAutoCollapseTimer = () => {
  if (autoCollapseTimer.value) {
    clearTimeout(autoCollapseTimer.value)
    autoCollapseTimer.value = null
  }
  if (userActivityTimer.value) {
    clearTimeout(userActivityTimer.value)
    userActivityTimer.value = null
  }
}

const startAutoCollapseTimer = () => {
  clearAutoCollapseTimer() // Clear any existing timer first
  autoCollapseTimer.value = setTimeout(() => {
    // Check if user has been inactive for 10 seconds
    const timeSinceLastActivity = Date.now() - lastActivityTime.value
    if (timeSinceLastActivity >= 10000) { // 10 seconds
      showAuth.value = false
      autoCollapseTimer.value = null
    } else {
      // User was active recently, wait for remaining time
      const remainingTime = 10000 - timeSinceLastActivity
      autoCollapseTimer.value = setTimeout(() => {
        showAuth.value = false
        autoCollapseTimer.value = null
      }, remainingTime)
    }
  }, 5000) // Initial 5 seconds, then check activity
}

const resetActivityTimer = () => {
  lastActivityTime.value = Date.now()
  
  // Clear existing activity timer
  if (userActivityTimer.value) {
    clearTimeout(userActivityTimer.value)
  }
  
  // If menu is open and we detect activity, extend the collapse time
  if (showAuth.value) {
    // Clear the main collapse timer and restart it
    if (autoCollapseTimer.value) {
      clearTimeout(autoCollapseTimer.value)
      // Wait 10 seconds from this activity
      autoCollapseTimer.value = setTimeout(() => {
        showAuth.value = false
        autoCollapseTimer.value = null
      }, 10000)
    }
  }
}

const toggleExpandAll = () => {
  allExpanded.value = !allExpanded.value
  forceExpandState.value = allExpanded.value ? 'expand' : 'collapse'
  
  // Reset the force state after a short delay to allow cards to process it
  nextTick(() => {
    setTimeout(() => {
      forceExpandState.value = null
    }, 100)
  })
}

// Reset expansion when manually clearing all filters
watch(filter, (newFilter) => {
  const hasAnyFilter = newFilter.green || newFilter.grey || newFilter.origin || newFilter.shop || newFilter.name
  if (!hasAnyFilter) {
    shouldExpandFromUrl.value = false
  }
}, { deep: true })

// Watch for login state changes to handle auto-expand and auto-collapse
watch(isLoggedIn, (newValue, oldValue) => {
  if (newValue && !oldValue) {
    // User just logged in - expand the menu and start auto-collapse timer
    showAuth.value = true
    nextTick(() => {
      resetActivityTimer()
      startAutoCollapseTimer() // 5 seconds initial, then 10 seconds after activity
    })
  }
  
  // Hide coffee form when logging out
  if (!newValue && oldValue) {
    showCoffeeForm.value = false
  }
})

// Watch tab changes to close forms
watch(selectedIndex, () => {
  showCoffeeForm.value = false
  showShopForm.value = false
})

// Computed properties
const filteredCoffees = computed(() => {
  return coffees.value.filter(coffee => {
    // Container filter logic - if no containers selected, show all
    let containerMatch = true
    if (filter.value.green || filter.value.grey) {
      containerMatch = 
        (filter.value.green && coffee.in_green_container) ||
        (filter.value.grey && coffee.in_grey_container)
    }

    // Origin filter
    const originMatch = !filter.value.origin || coffee.origin === filter.value.origin
    
    // Shop filter
    const shopMatch = !filter.value.shop || coffee.shop_name === filter.value.shop

    // Name filter (real-time search)
    const nameMatch = !filter.value.name || 
      coffee.name.toLowerCase().includes(filter.value.name.toLowerCase())

    return containerMatch && originMatch && shopMatch && nameMatch
  })
})

const totalCoffees = computed(() => coffees.value.length)

const uniqueOrigins = computed(() =>
  [...new Set(coffees.value.map(c => c.origin).filter(Boolean))]
)

const uniqueShops = computed(() =>
  [...new Set(coffees.value.map(c => c.shop_name).filter(Boolean))]
)

const shouldExpandCards = computed(() => {
  return shouldExpandFromUrl.value
})

// Methods
const loadCoffees = async () => {
  try {
    const { data, error } = await supabase
      .from('coffee_beans')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    } else {
      coffees.value = data
    }
  } catch (err) {
    error('Failed to load coffees', 'Please check your connection and try again')
    console.error('Load coffees error:', err)
  }
}

onMounted(async () => {
  const { data: names } = await supabase
    .from('coffee_beans') // Make sure this is the correct table name
    .select('name') // Make sure this is the correct column name
    .order('name')

  if (names) {
    coffeeNames.value = names.map(r => r.name)
  }
  
  loadCoffees()
  window.addEventListener('scroll', handleScroll)
  lastScrollY.value = window.scrollY
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', handleScroll)
  if (autoCollapseTimer.value) {
    clearTimeout(autoCollapseTimer.value)
  }
})

async function loadShops() {
  // 1) pull every bean’s shop fields
  const { data: beans, error } = await supabase
    .from('coffee_beans')
    .select('shop_name, bean_url')
  if (error) {
    console.error('Error loading shops:', error)
    return
  }

  // 2) filter out null/empty
  const valid = beans.filter(
    (b) => b.shop_name && b.bean_url
  )

  // 3) dedupe by shop_name
  const map = new Map()
  valid.forEach((b) => {
    if (!map.has(b.shop_name)) {
      map.set(b.shop_name, b.bean_url)
    }
  })

  // 4) turn into array & sort
  shops.value = Array.from(map, ([shop_name, bean_url]) => ({
    shop_name,
    bean_url
  })).sort((a, b) =>
    a.shop_name.localeCompare(b.shop_name, undefined, { sensitivity: 'base' })
  )
}

onMounted(async () => {
  await loadCoffees()
  await loadShops()
})

const scrollToFirstCard = async () => {
  await nextTick()
  
  setTimeout(() => {
    const firstCard = document.querySelector('[data-coffee-id]') || 
                     document.querySelector('.coffee-card-wrapper')
    
    if (firstCard) {
      const cardTop = firstCard.offsetTop
      window.scrollTo({
        top: Math.max(0, cardTop - 100),
        behavior: 'smooth'
      })
    }
  }, 800)
}

/* const handleAddCoffeeClick = () => {
  if (!isLoggedIn.value) {
    warning('🔒 Please log in first', 'Login required to add coffee')
    return
  }
  
  showCoffeeForm.value = true
} */

function handleAddClick() {
  if (!isLoggedIn.value) return
  if (selectedIndex.value === 0) {
    showCoffeeForm.value = true
  } else if (selectedIndex.value === 2) {
    showShopForm.value = true
  }
}

const handleTabChange = (index) => {
  selectedIndex.value = index
  console.log(`Tab changed to index: ${selectedIndex.value}`)
}

const handleOverlayClick = (event) => {
  // Close form when clicking on the backdrop
  if (event.target === event.currentTarget) {
    closeForms()
  }
}

function closeForms() {
  showCoffeeForm.value = false
  showShopForm.value = false
}

const onUserChanged = (newUser) => {
  user.value = newUser
  isLoggedIn.value = !!newUser

  loadCoffees()
  
  if (!newUser) {
    anyEditing.value = false
    showCoffeeForm.value = false
  }
}

const attemptLogout = async () => {
  if (anyEditing.value) {
    const ok = confirm(
      'You have unsaved changes. Discard them and log out?'
    )
    if (!ok) {
      return
    }
  }

  isLoggedIn.value = false
  anyEditing.value = false 
  user.value = null
  showCoffeeForm.value = false
  
  clearAutoCollapseTimer()
  
  try {
    await supabase.auth.signOut({ scope: 'global' })
    localStorage.removeItem('supabase.auth.token')
    localStorage.removeItem('sb-' + supabase.supabaseKey + '-auth-token')
    sessionStorage.clear()
    
    // Show logout toast
    info('Logged out', 'See you next time!')
    
  } catch (error) {
    console.warn('Error during logout cleanup (but continuing):', error)
    error('Logout error', 'There was an issue logging out, but you\'ve been signed out locally')
  }
  
  showAuth.value = false
  await loadCoffees()
}

const handleNewCoffee = async (newCoffee) => {
  await loadCoffees()
  
  newlyAddedId.value = newCoffee.id
  showCoffeeForm.value = false
  
  success('Coffee added successfully!', `${newCoffee.name} has been saved to your collection`)
  
  await nextTick()
  const newElement = document.querySelector(`[data-coffee-id="${newCoffee.id}"]`)
  if (newElement) {
    newElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
  
  setTimeout(() => {
    newlyAddedId.value = null
  }, 3000)
}

const handleNewShop = async (newShop) => {
  await loadShops()
  
  newlyAddedId.value = newShop.id
  showShopForm.value = false
  
  success('Shop added successfully!', `${newShop.name} has been saved to your collection`)
  
  await nextTick()
  const newElement = document.querySelector(`[data-shop-id="${newShop.id}"]`)
  if (newElement) {
    newElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
  
  setTimeout(() => {
    newlyAddedId.value = null
  }, 3000)
}

const handleFilterChange = (newFilter, isFromUrl = false) => {
  filter.value = { ...newFilter }
  
  // Only expand on URL load with single container (don't reset isInitialUrlLoad yet)
  if (isFromUrl && isInitialUrlLoad.value) {
    const containerCount = (newFilter.green ? 1 : 0) + (newFilter.grey ? 1 : 0)
    const hasOtherFilters = newFilter.origin || newFilter.shop
        
    if (containerCount === 1 && !hasOtherFilters) {
      shouldExpandFromUrl.value = true
      isInitialUrlLoad.value = false // Only reset after successful expansion
    } else if (containerCount === 0) {
      // Don't reset isInitialUrlLoad if no containers yet (waiting for route watcher)
    } else {
      // Multiple containers or other filters - reset flag
      isInitialUrlLoad.value = false
    }
  } else if (!isFromUrl) {
    shouldExpandFromUrl.value = false
    isInitialUrlLoad.value = false // Reset on any manual change
  }
}

// Watch for filtered coffees to become available after URL-based expansion
watch(filteredCoffees, (newFilteredCoffees) => {
  if (shouldExpandFromUrl.value && newFilteredCoffees.length > 0) {
    scrollToFirstCard()
  }
}, { immediate: true })

// ADD: New event handler for coffee updates
const handleCoffeeUpdated = async (updatedCoffee) => {
  // Option 1: Refresh entire list (simple and reliable)
  await loadCoffees()
  
  // Option 2: Update specific item (more efficient)
const index = coffees.value.findIndex(c => c.id === updatedCoffee.id)
  if (index !== -1) {
    coffees.value[index] = updatedCoffee
  }
}

// Track container status
const containerStatus = computed(() => {
  const status = { green: null, grey: null }
  
  coffees.value.forEach(coffee => {
    if (coffee.in_green_container) {
      status.green = coffee
    }
    if (coffee.in_grey_container) {
      status.grey = coffee
    }
  })
  
  return status
})

const handleContainerUpdate = async ({ coffee, container, assign }) => {
  if (assign) {
    const conflicting = coffees.value.find(c =>
      container === 'green' ? c.in_green_container : c.in_grey_container
    )

    if (conflicting && conflicting.id !== coffee.id) {
      // Show toast instead of silent handling
      warning(
        'Container reassigned',
        `${conflicting.name} moved out of ${container} container`
      )
      
      const unassignUpdate = container === 'green'
        ? { in_green_container: false }
        : { in_grey_container: false }

      await supabase
        .from('coffee_beans')
        .update(unassignUpdate)
        .eq('id', conflicting.id)
    }
  }

  const update = {
    in_green_container: container === 'green' ? assign : coffee.in_green_container,
    in_grey_container: container === 'grey' ? assign : coffee.in_grey_container
  }

  try {
    await supabase
      .from('coffee_beans')
      .update(update)
      .eq('id', coffee.id)

    await loadCoffees()
    
    // Show success toast
    const action = assign ? 'assigned to' : 'removed from'
    success(
      `Container ${action} ${coffee.name}`,
      `${container.charAt(0).toUpperCase() + container.slice(1)} container updated`
    )
    
  } catch (err) {
    error('Container update failed', 'Please try again')
    console.error('Container update error:', err)
  }
}

const onEditingChanged = (isNowEditing) => {
  anyEditing.value = anyEditing.value || isNowEditing
}

const handleScroll = () => {
  const currentScrollY = window.scrollY
  
  // Show back to top button after scrolling down 300px
  showBackToTop.value = currentScrollY > 300
  
  // Close auth panel quickly when scrolling (after 1 second delay)
  if (showAuth.value && Math.abs(currentScrollY - lastScrollY.value) > 10) {
    // Clear existing timers
    clearAutoCollapseTimer()
    
    // Set short timer for scroll-based closing (1 second)
    autoCollapseTimer.value = setTimeout(() => {
      showAuth.value = false
      autoCollapseTimer.value = null
    }, 1000) // 1 second when scrolling
  }
  
  lastScrollY.value = currentScrollY
}

const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  })
}
</script>

<style scoped>
.gradient-text {
  background: linear-gradient(to bottom, #8D6E63, #000000);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Z-index layers */
.z-60 {
  z-index: 60;
}

.floating-btn {
  position: fixed;
  transition: all .3s;
}

.floating-btn--disabled {
  pointer-events: none;
  opacity: 0.5;
  cursor: not-allowed;
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

.slide-fade-enter-active {
  transition: all 0.3s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.2s cubic-bezier(1.0, 0.5, 0.8, 1.0);
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateY(-20px) scale(0.95);
  opacity: 0;
}

.new-item {
  animation: highlight 3s ease-in-out;
  position: relative;
}

.new-item::before {
  content: "NEW";
  position: absolute;
  top: 10px;
  right: 10px;
  background: #10b981;
  color: white;
  font-size: 10px;
  font-weight: bold;
  padding: 2px 6px;
  border-radius: 4px;
  z-index: 10;
  animation: fade-out 3s ease-in-out forwards;
}

@keyframes highlight {
  0% { 
    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
    transform: scale(1);
  }
  50% { 
    box-shadow: 0 0 0 20px rgba(16, 185, 129, 0);
    transform: scale(1.02);
  }
  100% { 
    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
    transform: scale(1);
  }
}

@keyframes fade-out {
  0% { opacity: 1; }
  70% { opacity: 1; }
  100% { opacity: 0; }
}

.coffee-list {
  display: grid;
  gap: 1rem;
  padding: 1rem;
}
</style>