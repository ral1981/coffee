<template>
  <div class="app-layout">
    <!-- App Header -->
    <AppHeader 
      @profile-click="handleProfile"
      @back-click="handleBack"
      :show-back="route.meta?.showBack || false"
    />

    <!-- Tab Navigation -->
    <TabNavigation 
      v-model="activeTab"
      :tabs="mainTabs"
      @tab-change="handleTabChange"
    />

    <!-- Main Content Area -->
    <main class="main-content">
      <!-- Coffee Form - shows when coffee tab is active and form is triggered -->
      <CoffeeForm
        v-if="showAddCoffeeForm && activeTab === 'coffee'"
        :mode="editingCoffee ? 'edit' : 'add'"
        :initial-data="editingCoffee || {}"
        :fetchCoffees="fetchCoffees"
        @coffee-saved="handleCoffeeSaved"
        @coffee-updated="handleCoffeeUpdated"
        @close="handleFormClose"
        @cancel="handleFormClose"
      />
      
      <!-- Shop Form - shows when shop tab is active and form is triggered -->
      <ShopForm
        v-if="showAddShopForm && activeTab === 'shops'"
        :mode="editingShop ? 'edit' : 'add'"
        :initial-data="editingShop || {}"
        :fetchShops="fetchShops"
        @shop-saved="handleShopSaved"
        @shop-updated="handleShopUpdated"
        @close="handleShopFormClose"
        @cancel="handleShopFormClose"
      />
      
      <!-- Add Container Form - shows when container tab is active and form is triggered -->
      <ContainerForm
        v-if="showAddContainerForm && activeTab === 'containers'"
        :mode="editingContainer ? 'edit' : 'add'"
        :initial-data="editingContainer || {}"
        :fetchContainers="fetchContainers"
        @container-saved="handleContainerSaved"
        @container-updated="handleContainerUpdated"
        @close="handleContainerFormClose"
        @cancel="handleContainerFormClose"
      />

      <!-- Regular router content -->
      <router-view v-slot="{ Component }">
        <keep-alive>
          <component 
            :is="Component" 
            :key="$route.fullPath"
            :highlighted-coffee-id="newlyAddedCoffeeId"
            :highlighted-shop-id="newlyAddedShopId"
            :highlighted-container-id="newlyAddedContainerId"
            :expanded-cards="expandedCards"
            @edit-coffee="handleEditCoffee"
            @edit-shop="handleEditShop"
            @edit-container="handleEditContainer"
            @trigger-add-form="handleTriggerAddForm"
            @trigger-add-shop="handleTriggerAddShop"
            @trigger-add-container="handleTriggerAddContainer"
            @card-expand="handleCardExpand"
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

    <!-- Expand/Collapse All Cards Floating Button -->
    <Transition name="fade">
      <button
        v-if="showExpandCollapseButton"
        @click="toggleExpandAll"
        :disabled="isFormOpen || !hasExpandableCards"
        :class="[
          'expand-collapse-fab',
          {
            'expand-collapse-fab--disabled': isFormOpen || !hasExpandableCards,
            'expand-collapse-fab--active': !isFormOpen && hasExpandableCards,
            'expand-collapse-fab--visible': hasExpandableCards
          }
        ]"
        :title="allExpanded ? 'Collapse All Cards' : 'Expand All Cards'"
        :aria-label="allExpanded ? 'Collapse All Cards' : 'Expand All Cards'"
      >
        <ChevronDown v-if="allExpanded" class="expand-collapse-icon" />
        <ChevronRight v-else class="expand-collapse-icon" />
      </button>
    </Transition>

    <!-- Floating Action Button -->
    <FloatingActionButton 
      v-if="!showAddCoffeeForm && !showAddShopForm && !showAddContainerForm"
      @click="handleAddNew"
      :icon="getFabIcon"
      :aria-label="getFabTitle"
      :disabled="!isLoggedIn"
    />

    <!-- Toast Container -->
    <ToastContainer />
  </div>
</template>

<script setup>
console.log('AppLayout script running')

import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppHeader from '../layout/AppHeader.vue'
import TabNavigation from '../layout/TabNavigation.vue'
import FloatingActionButton from '../shared/FloatingActionButton.vue'
import CoffeeForm from '../coffee/CoffeeForm.vue'
import ToastContainer from '../shared/ToastContainer.vue'
import { useTabNavigation } from '../../composables/useTabNavigation'
import { useCoffeeData } from '../../composables/useCoffeeData'
import { Plus, PackagePlus, Store, ArrowUp, ChevronDown, ChevronRight } from 'lucide-vue-next'
import ShopForm from '../shops/ShopForm.vue'
import { useShops } from '../../composables/useShops'
import { useAuth } from '../../composables/useAuth'
import { useToast } from '../../composables/useToast'
import StorePlusIcon from '../shared/StorePlusIcon.vue'
import ContainerForm from '../containers/ContainerForm.vue'
import { useContainers } from '../../composables/useContainers'

const route = useRoute()
const router = useRouter()

// Use the new tab navigation composable
const { activeTab, tabs: mainTabs, setActiveTab } = useTabNavigation()

// Use coffee data composable for fetching and card expansion
const { 
  fetchCoffees, 
  addCoffeeToList, 
  highlightCoffee, 
  expandedCards, 
  toggleCardExpansion,
  filteredCoffees
} = useCoffeeData()

// Use shops composable for fetching
const { fetchShops, addShopToList, highlightShop } = useShops()

// Use containers composable
const { fetchContainers, addContainerToList, highlightContainer, containers } = useContainers()

// Use useAuth composable for authentication
const { isLoggedIn, user } = useAuth()

// Use Toast notifications
const { warning } = useToast()

// Form state management
const showAddCoffeeForm = ref(false)
const showAddShopForm = ref(false)
const editingCoffee = ref(null)
const editingShop = ref(null)
const newlyAddedCoffeeId = ref(null)
const newlyAddedShopId = ref(null)
const showAddContainerForm = ref(false)
const editingContainer = ref(null)
const newlyAddedContainerId = ref(null)

// Track card being edited
const editingCoffeePosition = ref(null)
const editingContainerPosition = ref(null)

// Back to top button
const showBackToTop = ref(false)

// Expand/Collapse All Cards Functionality
const expandAllTimer = ref(null)

// Computed properties for expand/collapse functionality
const isFormOpen = computed(() => 
  showAddCoffeeForm.value || showAddShopForm.value || showAddContainerForm.value
)

const hasExpandableCards = computed(() => {
  // Check if current route has expandable cards
  switch (route.path) {
    case '/coffee':
    case '/':
      return filteredCoffees.value && filteredCoffees.value.length > 0
    case '/containers':
      return containers.value && containers.value.length > 0
    case '/shops':
      // Shops typically don't have expandable cards
      return false
    default:
      // Handle nested routes
      if (route.path.startsWith('/coffee')) {
        return filteredCoffees.value && filteredCoffees.value.length > 0
      } else if (route.path.startsWith('/containers')) {
        return containers.value && containers.value.length > 0
      }
      return false
  }
})

const showExpandCollapseButton = computed(() => {
  return hasExpandableCards.value && !route.path.startsWith('/shops')
})

const allExpanded = computed(() => {
  if (!hasExpandableCards.value) return false
  
  const relevantCards = getCurrentTabCards()
  if (relevantCards.length === 0) return false
  
  return relevantCards.every(card => expandedCards.value.has(card.id))
})

const getCurrentTabCards = () => {
  // Get cards based on the current route/tab
  switch (route.path) {
    case '/coffee':
    case '/':
      return filteredCoffees.value || []
    case '/containers':
      return containers.value || []
    case '/shops':
      // Shops typically don't have expandable cards
      return []
    default:
      // Handle nested routes
      if (route.path.startsWith('/coffee')) {
        return filteredCoffees.value || []
      } else if (route.path.startsWith('/containers')) {
        return containers.value || []
      } else if (route.path.startsWith('/shops')) {
        return []
      }
      return []
  }
}

// Expand/Collapse All functionality
const toggleExpandAll = () => {
  if (!hasExpandableCards.value) return
  
  const relevantCards = getCurrentTabCards()
  if (relevantCards.length === 0) return
  
  // Clear any existing timer
  if (expandAllTimer.value) {
    clearTimeout(expandAllTimer.value)
    expandAllTimer.value = null
  }
  
  if (allExpanded.value) {
    // Collapse all cards
    collapseAllCards(relevantCards)
  } else {
    // Expand all cards
    expandAllCards(relevantCards)
  }
}

const expandAllCards = (cards) => {
  let delay = 0
  const increment = 50 // 50ms delay between each card
  
  cards.forEach((card, index) => {
    setTimeout(() => {
      if (!expandedCards.value.has(card.id)) {
        toggleCardExpansion(card.id)
      }
    }, delay)
    delay += increment
  })
}

const collapseAllCards = (cards) => {
  let delay = 0
  const increment = 30 // Faster collapse
  
  cards.forEach((card, index) => {
    setTimeout(() => {
      if (expandedCards.value.has(card.id)) {
        toggleCardExpansion(card.id)
      }
    }, delay)
    delay += increment
  })
}

const handleScroll = () => {
  showBackToTop.value = window.scrollY > 200
}

const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  })
}

// Handle card expansion from child components
const handleCardExpand = (cardId) => {
  toggleCardExpansion(cardId)
}

// Computed FAB properties based on active tab
const getFabIcon = computed(() => {
  const icons = {
    coffee: Plus,
    containers: PackagePlus,
    shops: StorePlusIcon
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

const handleTabChange = async (tabId) => {
  // Close any open forms when switching tabs
  if (showAddCoffeeForm.value) handleFormClose()
  if (showAddShopForm.value) handleShopFormClose()
  if (showAddContainerForm.value) handleContainerFormClose()
  
  // Navigate to the corresponding route
  const tab = mainTabs.value.find(t => t.id === tabId)
  if (tab && tab.route) {
    try {
      await router.push(tab.route)
      setActiveTab(tabId)
    } catch (error) {
      console.error(`Failed to navigate to tab '${tabId}':`, error)
    }
  }
}

const handleAddNew = () => {
  if (!isLoggedIn.value) {
    warning('Please log in to add items')
    return
  }

  switch (activeTab.value) {
    case 'coffee':
      handleTriggerAddForm()
      break
    case 'containers':
      handleTriggerAddContainer()
      break
    case 'shops':
      handleTriggerAddShop()
      break
    default:
      handleTriggerAddForm()
  }
}

// Coffee form handlers
const handleTriggerAddForm = () => {
  editingCoffee.value = null
  showAddCoffeeForm.value = true
  window.history.pushState(null, '', window.location.href)
}

const handleEditCoffee = (coffee) => {
  console.log('🎯 Starting edit for coffee:', coffee.name)
  
  // Store the coffee being edited and its current scroll position
  editingCoffee.value = coffee
  editingCoffeePosition.value = {
    coffeeId: coffee.id,
    scrollPosition: window.scrollY
  }
  
  // Open the form
  showAddCoffeeForm.value = true
  window.history.pushState(null, '', window.location.href)
  
  // Scroll to top of page to show the edit form
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  })
  
  console.log('📝 Edit form opened, scrolled to top')
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
  console.log('✅ Coffee updated:', updatedCoffee.name)
  
  // Refresh the coffee list
  await fetchCoffees()
  
  // Close the form
  handleFormClose()
  
  // Highlight the updated coffee
  highlightCoffee(updatedCoffee.id)
  
  // Scroll back to the coffee card after a short delay
  setTimeout(() => {
    scrollToCoffeeCard(updatedCoffee.id, 'Coffee updated successfully!')
  }, 100)
}

const handleFormClose = () => {
  console.log('📝 Form closing...')
  
  // Store the coffee ID before clearing edit state
  const coffeeId = editingCoffee.value?.id
  
  // Close the form and clear editing state
  showAddCoffeeForm.value = false
  editingCoffee.value = null
  
  // If we were editing a coffee and user cancelled, scroll back to it
  if (coffeeId && editingCoffeePosition.value?.coffeeId === coffeeId) {
    setTimeout(() => {
      scrollToCoffeeCard(coffeeId, 'Edit cancelled')
    }, 100)
  }
  
  // Clear the position reference
  editingCoffeePosition.value = null
}

// Utility to scroll to a specific coffee card
const scrollToCoffeeCard = (coffeeId, message = '') => {
  console.log('🎯 Scrolling to coffee card:', coffeeId)
  
  // Use nextTick to ensure DOM is updated
  nextTick(() => {
    // Try multiple selectors to find the coffee card
    const selectors = [
      `[data-coffee-id="${coffeeId}"]`,
      `[data-id="${coffeeId}"]`,
      `.coffee-card[data-coffee-id="${coffeeId}"]`
    ]
    
    let coffeeElement = null
    
    for (const selector of selectors) {
      coffeeElement = document.querySelector(selector)
      if (coffeeElement) break
    }
    
    if (coffeeElement) {
      // Scroll to the coffee card with some offset for better visibility
      const offset = 100 // Space from top for header/tabs
      const elementTop = coffeeElement.getBoundingClientRect().top + window.scrollY
      const scrollToPosition = Math.max(0, elementTop - offset)
      
      window.scrollTo({
        top: scrollToPosition,
        behavior: 'smooth'
      })
      
      console.log('📍 Scrolled to coffee card:', coffeeId)
      if (message) {
        console.log('💬 Message:', message)
      }
    } else {
      console.warn('⚠️ Could not find coffee card element for:', coffeeId)
      console.log('Available coffee cards:', document.querySelectorAll('[data-coffee-id]'))
    }
  })
}

// Shop form handlers
const handleTriggerAddShop = () => {
  editingShop.value = null
  showAddShopForm.value = true
  window.history.pushState(null, '', window.location.href)
}

const handleEditShop = (shop) => {
  editingShop.value = shop
  showAddShopForm.value = true
  window.history.pushState(null, '', window.location.href)
}

const handleShopSaved = async (savedShop) => {
  console.log('🎉 Shop saved in AppLayout:', savedShop)
  
  // Validate that we have a complete shop object
  if (!savedShop || !savedShop.bean_url) {
    console.error('❌ Invalid shop object received:', savedShop)
    return
  }
  
  // Store the newly added shop ID for highlighting
  newlyAddedShopId.value = savedShop.bean_url
  
  console.log('➕ Adding shop to GLOBAL list via composable...')
  
  // Add to GLOBAL list immediately - this should trigger reactivity in ShopsView
  addShopToList(savedShop)
  
  console.log('✨ Highlighting newly added shop...')
  
  // Highlight the newly added shop
  highlightShop(savedShop.bean_url)
  
  // Close the form
  handleShopFormClose()
  
  // Clear the highlight reference after 5 seconds
  setTimeout(() => {
    if (newlyAddedShopId.value === savedShop.bean_url) {
      console.log('🧹 Clearing highlight reference')
      newlyAddedShopId.value = null
    }
  }, 5000)
}

const handleShopUpdated = async (updatedShop) => {
  console.log('Shop updated:', updatedShop)
  
  // Refresh the shops list
  await fetchShops()
  
  // Close the form
  handleShopFormClose()
  
  // Highlight the updated shop
  highlightShop(updatedShop.bean_url)
}

const handleShopFormClose = () => {
  showAddShopForm.value = false
  editingShop.value = null
}

// Container form handlers
const handleTriggerAddContainer = () => {
  editingContainer.value = null
  showAddContainerForm.value = true
  window.history.pushState(null, '', window.location.href)
}

const handleEditContainer = (container) => {
  console.log('🎯 Starting edit for container:', container.name)
  
  // Store the container being edited and its current scroll position
  editingContainer.value = container
  editingContainerPosition.value = {
    containerId: container.id,
    scrollPosition: window.scrollY
  }
  
  // Open the form
  showAddContainerForm.value = true
  window.history.pushState(null, '', window.location.href)
  
  // Scroll to top of page to show the edit form
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  })
  
  console.log('📝 Container edit form opened, scrolled to top')
}

const handleContainerSaved = async (savedContainer) => {
  console.log('🎉 Container saved in AppLayout:', savedContainer)
  
  // Validate that we have a complete container object
  if (!savedContainer || !savedContainer.id) {
    console.error('❌ Invalid container object received:', savedContainer)
    return
  }
  
  // Store the newly added container ID for highlighting
  newlyAddedContainerId.value = savedContainer.id
  
  console.log('➕ Adding container to GLOBAL list via composable...')
  
  // Add to GLOBAL list immediately - this should trigger reactivity in ContainersView
  addContainerToList(savedContainer)
  
  console.log('✨ Highlighting newly added container...')
  
  // Highlight the newly added container
  highlightContainer(savedContainer.id)
  
  // Close the form
  handleContainerFormClose()
  
  // Clear the highlight reference after 5 seconds
  setTimeout(() => {
    if (newlyAddedContainerId.value === savedContainer.id) {
      console.log('🧹 Clearing highlight reference')
      newlyAddedContainerId.value = null
    }
  }, 5000)
}

const handleContainerUpdated = async (updatedContainer) => {
  console.log('✅ Container updated:', updatedContainer.name)
  
  // Refresh the containers list
  await fetchContainers()
  
  // Close the form
  handleContainerFormClose()
  
  // Highlight the updated container
  highlightContainer(updatedContainer.id)
  
  // Scroll back to the container card after a short delay
  setTimeout(() => {
    scrollToContainerCard(updatedContainer.id, 'Container updated successfully!')
  }, 100)
}

const handleContainerFormClose = () => {
  console.log('📝 Container form closing...')
  
  // Store the container ID before clearing edit state
  const containerId = editingContainer.value?.id
  
  // Close the form and clear editing state
  showAddContainerForm.value = false
  editingContainer.value = null
  
  // If we were editing a container and user cancelled, scroll back to it
  if (containerId && editingContainerPosition.value?.containerId === containerId) {
    setTimeout(() => {
      scrollToContainerCard(containerId, 'Edit cancelled')
    }, 100)
  }
  
  // Clear the position reference
  editingContainerPosition.value = null
}

const scrollToContainerCard = (containerId, message = '') => {
  console.log('🎯 Scrolling to container card:', containerId)
  
  // Use nextTick to ensure DOM is updated
  nextTick(() => {
    // Try multiple selectors to find the container card
    const selectors = [
      `[data-container-id="${containerId}"]`,
      `[data-id="${containerId}"]`,
      `.container-card[data-container-id="${containerId}"]`
    ]
    
    let containerElement = null
    
    for (const selector of selectors) {
      containerElement = document.querySelector(selector)
      if (containerElement) break
    }
    
    if (containerElement) {
      // Scroll to the container card with some offset for better visibility
      const offset = 100 // Space from top for header/tabs
      const elementTop = containerElement.getBoundingClientRect().top + window.scrollY
      const scrollToPosition = Math.max(0, elementTop - offset)
      
      window.scrollTo({
        top: scrollToPosition,
        behavior: 'smooth'
      })
      
      console.log('📍 Scrolled to container card:', containerId)
      if (message) {
        console.log('💬 Message:', message)
      }
    } else {
      console.warn('⚠️ Could not find container card element for:', containerId)
      console.log('Available container cards:', document.querySelectorAll('[data-container-id]'))
    }
  })
}

// Sync active tab with route changes
watch(() => route.path, (newPath) => {
  // Map routes to tabs
  const routeToTab = {
    '/': 'coffee',
    '/coffee': 'coffee',
    '/containers': 'containers',
    '/shops': 'shops'
  }
  
  const pathTab = routeToTab[newPath] || newPath.split('/')[1] || 'coffee'
  if (mainTabs.value.some(tab => tab.id === pathTab)) {
    setActiveTab(pathTab)
  }
}, { immediate: true })

// Close form when navigating away from tabs
watch(() => route.path, (newPath, oldPath) => {
  // Close forms when navigating away from the appropriate routes
  if (oldPath?.startsWith('/coffee') && !newPath.startsWith('/coffee')) {
    handleFormClose()
  }
  if (oldPath?.startsWith('/shops') && !newPath.startsWith('/shops')) {
    handleShopFormClose()
  }
  if (oldPath?.startsWith('/containers') && !newPath.startsWith('/containers')) {
    handleContainerFormClose()
  }
})

// Handle browser back button when form is open
const handlePopState = () => {
  if (showAddCoffeeForm.value) {
    handleFormClose()
  }
  if (showAddShopForm.value) {
    handleShopFormClose()
  }
  if (showAddContainerForm.value) {
    handleContainerFormClose()
  }
}

onMounted(() => {
  console.log('AppLayout mounted, setting up event listeners')
  window.addEventListener('scroll', handleScroll)
  window.addEventListener('popstate', handlePopState)
})

onUnmounted(() => {
  console.log('AppLayout unmounting, cleaning up event listeners')
  window.removeEventListener('scroll', handleScroll)
  window.removeEventListener('popstate', handlePopState)
  
  // Clean up any expand/collapse timers
  if (expandAllTimer.value) {
    clearTimeout(expandAllTimer.value)
  }
})
</script>

<style scoped>
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

.app-layout {
  font-family: var(--font-family);
  line-height: 1.6;
  color: var(--text-primary);
  background-color: var(--background);
  min-height: 100vh;
  position: relative;
}

/* Main layout */
.main-content {
  min-height: calc(100vh - var(--header-height) - var(--tab-height));
  background-color: var(--background);
  position: relative;
  padding-bottom: 100px; /* Space for FABs */
}

/* Back to top button */
.back-to-top {
  position: fixed;
  bottom: 4rem;
  left: 2rem;
  width: var(--fab-size);
  height: var(--fab-size);
  background: var(--card-background);
  color: var(--text-secondary);
  border: 2px solid var(--primary-green);
  border-radius: 50%;
  box-shadow: 0 6px 20px rgba(34, 197, 94, 0.3);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 40;
  outline: none;
}

.back-to-top:hover {
  color: var(--primary-green);
  border-color: var(--primary-green);
  transform: scale(1.1);
  box-shadow: 0 8px 25px rgba(34, 197, 94, 0.4);
}

.back-to-top:active {
  transform: scale(0.95);
}

.back-to-top-icon {
  width: 24px;
  height: 24px;
  color: var(--primary-green);
  transition: transform 0.2s ease;
}

/* Expand/Collapse All Floating Action Button */
.expand-collapse-fab {
  position: fixed;
  bottom: 10rem;
  left: 2rem;
  width: var(--fab-size);
  height: var(--fab-size);
  background: var(--card-background);
  color: var(--text-secondary);
  border: 2px solid var(--primary-green);
  border-radius: 50%;
  box-shadow: 0 6px 20px rgba(34, 197, 94, 0.3);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 45;
  outline: none;
}

.expand-collapse-fab--visible {
  border-color: var(--primary-green);
  box-shadow: 0 6px 20px rgba(34, 197, 94, 0.3);
}

.expand-collapse-fab--active:hover {
  color: var(--text-primary);
  border-color: var(--primary-green);
  transform: scale(1.1);
  box-shadow: 0 8px 25px rgba(34, 197, 94, 0.4);
  background: var(--card-background);
}

.expand-collapse-fab--active:active {
  transform: scale(0.95);
}

.expand-collapse-fab--disabled {
  opacity: 0.4;
  cursor: not-allowed;
  transform: none !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-color: var(--border-medium);
  color: var(--text-tertiary);
}

.expand-collapse-fab--disabled:hover {
  transform: none !important;
  border-color: var(--border-medium);
  color: var(--text-tertiary);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.expand-collapse-icon {
  width: 24px;
  height: 24px;
  transition: transform 0.2s ease;
}

.expand-collapse-fab--active .expand-collapse-icon {
  color: var(--primary-green);
}

.expand-collapse-fab--disabled .expand-collapse-icon {
  color: var(--text-tertiary);
}

/* Animations */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .expand-collapse-fab {
    bottom: 8rem;
    left: 1rem;
    width: 48px;
    height: 48px;
  }
  
  .expand-collapse-icon {
    width: 20px;
    height: 20px;
  }
  
  .back-to-top {
    bottom: 3rem;
    left: 1rem;
    width: 48px;
    height: 48px;
  }
  
  .back-to-top-icon {
    width: 18px;
    height: 18px;
  }

  .expand-collapse-icon,
  .back-to-top-icon {
    width: 20px;
    height: 20px;
  }
}

@media (max-width: 480px) {
  .expand-collapse-fab {
    bottom: 7rem;
    left: 0.75rem;
    width: 44px;
    height: 44px;
  }
  
  .back-to-top {
    bottom: 2.5rem;
    left: 0.75rem;
    width: 44px;
    height: 44px;
  }
  
  .expand-collapse-icon,
  .back-to-top-icon {
    width: 18px;
    height: 18px;
  }
  
  .expand-collapse-icon {
    width: 18px;
    height: 18px;
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .expand-collapse-fab {
    border-width: 2px;
  }
  
  .expand-collapse-fab--active {
    border-color: var(--primary-green);
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .expand-collapse-fab,
  .back-to-top,
  .expand-collapse-icon {
    transition: none;
  }
  
  .expand-collapse-fab--active:hover {
    transform: none;
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .expand-collapse-fab {
    background: #374151;
    border-color: #4b5563;
    color: #d1d5db;
  }
  
  .expand-collapse-fab--active:hover {
    background: #4b5563;
    border-color: var(--primary-green);
    color: #f3f4f6;
  }
  
  .back-to-top {
    background: #374151;
    border-color: var(--primary-green);
    color: var(--primary-green);
  }
  
  .back-to-top:hover {
    background: #4b5563;
    color: var(--primary-green);
  }
  
  .back-to-top-icon {
    color: var(--primary-green);
  }
}
</style>