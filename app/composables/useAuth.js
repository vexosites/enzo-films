export function useAuth() {
  const loggedIn = useCookie('auth_logged_in', {
    default: () => '',
    encode: val => val,
    decode: val => val
  })
  const user = useState('user', () => null)

  async function login(email, password) {
    const res = await $fetch('/api/auth/login', {
      method: 'POST',
      body: { email, password }
    })
    loggedIn.value = '1'
    user.value = res.user
    return res
  }

  async function register(name, email, password) {
    const res = await $fetch('/api/auth/register', {
      method: 'POST',
      body: { name, email, password }
    })
    loggedIn.value = '1'
    user.value = res.user
    return res
  }

  async function fetchMe() {
    try {
      const res = await $fetch('/api/auth/me')
      user.value = res.user
      loggedIn.value = '1'
      return res.user
    } catch {
      user.value = null
      loggedIn.value = ''
      return null
    }
  }

  async function logout() {
    await $fetch('/api/auth/logout', { method: 'POST' }).catch(() => {})
    user.value = null
    loggedIn.value = ''
  }

  return { loggedIn, user, login, register, fetchMe, logout }
}
