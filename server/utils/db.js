export async function findByEmail(email) {
  return prisma.user.findUnique({ where: { email } })
}

export async function createUser(user) {
  const exists = await prisma.user.findUnique({ where: { email: user.email } })
  if (exists) return null
  return prisma.user.create({ data: user })
}
