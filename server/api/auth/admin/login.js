import bcrypt from 'bcryptjs'

export default defineEventHandler(async (event) => {
  const { email, password } = await readBody(event)

  if (!email || !password) {
    throw createError({ statusCode: 400, message: 'email and password are required' })
  }

  const user = await findByEmail(email)
  if (!user || user.role !== 'admin') {
    throw createError({ statusCode: 401, message: 'invalid admin credentials' })
  }

  const valid = await bcrypt.compare(password, user.password)
  if (!valid) {
    throw createError({ statusCode: 401, message: 'invalid admin credentials' })
  }

  const token = signToken({ id: user.id, email: user.email, role: 'admin' })
  setAuthCookies(event, token)

  return { user: { id: user.id, name: user.name, email: user.email, role: user.role } }
})
