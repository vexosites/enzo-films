export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const { id, episodeId } = getRouterParams(event)
  const body = await readBody(event)
  if (!body.label || !body.file) throw createError({ statusCode: 400, message: 'label and file are required' })
  const updated = await addEpisodeVersion(id, episodeId, { id: Date.now().toString(), ...body })
  if (!updated) throw createError({ statusCode: 404, message: 'media or episode not found' })
  return updated
})
