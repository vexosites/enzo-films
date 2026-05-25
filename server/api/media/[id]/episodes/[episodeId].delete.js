export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const { id, episodeId } = getRouterParams(event)
  const removed = await removeEpisode(id, episodeId)
  if (!removed) throw createError({ statusCode: 404, message: 'episode not found' })
  return { message: 'episode removed' }
})
