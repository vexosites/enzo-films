<script setup>
import { ref, onMounted } from 'vue'

const router = useRouter()
const { register, loggedIn } = useAuth()

onMounted(async () => {
  if (loggedIn.value) {
    await navigateTo('/')
  }
})

const name = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const error = ref('')
const showPassword = ref(false)
const showConfirmPassword = ref(false)

async function handleSubmit() {
  error.value = ''

  if (password.value !== confirmPassword.value) {
    error.value = 'passwords do not match'
    return
  }

  try {
    await register(name.value, email.value, password.value)
    router.push('/')
  } catch (e) {
    error.value = e.data?.message || 'registration failed'
  }
}
</script>

<template>
  <div class="fixed inset-0 flex items-center justify-center bg-gray-100">
    <div class="bg-white p-8 rounded-lg shadow-md w-full max-w-sm">
      <h1 class="text-2xl font-bold mb-6 text-center">Register</h1>
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div>
          <label class="block text-sm font-medium mb-1">Name</label>
          <input v-model="name" type="text" required class="w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">Email</label>
          <input v-model="email" type="email" required class="w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">Password</label>
          <div class="relative">
            <input v-model="password" :type="showPassword ? 'text' : 'password'" required minlength="6" class="w-full border rounded px-3 py-2 pr-10" />
            <button type="button" @click="showPassword = !showPassword" class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 text-sm">
              {{ showPassword ? '🙈' : '👁️' }}
            </button>
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">Confirm Password</label>
          <div class="relative">
            <input v-model="confirmPassword" :type="showConfirmPassword ? 'text' : 'password'" required minlength="6" class="w-full border rounded px-3 py-2 pr-10" />
            <button type="button" @click="showConfirmPassword = !showConfirmPassword" class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 text-sm">
              {{ showConfirmPassword ? '🙈' : '👁️' }}
            </button>
          </div>
        </div>
        <p v-if="error" class="text-red-500 text-sm">{{ error }}</p>
        <button type="submit" class="w-full bg-blue-600 text-white rounded py-2 font-medium hover:bg-blue-700">
          Register
        </button>
      </form>
      <p class="text-sm text-center mt-4">
        Already have an account?
        <NuxtLink to="/login" class="text-blue-600 hover:underline">Sign In</NuxtLink>
      </p>
    </div>
  </div>
</template>
