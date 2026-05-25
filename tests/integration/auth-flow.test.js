import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest'

const mockFindUnique = vi.fn()
const mockCreate = vi.fn()
const mockPrisma = {
  user: { findUnique: mockFindUnique, create: mockCreate }
}

vi.stubGlobal('prisma', mockPrisma)
vi.stubGlobal('useRuntimeConfig', () => ({ jwtSecret: 'test-secret', cookieSecure: false }))
vi.stubGlobal('getCookie', vi.fn())
vi.stubGlobal('createError', (err) => {
  const error = new Error(err.message)
  error.statusCode = err.statusCode
  throw error
})

const mockSetCookie = vi.fn()
const mockDeleteCookie = vi.fn()
vi.mock('h3', () => ({
  setCookie: mockSetCookie,
  deleteCookie: mockDeleteCookie
}))

describe('Auth Integration Flow', () => {
  let findByEmail, createUser, signToken, verifyToken, setAuthCookies, clearAuthCookies, getTokenFromCookie

  beforeAll(async () => {
    const db = await import('../../server/utils/db')
    findByEmail = db.findByEmail
    createUser = db.createUser

    const jwt = await import('../../server/utils/jwt')
    signToken = jwt.signToken
    verifyToken = jwt.verifyToken

    const cookie = await import('../../server/utils/cookie')
    setAuthCookies = cookie.setAuthCookies
    clearAuthCookies = cookie.clearAuthCookies
    getTokenFromCookie = cookie.getTokenFromCookie
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('full registration flow: createUser -> signToken -> verifyToken', async () => {
    const userData = {
      id: '1', name: 'New User', email: 'new@test.com', password: 'hashed_password', role: 'user'
    }
    mockFindUnique.mockResolvedValue(null)
    mockCreate.mockResolvedValue(userData)

    const created = await createUser(userData)
    expect(created).toEqual(userData)

    const token = signToken({ id: created.id, email: created.email })
    expect(token).toBeTruthy()

    const decoded = verifyToken(token)
    expect(decoded.id).toBe('1')
    expect(decoded.email).toBe('new@test.com')
  })

  it('full auth flow: register -> login -> me -> logout', async () => {
    const user = { id: '1', name: 'Test', email: 'test@test.com', password: '$2a$10$dummyhash', role: 'user' }

    mockFindUnique.mockImplementation(async ({ where }) => {
      if (where.email === 'test@test.com') return user
      return null
    })

    const found = await findByEmail('test@test.com')
    expect(found).toEqual(user)

    const token = signToken({ id: found.id, email: found.email })
    expect(token).toBeTruthy()

    const event = {}
    setAuthCookies(event, token)
    expect(mockSetCookie).toHaveBeenCalledWith(event, 'auth_token', token, expect.objectContaining({ httpOnly: true }))
    expect(mockSetCookie).toHaveBeenCalledWith(event, 'auth_logged_in', '1', expect.objectContaining({ httpOnly: false }))

    const getCookie = vi.fn().mockReturnValue(token)
    vi.stubGlobal('getCookie', getCookie)
    const cookieToken = getTokenFromCookie(event)
    expect(cookieToken).toBe(token)

    const decoded = verifyToken(cookieToken)
    expect(decoded.email).toBe('test@test.com')

    const userFromDb = await findByEmail(decoded.email)
    expect(userFromDb).toEqual(user)
    expect(userFromDb.role).toBe('user')

    clearAuthCookies(event)
    expect(mockDeleteCookie).toHaveBeenCalledWith(event, 'auth_token', { path: '/' })
    expect(mockDeleteCookie).toHaveBeenCalledWith(event, 'auth_logged_in', { path: '/' })
  })

  it('blocks duplicate registration', async () => {
    const existing = { id: '1', email: 'dup@test.com' }
    mockFindUnique.mockResolvedValue(existing)

    const result = await createUser({ id: '2', email: 'dup@test.com', name: 'Dup', password: 'hash', role: 'user' })
    expect(result).toBeNull()
  })

  it('blocks login for non-existent user', async () => {
    mockFindUnique.mockResolvedValue(null)
    const user = await findByEmail('nobody@test.com')
    expect(user).toBeNull()
  })
})
