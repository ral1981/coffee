<template>
  <header class="header">
    <div class="header-content">
      <!-- Back Button -->
      <button class="back-btn" @click="goBack" :disabled="!canGoBack">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
      </button>
      
      <!-- Logo and Title -->
      <router-link to="/" class="logo-section">
        <!-- Coffee Cup Icon -->
        <svg class="coffee-icon" xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24">
          <defs>
            <linearGradient id="coffeeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style="stop-color:#8D6E63;stop-opacity:1" />
              <stop offset="100%" style="stop-color:#000000;stop-opacity:1" />
            </linearGradient>
          </defs>
          <path fill="url(#coffeeGradient)" d="M13.325 0c-.907 1.116-2.442 2.302-.768 4.814.558.628.838 1.953.768 2.372 0 0 2.512-1.464.977-4.116-.907-1.395-1.326-2.582-.977-3.07zm-2.79 2.582c-.628.767-1.605 1.535-.489 3.279.35.349.489 1.256.489 1.535 0 0 1.673-.978.627-2.792-.628-.907-.906-1.743-.627-2.022zm-5.094 6a.699.699 0 0 0-.697.698c0 2.372.349 10.535 3.837 14.512.14.139.28.208.489.208h5.86c.21 0 .35-.069.489-.208 3.488-3.908 3.837-12.07 3.837-14.512a.7.7 0 0 0-.698-.699H12zm2.023 2.163h9.21c.349 0 .697.278.697.697 0 1.953-.348 7.465-2.72 10.326-.21.14-.35.208-.559.208H9.976a.633.633 0 0 1-.488-.208c-2.372-2.79-2.652-8.373-2.722-10.326 0-.35.28-.697.698-.697zm8.792 4.744s-.071.627-1.745 1.255c-2.303.837-6.348.28-6.348.28.349 1.465.906 2.86 1.743 3.907.07.14.28.209.419.209h3.489c.14 0 .279-.07.418-.209 1.186-1.395 1.745-3.558 2.024-5.442z"/>
        </svg>
        
        <!-- Vertical Coffee Bar -->
        <div class="coffee-bar"></div>
        
        <!-- Title Section with Two Lines -->
        <div class="title-section">
          <div class="title-line">Coffee</div>
          <div class="title-line">Tracker</div>
        </div>
      </router-link>
      
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
                  <span v-else">Sign In</span>
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
  padding: 1.5rem 1rem;
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

/* Logo Section - Horizontal Layout with Icon on Left */
.logo-section {
  text-decoration: none;
  color: inherit;
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
  justify-content: center;
  transition: transform 0.2s ease;
}

.logo-section:hover {
  transform: scale(1.02);
}

.coffee-icon {
  width: 70px;
  height: 70px;
  flex-shrink: 0;
}

.coffee-bar {
  width: 4px;
  height: 60px;
  background: linear-gradient(180deg, #8D6E63 0%, #000000 100%);
  border-radius: 2px;
  flex-shrink: 0;
}

.title-section {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
}

.title-line {
  font-size: 1.8rem;
  font-weight: 700;
  line-height: 1.1;
  margin: 0;
  letter-spacing: 0.25px;
}

.title-line:first-child {
  background: linear-gradient(135deg, #8D6E63 0%, #5D4037 50%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.title-line:last-child {
  background: linear-gradient(135deg, #5D4037 0%, #3E2723 50%, #000000 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
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

/* Responsive Design */
@media (max-width: 768px) {
  .header {
    padding: 1.25rem 1rem; /* Increased from 0.75rem */
  }
  
  .logo-section {
    gap: 12px;
  }
  
  .coffee-icon {
    width: 60px; /* Increased from 50px */
    height: 60px; /* Increased from 50px */
  }
  
  .coffee-bar {
    width: 4px;
    height: 50px; /* Increased from 40px */
  }
  
  .title-line {
    font-size: 1.6rem; /* Increased from 1.4rem */
  }
  
  .auth-panel {
    width: calc(100vw - 2rem);
    right: -1rem;
  }
}

@media (max-width: 640px) {
  .header {
    padding: 1rem; /* Increased from 0.75rem */
  }
  
  .logo-section {
    gap: 10px;
  }
  
  .coffee-icon {
    width: 55px; /* Increased from 45px */
    height: 55px; /* Increased from 45px */
  }
  
  .coffee-bar {
    width: 3px;
    height: 45px; /* Increased from 35px */
  }
  
  .title-line {
    font-size: 1.4rem; /* Increased from 1.2rem */
  }
}

@media (max-width: 480px) {
  .header {
    padding: 0.875rem 1rem; /* Increased from 0.75rem */
  }
  
  .logo-section {
    gap: 8px;
  }
  
  .coffee-icon {
    width: 50px; /* Increased from 40px */
    height: 50px; /* Increased from 40px */
  }
  
  .coffee-bar {
    width: 3px;
    height: 40px; /* Increased from 30px */
  }
  
  .title-line {
    font-size: 1.3rem; /* Increased from 1.1rem */
  }
  
  .back-btn,
  .auth-btn {
    width: 36px;
    height: 36px;
  }
}
</style>