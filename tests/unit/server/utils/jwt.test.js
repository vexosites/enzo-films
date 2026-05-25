import { describe, it, expect, vi, beforeAll } from 'vitest'

beforeAll(() => {
  vi.stubGlobal('useRuntimeConfig', () => ({ jwtSecret: 'test-secret-key' }))
})

describe('jwt', () => {
  let signToken, verifyToken

  beforeAll(async () => {
    const mod = await import('../../../../server/utils/jwt')
    signToken = mod.signToken
    verifyToken = mod.verifyToken
  })

  it('signs a token and verifies it correctly', () => {
    const payload = { id: '1', email: 'test@test.com' }
    const token = signToken(payload)
    expect(token).toBeTruthy()
    expect(typeof token).toBe('string')

    const decoded = verifyToken(token)
    expect(decoded.email).toBe('test@test.com')
    expect(decoded.id).toBe('1')
  })

  it('returns null for invalid token', () => {
    const result = verifyToken('invalid-token')
    expect(result).toBeNull()
  })

  it('returns null for tampered token', () => {
    const payload = { id: '1', email: 'test@test.com' }
    const token = signToken(payload) + 'tampered'
    const result = verifyToken(token)
    expect(result).toBeNull()
  })

  it('signs tokens with different payloads', () => {
    const token1 = signToken({ id: '1', email: 'a@a.com' })
    const token2 = signToken({ id: '2', email: 'b@b.com' })
    expect(token1).not.toBe(token2)
  })
})
