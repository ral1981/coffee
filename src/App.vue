<template>
  <div id="app">
    <!-- New UI with feature flag -->
    <AppLayout v-if="flags.newUI" />
    
    <!-- Old UI fallback -->
    <div v-else class="old-ui max-w-full overflow-x-hidden">
      <main class="min-h-screen bg-gray-35 dark:bg-white dark:text-gray-900 p-6 relative flex flex-col max-w-full overflow-x-hidden">
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
              @shop-saved="handleNewShop"
              @cancel="closeForms"
            />
          </div>
        </div>

        <!-- Container Form Overlay -->
        <div 
          v-if="selectedIndex === 1 && showContainerForm"
          @click="handleOverlayClick"
          class="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-start justify-center pt-8 px-4"
        >
          <div @click.stop class="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <ContainerForm
              :user="user"
              :fetch-containers="loadContainers"
              @container-saved="handleNewContainer"
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
        <div class="flex flex-col lg:flex-row lg:items-stretch gap-4 max-w-full">
          <div class="w-full max-w-6xl mx-auto">
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
                  <TabPanels class="p-0">
                    
                    <!-- Filters panel -->
                    <TabPanel>
                      <FilterPanel
                        :origins="uniqueOrigins"
                        :shops="uniqueShops"
                        :names="coffeeNames"
                        :containers="containers"
                        :filtered-count="filteredCoffees.length"
                        :total-count="totalCoffees"
                        @filter-change="handleFilterChange"
                      />
                      
                      <!-- Coffee Cards Grid -->
                      <div class="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 items-start">
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
                    
                    <!-- Containers panel -->
                    <TabPanel>
                      <div class="flex flex-wrap justify-center gap-4 px-4 py-4">
                        <ContainerCard
                          v-for="container in containers"
                          :key="container.id"
                          :container="container"
                          :class="{ 'new-item': container.id === newlyAddedId }"
                          :is-logged-in="isLoggedIn"
                          :fetch-containers="loadContainers"
                          @deleted="loadContainers"
                          @container-updated="handleContainerUpdated"
                          @view-coffees="handleViewContainerCoffees"
                        />
                      </div>
                    </TabPanel>
                    
                    <!-- Shops panel -->
                    <TabPanel>
                      <div class="flex flex-wrap justify-center gap-4  px-4 py-4">
                        <ShopCard
                          v-for="shop in shops"
                          :key="shop.bean_url"
                          :shop="shop"
                          :is-logged-in="isLoggedIn"
                          @deleted="handleShopDeleted"
                        />
                      </div>
                    </TabPanel>
                  </TabPanels>
                </TabGroup>
              </div>
            </div>
          </div>
        </div>

        <!-- Add Button -->
        <button 
          @click="handleAddClick"
          class="fixed bottom-6 right-6 w-14 h-14 bg-green-500 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 justify-center z-50"
          :title="fabTitle"
          :disabled="anyEditing"
          style="position: fixed !important; z-index: 9999 !important;"
        >
          <PlusIcon class="w-6 h-6 mx-auto" />
        </button>

        <Transition name="fade">
          <button
            v-if="showBackToTop"
            @click="scrollToTop"
            :disabled="showCoffeeForm || showContainerForm"
            :class="[
              'floating-btn bottom-6 right-6',
              (showCoffeeForm || showContainerForm) ? 'z-10 floating-btn--disabled' : 'z-50',
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
      <router-view />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { TabGroup, TabList, Tab, TabPanels, TabPanel } from '@headlessui/vue'
import { useRouter } from 'vue-router'
import { ArrowUp, Lock, LockOpen, PlusIcon, ChevronDown, ChevronRight } from 'lucide-vue-next'

// New UI Components
import AppLayout from './components/layout/AppLayout.vue'

// Old UI Components (conditionally imported)
import { supabase } from './lib/supabase'
import { useToast } from './composables/useToast'
import ToastContainer from './components/ToastContainer.vue'
import Authentication from './components/Authentication.vue'
import CoffeeForm from './components/CoffeeForm.vue'
import ShopForm from './components/ShopForm.vue'
import FilterPanel from './components/FilterPanel.vue'
import CoffeeCard from './components/CoffeeCard.vue'
import ShopCard from './components/ShopCard.vue'
import ContainerCard from './components/ContainerCard.vue'
import ContainerForm from './components/ContainerForm.vue'

// Composables
import { useFeatureFlags } from './composables/useFeatureFlags'
import { useAuth } from './composables/useAuth'

console.log('App.vue script is running')

// Initialize auth
const { initAuthListener } = useAuth()
onMounted(() => {
  console.log('App.vue mounted')
  initAuthListener()
})

// Feature flags
const { flags } = useFeatureFlags()

// Router
const router = useRouter()

// Toast notifications
const { success, error, warning, info } = useToast()

// Only initialize old UI state if we're using the old UI
// Reactive state for old UI
const user = ref(null)
const coffees = ref([])
const shops = ref([])
const isLoggedIn = ref(false)
const anyEditing = ref(false)
const filter = ref({ 
  containers: [],
  origin: '', 
  shop: '', 
  name: '' 
})
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
const selectedIndex = ref(0)
const showContainerForm = ref(false)
const containers = ref([])
const fabTitle = computed(() => {
  if (selectedIndex.value === 0) return 'Add Coffee'
  if (selectedIndex.value === 1) return 'Add Container'
  if (selectedIndex.value === 2) return 'Add Shop'
  return 'Add New'
})

// Authentication methods for old UI
const toggleAuth = () => {
  showAuth.value = !showAuth.value
  
  clearAutoCollapseTimer()
  
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
  clearAutoCollapseTimer()
  autoCollapseTimer.value = setTimeout(() => {
    const timeSinceLastActivity = Date.now() - lastActivityTime.value
    if (timeSinceLastActivity >= 10000) {
      showAuth.value = false
      autoCollapseTimer.value = null
    } else {
      const remainingTime = 10000 - timeSinceLastActivity
      autoCollapseTimer.value = setTimeout(() => {
        showAuth.value = false
        autoCollapseTimer.value = null
      }, remainingTime)
    }
  }, 5000)
}

const resetActivityTimer = () => {
  lastActivityTime.value = Date.now()
  
  if (userActivityTimer.value) {
    clearTimeout(userActivityTimer.value)
  }
  
  if (showAuth.value) {
    if (autoCollapseTimer.value) {
      clearTimeout(autoCollapseTimer.value)
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
  
  nextTick(() => {
    setTimeout(() => {
      forceExpandState.value = null
    }, 100)
  })
}

// Watch for login state changes
watch(isLoggedIn, (newValue, oldValue) => {
  if (newValue && !oldValue) {
    showAuth.value = true
    nextTick(() => {
      resetActivityTimer()
      startAutoCollapseTimer()
    })
  }
  
  if (!newValue && oldValue) {
    showCoffeeForm.value = false
    showContainerForm.value = false
  }
})

// Watch tab changes to close forms
watch(selectedIndex, () => {
  showCoffeeForm.value = false
  showContainerForm.value = false
  showShopForm.value = false
})

// Watch filter changes
watch(filter, (newFilter) => {
  const hasAnyFilter = newFilter.green || newFilter.grey || newFilter.origin || newFilter.shop || newFilter.name
  if (!hasAnyFilter) {
    shouldExpandFromUrl.value = false
  }
}, { deep: true })

// Computed properties for old UI
const filteredCoffees = computed(() => {
  return coffees.value.filter(coffee => {
    let containerMatch = true
    if (filter.value.containers && filter.value.containers.length > 0) {
      if (coffee.containerAssignments && coffee.containerAssignments.length > 0) {
        containerMatch = filter.value.containers.some(containerId => 
          coffee.containerAssignments.includes(containerId)
        )
      } else {
        containerMatch = false
      }
    }

    const originMatch = !filter.value.origin || coffee.origin === filter.value.origin
    const shopMatch = !filter.value.shop || coffee.shop_name === filter.value.shop
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

// Methods for old UI
const loadCoffees = async () => {
  try {
    const { data, error } = await supabase
      .from('coffee_beans')
      .select(`
        *,
        coffee_container_assignments(
          container_id,
          containers(
            id,
            name,
            color
          )
        )
      `)
      .order('created_at', { ascending: false })

    if (error) throw error

    coffees.value = (data || []).map(coffee => ({
      ...coffee,
      containerAssignments: coffee.coffee_container_assignments?.map(a => a.container_id) || [],
      containerDetails: coffee.coffee_container_assignments?.map(a => a.containers) || []
    }))

  } catch (err) {
    console.error('Load coffees error:', err)
    error('Failed to load coffees', 'Please check your connection and try again')
    coffees.value = []
  }
}

const loadShops = async () => {
  const { data: shops_data, error } = await supabase
    .from('shops')
    .select('id, name, url')
  
  if (error) {
    console.error('Error loading shops:', error)
    return
  }

  shops.value = shops_data
    .filter(shop => shop.name && shop.url)
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }))
}

const loadContainers = async () => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    let query = supabase
      .from('containers')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: true })

    if (user) {
      query = query.in('user_id', [user.id, 'system'])
    } else {
      query = query.eq('user_id', 'system')
    }

    const { data, error } = await query

    if (error) {
      throw error
    } else {
      containers.value = data || []
    }
  } catch (err) {
    error('Failed to load containers', 'Please check your connection and try again')
    console.error('Load containers error:', err)
    containers.value = []
  }
}

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

const handleAddClick = () => {
  if (!isLoggedIn.value) return
  if (selectedIndex.value === 0) {
    showCoffeeForm.value = true
  } else if (selectedIndex.value === 1) {
    showContainerForm.value = true
  } else if (selectedIndex.value === 2) {
    showShopForm.value = true
  }
}

const handleShopDeleted = (shopId) => {
  shops.value = shops.value.filter(shop => shop.id !== shopId)
}

const handleTabChange = (index) => {
  selectedIndex.value = index
  console.log(`Tab changed to index: ${selectedIndex.value}`)
}

const handleOverlayClick = (event) => {
  if (event.target === event.currentTarget) {
    closeForms()
  }
}

const closeForms = () => {
  showCoffeeForm.value = false
  showContainerForm.value = false
  showShopForm.value = false
}

const onUserChanged = (newUser) => {
  user.value = newUser
  isLoggedIn.value = !!newUser

  loadCoffees()
  loadContainers()
  
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
  newlyAddedId.value = newShop.id
  
  await nextTick()
  const newElement = document.querySelector(`[data-shop-id="${newShop.id}"]`)
  if (newElement) {
    newElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
  
  setTimeout(() => {
    newlyAddedId.value = null
  }, 3000)
}

const handleNewContainer = async (newContainer) => {
  await loadContainers()
  
  newlyAddedId.value = newContainer.id
  showContainerForm.value = false
  
  success('Container added successfully!', `${newContainer.name} has been added to your containers`)
  
  await nextTick()
  const newElement = document.querySelector(`[data-container-id="${newContainer.id}"]`)
  if (newElement) {
    newElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
  
  setTimeout(() => {
    newlyAddedId.value = null
  }, 3000)
}

const handleFilterChange = (newFilter, isFromUrl = false) => {
  filter.value = { ...newFilter }
  
  if (isFromUrl && isInitialUrlLoad.value) {
    const containerCount = newFilter.containers?.length || 0
    const hasOtherFilters = newFilter.origin || newFilter.shop
        
    if (containerCount === 1 && !hasOtherFilters) {
      shouldExpandFromUrl.value = true
      isInitialUrlLoad.value = false
    } else if (containerCount === 0) {
      // No containers selected
    } else {
      isInitialUrlLoad.value = false
    }
  } else if (!isFromUrl) {
    shouldExpandFromUrl.value = false
    isInitialUrlLoad.value = false
  }
}

const handleCoffeeUpdated = async (updatedCoffee) => {
  await loadCoffees()
  
  const index = coffees.value.findIndex(c => c.id === updatedCoffee.id)
  if (index !== -1) {
    coffees.value[index] = updatedCoffee
  }
}

const handleContainerUpdate = async ({ coffee, container, assign }) => {
  try {
    if (assign) {
      await loadCoffees()
    } else {
      await loadCoffees()
    }
    
    const action = assign ? 'assigned to' : 'removed from'
    success(
      `Container ${action} ${coffee.name}`,
      `${container.name} container updated`
    )
    
  } catch (err) {
    error('Container update failed', 'Please try again')
    console.error('Container update error:', err)
  }
}

const handleContainerUpdated = async (updatedContainer) => {
  await loadContainers()
  
  const index = containers.value.findIndex(c => c.id === updatedContainer.id)
  if (index !== -1) {
    containers.value[index] = updatedContainer
  }
}

const handleViewContainerCoffees = (container) => {
  selectedIndex.value = 0
  
  const containerName = container.name.toLowerCase()
  
  router.push({
    path: '/coffee/',
    query: { container: containerName }
  }).catch(() => {
    const newFilter = {
      containers: [container.id],
      origin: '',
      shop: '',
      name: ''
    }
    
    filter.value = newFilter
    handleFilterChange(newFilter, false)
  })
  
  success(
    `Viewing ${container.name} coffees`,
    `Filtering for coffees in ${container.name} container`
  )
}

const onEditingChanged = (isNowEditing) => {
  anyEditing.value = anyEditing.value || isNowEditing
}

const handleScroll = () => {
  const currentScrollY = window.scrollY
  
  showBackToTop.value = currentScrollY > 300
  
  if (showAuth.value && Math.abs(currentScrollY - lastScrollY.value) > 10) {
    const authPanel = document.querySelector('[data-auth-panel]')
    const activeElement = document.activeElement
    const isUsingAuthPanel = authPanel && (
      authPanel.contains(activeElement) || 
      authPanel.matches(':hover') ||
      activeElement.closest('[data-auth-panel]')
    )
    
    if (!isUsingAuthPanel) {
      clearAutoCollapseTimer()
      
      autoCollapseTimer.value = setTimeout(() => {
        showAuth.value = false
        autoCollapseTimer.value = null
      }, 1000)
    }
  }
  
  lastScrollY.value = currentScrollY
}

const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  })
}

// Watch for filtered coffees to become available after URL-based expansion
watch(filteredCoffees, (newFilteredCoffees) => {
  if (shouldExpandFromUrl.value && newFilteredCoffees.length > 0) {
    scrollToFirstCard()
  }
}, { immediate: true })

// Lifecycle hooks
onMounted(async () => {
  // Load coffee names for old UI
  const { data: names } = await supabase
    .from('coffee_beans')
    .select('name')
    .order('name')

  if (names) {
    coffeeNames.value = names.map(r => r.name)
  }
  
  // Load data for old UI if not using new UI
  if (!flags.newUI) {
    await loadCoffees()
    await loadShops()
    await loadContainers()
    
    window.addEventListener('scroll', handleScroll)
    lastScrollY.value = window.scrollY
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', handleScroll)
  if (autoCollapseTimer.value) {
    clearTimeout(autoCollapseTimer.value)
  }
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

/* Force Inter font globally */
* {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
}

/* Target specific Tailwind/component classes */
.bg-white, .rounded-lg, .p-1, .py-2, .px-4 {
  font-family: 'Inter', sans-serif !important;
}

/* Fix tab styles specifically */
.ui-selected\\:bg-blue-600 {
  font-family: 'Inter', sans-serif !important;
}

/* CSS Variables for design system */
:root {
  --font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --primary-green: #22c55e;
  --primary-green-hover: #16a34a;
  --background: #f8fafc;
  --card-background: #ffffff;
  --border-light: #e2e8f0;
  --border-medium: #cbd5e1;
  --text-primary: #1e293b;
  --text-secondary: #64748b;
  --text-tertiary: #94a3b8;
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --header-height: 80px;
  --tab-height: 64px;
  --fab-size: 56px;
}

/* Ensure proper mobile viewport */
html {
  width: 100%;
  overflow-x: hidden;
}

/* Fix any flex containers that might cause overflow */
.flex {
  min-width: 0;
}

/* Ensure cards don't overflow */
.bg-white, .card, [class*="card"] {
  max-width: 100%;
  overflow: hidden;
  word-wrap: break-word;
}

/* Fix button positioning */
.fixed {
  position: fixed !important;
}

/* Ensure FAB is always visible */
.z-50 {
  z-index: 50 !important;
}

/* Global styles */
* {
  box-sizing: border-box;
}

/* Fix layout containment */
.old-ui {
  width: 100%;
  max-width: 100vw;
  overflow-x: hidden;
}

.old-ui main {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding-left: 1.5rem;
  padding-right: 1.5rem;
  box-sizing: border-box;
}

/* Override Tailwind grid to prevent overflow */
.grid {
  max-width: 100%;
  overflow: hidden;
}

/* Fix card containers */
.flex.flex-col.lg\\:flex-row {
  max-width: 100%;
  overflow: hidden;
}

/* Ensure tab panels don't overflow */
.w-full.bg-white {
  max-width: 100%;
  overflow: hidden;
  box-sizing: border-box;
}

#app {
  font-family: var(--font-family);
  line-height: 1.6;
  color: var(--text-primary);
  background-color: var(--background);
  min-height: 100vh;
}

/* Main layout */
.app-main {
  min-height: 100vh;
  background-color: var(--background);
  position: relative;
  padding-bottom: 100px; /* Space for FAB */
}

.backdrop {
  position: fixed;
  inset: 0;
  z-index: 40;
  background-color: rgba(0, 0, 0, 0.2);
}

/* Form overlays */
.form-overlay {
  position: fixed;
  inset: 0;
  z-index: 50;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 2rem 1rem;
  overflow-y: auto;
}

.form-container {
  width: 100%;
  max-width: 42rem;
  max-height: 90vh;
  overflow-y: auto;
  background: var(--card-background);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
}

/* Header */
.app-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: var(--card-background);
  border-bottom: 1px solid var(--border-light);
  box-shadow: var(--shadow-sm);
  height: var(--header-height);
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem 1.5rem;
  height: 100%;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.app-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
  letter-spacing: -0.025em;
}

/* Auth container */
.auth-container {
  position: relative;
}

.auth-btn {
  background: #f1f5f9;
  border: none;
  border-radius: 50%;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

.auth-btn:hover {
  background: #e2e8f0;
  transform: scale(1.05);
}

.auth-btn.logged-in {
  background: var(--primary-green);
  box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);
}

.auth-btn.logged-in:hover {
  background: var(--primary-green-hover);
  box-shadow: 0 6px 16px rgba(34, 197, 94, 0.4);
}

.auth-icon {
  width: 20px;
  height: 20px;
  color: var(--text-secondary);
  transition: color 0.3s;
}

.logged-in-icon {
  color: white;
}

.auth-panel {
  position: absolute;
  top: calc(100% + 0.75rem);
  right: 0;
  width: 320px;
  background: var(--card-background);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  z-index: 110;
}

/* Tab navigation */
.tab-navigation {
  position: sticky;
  top: var(--header-height);
  z-index: 90;
  background: var(--card-background);
  border-bottom: 1px solid var(--border-light);
  height: var(--tab-height);
}

.tab-list {
  display: flex;
  max-width: 1200px;
  margin: 0 auto;
  height: 100%;
}

.tab-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  border: none;
  background: none;
  padding: 0.75rem 1rem;
  cursor: pointer;
  color: var(--text-secondary);
  font-weight: 500;
  font-size: 0.875rem;
  position: relative;
  transition: all 0.2s ease;
  min-width: 0;
}

.tab-item:hover {
  color: var(--text-primary);
  background: #f8fafc;
}

.tab-item.active {
  color: var(--primary-green);
  font-weight: 600;
}

.tab-item.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: var(--primary-green);
  border-radius: 2px 2px 0 0;
}

.tab-icon {
  width: 20px;
  height: 20px;
}

.tab-label {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tab-badge {
  position: absolute;
  top: 0.5rem;
  right: 0.75rem;
  background: var(--primary-green);
  color: white;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.125rem 0.375rem;
  border-radius: 10px;
  min-width: 18px;
  text-align: center;
  line-height: 1.2;
}

/* Content wrapper */
.content-wrapper {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1.5rem;
}

.tab-content {
  width: 100%;
}

.tab-panel {
  width: 100%;
}

.content-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  gap: 1rem;
}

.content-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.content-actions {
  display: flex;
  gap: 0.75rem;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--border-medium);
  border-radius: var(--radius-md);
  background: var(--card-background);
  color: var(--text-secondary);
  font-weight: 500;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-btn:hover {
  border-color: var(--border-medium);
  color: var(--text-primary);
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

.action-btn.secondary {
  background: #f8fafc;
}

.action-icon {
  width: 16px;
  height: 16px;
}

/* Grids */
.coffee-grid,
.container-grid,
.shop-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
  width: 100%;
}

/* Floating Action Button */
.fab {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  width: var(--fab-size);
  height: var(--fab-size);
  background: var(--primary-green);
  color: white;
  border: none;
  border-radius: 50%;
  box-shadow: var(--shadow-lg);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 60;
}

.fab:hover:not(:disabled) {
  background: var(--primary-green-hover);
  transform: scale(1.1);
  box-shadow: 0 8px 25px rgba(34, 197, 94, 0.3);
}

.fab:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.fab-icon {
  width: 24px;
  height: 24px;
}

/* Back to top button */
.back-to-top {
  position: fixed;
  bottom: 6rem;
  right: 2rem;
  width: 48px;
  height: 48px;
  background: var(--card-background);
  color: var(--text-secondary);
  border: 1px solid var(--border-light);
  border-radius: 50%;
  box-shadow: var(--shadow-md);
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
}

.back-to-top:hover {
  color: var(--text-primary);
  border-color: var(--border-medium);
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.back-to-top-icon {
  width: 20px;
  height: 20px;
}

/* Transitions */
.slide-fade-enter-active {
  transition: all 0.3s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.2s cubic-bezier(1.0, 0.5, 0.8, 1.0);
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateY(-10px) scale(0.95);
  opacity: 0;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Responsive Design */
@media (max-width: 768px) {
  :root {
    --header-height: 64px;
    --tab-height: 56px;
    --fab-size: 52px;
  }

  .header-content {
    padding: 0.75rem 1rem;
  }

  .app-title {
    font-size: 1.5rem;
  }

  .auth-btn {
    width: 44px;
    height: 44px;
  }

  .auth-panel {
    width: calc(100vw - 2rem);
    right: -1rem;
  }

  .tab-item {
    padding: 0.5rem;
    font-size: 0.8125rem;
  }

  .tab-icon {
    width: 18px;
    height: 18px;
  }

  .content-wrapper {
    padding: 1rem;
  }

  .content-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .coffee-grid,
  .container-grid,
  .shop-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .fab {
    bottom: 1.5rem;
    right: 1.5rem;
  }

  .back-to-top {
    bottom: 5rem;
    right: 1.5rem;
    width: 44px;
    height: 44px;
  }

  .form-overlay {
    padding: 1rem 0.5rem;
  }

  .form-container {
    border-radius: var(--radius-lg);
  }
}

@media (max-width: 480px) {
  .app-title {
    font-size: 1.25rem;
  }

  .tab-item {
    gap: 0.125rem;
  }

  .tab-label {
    font-size: 0.75rem;
  }

  .content-title {
    font-size: 1.25rem;
  }

  .coffee-grid,
  .container-grid,
  .shop-grid {
    grid-template-columns: 1fr;
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  :root {
    --background: #0f172a;
    --card-background: #1e293b;
    --border-light: #334155;
    --border-medium: #475569;
    --text-primary: #f1f5f9;
    --text-secondary: #cbd5e1;
    --text-tertiary: #64748b;
  }

  .auth-btn {
    background: #334155;
  }

  .auth-btn:hover {
    background: #475569;
  }

  .tab-item:hover {
    background: #1e293b;
  }

  .action-btn.secondary {
    background: #1e293b;
  }

  .back-to-top {
    background: #1e293b;
    border-color: #334155;
  }
}

/* Performance optimizations */
.coffee-grid,
.container-grid,
.shop-grid {
  will-change: transform;
}

.fab,
.back-to-top,
.auth-btn {
  will-change: transform;
}

/* Accessibility improvements */
.fab:focus-visible,
.back-to-top:focus-visible,
.auth-btn:focus-visible,
.tab-item:focus-visible,
.action-btn:focus-visible {
  outline: 2px solid var(--primary-green);
  outline-offset: 2px;
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  :root {
    --border-light: #000000;
    --border-medium: #000000;
    --shadow-sm: 0 2px 4px 0 rgb(0 0 0 / 0.3);
    --shadow-md: 0 4px 8px 0 rgb(0 0 0 / 0.3);
    --shadow-lg: 0 8px 16px 0 rgb(0 0 0 / 0.3);
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}

/* Print styles */
@media print {
  .fab,
  .back-to-top,
  .auth-panel,
  .form-overlay {
    display: none !important;
  }

  .app-main {
    background: white !important;
    color: black !important;
  }

  .coffee-grid,
  .container-grid,
  .shop-grid {
    grid-template-columns: repeat(2, 1fr) !important;
    gap: 1rem !important;
  }
}

/* Animation keyframes */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

@keyframes bounce {
  0%, 20%, 53%, 80%, 100% {
    animation-timing-function: cubic-bezier(0.215, 0.610, 0.355, 1.000);
    transform: translate3d(0,0,0);
  }
  40%, 43% {
    animation-timing-function: cubic-bezier(0.755, 0.050, 0.855, 0.060);
    transform: translate3d(0, -30px, 0);
  }
  70% {
    animation-timing-function: cubic-bezier(0.755, 0.050, 0.855, 0.060);
    transform: translate3d(0, -15px, 0);
  }
  90% {
    transform: translate3d(0,-4px,0);
  }
}

/* Loading states */
.loading {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

/* Utility classes */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.text-truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.visually-hidden {
  position: absolute !important;
  width: 1px !important;
  height: 1px !important;
  padding: 0 !important;
  margin: -1px !important;
  overflow: hidden !important;
  clip: rect(0, 0, 0, 0) !important;
  white-space: nowrap !important;
  border: 0 !important;
}
</style>