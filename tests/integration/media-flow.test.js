import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest'

let storedMedia = []
let storedVersions = []
let storedEpisodes = []
let storedEpisodeVersions = []

const mockFindMany = vi.fn(() => Promise.resolve(storedMedia))
const mockFindUnique = vi.fn(({ where }) => Promise.resolve(storedMedia.find(m => m.id === where.id) || null))
const mockCreate = vi.fn(({ data }) => {
  if (data.type) {
    const item = { ...data, versions: [], episodes: [] }
    storedMedia.push(item)
    return Promise.resolve(item)
  }
  if (data.mediaId && data.season != null) {
    const ep = { ...data, versions: [] }
    storedEpisodes.push(ep)
    return Promise.resolve(ep)
  }
  if (data.mediaId && data.label) {
    const v = { ...data }
    storedVersions.push(v)
    return Promise.resolve(v)
  }
  if (data.episodeId && data.label) {
    const ev = { ...data }
    storedEpisodeVersions.push(ev)
    return Promise.resolve(ev)
  }
  return Promise.resolve(data)
})
const mockUpdate = vi.fn(({ where, data }) => {
  const collections = [storedMedia, storedEpisodes]
  for (const coll of collections) {
    const idx = coll.findIndex(m => m.id === where.id)
    if (idx !== -1) {
      coll[idx] = { ...coll[idx], ...data }
      return Promise.resolve(coll[idx])
    }
  }
  return Promise.reject(new Error('Not found'))
})
const mockDelete = vi.fn(({ where }) => {
  for (const coll of [storedMedia, storedVersions, storedEpisodes, storedEpisodeVersions]) {
    const idx = coll.findIndex(m => m.id === where.id)
    if (idx !== -1) {
      coll.splice(idx, 1)
      return Promise.resolve({ id: where.id })
    }
  }
  return Promise.reject(new Error('Not found'))
})
const mockDeleteMany = vi.fn(({ where }) => {
  if (where.mediaId) {
    storedVersions = storedVersions.filter(v => v.mediaId !== where.mediaId)
    storedEpisodes = storedEpisodes.filter(e => e.mediaId !== where.mediaId)
    storedEpisodeVersions = storedEpisodeVersions.filter(ev => {
      const ep = storedEpisodes.find(e => e.id === ev.episodeId)
      return !ep
    })
  }
  if (where.episodeId) {
    storedEpisodeVersions = storedEpisodeVersions.filter(ev => ev.episodeId !== where.episodeId)
  }
  return Promise.resolve({ count: 0 })
})

const mockPrisma = {
  media: { findMany: mockFindMany, findUnique: mockFindUnique, create: mockCreate, update: mockUpdate, delete: mockDelete },
  version: { create: mockCreate, delete: mockDelete, deleteMany: mockDeleteMany },
  episode: { findMany: mockFindMany, create: mockCreate, delete: mockDelete, update: mockUpdate, deleteMany: mockDeleteMany },
  episodeVersion: { create: mockCreate, delete: mockDelete, deleteMany: mockDeleteMany }
}

vi.stubGlobal('prisma', mockPrisma)
vi.stubGlobal('existsSync', vi.fn(() => true))
vi.stubGlobal('mkdirSync', vi.fn())

describe('Media CRUD Integration Flow', () => {
  let media

  beforeAll(async () => {
    const mod = await import('../../server/utils/media')
    media = mod
  })

  beforeEach(() => {
    vi.clearAllMocks()
    storedMedia = []
    storedVersions = []
    storedEpisodes = []
    storedEpisodeVersions = []
  })

  it('full media lifecycle: create -> read -> update -> delete', async () => {
    const movieData = { id: '1', title: 'Test Movie', type: 'movie', genre: 'Action', year: 2024, description: 'A test movie', rating: 8.5, image: 'poster.jpg' }

    const created = await media.createMedia(movieData)
    expect(created.title).toBe('Test Movie')
    expect(created.type).toBe('movie')

    const found = await media.getMediaById('1')
    expect(found).toBeTruthy()
    expect(found.title).toBe('Test Movie')

    const updated = await media.updateMedia('1', { title: 'Updated Movie', rating: 9.0 })
    expect(updated.title).toBe('Updated Movie')
    expect(updated.rating).toBe(9.0)

    const deleted = await media.deleteMedia('1')
    expect(deleted).toBe(true)

    const notFound = await media.getMediaById('1')
    expect(notFound).toBeNull()
  })

  it('manages series with episodes and versions', async () => {
    const series = await media.createMedia({ id: '2', title: 'Test Series', type: 'series', genre: 'Drama', seasons: 3 })
    expect(series.seasons).toBe(3)

    const ep1 = await media.addEpisode('2', { id: 'e1', season: 1, episode: 1, title: 'Pilot' })
    expect(ep1.title).toBe('Pilot')

    const ep2 = await media.addEpisode('2', { id: 'e2', season: 1, episode: 2, title: 'Second Episode' })
    expect(ep2.title).toBe('Second Episode')

    const ev1 = await media.addEpisodeVersion('2', 'e1', { id: 'ev1', label: 'English', file: 'pilot_en.mp4' })
    expect(ev1.label).toBe('English')

    const ev2 = await media.addEpisodeVersion('2', 'e1', { id: 'ev2', label: 'Spanish', file: 'pilot_es.mp4' })
    expect(ev2.label).toBe('Spanish')

    expect(storedEpisodes.length).toBe(2)

    let removed = await media.removeEpisodeVersion('2', 'e1', 'ev2')
    expect(removed).toBe(true)
    expect(storedEpisodeVersions.length).toBe(1)

    removed = await media.removeEpisode('2', 'e2')
    expect(removed).toBe(true)
    expect(storedEpisodes.length).toBe(1)

    const fullSeries = await media.getMediaById('2')
    expect(fullSeries).toBeTruthy()
  })

  it('prevents deleting nonexistent media', async () => {
    const result = await media.deleteMedia('nonexistent')
    expect(result).toBe(false)
  })

  it('handles anime type with seasons', async () => {
    const anime = await media.createMedia({ id: '3', title: 'Test Anime', type: 'anime', genre: 'Action', seasons: 1 })
    expect(anime.type).toBe('anime')

    const ep = await media.addEpisode('3', { id: 'e3', season: 1, episode: 1, title: 'Episode 1' })
    expect(ep.season).toBe(1)

    const version = await media.addEpisodeVersion('3', 'e3', { id: 'ev3', label: 'Japanese', file: 'ep1_jp.mp4' })
    expect(version.label).toBe('Japanese')
  })

  it('lists all media ordered by title', async () => {
    await media.createMedia({ id: 'a', title: 'Alpha', type: 'movie', genre: 'Action' })
    await media.createMedia({ id: 'b', title: 'Beta', type: 'movie', genre: 'Comedy' })

    mockFindMany.mockResolvedValue(storedMedia)
    const all = await media.getAllMedia()
    expect(all.length).toBe(2)
  })
})
