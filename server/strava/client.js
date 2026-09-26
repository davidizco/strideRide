import { getAccessToken } from './auth.js'
import { loadTokens } from './tokenStore.js'

const API_URL = 'https://www.strava.com/api/v3'
const CACHE_TTL_MS = 5 * 60 * 1000
// Una actividad ya subida casi no cambia: se cachea más tiempo.
const ACTIVITY_TTL_MS = 60 * 60 * 1000

const cache = new Map()

async function stravaGet(path, params = {}, { ttlMs = CACHE_TTL_MS } = {}) {
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
    throw Object.assign(new Error(`Error de Strava (${res.status}) en ${path}`), {
      status: 502,
      stravaStatus: res.status,
    })
  }
  const data = await res.json()
  cache.set(url.href, { data, expiresAt: Date.now() + ttlMs })
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

/** Detalle sin `segment_efforts` ni la polilínea completa, que pesan mucho y no se usan. */
export async function getActivity(id) {
  const { segment_efforts: _segments, map, ...activity } = await stravaGet(`/activities/${id}`, {}, { ttlMs: ACTIVITY_TTL_MS })
  return { ...activity, map: map && { id: map.id, summary_polyline: map.summary_polyline } }
}

async function emptyWhenUnavailable(request, empty) {
  try {
    return await request
  } catch (error) {
    if ([402, 403, 404].includes(error.stravaStatus)) return empty
    throw error
  }
}

/** Zonas de FC y potencia (`type: 'heartrate' | 'power'`). Requiere suscripción de Strava; `[]` si no hay. */
export function getActivityZones(id) {
  return emptyWhenUnavailable(stravaGet(`/activities/${id}/zones`, {}, { ttlMs: ACTIVITY_TTL_MS }), [])
}

/** Series temporales indexadas por tipo, p. ej. `{ time: { data: [...] }, heartrate: { data: [...] } }`. */
export function getActivityStreams(id, keys = ['time', 'heartrate', 'watts']) {
  return emptyWhenUnavailable(
    stravaGet(`/activities/${id}/streams`, { keys: keys.join(','), key_by_type: true }, { ttlMs: ACTIVITY_TTL_MS }),
    {},
  )
}
