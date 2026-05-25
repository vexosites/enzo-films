export default defineEventHandler(async (event) => {
  requireAdmin(event)

  const { title, type, genre, year, description, rating, image, seasons } = await readBody(event)

  if (!title || !type || !genre) {
    throw createError({ statusCode: 400, message: 'title, type and genre are required' })
  }

  const item = {
    id: Date.now().toString(),
    title,
    type,
    genre,
    year: year || null,
    description: description || '',
    rating: rating || null,
    image: image || '',
    ...(type === 'series' ? { seasons: seasons || null } : {})
  }

  return createMedia(item)
})
