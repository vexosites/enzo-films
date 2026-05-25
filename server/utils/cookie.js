import { setCookie, deleteCookie } from 'h3'

const config = useRuntimeConfig()

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: config.cookieSecure,
  sameSite: 'lax',
  path: '/',
  maxAge: 60 * 60 * 24 * 7
}

const PUBLIC_OPTIONS = {
  ...COOKIE_OPTIONS,
  httpOnly: false
}

export function setAuthCookies(event, token) {
  setCookie(event, 'auth_token', token, COOKIE_OPTIONS)
  setCookie(event, 'auth_logged_in', '1', PUBLIC_OPTIONS)
}

export function clearAuthCookies(event) {
  deleteCookie(event, 'auth_token', { path: '/' })
  deleteCookie(event, 'auth_logged_in', { path: '/' })
}

export function getTokenFromCookie(event) {
  return getCookie(event, 'auth_token')
}
