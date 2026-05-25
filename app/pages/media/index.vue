<script setup>
definePageMeta({ middleware: 'auth' })

const { fetchMe } = useAuth()
const media = ref([])
const loading = ref(true)
const filterType = ref('all')
const search = ref('')

onMounted(async () => {
  await fetchMe()
  media.value = await $fetch('/api/media')
  loading.value = false
})

const filtered = computed(() => {
  let list = media.value
  if (filterType.value !== 'all') {
    list = list.filter(m => m.type === filterType.value)
  }
  if (search.value) {
    const q = search.value.toLowerCase()
    list = list.filter(m => m.title.toLowerCase().includes(q) || m.genre.toLowerCase().includes(q))
  }
  return list
})
</script>

<template>
  <div class="min-h-screen bg-gray-100">
    <header class="bg-white shadow">
      <div class="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <h1 class="text-xl font-bold">Catálogo</h1>
        <NuxtLink to="/" class="text-sm text-blue-600 hover:underline">Dashboard</NuxtLink>
      </div>
    </header>

    <main class="max-w-6xl mx-auto px-4 py-8">
      <div class="flex flex-col sm:flex-row gap-4 mb-6">
        <input v-model="search" type="text" placeholder="Pesquisar por título ou gênero..."
               class="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <select v-model="filterType"
                class="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="all">Todos</option>
          <option value="movie">Filmes</option>
          <option value="series">Séries</option>
          <option value="anime">Animes</option>
        </select>
      </div>

      <div v-if="loading" class="text-center text-gray-500 py-12">Carregando...</div>

      <div v-else-if="filtered.length === 0" class="text-center text-gray-500 py-12">
        Nenhum resultado encontrado.
      </div>

      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <NuxtLink v-for="item in filtered" :key="item.id"
                  :to="`/media/${item.id}`"
                  class="bg-white rounded-lg shadow hover:shadow-lg transition overflow-hidden">
          <div class="h-48 bg-gray-200 overflow-hidden">
            <img v-if="item.image" :src="item.image" :alt="item.title"
                 class="w-full h-full object-cover" />
            <div v-else class="w-full h-full flex items-center justify-center text-gray-400">
              Sem imagem
            </div>
          </div>
          <div class="p-4">
            <div class="flex items-center justify-between mb-1">
              <span class="text-xs font-medium px-2 py-0.5 rounded"
                    :class="item.type === 'movie' ? 'bg-blue-100 text-blue-700' : item.type === 'series' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'">
                {{ item.type === 'movie' ? 'Filme' : item.type === 'series' ? 'Série' : 'Anime' }}
              </span>
              <span v-if="item.rating" class="text-sm text-yellow-600 font-semibold">★ {{ item.rating }}</span>
            </div>
            <h2 class="text-lg font-semibold">{{ item.title }}</h2>
            <p class="text-sm text-gray-500">{{ item.genre }} · {{ item.year }}</p>
            <p class="text-sm text-gray-600 mt-2 line-clamp-2">{{ item.description }}</p>
          </div>
        </NuxtLink>
      </div>
    </main>
  </div>
</template>
