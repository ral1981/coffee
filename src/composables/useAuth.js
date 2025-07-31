import { ref, computed } from 'vue'
import { supabase } from '../lib/supabase'
import { useToast } from '../composables/useToast'

export function useAuth() {
  // get all four toast methods
  const { success, error, warning, info } = useToast()

  const user = ref(null)
  const isLoggedIn = computed(() => !!user.value)
  const anyEditing = ref(false)
  const showCoffeeForm = ref(false)

  function showLoginError(msg) {
    error('Login failed', msg || 'An unexpected error occurred')
  }

  async function login(emailRaw, passwordRaw) {
  if (!emailRaw || !passwordRaw) {
    warning('Missing credentials', 'Please fill in both email and password')
    return false
  }
  
  const emailTrim = String(emailRaw).trim()
  const passwordStr = String(passwordRaw)

    try {
      const { data, error: loginErr } = await supabase.auth.signInWithPassword({
        email: emailTrim,
        password: passwordStr,
      })

      if (loginErr) {
        const msg = loginErr.message
        if (msg.includes('Invalid login credentials')) {
          error('Invalid credentials', 'Please check your email and password')
        } else if (msg.includes('Email not confirmed')) {
          warning('Email not confirmed', 'Please check your email for a confirmation link')
        } else if (msg.includes('Too many requests')) {
          warning('Too many attempts', 'Please wait a moment before trying again')
        } else {
          showLoginError(msg)
        }
        return false
      }

      user.value = data.user
      success('Welcome back!', `Logged in as ${emailTrim}`)
      return true

    } catch (err) {
      console.error('Login exception:', err)
      showLoginError()
      return false
    }
  }

  async function logout({ confirmIfDirty = false, onSuccess = () => {}, onFinish = () => {} } = {}) {
    if (confirmIfDirty && anyEditing.value) {
      if (!window.confirm('You have unsaved changes. Discard them and log out?')) {
        return
      }
    }

    user.value = null
    anyEditing.value = false
    showCoffeeForm.value = false

    try {
      const { error: supaErr } = await supabase.auth.signOut({ scope: 'global' })
      localStorage.removeItem('supabase.auth.token')
      localStorage.removeItem(`sb-${supabase.supabaseKey}-auth-token`)
      sessionStorage.clear()

      if (supaErr) {
        console.warn('Supabase logout error:', supaErr)
        warning('Logout warning', 'Logged out locally, but server logout may have failed')
      } else {
        info('Logged out', 'See you next time!')
        onSuccess()
      }
    } catch (err) {
      console.warn('Logout exception:', err)
      error('Logout error', 'An error occurred during logout, but you have been logged out locally')
    } finally {
      onFinish()
    }
  }

  function initAuthListener() {
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        user.value = session.user
        info('Session refreshed', 'Your session has been updated')
      } else if (event === 'SIGNED_OUT') {
        user.value = null
      } else if (event === 'TOKEN_EXPIRED') {
        warning('Session expired', 'Please log in again to continue')
        user.value = null
      }
    })
  }

  return {
    user,
    isLoggedIn,
    anyEditing,
    showCoffeeForm,
    login,
    logout,
    initAuthListener,
  }
}
