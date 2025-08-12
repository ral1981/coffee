<template>
  <header class="header">
    <div class="header-content">
      <!-- Back Button -->
      <button class="back-btn" @click="goBack" :disabled="!canGoBack">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
      </button>
      
      <!-- Title -->
      <h1 class="header-title">Coffee Tracker</h1>
      
      <!-- Profile/Auth Button -->
      <div class="auth-container" ref="authContainer">
        <button 
          class="auth-btn" 
          :class="{ 'logged-in': isLoggedIn }"
          @click="toggleAuthPanel"
          :title="isLoggedIn ? 'Account Menu' : 'Login'"
        >
          <!-- Lock icons for auth state -->
          <Lock v-if="!isLoggedIn" class="auth-icon" />
          <LockOpen v-else class="auth-icon logged-in-icon" />
        </button>
        
        <!-- Authentication Panel -->
        <Transition name="slide-fade">
          <div 
            v-if="showAuthPanel" 
            class="auth-panel"
            @click.stop
          >
            <!-- Not Logged In State -->
            <div v-if="!isLoggedIn" class="login-form">
              <div class="panel-header">
                <Lock class="panel-icon" />
                <h3 class="panel-title">Sign In</h3>
              </div>
              
              <form @submit.prevent="handleLogin" class="login-fields">
                <div class="input-group">
                  <input
                    v-model="loginForm.email"
                    type="email"
                    placeholder="Email address"
                    required
                    class="auth-input"
                    :disabled="isLoggingIn"
                  />
                </div>
                
                <div class="input-group">
                  <input
                    v-model="loginForm.password"
                    type="password"
                    placeholder="Password"
                    required
                    class="auth-input"
                    :disabled="isLoggingIn"
                  />
                </div>
                
                <button 
                  type="submit" 
                  class="auth-submit-btn"
                  :disabled="isLoggingIn || !isLoginFormValid"
                >
                  <span v-if="isLoggingIn">Signing in...</span>
                  <span v-else>Sign In</span>
                </button>
              </form>
            </div>
            
            <!-- Logged In State -->
            <div v-else class="user-menu">
              <div class="panel-header">
                <LockOpen class="panel-icon logged-in-icon" />
                <h3 class="panel-title">Account</h3>
              </div>
              
              <div class="user-info">
                <div class="user-avatar">
                  {{ userInitials }}
                </div>
                <div class="user-details">
                  <div class="user-email">{{ user?.email }}</div>
                  <div class="user-status">Logged in</div>
                </div>
              </div>
              
              <div class="menu-actions">
                <button 
                  @click="handleLogout" 
                  class="logout-btn"
                  :disabled="isLoggingOut"
                >
                  <LogOut class="action-icon" />
                  <span v-if="isLoggingOut">Signing out...</span>
                  <span v-else>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../../composables/useAuth'
import { useToast } from '../../composables/useToast'
import { Lock, LockOpen, LogOut } from 'lucide-vue-next'

// Props
const props = defineProps({
  canGoBack: {
    type: Boolean,
    default: true
  }
})

// Emits
const emit = defineEmits(['back'])

// Composables
const router = useRouter()
const { user, login, logout, isLoggedIn } = useAuth()
const { success, error, info } = useToast()

// Local state
const showAuthPanel = ref(false)
const authContainer = ref(null)
const isLoggingIn = ref(false)
const isLoggingOut = ref(false)
const autoCloseTimer = ref(null)

// Login form
const loginForm = ref({
  email: '',
  password: ''
})

// Computed
const userInitials = computed(() => {
  if (!user.value?.email) return 'U'
  return user.value.email.charAt(0).toUpperCase()
})

const isLoginFormValid = computed(() => {
  return loginForm.value.email && loginForm.value.password
})

// Methods
const goBack = () => {
  emit('back')
  if (router.currentRoute.value.meta?.canGoBack !== false) {
    router.back()
  }
}

const toggleAuthPanel = () => {
  showAuthPanel.value = !showAuthPanel.value
  
  if (showAuthPanel.value) {
    startAutoCloseTimer()
  } else {
    clearAutoCloseTimer()
  }
}

const closeAuthPanel = () => {
  showAuthPanel.value = false
  clearAutoCloseTimer()
}

const startAutoCloseTimer = () => {
  clearAutoCloseTimer()
  // Auto-close after 30 seconds of inactivity
  autoCloseTimer.value = setTimeout(() => {
    closeAuthPanel()
  }, 30000)
}

const clearAutoCloseTimer = () => {
  if (autoCloseTimer.value) {
    clearTimeout(autoCloseTimer.value)
    autoCloseTimer.value = null
  }
}

const handleLogin = async () => {
  if (!isLoginFormValid.value || isLoggingIn.value) return
  
  isLoggingIn.value = true
  
  try {
    const success = await login(loginForm.value.email, loginForm.value.password)
    
    if (success) {
      // Clear form
      loginForm.value = { email: '', password: '' }
      
      // Show success message
      info('Welcome back!', 'You have been signed in successfully')
      
      // Close panel after short delay
      setTimeout(() => {
        closeAuthPanel()
      }, 1000)
    }
  } catch (err) {
    error('Sign in failed', 'Please check your credentials and try again')
  } finally {
    isLoggingIn.value = false
  }
}

const handleLogout = async () => {
  if (isLoggingOut.value) return
  
  isLoggingOut.value = true
  
  try {
    await logout()
    closeAuthPanel()
    success('Signed out', 'You have been signed out successfully')
  } catch (err) {
    error('Sign out failed', 'Please try again')
  } finally {
    isLoggingOut.value = false
  }
}

const handleClickOutside = (event) => {
  if (showAuthPanel.value && authContainer.value && !authContainer.value.contains(event.target)) {
    closeAuthPanel()
  }
}

// Lifecycle
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
  clearAutoCloseTimer()
})

// Watchers
watch(isLoggedIn, (newValue, oldValue) => {
  // Auto-close panel when login state changes
  if (newValue !== oldValue) {
    setTimeout(() => {
      closeAuthPanel()
    }, 1500)
  }
})

// Reset auto-close timer on panel interaction
watch(showAuthPanel, (isOpen) => {
  if (isOpen) {
    startAutoCloseTimer()
  }
})
</script>

<style scoped>
.header {
  background: white;
  padding: 1rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 1200px;
  margin: 0 auto;
}

.back-btn {
  background: #f0f0f0;
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  color: #666;
}

.back-btn:hover:not(:disabled) {
  background: #e0e0e0;
  color: #333;
}

.back-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.header-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #333;
}

/* Auth Container */
.auth-container {
  position: relative;
}

.auth-btn {
  background: #f0f0f0;
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s;
  position: relative;
}

.auth-btn:hover {
  background: #e0e0e0;
  transform: scale(1.05);
}

.auth-btn.logged-in {
  background: #22c55e;
  box-shadow: 0 2px 8px rgba(34, 197, 94, 0.3);
}

.auth-btn.logged-in:hover {
  background: #16a34a;
  box-shadow: 0 4px 12px rgba(34, 197, 94, 0.4);
}

.auth-icon {
  width: 20px;
  height: 20px;
  color: #666;
  transition: color 0.3s;
}

.logged-in-icon {
  color: white;
}

/* Auth Panel */
.auth-panel {
  position: absolute;
  top: calc(100% + 0.5rem);
  right: 0;
  width: 320px;
  background: white;
  border: 1px solid #e5e5e5;
  border-radius: 12px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  z-index: 1000;
}

.panel-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1.5rem 1.5rem 1rem 1.5rem;
  border-bottom: 1px solid #f0f0f0;
}

.panel-icon {
  width: 20px;
  height: 20px;
  color: #666;
}

.panel-icon.logged-in-icon {
  color: #22c55e;
}

.panel-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #333;
  margin: 0;
}

/* Login Form */
.login-form {
  padding-bottom: 1.5rem;
}

.login-fields {
  padding: 0 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.input-group {
  display: flex;
  flex-direction: column;
}

.auth-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.2s;
}

.auth-input:focus {
  outline: none;
  border-color: #22c55e;
  box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.1);
}

.auth-input:disabled {
  background: #f9fafb;
  color: #9ca3af;
}

.auth-submit-btn {
  background: #22c55e;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.75rem 1rem;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.auth-submit-btn:hover:not(:disabled) {
  background: #16a34a;
}

.auth-submit-btn:disabled {
  background: #d1d5db;
  cursor: not-allowed;
}

/* User Menu */
.user-menu {
  padding-bottom: 1rem;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #f0f0f0;
}

.user-avatar {
  width: 40px;
  height: 40px;
  background: #22c55e;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 1.125rem;
}

.user-details {
  flex: 1;
}

.user-email {
  font-weight: 500;
  color: #333;
  font-size: 0.875rem;
  margin-bottom: 0.25rem;
}

.user-status {
  color: #22c55e;
  font-size: 0.75rem;
  font-weight: 500;
}

.menu-actions {
  padding: 0 1.5rem;
}

.logout-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.75rem;
  background: none;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  color: #ef4444;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.875rem;
}

.logout-btn:hover:not(:disabled) {
  background: #fef2f2;
  border-color: #fca5a5;
}

.logout-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-icon {
  width: 16px;
  height: 16px;
}

/* Transitions */
.slide-fade-enter-active {
  transition: all 0.3s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.2s cubic-bezier(1.0, 0.5, 0.8, 1.0);
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateY(-10px) scale(0.95);
  opacity: 0;
}

/* Responsive */
@media (max-width: 640px) {
  .auth-panel {
    width: calc(100vw - 2rem);
    right: -1rem;
  }
  
  .header {
    padding: 0.75rem 1rem;
  }
  
  .header-title {
    font-size: 1.25rem;
  }
}
</style>