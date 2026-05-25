export function useMedia() {
  async function uploadFile(file) {
    const form = new FormData()
    form.append('video', file)
    return $fetch('/api/media/upload', {
      method: 'POST',
      body: form
    })
  }

  async function addVersion(id, { label, file }) {
    return $fetch(`/api/media/${id}/versions`, {
      method: 'POST',
      body: { label, file }
    })
  }

  async function removeVersion(id, versionId) {
    return $fetch(`/api/media/${id}/versions`, {
      method: 'DELETE',
      body: { versionId }
    })
  }

  async function addEpisode(id, { season, episode, title }) {
    return $fetch(`/api/media/${id}/episodes`, {
      method: 'POST',
      body: { season, episode, title }
    })
  }

  async function removeEpisode(id, episodeId) {
    return $fetch(`/api/media/${id}/episodes/${episodeId}`, {
      method: 'DELETE'
    })
  }

  async function addEpisodeVersion(id, episodeId, { label, file }) {
    return $fetch(`/api/media/${id}/episodes/${episodeId}/versions`, {
      method: 'POST',
      body: { label, file }
    })
  }

  async function removeEpisodeVersion(id, episodeId, versionId) {
    return $fetch(`/api/media/${id}/episodes/${episodeId}/versions`, {
      method: 'DELETE',
      body: { versionId }
    })
  }

  return { uploadFile, addVersion, removeVersion, addEpisode, removeEpisode, addEpisodeVersion, removeEpisodeVersion }
}
