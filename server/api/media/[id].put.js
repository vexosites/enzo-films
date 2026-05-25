export default defineEventHandler(async (event) => {
  requireAdmin(event)

  const { id } = getRouterParams(event)
  const data = await readBody(event)

  const updated = await updateMedia(id, data)
  if (!updated) {
    throw createError({ statusCode: 404, message: 'media not found' })
  }

  return updated
})
