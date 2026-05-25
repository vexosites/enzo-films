<script setup>
definePageMeta({ middleware: 'auth' })

const { fetchMe } = useAuth()
const route = useRoute()
const item = ref(null)
const loading = ref(true)

const selectedSeason = ref(1)
const selectedEpisode = ref(null)

onMounted(async () => {
  await fetchMe()
  item.value = await $fetch(`/api/media/${route.params.id}`)
  if (item.value.episodes?.length) {
    const first = item.value.episodes.sort((a, b) => a.season - b.season || a.episode - b.episode)[0]
    selectedSeason.value = first.season
    selectedEpisode.value = first
  }
  loading.value = false
})

const seasons = computed(() => {
  if (!item.value?.episodes) return []
  const s = new Set(item.value.episodes.map(e => e.season))
  return [...s].sort((a, b) => a - b)
})

const seasonEpisodes = computed(() => {
  if (!item.value?.episodes) return []
  return item.value.episodes
    .filter(e => e.season === selectedSeason.value)
    .sort((a, b) => a.episode - b.episode)
})

function selectEpisode(ep) {
  selectedEpisode.value = ep
}

function changeSeason(s) {
  selectedSeason.value = s
  const eps = item.value.episodes.filter(e => e.season === s).sort((a, b) => a.episode - b.episode)
  if (eps.length) selectedEpisode.value = eps[0]
}

const versions = computed(() => {
  if (item.value?.type === 'movie') {
    return item.value.versions || []
  }
  return selectedEpisode.value?.versions || []
})
</script>

<template>
  <div class="min-h-screen bg-gray-100">
    <header class="bg-white shadow">
      <div class="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
        <h1 class="text-xl font-bold">{{ item?.title || 'Detalhes' }}</h1>
        <NuxtLink to="/media" class="text-sm text-blue-600 hover:underline">← Voltar</NuxtLink>
      </div>
    </header>

    <main class="max-w-5xl mx-auto px-4 py-8">
      <div v-if="loading" class="text-center text-gray-500 py-12">Carregando...</div>

      <div v-else-if="!item" class="text-center text-gray-500 py-12">Mídia não encontrada.</div>

      <div v-else>
        <div v-if="(item.type === 'series' || item.type === 'anime') && seasons.length" class="bg-white rounded-lg shadow p-4 mb-6">
          <div class="flex flex-wrap items-center gap-4">
            <div class="flex items-center gap-2">
              <label class="text-sm font-medium text-gray-600">Temporada:</label>
              <select v-model="selectedSeason" @change="changeSeason(selectedSeason)"
                      class="border rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option v-for="s in seasons" :key="s" :value="s">Temporada {{ s }}</option>
              </select>
            </div>
            <div class="flex items-center gap-2">
              <label class="text-sm font-medium text-gray-600">Episódio:</label>
              <select :value="selectedEpisode?.id" @change="selectEpisode(item.episodes.find(e => e.id === $event.target.value))"
                      class="border rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option v-for="ep in seasonEpisodes" :key="ep.id" :value="ep.id">
                  Ep. {{ ep.episode }} - {{ ep.title }}
                </option>
              </select>
            </div>
          </div>
        </div>

        <div v-if="versions.length > 0" class="mb-6">
          <MediaPlayer :versions="versions" />
        </div>

        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-start gap-6">
            <div v-if="item.image && versions.length === 0" class="w-48 flex-shrink-0">
              <img :src="item.image" :alt="item.title" class="w-full rounded-lg" />
            </div>
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-2">
                <span class="text-xs font-medium px-2 py-0.5 rounded"
                      :class="item.type === 'movie' ? 'bg-blue-100 text-blue-700' : item.type === 'series' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'">
                  {{ item.type === 'movie' ? 'Filme' : item.type === 'series' ? 'Série' : 'Anime' }}
                </span>
                <span v-if="item.rating" class="text-sm text-yellow-600 font-semibold">★ {{ item.rating }}</span>
              </div>

              <h1 class="text-2xl font-bold mb-2">{{ item.title }}</h1>
              <p class="text-gray-500 mb-4">{{ item.genre }} · {{ item.year }}</p>
              <p v-if="(item.type === 'series' || item.type === 'anime') && item.seasons" class="text-sm text-gray-600 mb-4">
                {{ item.seasons }} temporada{{ item.seasons > 1 ? 's' : '' }}
              </p>
              <p class="text-gray-700 leading-relaxed">{{ item.description }}</p>

              <div v-if="selectedEpisode && (item.type === 'series' || item.type === 'anime')" class="mt-4 pt-4 border-t">
                <p class="text-sm text-gray-500">Temporada {{ selectedEpisode.season }}, Episódio {{ selectedEpisode.episode }}</p>
                <p class="font-semibold">{{ selectedEpisode.title }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>
