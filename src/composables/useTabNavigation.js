import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Coffee, Package, Store } from 'lucide-vue-next'

/**
 * Composable for managing tab navigation state and behavior
 * Provides centralized tab management with route synchronization
 */
export function useTabNavigation() {
  const route = useRoute()
  const router = useRouter()

  // Reactive state
  const activeTab = ref('coffee')
  const tabHistory = ref([])
  
  // Main application tabs configuration
  const tabs = ref([
    {
      id: 'coffee',
      label: 'Coffee',
      icon: Coffee,
      route: '/coffee',
      badge: 0,
      disabled: false,
      meta: {
        title: 'Coffee List',
        description: 'Browse and manage your coffee collection'
      }
    },
    {
      id: 'containers',
      label: 'Containers',
      icon: Package,
      route: '/containers',
      badge: 0,
      disabled: false,
      meta: {
        title: 'Containers',
        description: 'Manage your coffee storage containers'
      }
    },
    {
      id: 'shops',
      label: 'Shops',
      icon: Store,
      route: '/shops',
      badge: 0,
      disabled: false,
      meta: {
        title: 'Coffee Shops',
        description: 'Browse coffee shops and roasters'
      }
    }
  ])

  // Computed properties
  const visibleTabs = computed(() => 
    tabs.value.filter(tab => !tab.hidden && !tab.disabled)
  )

  const currentTab = computed(() => 
    tabs.value.find(tab => tab.id === activeTab.value)
  )

  const currentTitle = computed(() => 
    currentTab.value?.meta?.title || currentTab.value?.label || 'Coffee Tracker'
  )

  const currentRoute = computed(() => 
    currentTab.value?.route || '/'
  )

  const hasNextTab = computed(() => {
    const currentIndex = visibleTabs.value.findIndex(tab => tab.id === activeTab.value)
    return currentIndex < visibleTabs.value.length - 1
  })

  const hasPreviousTab = computed(() => {
    const currentIndex = visibleTabs.value.findIndex(tab => tab.id === activeTab.value)
    return currentIndex > 0
  })

  // Tab management functions
  const setActiveTab = (tabId) => {
    const tab = tabs.value.find(t => t.id === tabId)
    
    if (!tab) {
      console.warn(`Tab with id '${tabId}' not found`)
      return false
    }

    if (tab.disabled) {
      console.warn(`Tab '${tabId}' is disabled`)
      return false
    }

    // Add to history if it's a different tab
    if (activeTab.value !== tabId) {
      addToHistory(activeTab.value)
    }

    activeTab.value = tabId
    return true
  }

  const goToNextTab = () => {
    const currentIndex = visibleTabs.value.findIndex(tab => tab.id === activeTab.value)
    if (currentIndex < visibleTabs.value.length - 1) {
      const nextTab = visibleTabs.value[currentIndex + 1]
      setActiveTab(nextTab.id)
      return nextTab.id
    }
    return null
  }

  const goToPreviousTab = () => {
    const currentIndex = visibleTabs.value.findIndex(tab => tab.id === activeTab.value)
    if (currentIndex > 0) {
      const prevTab = visibleTabs.value[currentIndex - 1]
      setActiveTab(prevTab.id)
      return prevTab.id
    }
    return null
  }

  const goBackInHistory = () => {
    if (tabHistory.value.length > 0) {
      const previousTab = tabHistory.value.pop()
      activeTab.value = previousTab
      return previousTab
    }
    return null
  }

  // Badge management
  const setBadge = (tabId, count) => {
    const tab = tabs.value.find(t => t.id === tabId)
    if (tab) {
      tab.badge = Math.max(0, count)
    }
  }

  const incrementBadge = (tabId, increment = 1) => {
    const tab = tabs.value.find(t => t.id === tabId)
    if (tab) {
      tab.badge = Math.max(0, (tab.badge || 0) + increment)
    }
  }

  const clearBadge = (tabId) => {
    setBadge(tabId, 0)
  }

  const clearAllBadges = () => {
    tabs.value.forEach(tab => {
      tab.badge = 0
    })
  }

  // Tab configuration management
  const updateTabConfig = (tabId, updates) => {
    const tabIndex = tabs.value.findIndex(t => t.id === tabId)
    if (tabIndex !== -1) {
      tabs.value[tabIndex] = { ...tabs.value[tabIndex], ...updates }
    }
  }

  const enableTab = (tabId) => {
    updateTabConfig(tabId, { disabled: false })
  }

  const disableTab = (tabId) => {
    updateTabConfig(tabId, { disabled: true })
    
    // If current tab is being disabled, switch to first available tab
    if (activeTab.value === tabId) {
      const firstAvailable = visibleTabs.value.find(tab => !tab.disabled)
      if (firstAvailable) {
        setActiveTab(firstAvailable.id)
      }
    }
  }

  const showTab = (tabId) => {
    updateTabConfig(tabId, { hidden: false })
  }

  const hideTab = (tabId) => {
    updateTabConfig(tabId, { hidden: true })
  }

  // Route synchronization
  const syncWithRoute = (routePath = route.path) => {
    const matchedTab = tabs.value.find(tab => {
      if (tab.route === routePath) return true
      
      // Handle nested routes (e.g., /coffee/123 matches /coffee)
      if (routePath.startsWith(tab.route + '/') && tab.route !== '/') {
        return true
      }
      
      return false
    })

    if (matchedTab && matchedTab.id !== activeTab.value) {
      activeTab.value = matchedTab.id
    } else if (!matchedTab && routePath === '/') {
      // Default to coffee tab for root route
      activeTab.value = 'coffee'
    }
  }

  const navigateToTab = async (tabId) => {
    const tab = tabs.value.find(t => t.id === tabId)
    if (!tab || tab.disabled) return false

    try {
      await router.push(tab.route)
      setActiveTab(tabId)
      return true
    } catch (error) {
      console.error(`Failed to navigate to tab '${tabId}':`, error)
      return false
    }
  }

  // History management
  const addToHistory = (tabId) => {
    // Limit history size to prevent memory issues
    if (tabHistory.value.length >= 10) {
      tabHistory.value.shift()
    }
    tabHistory.value.push(tabId)
  }

  const clearHistory = () => {
    tabHistory.value = []
  }

  // Utility functions
  const getTabById = (tabId) => {
    return tabs.value.find(tab => tab.id === tabId)
  }

  const isTabActive = (tabId) => {
    return activeTab.value === tabId
  }

  const getTabIndex = (tabId) => {
    return visibleTabs.value.findIndex(tab => tab.id === tabId)
  }

  // Keyboard navigation support
  const handleKeyboardNavigation = (event) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return

    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault()
        goToPreviousTab()
        break
      case 'ArrowRight':
        event.preventDefault()
        goToNextTab()
        break
      case 'Home':
        event.preventDefault()
        if (visibleTabs.value.length > 0) {
          setActiveTab(visibleTabs.value[0].id)
        }
        break
      case 'End':
        event.preventDefault()
        if (visibleTabs.value.length > 0) {
          setActiveTab(visibleTabs.value[visibleTabs.value.length - 1].id)
        }
        break
    }
  }

  // Watchers for route synchronization
  watch(() => route.path, (newPath) => {
    syncWithRoute(newPath)
  }, { immediate: true })

  // Initialize with current route
  syncWithRoute()

  return {
    // Reactive state
    activeTab,
    tabs,
    tabHistory,

    // Computed properties
    visibleTabs,
    currentTab,
    currentTitle,
    currentRoute,
    hasNextTab,
    hasPreviousTab,

    // Tab management
    setActiveTab,
    goToNextTab,
    goToPreviousTab,
    goBackInHistory,
    navigateToTab,

    // Badge management
    setBadge,
    incrementBadge,
    clearBadge,
    clearAllBadges,

    // Tab configuration
    updateTabConfig,
    enableTab,
    disableTab,
    showTab,
    hideTab,

    // Utilities
    getTabById,
    isTabActive,
    getTabIndex,
    syncWithRoute,
    handleKeyboardNavigation,
    clearHistory
  }
}