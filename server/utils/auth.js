export function requireAuth(event) {
  const token = getTokenFromCookie(event)
  if (!token) {
    throw createError({ statusCode: 401, message: 'not authenticated' })
  }

  const payload = verifyToken(token)
  if (!payload) {
    clearAuthCookies(event)
    throw createError({ statusCode: 401, message: 'invalid or expired token' })
  }

  const user = findByEmail(payload.email)
  if (!user) {
    clearAuthCookies(event)
    throw createError({ statusCode: 401, message: 'user not found' })
  }

  return user
}

export function requireAdmin(event) {
  const user = requireAuth(event)
  if (user.role !== 'admin') {
    throw createError({ statusCode: 403, message: 'admin access required' })
  }
  return user
}
