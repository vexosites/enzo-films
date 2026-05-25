<script setup>
definePageMeta({ middleware: 'admin' })

const { user, fetchMe, logout } = useAuth()
const loading = ref(true)

onMounted(async () => {
  await fetchMe()
  loading.value = false
})

async function handleLogout() {
  await logout()
  navigateTo('/admin/login')
}
</script>

<template>
  <div class="min-h-screen bg-gray-900 text-white">
    <header class="bg-gray-800 shadow">
      <div class="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <h1 class="text-xl font-bold">Admin Panel</h1>
        <div class="flex items-center gap-4">
          <NuxtLink to="/admin/media" class="text-sm text-blue-400 hover:underline">Mídias</NuxtLink>
          <span class="text-sm text-gray-400">{{ user?.email }}</span>
          <button @click="handleLogout" class="text-sm text-red-400 hover:underline">
            Sign Out
          </button>
        </div>
      </div>
    </header>
    <main class="max-w-6xl mx-auto px-6 py-8">
      <div class="bg-gray-800 rounded-lg p-6">
        <p v-if="loading" class="text-gray-400">loading...</p>
        <p v-else class="text-lg">Welcome, <span class="font-semibold">{{ user?.name }}</span>!</p>
        <p class="text-gray-400 text-sm mt-1">Admin dashboard ready.</p>
      </div>
    </main>
  </div>
</template>
