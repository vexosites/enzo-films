import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest'

const mockSetCookie = vi.fn()
const mockDeleteCookie = vi.fn()
const mockGetCookie = vi.fn()

vi.stubGlobal('useRuntimeConfig', () => ({ cookieSecure: false }))
vi.stubGlobal('getCookie', mockGetCookie)

vi.mock('h3', () => ({
  setCookie: mockSetCookie,
  deleteCookie: mockDeleteCookie
}))

describe('cookie', () => {
  let setAuthCookies, clearAuthCookies, getTokenFromCookie

  beforeAll(async () => {
    const mod = await import('../../../../server/utils/cookie')
    setAuthCookies = mod.setAuthCookies
    clearAuthCookies = mod.clearAuthCookies
    getTokenFromCookie = mod.getTokenFromCookie
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('setAuthCookies sets auth_token and auth_logged_in cookies', () => {
    const event = {}
    setAuthCookies(event, 'my-token')
    expect(mockSetCookie).toHaveBeenCalledTimes(2)
    expect(mockSetCookie).toHaveBeenCalledWith(event, 'auth_token', 'my-token', expect.objectContaining({ httpOnly: true }))
    expect(mockSetCookie).toHaveBeenCalledWith(event, 'auth_logged_in', '1', expect.objectContaining({ httpOnly: false }))
  })

  it('clearAuthCookies removes both cookies', () => {
    const event = {}
    clearAuthCookies(event)
    expect(mockDeleteCookie).toHaveBeenCalledTimes(2)
    expect(mockDeleteCookie).toHaveBeenCalledWith(event, 'auth_token', { path: '/' })
    expect(mockDeleteCookie).toHaveBeenCalledWith(event, 'auth_logged_in', { path: '/' })
  })

  it('getTokenFromCookie reads auth_token', () => {
    mockGetCookie.mockReturnValue('my-token')
    const event = {}
    const result = getTokenFromCookie(event)
    expect(mockGetCookie).toHaveBeenCalledWith(event, 'auth_token')
    expect(result).toBe('my-token')
  })

  it('getTokenFromCookie returns undefined when no token', () => {
    mockGetCookie.mockReturnValue(undefined)
    const event = {}
    const result = getTokenFromCookie(event)
    expect(result).toBeUndefined()
  })
})
