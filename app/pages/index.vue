<script setup>
definePageMeta({ middleware: 'auth' })

const { user, fetchMe, logout } = useAuth()
const loading = ref(true)

onMounted(async () => {
  await fetchMe()
  loading.value = false
})

async function handleLogout() {
  await logout()
  navigateTo('/login')
}
</script>

<template>
  <div class="min-h-screen bg-gray-100">
    <header class="bg-white shadow">
      <div class="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
        <h1 class="text-xl font-bold">Dashboard</h1>
        <div class="flex items-center gap-4">
          <NuxtLink to="/media" class="text-sm text-blue-600 hover:underline">Catálogo</NuxtLink>
          <button @click="handleLogout" class="text-sm text-red-600 hover:underline">
            Sign Out
          </button>
        </div>
      </div>
    </header>
    <main class="max-w-4xl mx-auto px-4 py-8">
      <div v-if="loading" class="text-center text-gray-500">loading...</div>
      <div v-else-if="user" class="bg-white rounded-lg shadow p-6">
        <p class="text-lg">Welcome, <span class="font-semibold">{{ user.name }}</span>!</p>
        <p class="text-gray-500 text-sm mt-1">{{ user.email }}</p>
      </div>
    </main>
  </div>
</template>
