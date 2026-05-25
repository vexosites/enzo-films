export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const { id, episodeId } = getRouterParams(event)
  const body = await readBody(event)
  const updated = await updateEpisode(id, episodeId, body)
  if (!updated) throw createError({ statusCode: 404, message: 'episode not found' })
  return updated
})
