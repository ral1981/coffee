import { ref, computed } from 'vue'
import { supabase } from '../lib/supabase'
import { useToast } from '../composables/useToast'

// Global auth state - shared across all components
const user = ref(null)
const loading = ref(false)
const initializing = ref(true)
const anyEditing = ref(false)
const showCoffeeForm = ref(false)

// Initialize auth listener once
let authListenerInitialized = false

export function useAuth() {
  // get all four toast methods
  const { success, error, warning, info } = useToast()

  const isLoggedIn = computed(() => !!user.value)

  // Computed user properties for easy access
  const userId = computed(() => user.value?.id || null)
  const userEmail = computed(() => user.value?.email || null)
  const userDisplayName = computed(() => {
    if (!user.value) return null
    return user.value.user_metadata?.full_name || 
           user.value.user_metadata?.name || 
           user.value.email?.split('@')[0] ||
           'User'
  })

  // Get user initials for profile display
  const userInitials = computed(() => {
    if (!user.value) return 'U'
    
    const name = userDisplayName.value
    if (name && name !== 'User') {
      return name.split(' ')
        .map(word => word.charAt(0).toUpperCase())
        .slice(0, 2)
        .join('')
    }
    
    // Fallback to email initial
    return (userEmail.value?.charAt(0) || 'U').toUpperCase()
  })

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

    loading.value = true

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
    } finally {
      loading.value = false
    }
  }

  async function signup(emailRaw, passwordRaw, options = {}) {
    if (!emailRaw || !passwordRaw) {
      warning('Missing credentials', 'Please fill in both email and password')
      return false
    }

    if (passwordRaw.length < 6) {
      warning('Password too short', 'Password must be at least 6 characters')
      return false
    }
    
    const emailTrim = String(emailRaw).trim()
    const passwordStr = String(passwordRaw)

    loading.value = true

    try {
      const signupData = {
        email: emailTrim,
        password: passwordStr,
      }

      // Add user metadata if provided
      if (options.fullName || options.name) {
        signupData.options = {
          data: {
            full_name: options.fullName || options.name,
            name: options.fullName || options.name
          }
        }
      }

      const { data, error: signupErr } = await supabase.auth.signUp(signupData)

      if (signupErr) {
        const msg = signupErr.message
        if (msg.includes('User already registered')) {
          warning('Account exists', 'An account with this email already exists. Try logging in instead.')
        } else if (msg.includes('Invalid email')) {
          error('Invalid email', 'Please enter a valid email address')
        } else if (msg.includes('Password should be')) {
          error('Password requirements', msg)
        } else {
          error('Signup failed', msg)
        }
        return false
      }

      if (data.user && !data.session) {
        // Email confirmation required
        info('Check your email', 'Please check your email for a confirmation link to complete your account setup')
      } else if (data.user && data.session) {
        // Auto-signed in
        user.value = data.user
        success('Welcome!', `Account created successfully`)
      }

      return true

    } catch (err) {
      console.error('Signup exception:', err)
      error('Signup failed', 'An unexpected error occurred during signup')
      return false
    } finally {
      loading.value = false
    }
  }

  async function resetPassword(email) {
    if (!email) {
      warning('Email required', 'Please enter your email address')
      return false
    }

    const emailTrim = String(email).trim()
    loading.value = true

    try {
      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(emailTrim, {
        redirectTo: `${window.location.origin}/reset-password`
      })

      if (resetErr) {
        error('Reset failed', resetErr.message)
        return false
      }

      info('Password reset sent', 'Check your email for password reset instructions')
      return true

    } catch (err) {
      console.error('Password reset exception:', err)
      error('Reset failed', 'An unexpected error occurred')
      return false
    } finally {
      loading.value = false
    }
  }

  async function updateProfile(updates) {
    if (!user.value) {
      error('Not authenticated', 'Please log in to update your profile')
      return false
    }

    loading.value = true

    try {
      const { data, error: updateErr } = await supabase.auth.updateUser({
        data: updates
      })

      if (updateErr) {
        error('Update failed', updateErr.message)
        return false
      }

      user.value = data.user
      success('Profile updated', 'Your profile has been updated successfully')
      return true

    } catch (err) {
      console.error('Profile update exception:', err)
      error('Update failed', 'An unexpected error occurred')
      return false
    } finally {
      loading.value = false
    }
  }

  async function logout({ confirmIfDirty = false, onSuccess = () => {}, onFinish = () => {} } = {}) {
    if (confirmIfDirty && anyEditing.value) {
      if (!window.confirm('You have unsaved changes. Discard them and log out?')) {
        return
      }
    }

    loading.value = true
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
      loading.value = false
      onFinish()
    }
  }

  async function getCurrentSession() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      console.log('getCurrentSession - Session:', session)
      console.log('getCurrentSession - Error:', error)
      
      if (error) {
        console.error('Session error:', error)
        user.value = null
        return null
      }

      if (session?.user) {
        console.log('getCurrentSession - Setting user:', session.user.email)
        user.value = session.user
        return session
      } else {
        console.log('getCurrentSession - No session found')
        user.value = null
      }

      return null
    } catch (err) {
      console.error('Get session exception:', err)
      user.value = null
      return null
    }
  }

  function initAuthListener() {
    // Only initialize once globally
    if (authListenerInitialized) {
      console.log('Auth listener already initialized')
      return
    }

    console.log('initAuthListener called')
    authListenerInitialized = true
    
    // Get initial session
    getCurrentSession().then((session) => {
      console.log('Initial session check:', session)
      if (session?.user) {
        console.log('Found existing session for:', session.user.email)
        user.value = session.user
      } else {
        console.log('No existing session found')
        user.value = null
      }
    }).finally(() => {
      console.log('Setting initializing to false')
      initializing.value = false
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state change:', event, session?.user?.email)
      
      if (event === 'SIGNED_IN' && session?.user) {
        console.log('SIGNED_IN - Setting user:', session.user.email)
        user.value = session.user
        initializing.value = false
      } else if (event === 'SIGNED_OUT') {
        console.log('SIGNED_OUT - Clearing user')
        user.value = null
        initializing.value = false
      } else if (event === 'TOKEN_EXPIRED') {
        console.log('TOKEN_EXPIRED')
        warning('Session expired', 'Please log in again to continue')
        user.value = null
        initializing.value = false
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        console.log('TOKEN_REFRESHED - Updating user:', session.user.email)
        user.value = session.user
      } else if (event === 'INITIAL_SESSION' && session?.user) {
        console.log('INITIAL_SESSION - Setting user:', session.user.email)
        user.value = session.user
        initializing.value = false
      }
    })

    // Return unsubscribe function for cleanup
    return () => {
      subscription?.unsubscribe?.()
    }
  }

  // Utility function to check if user has specific permissions
  const hasPermission = (permission) => {
    if (!user.value) return false
    
    // Add your permission logic here based on user metadata or roles
    const userRoles = user.value.user_metadata?.roles || []
    const userPermissions = user.value.user_metadata?.permissions || []
    
    return userPermissions.includes(permission) || userRoles.includes('admin')
  }

  // Check if current user can access specific resource
  const canAccess = (resourceUserId) => {
    if (!user.value) return false
    return user.value.id === resourceUserId || hasPermission('admin')
  }

  return {
    // State
    user,
    loading,
    initializing,
    isLoggedIn,
    anyEditing,
    showCoffeeForm,

    // Computed user info
    userId,
    userEmail,
    userDisplayName,
    userInitials,

    // Auth methods
    login,
    signup,
    logout,
    resetPassword,
    updateProfile,
    initAuthListener,
    getCurrentSession,

    // Utility methods
    hasPermission,
    canAccess,
  }
}