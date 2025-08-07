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
      <router-view v-slot="{ Component }">
        <keep-alive>
          <component :is="Component" :key="$route.fullPath" />
        </keep-alive>
      </router-view>
    </main>

    <!-- Floating Action Button -->
    <FloatingActionButton @click="handleAddNew" />
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppHeader from '../layout/AppHeader.vue'
import TabNavigation from '../layout/TabNavigation.vue'
import FloatingActionButton from '../shared/FloatingActionButton.vue'
import { useTabNavigation } from '../../composables/useTabNavigation'

const route = useRoute()
const router = useRouter()

// Use the new tab navigation composable
const { activeTab, tabs: mainTabs, setActiveTab } = useTabNavigation()

// Computed header title based on active tab
const headerTitle = computed(() => {
  const currentTab = mainTabs.value.find(tab => tab.id === activeTab.value)
  return currentTab?.label || 'Coffee Tracker'
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
  setActiveTab(tabId)
  // Navigate to the corresponding route
  router.push(`/${tabId}`)
}

const handleAddNew = () => {
  const routes = {
    coffee: '/coffee/new',
    containers: '/containers/new',
    shops: '/shops/new'
  }
  
  const newRoute = routes[activeTab.value] || '/coffee/new'
  router.push(newRoute)
}

// Sync active tab with route changes
watch(() => route.path, (newPath) => {
  const pathTab = newPath.split('/')[1] || 'coffee'
  if (mainTabs.value.some(tab => tab.id === pathTab)) {
    setActiveTab(pathTab)
  }
}, { immediate: true })
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
}

/* Responsive adjustments */
@media (min-width: 768px) {
  .main-content {
    padding: 0 2rem;
    padding-bottom: 6rem;
  }
}
</style>