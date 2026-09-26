import { getAccessToken } from './auth.js'
import { loadTokens } from './tokenStore.js'

const API_URL = 'https://www.strava.com/api/v3'
const CACHE_TTL_MS = 5 * 60 * 1000

const cache = new Map()

async function stravaGet(path, params = {}) {
  const url = new URL(`${API_URL}${path}`)
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) url.searchParams.set(key, value)
  }

  const cached = cache.get(url.href)
  if (cached && cached.expiresAt > Date.now()) return cached.data

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${await getAccessToken()}` },
  })

  if (res.status === 429) {
    throw Object.assign(new Error('Límite de peticiones de Strava alcanzado. Prueba en unos minutos.'), { status: 429 })
  }
  if (!res.ok) {
    throw Object.assign(new Error(`Error de Strava (${res.status}) en ${path}`), { status: 502 })
  }
  const data = await res.json()
  cache.set(url.href, { data, expiresAt: Date.now() + CACHE_TTL_MS })
  return data
}

export function getAthlete() {
  return stravaGet('/athlete')
}

export async function getAthleteStats() {
  const { athlete_id } = await loadTokens()
  return stravaGet(`/athletes/${athlete_id}/stats`)
}

/** `before`/`after` son epoch en segundos; `perPage` máximo 200. */
export function getActivities({ page = 1, perPage = 30, before, after } = {}) {
  return stravaGet('/athlete/activities', { page, per_page: perPage, before, after })
}

export function getActivity(id) {
  return stravaGet(`/activities/${id}`)
}
