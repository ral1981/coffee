<template>
  <div class="app-container">
    <!-- Mobile-first header -->
    <AppHeader 
      @profile-click="handleProfile"
      @back-click="handleBack"
      :title="headerTitle"
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

    <!-- Floating Action Button -->
    <FloatingActionButton 
      v-if="!showAddCoffeeForm"
      @click="handleAddNew"
      :icon="getFabIcon"
      :title="getFabTitle"
    />

    <!-- Toast Container -->
    <ToastContainer />
  </div>
</template>

<script setup>
console.log('AppLayout script running')

import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppHeader from '../layout/AppHeader.vue'
import TabNavigation from '../layout/TabNavigation.vue'
import FloatingActionButton from '../shared/FloatingActionButton.vue'
import CoffeeForm from '../coffee/CoffeeForm.vue'
import { useTabNavigation } from '../../composables/useTabNavigation'
import { useCoffeeData } from '../../composables/useCoffeeData'

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

// Computed header title based on active tab
const headerTitle = computed(() => {
  const currentTab = mainTabs.value.find(tab => tab.id === activeTab.value)
  return currentTab?.label || 'Coffee Tracker'
})

// Computed FAB properties based on active tab
const getFabIcon = computed(() => {
  const icons = {
    coffee: 'plus',
    containers: 'package-plus',
    shops: 'store-plus'
  }
  return icons[activeTab.value] || 'plus'
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

// Cleanup on unmount
import { onUnmounted } from 'vue'
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
  padding: 0 1rem;
  padding-bottom: 6rem; /* Space for FAB */
  width: 100%;
  position: relative;
}

/* Form overlay styling */
.main-content:has(.coffee-form) {
  /* When form is present, adjust spacing if needed */
}

/* Responsive adjustments */
@media (min-width: 768px) {
  .main-content {
    padding: 0 2rem;
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
</style>