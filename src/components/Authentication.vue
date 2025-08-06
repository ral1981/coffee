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
            @keyup.enter="onSubmit"
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
            @keyup.enter="onSubmit"
            @input="$emit('user-activity')"
            @keydown="$emit('user-activity')"
            @focus="$emit('user-activity')"
            class="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
          />
        </div>
        <div class="flex gap-2">
          <button
            @click.stop="onSubmit"
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
          @click.stop="onLogout"
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
import { ref, onMounted, watch, defineEmits, defineProps } from 'vue'
import { Lock, Mail, KeyRound, LogIn, CheckCircle, User, LogOut } from 'lucide-vue-next'
import { useAuth } from '../composables/useAuth'

const props = defineProps({
  showToggle: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['user-changed', 'logout', 'user-activity'])

const email = ref('')
const password = ref('')

// Pull in everything from your composable
const { user, login, logout, initAuthListener } = useAuth()

// Trim email live and on blur
const handleEmailInput = (e) => {
  emit('user-activity')
  email.value = e.target.value.trim()
}
const trimEmail = () => {
  email.value = email.value.trim()
}

// Emit upward whenever the auth user changes
watch(user, (u) => {
  emit('user-changed', u)
}, { immediate: true })

// Login handler wired to your composable
const onSubmit = async () => {
  
  const ok = await login(email.value, password.value)
  if (ok) {
  }
}

// Logout handler wired to your composable
const onLogout = () => {
  logout({
    confirmIfDirty: true,
    onSuccess: () => emit('logout'),
    onFinish: () => {
      // Optionally let parent know, or refresh any data
      emit('user-activity')
    }
  })
}

// Start listening for Supabase auth‐state changes once
onMounted(() => {
  initAuthListener()
})
</script>