import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest'

const mockGetTokenFromCookie = vi.fn()
const mockVerifyToken = vi.fn()
const mockClearAuthCookies = vi.fn()
const mockFindByEmail = vi.fn()

vi.stubGlobal('createError', (err) => {
  const error = new Error(err.message)
  error.statusCode = err.statusCode
  throw error
})

describe('auth', () => {
  let requireAuth, requireAdmin

  beforeAll(async () => {
    vi.stubGlobal('getTokenFromCookie', mockGetTokenFromCookie)
    vi.stubGlobal('verifyToken', mockVerifyToken)
    vi.stubGlobal('clearAuthCookies', mockClearAuthCookies)
    vi.stubGlobal('findByEmail', mockFindByEmail)

    const mod = await import('../../../../server/utils/auth')
    requireAuth = mod.requireAuth
    requireAdmin = mod.requireAdmin
  })

  beforeEach(() => {
    mockGetTokenFromCookie.mockReset()
    mockVerifyToken.mockReset()
    mockClearAuthCookies.mockReset()
    mockFindByEmail.mockReset()
  })

  describe('requireAuth', () => {
    it('returns user when authenticated', () => {
      const fakeUser = { id: '1', email: 'test@test.com', role: 'user' }
      mockGetTokenFromCookie.mockReturnValue('valid-token')
      mockVerifyToken.mockReturnValue({ id: '1', email: 'test@test.com' })
      mockFindByEmail.mockReturnValue(fakeUser)

      const result = requireAuth({})
      expect(result).toEqual(fakeUser)
    })

    it('throws 401 when no token', () => {
      mockGetTokenFromCookie.mockReturnValue(undefined)

      expect(() => requireAuth({})).toThrow('not authenticated')
    })

    it('throws 401 when token is invalid', () => {
      mockGetTokenFromCookie.mockReturnValue('invalid-token')
      mockVerifyToken.mockReturnValue(null)

      expect(() => requireAuth({})).toThrow('invalid or expired token')
      expect(mockClearAuthCookies).toHaveBeenCalled()
    })

    it('throws 401 when user not found', () => {
      mockGetTokenFromCookie.mockReturnValue('valid-token')
      mockVerifyToken.mockReturnValue({ id: '1', email: 'test@test.com' })
      mockFindByEmail.mockReturnValue(null)

      expect(() => requireAuth({})).toThrow('user not found')
      expect(mockClearAuthCookies).toHaveBeenCalled()
    })
  })

  describe('requireAdmin', () => {
    it('returns user when admin', () => {
      const fakeUser = { id: '1', email: 'admin@test.com', role: 'admin' }
      mockGetTokenFromCookie.mockReturnValue('admin-token')
      mockVerifyToken.mockReturnValue({ id: '1', email: 'admin@test.com' })
      mockFindByEmail.mockReturnValue(fakeUser)

      const result = requireAdmin({})
      expect(result).toEqual(fakeUser)
    })

    it('throws 403 when user is not admin', () => {
      const fakeUser = { id: '2', email: 'user@test.com', role: 'user' }
      mockGetTokenFromCookie.mockReturnValue('user-token')
      mockVerifyToken.mockReturnValue({ id: '2', email: 'user@test.com' })
      mockFindByEmail.mockReturnValue(fakeUser)

      expect(() => requireAdmin({})).toThrow('admin access required')
    })
  })
})
