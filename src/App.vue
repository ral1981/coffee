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
      v-if="showCoffeeForm"
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
    <div class="flex-1">
      <router-link to="/" class="flex flex-col items-center mb-6 cursor-pointer">
        <img src="./assets/icons/beans_02.svg" alt="Coffee Tracker Logo" class="w-32 h-32 mb-2" />
        <h1 class="text-4xl font-bold">Coffee Tracker</h1>
      </router-link>
    </div>

      <!-- Controls: Filter Panel -->
      <div class="flex flex-col lg:flex-row lg:items-stretch gap-4 mb-6">
        <div class="flex-1">
          <FilterPanel
            :origins="uniqueOrigins"
            :shops="uniqueShops"
            :filtered-count="filteredCoffees.length"
            :total-count="totalCoffees"
            @filter-change="handleFilterChange"
          />
        </div>
      </div>

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

    <!-- Fixed Footer -->
    <footer class="mt-auto pt-8 pb-4 text-center text-sm text-gray-600 dark:text-gray-400">
      <p>© 2025 R.A., all rights reserved unless otherwise noted.</p>
      <p>This site is for personal, non-commercial use to catalog specialty coffee beans at home.</p>
      <p>QR codes are intended for private household use and should not be shared externally.</p>
      <p>
        Licensed under 
        <a href="https://creativecommons.org/licenses/by-nc/4.0/" target="_blank" rel="noopener" class="text-blue-600 dark:text-blue-400 hover:underline">
          CC BY-NC 4.0
        </a>.
      </p>
    </footer>

    <Transition name="fade">
      <button
        v-if="showBackToTop"
        @click="scrollToTop"
        class="fixed bottom-6 right-6 z-50 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-all duration-300 hover:scale-110"
        title="Back to top"
      >
        <ArrowUp class="w-6 h-6" />
      </button>
    </Transition>

    <!-- Expand/Collapse All Button -->
    <button
      @click="toggleExpandAll"
      class="fixed left-6 bottom-24 z-50 bg-white dark:bg-gray-800 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 p-3 border border-gray-200 dark:border-gray-600"
      :title="allExpanded ? 'Collapse All Cards' : 'Expand All Cards'"
    >
      <ChevronDown v-if="allExpanded" class="w-6 h-6 text-gray-700 dark:text-gray-300" />
      <ChevronRight v-else class="w-6 h-6 text-gray-700 dark:text-gray-300" />
    </button>

    <!-- Add Coffee Button -->
    <button
      @click="handleAddCoffeeClick"
      :disabled="!isLoggedIn"
      class="fixed left-6 bottom-6 z-50 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:hover:bg-gray-400 disabled:cursor-not-allowed rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 disabled:scale-100 disabled:shadow-lg p-3"
      :class="{ 'opacity-60': !isLoggedIn }"
      :title="isLoggedIn ? 'Add Coffee' : 'Please log in to add coffee'"
    >
      <Plus class="w-6 h-6 text-white" />
    </button>

  </main>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { supabase } from './lib/supabase'
import Authentication from './components/Authentication.vue'
import CoffeeForm from './components/CoffeeForm.vue'
import FilterPanel from './components/FilterPanel.vue'
import CoffeeCard from './components/CoffeeCard.vue'
import { ArrowUp, Lock, LockOpen, Plus, ChevronDown, ChevronRight } from 'lucide-vue-next'

// Reactive state
const user = ref(null)
const coffees = ref([])
const isLoggedIn = ref(false)
const anyEditing = ref(false)
const filter = ref({ green: false, grey: false, origin: '', shop: '' })
const showBackToTop = ref(false)
const showAuth = ref(false)
const showCoffeeForm = ref(false)
const autoCollapseTimer = ref(null)
const lastScrollY = ref(0)
const userActivityTimer = ref(null)
const lastActivityTime = ref(Date.now())
const allExpanded = ref(false)
const forceExpandState = ref(null)
const newlyAddedId = ref(null)

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

    return containerMatch && originMatch && shopMatch
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
  // Check if we have exactly one container filter and no other filters
  const containerCount = (filter.value.green ? 1 : 0) + (filter.value.grey ? 1 : 0)
  const hasOtherFilters = filter.value.origin || filter.value.shop
  
  return containerCount === 1 && !hasOtherFilters
})

// Methods
const loadCoffees = async () => {
  const { data, error } = await supabase
    .from('coffee_beans')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error(error)
  } else {
    coffees.value = data
  }
}

// Add this method for scrolling to first card
const scrollToFirstCard = async () => {
  await nextTick()
  // Wait a bit more for the card to fully render in expanded state
  setTimeout(() => {
    const firstCard = document.querySelector('[data-coffee-id]')
    if (firstCard) {
      const cardTop = firstCard.offsetTop
      // Scroll to just above the card (accounting for header/spacing)
      window.scrollTo({
        top: cardTop - 20,
        behavior: 'smooth'
      })
    }
  }, 300) // Give time for the expand animation
}

const handleAddCoffeeClick = () => {
  if (!isLoggedIn.value) {
    // Show notification to log in
    alert('Please log in to add coffee entries.')
    return
  }
  
  // Show the form as an overlay
  showCoffeeForm.value = true
}

const handleOverlayClick = (event) => {
  // Close form when clicking on the backdrop
  if (event.target === event.currentTarget) {
    showCoffeeForm.value = false
  }
}

const onUserChanged = (newUser) => {
  user.value = newUser
  isLoggedIn.value = !!newUser

  loadCoffees()
  
  if (!newUser) {
    anyEditing.value = false
    showCoffeeForm.value = false
    // Don't automatically close auth panel when user logs out
    // Let them see the login form again
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

  // Clear the app state immediately to provide instant feedback
  isLoggedIn.value = false
  anyEditing.value = false 
  user.value = null
  showCoffeeForm.value = false
  
  // Clear any running timers
  clearAutoCollapseTimer()
  
  // Enhanced logout: Force sign out with global scope and clear all session data
  try {
    await supabase.auth.signOut({ scope: 'global' })
    
    // Clear all possible storage locations
    localStorage.removeItem('supabase.auth.token')
    localStorage.removeItem('sb-' + supabase.supabaseKey + '-auth-token')
    sessionStorage.clear()
    
  } catch (error) {
    console.warn('Error during logout cleanup (but continuing):', error)
  }
  
  // Close the auth panel
  showAuth.value = false
  
  // Reload coffees to show public view
  await loadCoffees()
}

const handleNewCoffee = async (newCoffee) => {
  // Refresh the entire list to ensure consistency
  await loadCoffees()
  
  // Mark as newly added
  newlyAddedId.value = newCoffee.id
  
  // Hide the form after successful addition
  showCoffeeForm.value = false
  
  // Scroll to new item
  await nextTick()
  const newElement = document.querySelector(`[data-coffee-id="${newCoffee.id}"]`)
  if (newElement) {
    newElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
  
  // Remove "new" highlight after 3 seconds
  setTimeout(() => {
    newlyAddedId.value = null
  }, 3000)
}

const handleFilterChange = (newFilter, isInitialLoad = false) => {
  filter.value = { ...newFilter }
  
  // If this is initial load from URL and we should expand cards, scroll to first card
  if (isInitialLoad && shouldExpandCards.value && filteredCoffees.value.length > 0) {
    scrollToFirstCard()
  }
}

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
      // Don't show another prompt here - the Container component already handled it
      // Just proceed with the unassignment of the conflicting coffee
      
      // Unassign the container from the previously assigned coffee
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

  await supabase
    .from('coffee_beans')
    .update(update)
    .eq('id', coffee.id)

  await loadCoffees()
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

// Lifecycle hooks
onMounted(() => {
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
</script>

<style scoped>
/* Z-index layers */
.z-60 {
  z-index: 60;
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