<template>
  <div class="mb-6 p-4 border border-gray-200 rounded bg-white dark:bg-gray-100 shadow-sm max-w-md mx-auto">
    <div v-if="!user">
      <h2 class="text-xl font-semibold mb-4">🔒 Login</h2>

      <input
        v-model="email"
        placeholder="Email"
        class="w-full mb-2 px-3 py-2 border border-gray-300 rounded text-sm"
      />
      <input
        v-model="password"
        type="password"
        placeholder="Password"
        class="w-full mb-4 px-3 py-2 border border-gray-300 rounded text-sm"
      />

      <div class="flex gap-2">
        <button
          @click="login"
          class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 text-sm"
        >
          Log In
        </button>
        <button
          @click="signup"
          class="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 text-sm"
        >
          Sign Up
        </button>
      </div>
    </div>

    <div v-else>
      <p class="mb-3 text-sm text-gray-700">✅ Logged in as: <strong>{{ user.email }}</strong></p>
      <button
        @click="$emit('logout')"
        class="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 text-sm"
      >
        Log Out
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, defineEmits } from 'vue'
import { supabase } from '../lib/supabase'

const email = ref('')
const password = ref('')
const user = ref(null)
const emit = defineEmits(['user-changed', 'logout'])

const getUser = async () => {
  const { data } = await supabase.auth.getUser()
  user.value = data.user
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

onMounted(async () => {
  await getUser()
})

onMounted(() => {
  supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_OUT') {
      user.value = null
    } else if (event === 'SIGNED_IN') {
      await getUser()
    }
  })
})
</script>