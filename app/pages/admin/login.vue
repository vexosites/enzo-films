<script setup>
import { ref, onMounted } from 'vue'

const router = useRouter()
const loggedIn = useCookie('auth_logged_in', {
  default: () => '',
  encode: val => val,
  decode: val => val
})

onMounted(async () => {
  if (loggedIn.value) {
    const { user } = useAuth()
    await useAuth().fetchMe()
    if (user.value?.role === 'admin') {
      await navigateTo('/admin')
    }
  }
})

const email = ref('')
const password = ref('')
const error = ref('')
const showPassword = ref(false)

async function handleSubmit() {
  error.value = ''
  try {
    const res = await $fetch('/api/auth/admin/login', {
      method: 'POST',
      body: { email: email.value, password: password.value }
    })
    loggedIn.value = '1'
    const { user } = useAuth()
    user.value = res.user
    router.push('/admin')
  } catch (e) {
    error.value = e.data?.message || 'login failed'
  }
}
</script>

<template>
  <div class="fixed inset-0 flex items-center justify-center bg-gray-900">
    <div class="bg-gray-800 p-8 rounded-lg shadow-md w-full max-w-sm">
      <h1 class="text-2xl font-bold mb-6 text-center text-white">Admin Login</h1>
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div>
          <label class="block text-sm font-medium mb-1 text-gray-300">Email</label>
          <input v-model="email" type="email" required class="w-full border border-gray-600 rounded px-3 py-2 bg-gray-700 text-white" />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1 text-gray-300">Password</label>
          <div class="relative">
            <input v-model="password" :type="showPassword ? 'text' : 'password'" required class="w-full border border-gray-600 rounded px-3 py-2 pr-10 bg-gray-700 text-white" />
            <button type="button" @click="showPassword = !showPassword" class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 text-sm">
              {{ showPassword ? '🙈' : '👁️' }}
            </button>
          </div>
        </div>
        <p v-if="error" class="text-red-400 text-sm">{{ error }}</p>
        <button type="submit" class="w-full bg-indigo-600 text-white rounded py-2 font-medium hover:bg-indigo-700">
          Sign In
        </button>
      </form>
    </div>
  </div>
</template>
