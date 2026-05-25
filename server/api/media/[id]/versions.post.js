export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const { id } = getRouterParams(event)

  const body = await readBody(event)
  if (!body.label || !body.file) {
    throw createError({ statusCode: 400, message: 'label and file are required' })
  }

  const updated = await addVersion(id, { id: Date.now().toString(), ...body })
  if (!updated) throw createError({ statusCode: 404, message: 'media not found' })

  return updated
})
