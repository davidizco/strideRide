const LOCALE = 'es-ES'

const numberFormat = (maxDecimals) =>
  new Intl.NumberFormat(LOCALE, { maximumFractionDigits: maxDecimals, minimumFractionDigits: 0 })

const km = numberFormat(1)
const integer = numberFormat(0)

// start_date_local viene con sufijo Z pero es la hora local del atleta: se formatea en UTC para no desplazarla.
const dateFormat = new Intl.DateTimeFormat(LOCALE, {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  timeZone: 'UTC',
})

export function formatDistance(meters) {
  if (meters < 1000) return `${integer.format(meters)} m`
  return `${km.format(meters / 1000)} km`
}

export function formatDuration(seconds) {
  const totalMinutes = Math.round(seconds / 60)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (hours === 0) return `${minutes} min`
  return `${hours} h ${String(minutes).padStart(2, '0')} min`
}

export function formatPace(metersPerSecond) {
  if (!metersPerSecond) return '—'
  const secondsPerKm = Math.round(1000 / metersPerSecond)
  const minutes = Math.floor(secondsPerKm / 60)
  const seconds = String(secondsPerKm % 60).padStart(2, '0')
  return `${minutes}:${seconds} /km`
}

export function formatSpeed(metersPerSecond) {
  return `${km.format(metersPerSecond * 3.6)} km/h`
}

export function formatElevation(meters) {
  return `${integer.format(meters)} m`
}

export function formatHeartRate(bpm) {
  return `${integer.format(bpm)} ppm`
}

export function formatActivityDate(startDateLocal) {
  return dateFormat.format(new Date(startDateLocal))
}

export function formatHours(seconds) {
  return km.format(seconds / 3600)
}
