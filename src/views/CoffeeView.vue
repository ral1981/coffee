<template>
  <div class="coffee-view">
    <!-- Main Coffee List -->
    <CoffeeListView />
    
    <!-- Debug Panel (remove this later) -->
    <div v-if="showDebug" class="debug-panel">
      <h3>Debug Info</h3>
      <p><strong>Route:</strong> {{ $route.path }}</p>
      <p><strong>Query:</strong> {{ JSON.stringify($route.query) }}</p>
      <p><strong>Active Tab:</strong> {{ activeTab }}</p>
      <button @click="toggleDebug">Hide Debug</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import CoffeeListView from '../components/coffee/CoffeeListView.vue'
import { useTabNavigation } from '../composables/useTabNavigation'

// Add debug logging
import { useAuth } from '../composables/useAuth'
const { userId, isLoggedIn, initializing } = useAuth()
// Debug what's happening
watch([isLoggedIn, initializing, userId], ([loggedIn, init, id]) => {
  console.log('CoffeeView - Auth state:', { loggedIn, init, id })
}, { immediate: true })

const route = useRoute()
const { activeTab } = useTabNavigation()

// Debug panel (helpful during development)
const showDebug = ref(false)

const toggleDebug = () => {
  showDebug.value = !showDebug.value
}

// Set up the coffee tab as active when this view loads
onMounted(() => {
  console.log('CoffeeView mounted')
  console.log('Current route:', route.path)
  console.log('Route query:', route.query)
})

// Enable debug panel with keyboard shortcut
const handleKeydown = (event) => {
  if (event.key === 'D' && event.ctrlKey) {
    event.preventDefault()
    showDebug.value = !showDebug.value
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
.coffee-view {
  display: flex;
  flex-direction: column;
  min-height: 100%;
  position: relative;
}

/* Debug Panel */
.debug-panel {
  position: fixed;
  top: 1rem;
  left: 1rem;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 1rem;
  border-radius: 8px;
  font-size: 0.875rem;
  z-index: 9999;
  max-width: 300px;
}

.debug-panel h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
}

.debug-panel p {
  margin: 0.25rem 0;
  word-break: break-all;
}

.debug-panel button {
  margin-top: 0.5rem;
  padding: 0.25rem 0.5rem;
  background: #22c55e;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.75rem;
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .debug-panel {
    top: 0.5rem;
    left: 0.5rem;
    right: 0.5rem;
    max-width: none;
  }
}
</style>