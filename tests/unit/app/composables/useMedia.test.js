import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest'

vi.stubGlobal('$fetch', vi.fn())
vi.stubGlobal('FormData', class {
  constructor() { this.data = {} }
  append(key, value) { this.data[key] = value }
})

describe('useMedia', () => {
  let useMedia

  beforeAll(async () => {
    const mod = await import('../../../../app/composables/useMedia')
    useMedia = mod.useMedia
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('uploadFile sends multipart form', async () => {
    const fakeFile = { name: 'video.mp4', size: 1000 }
    const fakeResponse = { fileName: '123_test.mp4', filePath: 'media/uploads/videos/123_test.mp4' }
    $fetch.mockResolvedValue(fakeResponse)

    const media = useMedia()
    const result = await media.uploadFile(fakeFile)

    expect($fetch).toHaveBeenCalledWith('/api/media/upload', {
      method: 'POST',
      body: expect.any(FormData)
    })
    expect(result).toEqual(fakeResponse)
  })

  it('addVersion calls POST with label and file', async () => {
    const fakeResponse = { id: 'v1', label: 'English', file: 'en.mp4' }
    $fetch.mockResolvedValue(fakeResponse)

    const media = useMedia()
    const result = await media.addVersion('1', { label: 'English', file: 'en.mp4' })

    expect($fetch).toHaveBeenCalledWith('/api/media/1/versions', {
      method: 'POST',
      body: { label: 'English', file: 'en.mp4' }
    })
    expect(result).toEqual(fakeResponse)
  })

  it('removeVersion calls DELETE', async () => {
    $fetch.mockResolvedValue({ message: 'version removed' })

    const media = useMedia()
    const result = await media.removeVersion('1', 'v1')

    expect($fetch).toHaveBeenCalledWith('/api/media/1/versions', {
      method: 'DELETE',
      body: { versionId: 'v1' }
    })
    expect(result).toEqual({ message: 'version removed' })
  })

  it('addEpisode calls POST', async () => {
    const fakeResponse = { id: 'e1', season: 1, episode: 2, title: 'Ep2' }
    $fetch.mockResolvedValue(fakeResponse)

    const media = useMedia()
    const result = await media.addEpisode('1', { season: 1, episode: 2, title: 'Ep2' })

    expect($fetch).toHaveBeenCalledWith('/api/media/1/episodes', {
      method: 'POST',
      body: { season: 1, episode: 2, title: 'Ep2' }
    })
    expect(result).toEqual(fakeResponse)
  })

  it('removeEpisode calls DELETE', async () => {
    $fetch.mockResolvedValue({ message: 'episode removed' })

    const media = useMedia()
    const result = await media.removeEpisode('1', 'e1')

    expect($fetch).toHaveBeenCalledWith('/api/media/1/episodes/e1', {
      method: 'DELETE'
    })
    expect(result).toEqual({ message: 'episode removed' })
  })

  it('addEpisodeVersion calls POST', async () => {
    const fakeResponse = { id: 'ev1', label: 'English', file: 'en.mp4' }
    $fetch.mockResolvedValue(fakeResponse)

    const media = useMedia()
    const result = await media.addEpisodeVersion('1', 'e1', { label: 'English', file: 'en.mp4' })

    expect($fetch).toHaveBeenCalledWith('/api/media/1/episodes/e1/versions', {
      method: 'POST',
      body: { label: 'English', file: 'en.mp4' }
    })
    expect(result).toEqual(fakeResponse)
  })

  it('removeEpisodeVersion calls DELETE', async () => {
    $fetch.mockResolvedValue({ message: 'version removed' })

    const media = useMedia()
    const result = await media.removeEpisodeVersion('1', 'e1', 'ev1')

    expect($fetch).toHaveBeenCalledWith('/api/media/1/episodes/e1/versions', {
      method: 'DELETE',
      body: { versionId: 'ev1' }
    })
    expect(result).toEqual({ message: 'version removed' })
  })
})
