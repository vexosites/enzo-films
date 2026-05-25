export default defineEventHandler(async (event) => {
  requireAdmin(event)

  const { id } = getRouterParams(event)
  const deleted = await deleteMedia(id)

  if (!deleted) {
    throw createError({ statusCode: 404, message: 'media not found' })
  }

  return { message: 'media deleted' }
})
