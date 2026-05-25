export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const { id } = getRouterParams(event)
  const body = await readBody(event)
  if (!body.season || !body.episode || !body.title) {
    throw createError({ statusCode: 400, message: 'season, episode and title are required' })
  }
  const episode = { id: Date.now().toString(), season: body.season, episode: body.episode, title: body.title, versions: [] }
  const updated = await addEpisode(id, episode)
  if (!updated) throw createError({ statusCode: 404, message: 'media not found' })
  return updated
})
