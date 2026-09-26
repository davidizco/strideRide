import { randomBytes } from 'node:crypto'
import { config } from '../config.js'
import { loadTokens, saveTokens } from './tokenStore.js'

const OAUTH_URL = 'https://www.strava.com/oauth'
const STATE_TTL_MS = 10 * 60 * 1000

const pendingStates = new Map()

export function redirectUri() {
  return `${config.appUrl}/auth/strava/callback`
}

export function buildAuthorizeUrl() {
  const state = randomBytes(16).toString('hex')
  pendingStates.set(state, Date.now() + STATE_TTL_MS)

  const params = new URLSearchParams({
    client_id: config.strava.clientId,
    redirect_uri: redirectUri(),
    response_type: 'code',
    approval_prompt: 'auto',
    scope: config.strava.scope,
    state,
  })
  return `${OAUTH_URL}/authorize?${params}`
}

export function consumeState(state) {
  const expiresAt = pendingStates.get(state)
  pendingStates.delete(state)
  return expiresAt !== undefined && expiresAt > Date.now()
}

async function requestToken(body) {
  const res = await fetch(`${OAUTH_URL}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: config.strava.clientId,
      client_secret: config.strava.clientSecret,
      ...body,
    }),
  })
  if (!res.ok) {
    throw Object.assign(new Error(`Strava rechazó la petición de token (${res.status})`), { status: 502 })
  }
  return saveTokens(await res.json())
}

export function exchangeCode(code) {
  return requestToken({ code, grant_type: 'authorization_code' })
}

export async function getAccessToken() {
  const tokens = await loadTokens()
  if (!tokens) {
    throw Object.assign(new Error('Strava no está conectado'), { status: 401 })
  }

  const expiresSoon = tokens.expires_at * 1000 < Date.now() + 60_000
  if (!expiresSoon) return tokens.access_token

  // Strava puede devolver un refresh_token nuevo: se guarda siempre el último.
  const refreshed = await requestToken({ refresh_token: tokens.refresh_token, grant_type: 'refresh_token' })
  return refreshed.access_token
}

export async function isConnected() {
  return (await loadTokens()) !== null
}
