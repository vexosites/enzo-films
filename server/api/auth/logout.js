export default defineEventHandler((event) => {
  clearAuthCookies(event)
  return { message: 'logged out' }
})
