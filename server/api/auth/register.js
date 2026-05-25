import bcrypt from 'bcryptjs'

export default defineEventHandler(async (event) => {
  const { name, email, password } = await readBody(event)

  if (!name || !email || !password) {
    throw createError({ statusCode: 400, message: 'name, email and password are required' })
  }

  if (password.length < 6) {
    throw createError({ statusCode: 400, message: 'password must be at least 6 characters' })
  }

  const existing = await findByEmail(email)
  if (existing) {
    throw createError({ statusCode: 409, message: 'email already registered' })
  }

  const hashed = await bcrypt.hash(password, 10)
  const user = { id: Date.now().toString(), name, email, password: hashed, role: 'user' }

  const created = await createUser(user)
  if (!created) {
    throw createError({ statusCode: 409, message: 'email already registered' })
  }

  const token = signToken({ id: user.id, email: user.email })
  setAuthCookies(event, token)

  return { user: { id: user.id, name: user.name, email: user.email } }
})
