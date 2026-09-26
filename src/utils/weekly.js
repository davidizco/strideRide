import { SPORT_GROUPS, getSportGroup } from './sports.js'

const DAY_MS = 24 * 60 * 60 * 1000
const WEEK_MS = 7 * DAY_MS

const weekLabel = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short', timeZone: 'UTC' })

// Trabaja con "hora local de pared" en UTC, igual que start_date_local de Strava.
function mondayOf(date) {
  const day = (date.getUTCDay() + 6) % 7
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() - day)
}

function todayAsWallClock() {
  const now = new Date()
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()))
}

/** Epoch en segundos (hora real) del lunes de hace `weeks - 1` semanas. */
export function weeksAgoEpoch(weeks) {
  const now = new Date()
  const day = (now.getDay() + 6) % 7
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day - (weeks - 1) * 7)
  return Math.floor(start.getTime() / 1000)
}

/** Horas de actividad por semana y grupo de deporte, de la más antigua a la actual. */
export function weeklyHoursBySport(activities, weeks) {
  const currentMonday = mondayOf(todayAsWallClock())
  const buckets = Array.from({ length: weeks }, (_, i) => {
    const start = currentMonday - (weeks - 1 - i) * WEEK_MS
    const bucket = { week: weekLabel.format(new Date(start)), start }
    for (const group of Object.keys(SPORT_GROUPS)) bucket[group] = 0
    return bucket
  })

  for (const activity of activities) {
    const monday = mondayOf(new Date(activity.start_date_local))
    const index = (monday - buckets[0].start) / WEEK_MS
    if (index < 0 || index >= weeks) continue
    buckets[index][getSportGroup(activity.sport_type)] += activity.moving_time / 3600
  }

  return buckets
}
