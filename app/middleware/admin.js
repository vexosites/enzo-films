export default defineNuxtRouteMiddleware(async () => {
  const loggedIn = useCookie('auth_logged_in', {
    default: () => '',
    encode: val => val,
    decode: val => val
  })

  if (!loggedIn.value) {
    return navigateTo('/admin/login')
  }

  if (import.meta.server) {
    try {
      const res = await $fetch('/api/auth/me')
      if (res.user.role !== 'admin') {
        return navigateTo('/admin/login')
      }
    } catch {
      return navigateTo('/admin/login')
    }
  }
})
