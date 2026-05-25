<script setup>
definePageMeta({ middleware: 'admin' })

const { fetchMe, logout } = useAuth()
const { uploadFile, addVersion, removeVersion, addEpisode, removeEpisode, addEpisodeVersion, removeEpisodeVersion } = useMedia()
const media = ref([])
const loading = ref(true)
const editing = ref(null)
const showForm = ref(false)
const success = ref('')
const error = ref('')

const form = ref({
  title: '',
  type: 'movie',
  genre: '',
  year: null,
  description: '',
  rating: null,
  image: '',
  seasons: null
})

const uploadingVer = ref(false)
const uploadingEpVer = ref({})
const showFilePanel = ref('')
const showEpForm = ref('')

onMounted(async () => {
  await fetchMe()
  await loadMedia()
})

async function loadMedia() {
  media.value = await $fetch('/api/media')
  loading.value = false
}

function openCreate() {
  form.value = { title: '', type: 'movie', genre: '', year: null, description: '', rating: null, image: '', seasons: null }
  editing.value = null
  showForm.value = true
  success.value = ''
  error.value = ''
}

function openEdit(item) {
  form.value = { ...item }
  editing.value = item.id
  showForm.value = true
  success.value = ''
  error.value = ''
}

async function save() {
  success.value = ''
  error.value = ''
  try {
    if (editing.value) {
      await $fetch(`/api/media/${editing.value}`, { method: 'PUT', body: form.value })
      success.value = 'Atualizado com sucesso!'
    } else {
      await $fetch('/api/media', { method: 'POST', body: form.value })
      success.value = 'Criado com sucesso!'
    }
    showForm.value = false
    await loadMedia()
  } catch (e) {
    error.value = e.data?.message || 'Erro ao salvar'
  }
}

async function remove(id) {
  if (!confirm('Tem certeza que deseja excluir?')) return
  try {
    await $fetch(`/api/media/${id}`, { method: 'DELETE' })
    success.value = 'Excluído com sucesso!'
    await loadMedia()
  } catch (e) {
    error.value = e.data?.message || 'Erro ao excluir'
  }
}

async function handleUploadVersion(item) {
  const label = prompt('Nome da versão (ex: Português, English):')
  if (!label) return
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'video/mp4,video/webm,video/ogg,video/x-matroska'
  input.onchange = async () => {
    const file = input.files[0]
    if (!file) return
    uploadingVer.value = true
    error.value = ''
    try {
      const res = await uploadFile(file)
      await addVersion(item.id, { label, file: res.filePath })
      success.value = `Versão "${label}" adicionada!`
      await loadMedia()
    } catch (e) {
      error.value = e.data?.message || 'Erro ao enviar versão'
    }
    uploadingVer.value = false
  }
  input.click()
}

async function removeVer(item, versionId) {
  try {
    await removeVersion(item.id, versionId)
    success.value = 'Versão removida!'
    await loadMedia()
  } catch (e) {
    error.value = e.data?.message || 'Erro ao remover versão'
  }
}

async function handleAddEpisode(item) {
  const season = prompt('Temporada:')
  if (!season) return
  const episode = prompt('Episódio:')
  if (!episode) return
  const title = prompt('Título do episódio:')
  if (!title) return
  try {
    await addEpisode(item.id, { season: Number(season), episode: Number(episode), title })
    success.value = 'Episódio adicionado!'
    await loadMedia()
  } catch (e) {
    error.value = e.data?.message || 'Erro ao adicionar episódio'
  }
}

async function handleRemoveEpisode(item, episodeId) {
  if (!confirm('Remover este episódio?')) return
  try {
    await removeEpisode(item.id, episodeId)
    success.value = 'Episódio removido!'
    await loadMedia()
  } catch (e) {
    error.value = e.data?.message || 'Erro ao remover episódio'
  }
}

async function handleUploadEpVersion(item, episode) {
  const label = prompt('Nome da versão (ex: Português, English):')
  if (!label) return
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'video/mp4,video/webm,video/ogg,video/x-matroska'
  input.onchange = async () => {
    const file = input.files[0]
    if (!file) return
    uploadingEpVer.value = { ...uploadingEpVer.value, [episode.id]: true }
    error.value = ''
    try {
      const res = await uploadFile(file)
      await addEpisodeVersion(item.id, episode.id, { label, file: res.filePath })
      success.value = `Versão "${label}" adicionada ao episódio!`
      await loadMedia()
    } catch (e) {
      error.value = e.data?.message || 'Erro ao enviar versão do episódio'
    }
    uploadingEpVer.value = { ...uploadingEpVer.value, [episode.id]: false }
  }
  input.click()
}

async function removeEpVersion(item, episodeId, versionId) {
  try {
    await removeEpisodeVersion(item.id, episodeId, versionId)
    success.value = 'Versão removida!'
    await loadMedia()
  } catch (e) {
    error.value = e.data?.message || 'Erro ao remover versão'
  }
}

function toggleFiles(itemId) {
  showFilePanel.value = showFilePanel.value === itemId ? '' : itemId
}

function toggleEpForm(itemId) {
  showEpForm.value = showEpForm.value === itemId ? '' : itemId
}

async function handleLogout() {
  await logout()
  navigateTo('/admin/login')
}
</script>

<template>
  <div class="min-h-screen bg-gray-900 text-white">
    <header class="bg-gray-800 shadow">
      <div class="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <h1 class="text-xl font-bold">Admin - Mídias</h1>
        <div class="flex items-center gap-4">
          <NuxtLink to="/admin" class="text-sm text-blue-400 hover:underline">Dashboard</NuxtLink>
          <button @click="handleLogout" class="text-sm text-red-400 hover:underline">Sign Out</button>
        </div>
      </div>
    </header>

    <main class="max-w-6xl mx-auto px-6 py-8">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-lg font-semibold">Gerenciar Mídias</h2>
        <button @click="openCreate"
                class="bg-indigo-600 px-4 py-2 rounded text-sm font-medium hover:bg-indigo-700">
          + Nova Mídia
        </button>
      </div>

      <p v-if="success" class="bg-green-900 text-green-300 px-4 py-2 rounded mb-4">{{ success }}</p>
      <p v-if="error" class="bg-red-900 text-red-300 px-4 py-2 rounded mb-4">{{ error }}</p>

      <div v-if="showForm" class="bg-gray-800 rounded-lg p-6 mb-6">
        <h3 class="text-lg font-semibold mb-4">{{ editing ? 'Editar' : 'Nova' }} Mídia</h3>
        <form @submit.prevent="save" class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="md:col-span-2">
            <label class="block text-sm text-gray-400 mb-1">Título *</label>
            <input v-model="form.title" required
                   class="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white" />
          </div>
          <div>
            <label class="block text-sm text-gray-400 mb-1">Tipo *</label>
            <select v-model="form.type"
                    class="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white">
              <option value="movie">Filme</option>
              <option value="series">Série</option>
              <option value="anime">Anime</option>
            </select>
          </div>
          <div>
            <label class="block text-sm text-gray-400 mb-1">Gênero *</label>
            <input v-model="form.genre" required
                   class="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white" />
          </div>
          <div>
            <label class="block text-sm text-gray-400 mb-1">Ano</label>
            <input v-model="form.year" type="number"
                   class="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white" />
          </div>
          <div>
            <label class="block text-sm text-gray-400 mb-1">Nota (0-10)</label>
            <input v-model="form.rating" type="number" step="0.1" min="0" max="10"
                   class="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white" />
          </div>
          <div v-if="form.type === 'series' || form.type === 'anime'">
            <label class="block text-sm text-gray-400 mb-1">Temporadas</label>
            <input v-model="form.seasons" type="number"
                   class="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white" />
          </div>
          <div class="md:col-span-2">
            <label class="block text-sm text-gray-400 mb-1">URL da Imagem</label>
            <input v-model="form.image"
                   class="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white" />
          </div>
          <div class="md:col-span-2">
            <label class="block text-sm text-gray-400 mb-1">Descrição</label>
            <textarea v-model="form.description" rows="3"
                      class="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"></textarea>
          </div>
          <div class="md:col-span-2 flex gap-2">
            <button type="submit"
                    class="bg-indigo-600 px-6 py-2 rounded font-medium hover:bg-indigo-700">
              {{ editing ? 'Atualizar' : 'Criar' }}
            </button>
            <button type="button" @click="showForm = false"
                    class="bg-gray-600 px-6 py-2 rounded font-medium hover:bg-gray-500">
              Cancelar
            </button>
          </div>
        </form>
      </div>

      <div v-if="loading" class="text-center text-gray-400 py-12">Carregando...</div>

      <div v-else-if="media.length === 0" class="text-center text-gray-400 py-12">
        Nenhuma mídia cadastrada.
      </div>

      <div v-else class="space-y-4">
        <div v-for="item in media" :key="item.id" class="bg-gray-800 rounded-lg overflow-hidden">
          <div class="flex items-center justify-between px-6 py-4">
            <div class="flex items-center gap-4">
              <div class="w-12 h-16 bg-gray-700 rounded overflow-hidden flex-shrink-0">
                <img v-if="item.image" :src="item.image" :alt="item.title" class="w-full h-full object-cover" />
              </div>
              <div>
                <h3 class="font-medium">{{ item.title }}</h3>
                <p class="text-sm text-gray-400">
                  <span class="text-xs px-1.5 py-0.5 rounded"
                        :class="item.type === 'movie' ? 'bg-blue-900 text-blue-300' : item.type === 'series' ? 'bg-green-900 text-green-300' : 'bg-purple-900 text-purple-300'">
                    {{ item.type === 'movie' ? 'Filme' : item.type === 'series' ? 'Série' : 'Anime' }}
                  </span>
                  {{ item.genre }} · {{ item.year || '-' }}
                  <span v-if="item.rating" class="text-yellow-400">★ {{ item.rating }}</span>
                  <span v-if="item.episodes?.length" class="text-gray-500 ml-2">{{ item.episodes.length }} episódios</span>
                </p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <span v-if="item.versions?.length" class="text-xs text-green-400">● {{ item.versions.length }} versões</span>
              <button @click="toggleFiles(item.id)"
                      class="text-sm text-gray-400 hover:text-white transition px-2">
                {{ showFilePanel === item.id ? '▲' : '▼' }}
              </button>
              <button @click="openEdit(item)" class="text-blue-400 hover:text-blue-300 text-sm">Editar</button>
              <button @click="remove(item.id)" class="text-red-400 hover:text-red-300 text-sm">Excluir</button>
            </div>
          </div>

          <div v-if="showFilePanel === item.id" class="border-t border-gray-700 px-6 py-4 bg-gray-850 space-y-6">
            <div v-if="item.type === 'movie'">
              <h4 class="text-sm font-semibold text-gray-300 mb-3">Versões</h4>
              <div v-if="item.versions?.length" class="space-y-2 mb-3">
                <div v-for="v in item.versions" :key="v.id"
                     class="flex items-center justify-between text-xs text-gray-400 bg-gray-700 rounded px-3 py-2">
                  <span class="font-medium text-white">{{ v.label }}</span>
                  <button @click="removeVer(item, v.id)" class="text-red-400 hover:text-red-300 ml-4">×</button>
                </div>
              </div>
              <div v-else class="text-xs text-gray-500 mb-3">Nenhuma versão.</div>
              <button @click="handleUploadVersion(item)" :disabled="uploadingVer"
                      class="bg-indigo-700 hover:bg-indigo-600 disabled:opacity-50 px-4 py-2 rounded text-xs font-medium transition">
                {{ uploadingVer ? 'Enviando...' : '+ Adicionar Versão' }}
              </button>
            </div>

            <div v-if="item.type === 'series' || item.type === 'anime'">
              <div class="flex items-center justify-between mb-3">
                <h4 class="text-sm font-semibold text-gray-300">Episódios</h4>
                <button @click="handleAddEpisode(item)"
                        class="bg-green-700 hover:bg-green-600 px-3 py-1 rounded text-xs font-medium transition">
                  + Episódio
                </button>
              </div>
              <div v-if="item.episodes?.length" class="space-y-3">
                <div v-for="ep in item.episodes" :key="ep.id"
                     class="bg-gray-700 rounded px-3 py-2">
                  <div class="flex items-center justify-between text-sm">
                    <span class="font-medium text-white">
                      S{{ String(ep.season).padStart(2, '0') }}E{{ String(ep.episode).padStart(2, '0') }} - {{ ep.title }}
                    </span>
                    <button @click="handleRemoveEpisode(item, ep.id)" class="text-red-400 hover:text-red-300 text-xs ml-2">×</button>
                  </div>
                  <div class="mt-2 space-y-1">
                    <div v-for="v in ep.versions" :key="v.id"
                         class="flex items-center justify-between text-xs text-gray-400 ml-2">
                      <span>{{ v.label }}</span>
                      <button @click="removeEpVersion(item, ep.id, v.id)" class="text-red-400 hover:text-red-300">×</button>
                    </div>
                  </div>
                  <button @click="handleUploadEpVersion(item, ep)" :disabled="uploadingEpVer[ep.id]"
                          class="mt-2 bg-indigo-700 hover:bg-indigo-600 disabled:opacity-50 px-3 py-1 rounded text-xs font-medium transition">
                    {{ uploadingEpVer[ep.id] ? 'Enviando...' : '+ Versão' }}
                  </button>
                </div>
              </div>
              <div v-else class="text-xs text-gray-500">Nenhum episódio.</div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>
