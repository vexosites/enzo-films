export default defineEventHandler(async (event) => {
  const token = getTokenFromCookie(event)
  if (!token) {
    throw createError({ statusCode: 401, message: 'not authenticated' })
  }

  const payload = verifyToken(token)
  if (!payload) {
    clearAuthCookies(event)
    throw createError({ statusCode: 401, message: 'invalid or expired token' })
  }

  const user = await findByEmail(payload.email)
  if (!user) {
    clearAuthCookies(event)
    throw createError({ statusCode: 401, message: 'user not found' })
  }

  return { user: { id: user.id, name: user.name, email: user.email, role: user.role } }
})
