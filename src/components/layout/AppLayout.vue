<template>
  <div class="app-container">
    <!-- Mobile-first header -->
    <AppHeader 
      @profile-click="handleProfile"
      @back-click="handleBack"
    />
    
    <!-- Tab navigation -->
    <TabNavigation 
      v-model="activeTab" 
      :tabs="mainTabs"
      @tab-change="handleTabChange"
    />
    
    <!-- Dynamic content with keep-alive for performance -->
    <main class="main-content">
      <!-- Add Coffee Form - shows when coffee tab is active and form is triggered -->
      <CoffeeForm
        v-if="showAddCoffeeForm && activeTab === 'coffee'"
        :mode="'add'"
        :fetchCoffees="fetchCoffees"
        @coffee-saved="handleCoffeeSaved"
        @coffee-updated="handleCoffeeUpdated"
        @close="handleFormClose"
        @cancel="handleFormClose"
      />
      
      <!-- Regular router content -->
      <router-view v-slot="{ Component }">
        <keep-alive>
          <component 
            :is="Component" 
            :key="$route.fullPath"
            :highlighted-coffee-id="newlyAddedCoffeeId"
            @edit-coffee="handleEditCoffee"
            @trigger-add-form="handleTriggerAddForm"
          />
        </keep-alive>
      </router-view>
    </main>

    <!-- Back to Top Button -->
    <Transition name="fade">
      <button 
        v-if="showBackToTop"
        @click="scrollToTop"
        class="back-to-top"
        aria-label="Back to top"
      >
        <ArrowUp class="back-to-top-icon" />
      </button>
    </Transition>

    <!-- Floating Action Button -->
    <FloatingActionButton 
      v-if="!showAddCoffeeForm"
      @click="handleAddNew"
      :icon="getFabIcon"
      :aria-label="getFabTitle"
    />

    <!-- Toast Container -->
    <ToastContainer />
  </div>
</template>

<script setup>
console.log('AppLayout script running')

import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppHeader from '../layout/AppHeader.vue'
import TabNavigation from '../layout/TabNavigation.vue'
import FloatingActionButton from '../shared/FloatingActionButton.vue'
import CoffeeForm from '../coffee/CoffeeForm.vue'
import ToastContainer from '../shared/ToastContainer.vue'
import { useTabNavigation } from '../../composables/useTabNavigation'
import { useCoffeeData } from '../../composables/useCoffeeData'
import { Plus, PackagePlus, Store, ArrowUp } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()

// Use the new tab navigation composable
const { activeTab, tabs: mainTabs, setActiveTab } = useTabNavigation()

// Use coffee data composable for fetching
const { fetchCoffees, coffees, addCoffeeToList, highlightCoffee } = useCoffeeData()

// Form state management
const showAddCoffeeForm = ref(false)
const editingCoffee = ref(null)
const newlyAddedCoffeeId = ref(null)

// Back to top button
const showBackToTop = ref(false)

const handleScroll = () => {
  showBackToTop.value = window.scrollY > 100
}

const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  })
}

// Computed FAB properties based on active tab
const getFabIcon = computed(() => {
  const icons = {
    coffee: Plus,
    containers: PackagePlus,
    shops: Store
  }
  return icons[activeTab.value] || Plus
})

const getFabTitle = computed(() => {
  const titles = {
    coffee: 'Add Coffee',
    containers: 'Add Container',
    shops: 'Add Shop'
  }
  return titles[activeTab.value] || 'Add New'
})

// Event handlers
const handleProfile = () => {
  // Navigate to profile or open profile modal
  router.push('/profile')
}

const handleBack = () => {
  // Handle back navigation
  if (window.history.length > 1) {
    router.go(-1)
  } else {
    router.push('/')
  }
}

const handleTabChange = (tabId) => {
  // Close any open forms when switching tabs
  handleFormClose()
  
  setActiveTab(tabId)
  // Navigate to the corresponding route
  router.push(`/${tabId}`)
}

const handleAddNew = () => {
  if (activeTab.value === 'coffee') {
    // Show the coffee form instead of navigating
    handleTriggerAddForm()
  } else {
    // For other tabs, navigate to new routes
    const routes = {
      containers: '/containers/new',
      shops: '/shops/new'
    }
    
    const newRoute = routes[activeTab.value]
    if (newRoute) {
      router.push(newRoute)
    }
  }
}

// Coffee form handlers
const handleTriggerAddForm = () => {
  editingCoffee.value = null
  showAddCoffeeForm.value = true
}

const handleEditCoffee = (coffee) => {
  editingCoffee.value = coffee
  showAddCoffeeForm.value = true
}

const handleCoffeeSaved = async (savedCoffee) => {
  console.log('🎉 Coffee saved in AppLayout:', savedCoffee)
  
  // Validate that we have a complete coffee object
  if (!savedCoffee || !savedCoffee.id) {
    console.error('❌ Invalid coffee object received:', savedCoffee)
    return
  }
  
  // Store the newly added coffee ID for highlighting
  newlyAddedCoffeeId.value = savedCoffee.id
  
  console.log('➕ Adding coffee to GLOBAL list via composable...')
  
  // Add to GLOBAL list immediately - this should trigger reactivity in CoffeeListView
  addCoffeeToList(savedCoffee)
  
  console.log('✨ Highlighting newly added coffee...')
  
  // Highlight the newly added coffee
  highlightCoffee(savedCoffee.id)
  
  // Close the form
  handleFormClose()
  
  // Clear the highlight reference after 5 seconds
  setTimeout(() => {
    if (newlyAddedCoffeeId.value === savedCoffee.id) {
      console.log('🧹 Clearing highlight reference')
      newlyAddedCoffeeId.value = null
    }
  }, 5000)
}

const handleCoffeeUpdated = async (updatedCoffee) => {
  console.log('Coffee updated:', updatedCoffee)
  
  // Refresh the coffee list
  await fetchCoffees()
  
  // Close the form
  handleFormClose()
  
  // Highlight the updated coffee
  highlightCoffee(updatedCoffee.id)
}

const handleFormClose = () => {
  showAddCoffeeForm.value = false
  editingCoffee.value = null
}

// Sync active tab with route changes
watch(() => route.path, (newPath) => {
  const pathTab = newPath.split('/')[1] || 'coffee'
  if (mainTabs.value.some(tab => tab.id === pathTab)) {
    setActiveTab(pathTab)
  }
}, { immediate: true })

// Close form when navigating away from coffee tab
watch(activeTab, (newTab, oldTab) => {
  if (oldTab === 'coffee' && newTab !== 'coffee') {
    handleFormClose()
  }
})

// Handle browser back button when form is open
const handlePopState = () => {
  if (showAddCoffeeForm.value) {
    handleFormClose()
  }
}

onMounted(() => {
  // Add event listener for browser back button
  window.addEventListener('popstate', handlePopState)
  
  // Initial data fetch
  fetchCoffees()
})

// Back to top
onMounted(() => {
  window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})

// Cleanup on unmount
onUnmounted(() => {
  window.removeEventListener('popstate', handlePopState)
})
</script>

<style scoped>
.app-container {
  min-height: 100vh;
  background-color: var(--background, #f5f5f5);
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
  padding-bottom: 6rem;
  width: 100%;
  box-sizing: border-box;
  overflow-x: hidden;
}

.main-content > * {
  max-width: 100%;
  box-sizing: border-box;
}

/* Form overlay styling */
.main-content:has(.coffee-form) {
  /* When form is present, adjust spacing if needed */
}

/* Responsive adjustments */
@media (min-width: 768px) {
  .main-content {
    padding: 1.5rem 2rem;
    padding-bottom: 6rem;
  }
}

/* Animation for form appearance */
.coffee-form {
  animation: slideInUp 0.3s ease-out;
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Back to top */
.back-to-top {
  position: fixed;
  bottom: 2rem;
  left: 2rem;
  width: 48px;
  height: 48px;
  background: var(--card-background, #ffffff);
  color: var(--text-secondary, #666);
  border: 1px solid var(--border-light, #e5e5e5);
  border-radius: 50%;
  box-shadow: var(--shadow-lg, 0 8px 25px rgba(0, 0, 0, 0.15));
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
}

.back-to-top:hover {
  color: var(--text-primary, #333);
  border-color: var(--border-medium, #d1d5db);
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg, 0 12px 30px rgba(0, 0, 0, 0.2));
}

.back-to-top-icon {
  width: 20px;
  height: 20px;
}
</style>