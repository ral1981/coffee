<template>
  <div class="p-4 text-gray-900">
    <!-- Login Form -->
    <div v-if="!user" class="space-y-4">
      <div class="flex items-center gap-2 mb-4">
        <Lock class="w-5 h-5 text-purple-600" />
        <h2 class="text-xl font-semibold text-gray-900">Sign In</h2>
      </div>
      
      <div class="space-y-3">
        <div class="relative">
          <Mail class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            v-model="email"
            type="email"
            placeholder="Email address"
            @keyup.enter="login"
            @input="handleEmailInput"
            @keydown="$emit('user-activity')"
            @focus="$emit('user-activity')"
            @blur="trimEmail"
            class="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
          />
        </div>
        <div class="relative">
          <KeyRound class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            v-model="password"
            type="password"
            placeholder="Password"
            @keyup.enter="login"
            @input="$emit('user-activity')"
            @keydown="$emit('user-activity')"
            @focus="$emit('user-activity')"
            class="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
          />
        </div>
        <div class="flex gap-2">
          <button
            @click.stop="login"
            class="w-full bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 text-sm font-medium transition-colors duration-200 flex items-center justify-center gap-2"
          >
            <LogIn class="w-4 h-4" />
            Log In
          </button>
        </div>
        
        <!-- Clear Session Option -->
        <div v-if="showClearSession" class="pt-2 border-t border-gray-200">
          <button
            @click.stop="forceClearSession"
            class="w-full bg-gray-500 text-white px-4 py-1.5 rounded-md hover:bg-gray-600 text-xs font-medium transition-colors duration-200 flex items-center justify-center gap-2"
            title="Clear any cached session data"
          >
            <Lock class="w-3 h-3" />
            Clear Session Data
          </button>
        </div>
      </div>      
    </div>

    <!-- Logged In State -->
    <div v-else class="space-y-4">
      <div class="flex items-center gap-2 mb-4">
        <CheckCircle class="w-5 h-5 text-green-600" />
        <h2 class="text-xl font-semibold text-gray-900">Welcome!</h2>
      </div>
      <div class="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
        <User class="w-4 h-4 text-green-600" />
        <span class="text-sm text-gray-700 flex-1 truncate">
          <strong>{{ user.email }}</strong>
        </span>
      </div>
      <div class="flex gap-2">
        <button
          @click.stop="handleLogout"
          class="w-full bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 text-sm font-medium transition-colors duration-200 flex items-center justify-center gap-2"
        >
          <LogOut class="w-4 h-4" />
          Log Out
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, defineEmits, defineProps } from 'vue'
import { supabase } from '../lib/supabase'
import { Lock, Mail, KeyRound, LogIn, CheckCircle, User, LogOut } from 'lucide-vue-next'

const props = defineProps({
  showToggle: {
    type: Boolean,
    default: true
  }
})

const email = ref('')
const password = ref('')
const user = ref(null)
const showClearSession = ref(false)
const emit = defineEmits(['user-changed', 'logout', 'user-activity'])
let authSubscription = null

// Email trimming functions
const handleEmailInput = (event) => {
  emit('user-activity')
  // Trim spaces from email input in real-time
  email.value = event.target.value.trim()
}

const trimEmail = () => {
  // Additional trim on blur to catch any edge cases
  email.value = email.value.trim()
}

const initializeAuth = async () => {
  try {
    // Add a small delay to ensure Supabase is ready
    await new Promise(resolve => setTimeout(resolve, 100))
    
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('Error getting session:', error)
      user.value = null
      return
    }

    if (session?.user) {
      // Validate that the session is still valid by making a test request
      try {
        const { error: testError } = await supabase.auth.getUser()
        if (testError) {
          console.log('Session appears invalid, clearing:', testError.message)
          await clearInvalidSession()
          return
        }
        
        user.value = session.user
        console.log('Valid user session found:', session.user.email)
      } catch (validationError) {
        console.log('Session validation failed, clearing session')
        await clearInvalidSession()
      }
    } else {
      user.value = null
      console.log('No user session found')
    }
  } catch (error) {
    console.error('Error initializing auth:', error)
    user.value = null
  }
}

const clearInvalidSession = async () => {
  try {
    await supabase.auth.signOut({ scope: 'global' })
    localStorage.removeItem('supabase.auth.token')
    sessionStorage.clear()
  } catch (error) {
    console.warn('Error clearing invalid session:', error)
  }
  user.value = null
}

watch(user, (newUser) => {
  emit('user-changed', newUser)
}, { immediate: true })

const login = async () => {
  // Trim email before attempting login
  const trimmedEmail = email.value.trim()
  
  if (!trimmedEmail || !password.value) {
    alert('Please fill in both email and password')
    return
  }

  try {
    console.log('Attempting login for:', trimmedEmail)
    const { data, error } = await supabase.auth.signInWithPassword({
      email: trimmedEmail,
      password: password.value
    })
    
    if (error) {
      console.error('Login error:', error)
      // If login fails, show option to clear session
      if (error.message.includes('Invalid login credentials') || error.message.includes('Email not confirmed')) {
        showClearSession.value = true
      }
      alert(error.message)
    } else {
      console.log('Login successful:', data)
      // Clear form
      email.value = ''
      password.value = ''
      showClearSession.value = false
    }
  } catch (error) {
    console.error('Login catch error:', error)
    showClearSession.value = true
    alert('Login failed: ' + error.message)
  }
}

const forceClearSession = async (event) => {
  console.log('Force clear session clicked')
  event.preventDefault()
  event.stopPropagation()
  
  try {
    // Force sign out with global scope
    await supabase.auth.signOut({ scope: 'global' })
    
    // Clear all possible storage locations
    localStorage.removeItem('supabase.auth.token')
    localStorage.removeItem('sb-' + supabase.supabaseKey + '-auth-token')
    sessionStorage.clear()
    
    // Clear cookies if any (for extra safety)
    document.cookie.split(";").forEach(function(c) { 
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
    })
    
    user.value = null
    showClearSession.value = false
    
    console.log('All session data cleared')
    alert('Session data cleared. You can now login with a different account.')
    
  } catch (error) {
    console.warn('Error clearing session data:', error)
    // Still try to clear local state
    user.value = null
    showClearSession.value = false
    alert('Local session data cleared.')
  }
}

const handleLogout = async (event) => {
  console.log('Logout button clicked')
  event.preventDefault()
  event.stopPropagation()
  
  try {
    // First, clear the local user state immediately
    user.value = null
    
    // Enhanced logout with complete session cleanup
    const { error } = await supabase.auth.signOut({ scope: 'global' })
    
    if (error) {
      console.warn('Supabase logout error (but continuing with local logout):', error)
    } else {
      console.log('Supabase logout successful')
    }
    
    // Clear all possible storage locations (merged from switch user functionality)
    localStorage.removeItem('supabase.auth.token')
    localStorage.removeItem('sb-' + supabase.supabaseKey + '-auth-token')
    sessionStorage.clear()
    
    // Always emit logout event
    emit('logout')
    
  } catch (error) {
    console.warn('Logout catch error (but continuing with local logout):', error)
    // Still emit logout to clear app state
    emit('logout')
  }
}

onMounted(async () => {
  console.log('Authentication component mounted')
  
  // Check if there might be stale session data
  const hasStoredData = localStorage.getItem('supabase.auth.token') || 
                       Object.keys(localStorage).some(key => key.includes('supabase') || key.includes('sb-'))
  
  if (hasStoredData && !user.value) {
    console.log('Detected possible stale session data')
    showClearSession.value = true
  }
  
  await initializeAuth()
  
  try {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.email)
      
      if (event === 'SIGNED_OUT') {
        user.value = null
        showClearSession.value = false
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        user.value = session?.user || null
        showClearSession.value = false
      } else if (event === 'TOKEN_EXPIRED') {
        console.log('Token expired, clearing user state')
        user.value = null
        showClearSession.value = true
      }
    })

    authSubscription = subscription
  } catch (error) {
    console.error('Error setting up auth state listener:', error)
  }
})

onUnmounted(() => {
  if (authSubscription) {
    console.log('Cleaning up auth subscription')
    authSubscription.unsubscribe()
  }
})
</script>