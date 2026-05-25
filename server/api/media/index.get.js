export default defineEventHandler(async (event) => {
  requireAuth(event)
  return getAllMedia()
})
