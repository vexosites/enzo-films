import bcrypt from 'bcryptjs'

export default defineNitroPlugin(async () => {
  const admin = await findByEmail('admin@admin.com')
  if (!admin) {
    const hashed = await bcrypt.hash('admin123', 10)
    await createUser({
      id: 'admin',
      name: 'Admin',
      email: 'admin@admin.com',
      password: hashed,
      role: 'admin'
    })
  }
})
