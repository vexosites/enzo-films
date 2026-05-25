import jwt from 'jsonwebtoken'

const config = useRuntimeConfig()

export function signToken(payload) {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: '7d' })
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, config.jwtSecret)
  } catch {
    return null
  }
}
