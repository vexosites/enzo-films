<script setup>
const props = defineProps({
  versions: { type: Array, default: () => [] }
})

const video = ref(null)
const container = ref(null)
const playing = ref(false)
const currentTime = ref(0)
const duration = ref(0)
const volume = ref(1)
const muted = ref(false)
const fullscreen = ref(false)
const buffered = ref(0)
const showControls = ref(true)
const showVersions = ref(false)
const seeking = ref(false)
const volDragging = ref(false)
const seekBar = ref(null)
const volBar = ref(null)
let controlsTimer = null

const activeVersion = ref(props.versions[0] || null)

const currentSrc = computed(() => {
  if (!activeVersion.value) return null
  const f = activeVersion.value.file
  if (f.startsWith('http')) return f
  return `/api/uploads/${f.replace(/^media\/uploads\//, '')}`
})

const formattedTime = computed(() => {
  const h = Math.floor(currentTime.value / 3600)
  const m = Math.floor((currentTime.value % 3600) / 60)
  const s = Math.floor(currentTime.value % 60)
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
})

const formattedDuration = computed(() => {
  const d = duration.value || 0
  const h = Math.floor(d / 3600)
  const m = Math.floor((d % 3600) / 60)
  const s = Math.floor(d % 60)
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
})

const progressPercent = computed(() => {
  if (!duration.value) return 0
  return (currentTime.value / duration.value) * 100
})

const bufferPercent = computed(() => {
  if (!duration.value) return 0
  return (buffered.value / duration.value) * 100
})

const volumeIcon = computed(() => {
  if (muted.value || volume.value === 0) return 'Mute'
  if (volume.value < 0.5) return 'Low'
  return 'High'
})

function togglePlay() {
  if (!video.value) return
  if (video.value.paused) {
    video.value.play()
  } else {
    video.value.pause()
  }
}

function onPlay() { playing.value = true }
function onPause() { playing.value = false }

function onTimeUpdate() {
  currentTime.value = video.value.currentTime
}

function onLoadedMetadata() {
  duration.value = video.value.duration
}

function onProgress() {
  if (video.value.buffered.length > 0) {
    buffered.value = video.value.buffered.end(video.value.buffered.length - 1)
  }
}

function onEnded() {
  playing.value = false
}

function startSeek(e) {
  seeking.value = true
  seekBar.value = e.currentTarget
  doSeek(e)
}

function doSeek(e) {
  if (!seeking.value || !seekBar.value || !duration.value) return
  const rect = seekBar.value.getBoundingClientRect()
  const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
  video.value.currentTime = pos * duration.value
}

function stopSeek() {
  seeking.value = false
  seekBar.value = null
}

function startVolDrag(e) {
  volDragging.value = true
  volBar.value = e.currentTarget
  doVolume(e)
}

function doVolume(e) {
  if (!volDragging.value || !volBar.value) return
  const rect = volBar.value.getBoundingClientRect()
  const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
  volume.value = pos
  video.value.volume = pos
  if (pos === 0) {
    video.value.muted = true
    muted.value = true
  } else {
    video.value.muted = false
    muted.value = false
  }
}

function stopVolDrag() {
  volDragging.value = false
  volBar.value = null
}

function onDocMouseMove(e) {
  doSeek(e)
  doVolume(e)
}

function onDocMouseUp() {
  stopSeek()
  stopVolDrag()
}

function onVolumeScroll(e) {
  const delta = e.deltaY > 0 ? -0.05 : 0.05
  const val = Math.max(0, Math.min(1, volume.value + delta))
  volume.value = val
  video.value.volume = val
  if (val === 0) {
    video.value.muted = true
    muted.value = true
  } else {
    video.value.muted = false
    muted.value = false
  }
}

function toggleMute() {
  muted.value = !muted.value
  video.value.muted = muted.value
}

function toggleFullscreen() {
  if (!container.value) return
  if (!document.fullscreenElement) {
    container.value.requestFullscreen()
    fullscreen.value = true
  } else {
    document.exitFullscreen()
    fullscreen.value = false
  }
}

function switchVersion(version) {
  if (version.id === activeVersion.value?.id) return
  const currentTime = video.value?.currentTime || 0
  activeVersion.value = version
  showVersions.value = false
  nextTick(() => {
    if (video.value) {
      video.value.currentTime = currentTime
      if (playing.value) video.value.play()
    }
  })
}

onMounted(() => {
  const saved = parseFloat(localStorage.getItem('player_volume') || '1')
  const mutedSaved = localStorage.getItem('player_muted') === 'true'
  volume.value = saved
  muted.value = mutedSaved
  if (video.value) {
    video.value.volume = saved
    video.value.muted = mutedSaved
  }
  document.addEventListener('mousemove', onDocMouseMove)
  document.addEventListener('mouseup', onDocMouseUp)
})

onUnmounted(() => {
  document.removeEventListener('mousemove', onDocMouseMove)
  document.removeEventListener('mouseup', onDocMouseUp)
})

watch(volume, (val) => {
  localStorage.setItem('player_volume', String(val))
})

watch(muted, (val) => {
  localStorage.setItem('player_muted', String(val))
})

function handleMouseMove() {
  showControls.value = true
  clearTimeout(controlsTimer)
  if (playing.value) {
    controlsTimer = setTimeout(() => { showControls.value = false }, 3000)
  }
}
</script>

<template>
  <div ref="container" class="relative bg-black rounded-lg overflow-hidden group"
       @mousemove="handleMouseMove" @mouseleave="showControls = playing ? false : true">
    <video v-if="currentSrc" ref="video" class="w-full aspect-video cursor-pointer" :key="activeVersion?.id" :src="currentSrc"
           @play="onPlay" @pause="onPause" @timeupdate="onTimeUpdate"
           @loadedmetadata="onLoadedMetadata" @progress="onProgress" @ended="onEnded"
           @click="togglePlay" playsinline preload="metadata">
    </video>

    <div v-if="!playing && currentTime === 0"
         class="absolute inset-0 flex items-center justify-center cursor-pointer z-10"
         @click="togglePlay">
      <div class="w-20 h-20 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/80 transition">
        <svg class="w-10 h-10 text-white ml-1.5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M8 5v14l11-7z"/>
        </svg>
      </div>
    </div>

    <div v-if="video && playing && currentTime === 0" class="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
      <div class="w-16 h-16 rounded-full bg-black/50 flex items-center justify-center animate-pulse">
        <svg class="w-8 h-8 text-white ml-1" viewBox="0 0 24 24" fill="currentColor">
          <path d="M8 5v14l11-7z"/>
        </svg>
      </div>
    </div>

    <transition name="fade">
      <div v-if="showControls || !playing"
           class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4 pt-12 z-20">
        <div class="relative mb-1 h-4 flex items-center -mx-2 px-2 cursor-pointer"
             @mousedown.prevent="startSeek">
          <div class="w-full h-1 bg-white/20 rounded relative group/progress">
            <div class="absolute inset-y-0 left-0 bg-white/30 rounded" :style="{ width: bufferPercent + '%' }"></div>
            <div class="absolute inset-y-0 left-0 bg-red-600 rounded" :style="{ width: progressPercent + '%' }"></div>
            <div class="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-red-600 rounded-full opacity-0 group-hover/progress:opacity-100 transition group-hover:scale-125"
                 :style="{ left: progressPercent + '%', transform: 'translate(-50%, -50%)' }"></div>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <button @click="togglePlay" class="text-white hover:text-red-400 transition flex-shrink-0 flex items-center justify-center w-7 h-7">
            <svg v-if="playing" class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
            </svg>
            <svg v-else class="w-5 h-5 ml-0.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </button>

          <button @click="toggleMute"
                  class="text-white hover:text-red-400 transition flex items-center justify-center w-7 h-7 flex-shrink-0">
            <svg v-if="volumeIcon === 'Mute'" class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
            </svg>
            <svg v-else-if="volumeIcon === 'Low'" class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z"/>
            </svg>
            <svg v-else class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
            </svg>
          </button>
          <div class="w-16 h-1.5 bg-white/30 rounded cursor-pointer flex-shrink-0 relative"
               @mousedown.prevent="startVolDrag"
               @wheel.prevent="onVolumeScroll">
            <div class="absolute inset-y-0 left-0 bg-white rounded" :style="{ width: (volume * 100) + '%' }"></div>
          </div>

          <span class="text-white text-xs font-medium select-none flex-shrink-0">
            {{ formattedTime }} / {{ formattedDuration }}
          </span>

          <div class="flex-1"></div>

          <div v-if="versions.length > 1" class="relative">
            <button @click="showVersions = !showVersions"
                    class="text-white hover:text-red-400 transition text-xs font-medium flex items-center gap-1 px-2 py-1 rounded"
                    :class="{ 'bg-red-600/30 text-red-400': versions.length > 1 }">
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
              </svg>
              <span>{{ activeVersion?.label || 'Versão' }}</span>
            </button>
            <div v-if="showVersions"
                 class="absolute bottom-full right-0 mb-2 bg-gray-900 border border-gray-700 rounded-lg py-1 min-w-[180px] shadow-xl">
              <button v-for="v in versions" :key="v.id"
                      @click="switchVersion(v)"
                      class="w-full text-left px-4 py-2 text-sm hover:bg-gray-800 transition flex items-center gap-2"
                      :class="activeVersion?.id === v.id ? 'text-red-400' : 'text-white'">
                <svg v-if="activeVersion?.id === v.id" class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                </svg>
                <span v-else class="w-4"></span>
                {{ v.label }}
              </button>
            </div>
          </div>

          <button @click="toggleFullscreen" class="text-white hover:text-red-400 transition flex items-center justify-center w-7 h-7">
            <svg v-if="!fullscreen" class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
            </svg>
            <svg v-else class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/>
            </svg>
          </button>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
