<template>
  <div class="mb-6 p-4 bg-white rounded-xl border border-gray-200 shadow-sm text-gray-900 border-l-4 border-l-purple-500 max-w-md mx-auto">
    <!-- Login Form -->
    <div v-if="!user" class="space-y-4">
      <div class="flex items-center gap-2 mb-4">
        <Lock class="w-5 h-5 text-purple-600" />
        <h2 class="text-xl font-semibold text-gray-900">Authentication</h2>
      </div>

      <!-- Login Form Section -->
      <div class="bg-purple-50 rounded-md p-4 border-l-4 border-purple-300">
        <h3 class="uppercase text-sm font-semibold text-purple-700 mb-3">
          Login Credentials
        </h3>
        <div class="space-y-3">
          <div class="relative">
            <Mail class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              v-model="email"
              type="email"
              placeholder="Email address"
              class="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
            />
          </div>
          <div class="relative">
            <Key class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              v-model="password"
              type="password"
              placeholder="Password"
              class="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
            />
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="bg-gray-50 rounded-md p-4 border-l-4 border-gray-300">
        <h3 class="uppercase text-sm font-semibold text-gray-700 mb-3">
          Actions
        </h3>
        <div class="flex gap-2">
          <button
            @click="login"
            class="flex-1 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 text-sm font-medium transition-colors duration-200 flex items-center justify-center gap-2"
          >
            <LogIn class="w-4 h-4" />
            Log In
          </button>
          <button
            @click="signup"
            class="flex-1 bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 text-sm font-medium transition-colors duration-200 flex items-center justify-center gap-2"
          >
            <UserPlus class="w-4 h-4" />
            Sign Up
          </button>
        </div>
      </div>
    </div>

    <!-- Logged In State -->
    <div v-else class="space-y-4">
      <div class="flex items-center gap-2 mb-4">
        <CheckCircle class="w-5 h-5 text-green-600" />
        <h2 class="text-xl font-semibold text-gray-900">Welcome Back!</h2>
      </div>

      <!-- User Info Section -->
      <div class="bg-green-50 rounded-md p-4 border-l-4 border-green-300">
        <h3 class="uppercase text-sm font-semibold text-green-700 mb-2">
          Current User
        </h3>
        <div class="flex items-center gap-2">
          <User class="w-4 h-4 text-green-600" />
          <span class="text-sm text-gray-700">
            <strong>{{ user.email }}</strong>
          </span>
        </div>
      </div>

      <!-- Logout Section -->
      <div class="bg-red-50 rounded-md p-4 border-l-4 border-red-300">
        <h3 class="uppercase text-sm font-semibold text-red-700 mb-3">
          Session Management
        </h3>
        <button
          @click="$emit('logout')"
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
import { ref, onMounted, watch, defineEmits } from 'vue'
import { supabase } from '../lib/supabase'
import { Lock, Mail, Key, LogIn, UserPlus, CheckCircle, User, LogOut } from 'lucide-vue-next'

const email = ref('')
const password = ref('')
const user = ref(null)
const emit = defineEmits(['user-changed', 'logout'])

const initializeAuth = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('Error getting session:', error)
      user.value = null
      return
    }

    if (session?.user) {
      user.value = session.user
    } else {
      user.value = null
    }
  } catch (error) {
    console.error('Error initializing auth:', error)
    user.value = null
  }
}

watch(user, (newUser) => {
  emit('user-changed', newUser)
}, { immediate: true })

const login = async () => {
  const { error } = await supabase.auth.signInWithPassword({
    email: email.value,
    password: password.value
  })
  if (error) {
    alert(error.message)
  } else {
    await getUser()
    email.value = ''
    password.value = ''
  }
}

const signup = async () => {
  const { error } = await supabase.auth.signUp({
    email: email.value,
    password: password.value
  })
  if (error) alert(error.message)
  else alert('Check your email to confirm!')
}

const getUser = async () => {
  const { data: { session } } = await supabase.auth.getSession()
  user.value = session?.user || null
}

onMounted(async () => {
  await initializeAuth()
  
  const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_OUT') {
      user.value = null
    } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
      user.value = session?.user || null
    }
  })

  return () => {
    subscription?.unsubscribe()
  }
})
</script>