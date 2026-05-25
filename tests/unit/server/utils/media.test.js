import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest'

const mockFindMany = vi.fn()
const mockFindUnique = vi.fn()
const mockCreate = vi.fn()
const mockUpdate = vi.fn()
const mockDelete = vi.fn()
const mockDeleteMany = vi.fn()

const mockPrisma = {
  media: { findMany: mockFindMany, findUnique: mockFindUnique, create: mockCreate, update: mockUpdate, delete: mockDelete },
  version: { deleteMany: mockDeleteMany, create: mockCreate, delete: mockDelete },
  episode: { findMany: mockFindMany, deleteMany: mockDeleteMany, create: mockCreate, delete: mockDelete, update: mockUpdate },
  episodeVersion: { deleteMany: mockDeleteMany, create: mockCreate, delete: mockDelete }
}

vi.stubGlobal('prisma', mockPrisma)
vi.stubGlobal('existsSync', vi.fn(() => true))
vi.stubGlobal('mkdirSync', vi.fn())

describe('media', () => {
  let media

  beforeAll(async () => {
    const mod = await import('../../../../server/utils/media')
    media = mod
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getAllMedia', () => {
    it('returns all media ordered by title', async () => {
      const fakeMedia = [{ id: '1', title: 'Test' }]
      mockFindMany.mockResolvedValue(fakeMedia)

      const result = await media.getAllMedia()
      expect(mockFindMany).toHaveBeenCalledWith({
        include: { versions: true, episodes: { include: { versions: true } } },
        orderBy: { title: 'asc' }
      })
      expect(result).toEqual(fakeMedia)
    })

    it('returns empty array when no media', async () => {
      mockFindMany.mockResolvedValue([])
      const result = await media.getAllMedia()
      expect(result).toEqual([])
    })
  })

  describe('getMediaById', () => {
    it('returns media when found', async () => {
      const fakeMedia = { id: '1', title: 'Test', versions: [] }
      mockFindUnique.mockResolvedValue(fakeMedia)

      const result = await media.getMediaById('1')
      expect(mockFindUnique).toHaveBeenCalledWith({
        where: { id: '1' },
        include: { versions: true, episodes: { include: { versions: true } } }
      })
      expect(result).toEqual(fakeMedia)
    })

    it('returns null when not found', async () => {
      mockFindUnique.mockResolvedValue(null)
      const result = await media.getMediaById('nonexistent')
      expect(result).toBeNull()
    })
  })

  describe('createMedia', () => {
    it('creates and returns media', async () => {
      const data = { id: '1', title: 'New', type: 'movie', genre: 'Action' }
      mockCreate.mockResolvedValue(data)

      const result = await media.createMedia(data)
      expect(mockCreate).toHaveBeenCalledWith({ data })
      expect(result).toEqual(data)
    })
  })

  describe('updateMedia', () => {
    it('updates and returns media', async () => {
      const updated = { id: '1', title: 'Updated' }
      mockUpdate.mockResolvedValue(updated)

      const result = await media.updateMedia('1', { title: 'Updated' })
      expect(mockUpdate).toHaveBeenCalledWith({ where: { id: '1' }, data: { title: 'Updated' } })
      expect(result).toEqual(updated)
    })
  })

  describe('deleteMedia', () => {
    it('deletes media and related records', async () => {
      mockDeleteMany.mockResolvedValue({ count: 0 })
      mockFindMany.mockResolvedValue([])
      mockDelete.mockResolvedValue({ id: '1' })

      const result = await media.deleteMedia('1')
      expect(result).toBe(true)
      expect(mockDeleteMany).toHaveBeenCalledWith({ where: { mediaId: '1' } })
      expect(mockDelete).toHaveBeenCalledWith({ where: { id: '1' } })
    })

    it('returns false on error', async () => {
      mockDeleteMany.mockRejectedValue(new Error('DB error'))
      const result = await media.deleteMedia('1')
      expect(result).toBe(false)
    })
  })

  describe('addVersion', () => {
    it('creates a version for media', async () => {
      const version = { id: 'v1', label: 'English', file: 'en.mp4' }
      mockCreate.mockResolvedValue(version)

      const result = await media.addVersion('1', version)
      expect(mockCreate).toHaveBeenCalledWith({ data: { ...version, mediaId: '1' } })
      expect(result).toEqual(version)
    })
  })

  describe('removeVersion', () => {
    it('removes version and returns true', async () => {
      mockDelete.mockResolvedValue({ id: 'v1' })
      const result = await media.removeVersion('1', 'v1')
      expect(mockDelete).toHaveBeenCalledWith({ where: { id: 'v1' } })
      expect(result).toBe(true)
    })

    it('returns false when version not found', async () => {
      mockDelete.mockRejectedValue(new Error('Not found'))
      const result = await media.removeVersion('1', 'nonexistent')
      expect(result).toBe(false)
    })
  })

  describe('addEpisode', () => {
    it('creates an episode for media', async () => {
      const episode = { id: 'e1', season: 1, episode: 1, title: 'Pilot' }
      mockCreate.mockResolvedValue(episode)

      const result = await media.addEpisode('1', episode)
      expect(mockCreate).toHaveBeenCalledWith({ data: { ...episode, mediaId: '1' } })
      expect(result).toEqual(episode)
    })
  })

  describe('removeEpisode', () => {
    it('removes episode and its versions', async () => {
      mockDeleteMany.mockResolvedValue({ count: 0 })
      mockDelete.mockResolvedValue({ id: 'e1' })

      const result = await media.removeEpisode('1', 'e1')
      expect(mockDeleteMany).toHaveBeenCalledWith({ where: { episodeId: 'e1' } })
      expect(mockDelete).toHaveBeenCalledWith({ where: { id: 'e1' } })
      expect(result).toBe(true)
    })
  })

  describe('updateEpisode', () => {
    it('updates episode data', async () => {
      const updated = { id: 'e1', title: 'Updated' }
      mockUpdate.mockResolvedValue(updated)

      const result = await media.updateEpisode('1', 'e1', { title: 'Updated' })
      expect(mockUpdate).toHaveBeenCalledWith({ where: { id: 'e1' }, data: { title: 'Updated' } })
      expect(result).toEqual(updated)
    })
  })

  describe('addEpisodeVersion', () => {
    it('creates a version for episode', async () => {
      const version = { id: 'ev1', label: 'English', file: 'en.mp4' }
      mockCreate.mockResolvedValue(version)

      const result = await media.addEpisodeVersion('1', 'e1', version)
      expect(mockCreate).toHaveBeenCalledWith({ data: { ...version, episodeId: 'e1' } })
      expect(result).toEqual(version)
    })
  })

  describe('removeEpisodeVersion', () => {
    it('removes episode version and returns true', async () => {
      mockDelete.mockResolvedValue({ id: 'ev1' })
      const result = await media.removeEpisodeVersion('1', 'e1', 'ev1')
      expect(mockDelete).toHaveBeenCalledWith({ where: { id: 'ev1' } })
      expect(result).toBe(true)
    })
  })
})
