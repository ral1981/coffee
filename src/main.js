import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

console.log('🚀 Starting Coffee Tracker...')

// Create Vue app
const app = createApp(App)

// Error handler
app.config.errorHandler = (err, vm, info) => {
  console.error('Application Error:', err)
  // In production, you might want to send this to a logging service
}

// Use router
app.use(router)

// Initialize auth (non-blocking)
try {
  import('./composables/useAuth').then(({ useAuth }) => {
    const { initAuthListener } = useAuth()
    initAuthListener()
  }).catch(err => {
    // Silently fail if auth is not available
    console.warn('Auth not available:', err.message)
  })
} catch (err) {
  // Silently fail if auth composable doesn't exist
}

// Mount the app
app.mount('#app')

console.log('✅ Coffee Tracker ready')