<template>
  <div class="login-container">
    <div class="login-card">
      <!-- Logo/Header -->
      <div class="login-header">
        <div class="app-logo">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 8h1a4 4 0 0 1 0 8h-1"/>
            <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/>
            <line x1="6" y1="1" x2="6" y2="4"/>
            <line x1="10" y1="1" x2="10" y2="4"/>
            <line x1="14" y1="1" x2="14" y2="4"/>
          </svg>
        </div>
        <h1 class="app-title">Coffee Tracker</h1>
        <p class="app-subtitle">Track your coffee collection and brewing recipes</p>
      </div>

      <!-- Auth Form -->
      <form @submit.prevent="handleSubmit" class="auth-form">
        <div class="form-tabs">
          <button
            type="button"
            class="tab-btn"
            :class="{ active: !isSignupMode }"
            @click="isSignupMode = false"
          >
            Login
          </button>
          <button
            type="button"
            class="tab-btn"
            :class="{ active: isSignupMode }"
            @click="isSignupMode = true"
          >
            Sign Up
          </button>
        </div>

        <!-- Name field (signup only) -->
        <div v-if="isSignupMode" class="form-group">
          <label for="fullName" class="form-label">Full Name</label>
          <input
            id="fullName"
            v-model="form.fullName"
            type="text"
            class="form-input"
            placeholder="Your full name"
            :disabled="loading"
          />
        </div>

        <!-- Email field -->
        <div class="form-group">
          <label for="email" class="form-label">Email</label>
          <input
            id="email"
            v-model="form.email"
            type="email"
            class="form-input"
            placeholder="your@email.com"
            :disabled="loading"
            required
          />
        </div>

        <!-- Password field -->
        <div class="form-group">
          <label for="password" class="form-label">Password</label>
          <input
            id="password"
            v-model="form.password"
            type="password"
            class="form-input"
            :placeholder="isSignupMode ? 'Minimum 6 characters' : 'Your password'"
            :disabled="loading"
            required
          />
        </div>

        <!-- Submit button -->
        <button
          type="submit"
          class="submit-btn"
          :disabled="loading || !canSubmit"
          :class="{ loading }"
        >
          <div v-if="loading" class="btn-spinner">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" opacity="0.25"/>
              <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </div>
          <span v-else>
            {{ isSignupMode ? 'Create Account' : 'Login' }}
          </span>
        </button>

        <!-- Forgot password link -->
        <div v-if="!isSignupMode" class="forgot-password">
          <button
            type="button"
            class="link-btn"
            @click="showForgotPassword = true"
            :disabled="loading"
          >
            Forgot your password?
          </button>
        </div>
      </form>

      <!-- Forgot Password Modal -->
      <div v-if="showForgotPassword" class="modal-overlay" @click="showForgotPassword = false">
        <div class="modal-content" @click.stop>
          <h3 class="modal-title">Reset Password</h3>
          <p class="modal-description">Enter your email to receive password reset instructions</p>
          
          <form @submit.prevent="handleResetPassword" class="modal-form">
            <input
              v-model="resetEmail"
              type="email"
              class="form-input"
              placeholder="your@email.com"
              :disabled="loading"
              required
            />
            
            <div class="modal-actions">
              <button
                type="button"
                class="cancel-btn"
                @click="showForgotPassword = false"
                :disabled="loading"
              >
                Cancel
              </button>
              <button
                type="submit"
                class="submit-btn small"
                :disabled="loading || !resetEmail"
              >
                <span v-if="loading">Sending...</span>
                <span v-else>Send Reset Link</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'

const router = useRouter()
const { login, signup, resetPassword, loading, isLoggedIn } = useAuth()

// Form state
const isSignupMode = ref(false)
const showForgotPassword = ref(false)
const form = ref({
  email: '',
  password: '',
  fullName: ''
})
const resetEmail = ref('')

// Computed
const canSubmit = computed(() => {
  const hasEmail = form.value.email.trim().length > 0
  const hasPassword = form.value.password.length > 0
  const hasName = !isSignupMode.value || form.value.fullName.trim().length > 0
  return hasEmail && hasPassword && hasName
})

// Methods
const handleSubmit = async () => {
  if (!canSubmit.value || loading.value) return

  let success = false

  if (isSignupMode.value) {
    success = await signup(form.value.email, form.value.password, {
      fullName: form.value.fullName.trim()
    })
  } else {
    success = await login(form.value.email, form.value.password)
  }

  if (success && isLoggedIn.value) {
    // Redirect to coffee list
    router.push('/coffee')
  }
}

const handleResetPassword = async () => {
  if (!resetEmail.value || loading.value) return

  const success = await resetPassword(resetEmail.value)
  if (success) {
    showForgotPassword.value = false
    resetEmail.value = ''
  }
}

// Redirect if already logged in
onMounted(() => {
  if (isLoggedIn.value) {
    router.push('/coffee')
  }
})
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 1rem;
}

.login-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  padding: 2rem;
  width: 100%;
  max-width: 400px;
}

.login-header {
  text-align: center;
  margin-bottom: 2rem;
}

.app-logo {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  background: var(--primary-green, #22c55e);
  border-radius: 16px;
  color: white;
  margin-bottom: 1rem;
}

.app-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 0.5rem 0;
}

.app-subtitle {
  color: #6b7280;
  margin: 0;
  font-size: 0.875rem;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-tabs {
  display: flex;
  background: #f3f4f6;
  border-radius: 8px;
  padding: 4px;
}

.tab-btn {
  flex: 1;
  padding: 0.75rem;
  border: none;
  background: transparent;
  border-radius: 6px;
  font-weight: 500;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;
}

.tab-btn.active {
  background: white;
  color: #1f2937;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-label {
  font-weight: 500;
  color: #374151;
  font-size: 0.875rem;
}

.form-input {
  padding: 0.75rem 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: var(--primary-green, #22c55e);
}

.form-input:disabled {
  background: #f9fafb;
  cursor: not-allowed;
}

.submit-btn {
  background: var(--primary-green, #22c55e);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.875rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-height: 48px;
}

.submit-btn:hover:not(:disabled) {
  background: var(--primary-green-hover, #16a34a);
  transform: translateY(-1px);
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.submit-btn.small {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  min-height: 36px;
}

.btn-spinner svg {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.forgot-password {
  text-align: center;
}

.link-btn {
  background: none;
  border: none;
  color: var(--primary-green, #22c55e);
  font-size: 0.875rem;
  cursor: pointer;
  text-decoration: underline;
}

.link-btn:hover {
  color: var(--primary-green-hover, #16a34a);
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-content {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.modal-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
  color: #1f2937;
}

.modal-description {
  color: #6b7280;
  margin: 0 0 1.5rem 0;
  font-size: 0.875rem;
}

.modal-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.modal-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
}

.cancel-btn {
  background: #f3f4f6;
  color: #374151;
  border: none;
  border-radius: 6px;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.cancel-btn:hover:not(:disabled) {
  background: #e5e7eb;
}

/* Responsive */
@media (max-width: 480px) {
  .login-card {
    padding: 1.5rem;
  }
  
  .app-title {
    font-size: 1.5rem;
  }
  
  .modal-actions {
    flex-direction: column;
  }
}
</style>