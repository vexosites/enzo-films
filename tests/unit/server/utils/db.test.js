import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest'

const mockFindUnique = vi.fn()
const mockCreate = vi.fn()
const mockPrisma = {
  user: {
    findUnique: mockFindUnique,
    create: mockCreate
  }
}

vi.stubGlobal('prisma', mockPrisma)

describe('db', () => {
  let findByEmail, createUser

  beforeAll(async () => {
    const mod = await import('../../../../server/utils/db')
    findByEmail = mod.findByEmail
    createUser = mod.createUser
  })

  beforeEach(() => {
    mockFindUnique.mockReset()
    mockCreate.mockReset()
  })

  describe('findByEmail', () => {
    it('returns user when found', async () => {
      const fakeUser = { id: '1', email: 'test@test.com', name: 'Test' }
      mockFindUnique.mockResolvedValue(fakeUser)

      const result = await findByEmail('test@test.com')
      expect(mockFindUnique).toHaveBeenCalledWith({ where: { email: 'test@test.com' } })
      expect(result).toEqual(fakeUser)
    })

    it('returns null when user not found', async () => {
      mockFindUnique.mockResolvedValue(null)
      const result = await findByEmail('missing@test.com')
      expect(result).toBeNull()
    })
  })

  describe('createUser', () => {
    it('creates and returns user', async () => {
      const userData = { id: '2', email: 'new@test.com', name: 'New', password: 'hash', role: 'user' }
      mockFindUnique.mockResolvedValue(null)
      mockCreate.mockResolvedValue(userData)

      const result = await createUser(userData)
      expect(mockFindUnique).toHaveBeenCalledWith({ where: { email: 'new@test.com' } })
      expect(mockCreate).toHaveBeenCalledWith({ data: userData })
      expect(result).toEqual(userData)
    })

    it('returns null if email already exists', async () => {
      const existing = { id: '1', email: 'dup@test.com' }
      mockFindUnique.mockResolvedValue(existing)

      const result = await createUser({ id: '3', email: 'dup@test.com', name: 'Dup', password: 'hash', role: 'user' })
      expect(mockFindUnique).toHaveBeenCalledWith({ where: { email: 'dup@test.com' } })
      expect(mockCreate).not.toHaveBeenCalled()
      expect(result).toBeNull()
    })
  })
})
