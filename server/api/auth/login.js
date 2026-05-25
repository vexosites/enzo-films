import bcrypt from 'bcryptjs'

export default defineEventHandler(async (event) => {
  const { email, password } = await readBody(event)

  if (!email || !password) {
    throw createError({ statusCode: 400, message: 'email and password are required' })
  }

  const user = await findByEmail(email)
  if (!user) {
    throw createError({ statusCode: 401, message: 'invalid email or password' })
  }

  const valid = await bcrypt.compare(password, user.password)
  if (!valid) {
    throw createError({ statusCode: 401, message: 'invalid email or password' })
  }

  const token = signToken({ id: user.id, email: user.email })
  setAuthCookies(event, token)

  return { user: { id: user.id, name: user.name, email: user.email } }
})
