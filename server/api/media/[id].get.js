export default defineEventHandler(async (event) => {
  requireAuth(event)

  const { id } = getRouterParams(event)
  const item = await getMediaById(id)

  if (!item) {
    throw createError({ statusCode: 404, message: 'media not found' })
  }

  return item
})
