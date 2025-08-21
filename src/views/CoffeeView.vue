<template>
  <div class="coffee-view">
    <!-- Main Coffee List -->
    <CoffeeListView
      @edit-coffee="$emit('edit-coffee', $event)"
    />
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

// Set up the coffee tab as active when this view loads
onMounted(() => {
  console.log('CoffeeView mounted')
  console.log('Current route:', route.path)
  console.log('Route query:', route.query)
})

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