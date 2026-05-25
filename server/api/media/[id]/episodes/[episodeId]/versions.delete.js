export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const { id, episodeId } = getRouterParams(event)
  const { versionId } = await readBody(event)
  if (!versionId) throw createError({ statusCode: 400, message: 'versionId is required' })
  const removed = await removeEpisodeVersion(id, episodeId, versionId)
  if (!removed) throw createError({ statusCode: 404, message: 'media, episode or version not found' })
  return { message: 'version removed' }
})
