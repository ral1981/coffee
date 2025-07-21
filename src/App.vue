<template>
  <main class="min-h-screen bg-gray-35 dark:bg-white dark:text-gray-900 p-6 relative">
    <!-- Backdrop to close menu when clicking outside -->
    <div 
      v-if="showAuth"
      @click="closeAuth"
      class="fixed inset-0 z-40 bg-black bg-opacity-20"
    ></div>

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

    <div class="flex flex-col items-center mb-6">
      <Coffee class="w-12 h-12 text-amber-700 mb-2" />
      <h1 class="text-4xl font-bold">Coffee Tracker</h1>
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
    <div class="mt-6">
      <div class="mb-6 flex justify-center">
        <button
          v-if="!showCoffeeForm"
          @click="showCoffeeForm = true"
          :disabled="!isLoggedIn"
          class="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:hover:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-all duration-200 hover:scale-105 shadow-md hover:shadow-lg disabled:scale-100 disabled:shadow-md flex items-center justify-center gap-2 px-4 py-3"
          :class="{ 'opacity-60': !isLoggedIn }"
          :title="isLoggedIn ? 'Add Coffee' : 'Please log in to add coffee'"
        >
          <Plus class="w-5 h-5" />
          <span>Add Coffee</span>
        </button>
      </div>
      <div class="mb-6 flex justify-center"></div>
        <CoffeeForm
          v-if="showCoffeeForm"
          :user="user"
          @coffee-added="handleNewCoffee"
          @cancel="showCoffeeForm = false"
          class="w-full lg:w-2/3 xl:w-1/2"
        />
      </div>
    <!-- Coffee Cards Grid -->
    <div class="grid grid-cols-1 gap-4 mt-6 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 items-start">
      <CoffeeCard
        v-for="coffee in filteredCoffees"
        :key="coffee.id"
        :coffee="coffee"
        :class="{ 'new-item': coffee.id === newlyAddedId }"
        :isLoggedIn="isLoggedIn"
        :containerStatus="containerStatus"
        @editing-changed="onEditingChanged"
        @update-container="handleContainerUpdate"
        @deleted="loadCoffees"
        @saved="loadCoffees"
      />
    </div>
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
  </main>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { supabase } from './lib/supabase'
import Authentication from './components/Authentication.vue'
import CoffeeForm from './components/CoffeeForm.vue'
import FilterPanel from './components/FilterPanel.vue'
import CoffeeCard from './components/CoffeeCard.vue'
import { ArrowUp, Coffee, Lock, LockOpen, Plus } from 'lucide-vue-next'

// Reactive state
const user = ref(null)
const coffees = ref([])
const isLoggedIn = ref(false)
const anyEditing = ref(false)
const newlyAddedId = ref(null)
const containerStatus = ref({})
const filter = ref({ green: false, grey: false, origin: '', shop: '' })
const showBackToTop = ref(false)
const showAuth = ref(false)
const showCoffeeForm = ref(false)
const autoCollapseTimer = ref(null)
const lastScrollY = ref(0)
const userActivityTimer = ref(null)
const lastActivityTime = ref(Date.now())

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

const handleAddCoffeeClick = () => {
  if (!isLoggedIn.value) {
    // Show notification to log in
    alert('Please log in to add coffee entries.')
    return
  }
  
  // Always show the form directly (don't toggle)
  showCoffeeForm.value = true
  
  // Scroll to form when opening
  nextTick(() => {
    const formElement = document.querySelector('.coffee-form') || document.querySelector('form')
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  })
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

const setupActivityListeners = () => {
  // Listen for activity in the auth panel
  const authPanel = document.querySelector('[data-auth-panel]')
  if (authPanel) {
    ['keydown', 'keyup', 'input', 'click', 'focus'].forEach(eventType => {
      authPanel.addEventListener(eventType, resetActivityTimer, true)
    })
  }
}

const cleanupActivityListeners = () => {
  const authPanel = document.querySelector('[data-auth-panel]')
  if (authPanel) {
    ['keydown', 'keyup', 'input', 'click', 'focus'].forEach(eventType => {
      authPanel.removeEventListener(eventType, resetActivityTimer, true)
    })
  }
}

const handleNewCoffee = async (newCoffee) => {
  // Add to beginning of list for immediate visibility
  coffees.value.unshift(newCoffee)
  
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

const handleFilterChange = (newFilter) => {
  console.log('[App] Filter changed:', newFilter)
  filter.value = { ...newFilter }
}

const handleContainerUpdate = async ({ coffee, container, assign }) => {
  if (assign) {
    const conflicting = coffees.value.find(c =>
      container === 'green' ? c.in_green_container : c.in_grey_container
    )

    if (conflicting && conflicting.id !== coffee.id) {
      const confirmText = `Container "${container}" is already used by "${conflicting.name}". Replace it?`
      if (!confirm(confirmText)) return

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