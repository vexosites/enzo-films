export default defineNuxtRouteMiddleware(() => {
  const loggedIn = useCookie('auth_logged_in', {
    default: () => '',
    encode: val => val,
    decode: val => val
  })

  if (!loggedIn.value) {
    return navigateTo('/login')
  }
})
