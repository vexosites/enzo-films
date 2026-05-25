import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest'

vi.stubGlobal('$fetch', vi.fn())
vi.stubGlobal('useCookie', vi.fn())
vi.stubGlobal('useState', vi.fn())

describe('useAuth', () => {
  let useAuth
  let mockLoggedIn, mockUserState

  beforeAll(async () => {
    const mod = await import('../../../../app/composables/useAuth')
    useAuth = mod.useAuth
  })

  beforeEach(() => {
    vi.clearAllMocks()

    mockLoggedIn = { value: '' }
    mockUserState = { value: null }

    useCookie.mockReturnValue(mockLoggedIn)
    useState.mockReturnValue(mockUserState)
  })

  it('returns default state', () => {
    const auth = useAuth()
    expect(auth.loggedIn.value).toBe('')
    expect(auth.user.value).toBeNull()
  })

  it('login sets user and loggedIn on success', async () => {
    const fakeUser = { id: '1', name: 'Test', email: 'test@test.com' }
    $fetch.mockResolvedValue({ user: fakeUser })

    const auth = useAuth()
    const result = await auth.login('test@test.com', 'password123')

    expect($fetch).toHaveBeenCalledWith('/api/auth/login', {
      method: 'POST',
      body: { email: 'test@test.com', password: 'password123' }
    })
    expect(mockLoggedIn.value).toBe('1')
    expect(mockUserState.value).toEqual(fakeUser)
    expect(result).toEqual({ user: fakeUser })
  })

  it('register creates user and sets state', async () => {
    const fakeUser = { id: '2', name: 'New', email: 'new@test.com' }
    $fetch.mockResolvedValue({ user: fakeUser })

    const auth = useAuth()
    const result = await auth.register('New', 'new@test.com', 'password123')

    expect($fetch).toHaveBeenCalledWith('/api/auth/register', {
      method: 'POST',
      body: { name: 'New', email: 'new@test.com', password: 'password123' }
    })
    expect(mockLoggedIn.value).toBe('1')
    expect(mockUserState.value).toEqual(fakeUser)
  })

  it('fetchMe loads user on success', async () => {
    const fakeUser = { id: '1', name: 'Test', email: 'test@test.com' }
    $fetch.mockResolvedValue({ user: fakeUser })

    const auth = useAuth()
    const result = await auth.fetchMe()

    expect($fetch).toHaveBeenCalledWith('/api/auth/me')
    expect(mockUserState.value).toEqual(fakeUser)
    expect(mockLoggedIn.value).toBe('1')
    expect(result).toEqual(fakeUser)
  })

  it('fetchMe clears state on failure', async () => {
    $fetch.mockRejectedValue(new Error('Unauthorized'))

    const auth = useAuth()
    const result = await auth.fetchMe()

    expect(mockUserState.value).toBeNull()
    expect(mockLoggedIn.value).toBe('')
    expect(result).toBeNull()
  })

  it('logout clears user state and cookie', async () => {
    mockLoggedIn.value = '1'
    mockUserState.value = { id: '1', name: 'Test' }

    $fetch.mockResolvedValue({ message: 'logged out' })

    const auth = useAuth()
    await auth.logout()

    expect($fetch).toHaveBeenCalledWith('/api/auth/logout', { method: 'POST' })
    expect(mockUserState.value).toBeNull()
    expect(mockLoggedIn.value).toBe('')
  })

  it('logout does not throw when API fails', async () => {
    mockLoggedIn.value = '1'
    mockUserState.value = { id: '1', name: 'Test' }

    $fetch.mockRejectedValue(new Error('Network error'))

    const auth = useAuth()
    await expect(auth.logout()).resolves.toBeUndefined()
    expect(mockUserState.value).toBeNull()
    expect(mockLoggedIn.value).toBe('')
  })
})
