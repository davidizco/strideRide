const integer = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 0 })

function rangeLabel({ min, max }, unit) {
  if (max === -1) return `≥ ${integer.format(min)} ${unit}`
  if (min === max) return `${integer.format(min)} ${unit}`
  if (min === 0) return `≤ ${integer.format(max)} ${unit}`
  return `${integer.format(min)}–${integer.format(max)} ${unit}`
}

function toRows(buckets, { unit, labelZones }) {
  const total = buckets.reduce((sum, bucket) => sum + bucket.time, 0)
  if (total === 0) return null
  return buckets.map((bucket, index) => ({
    key: `${bucket.min}-${bucket.max}`,
    label: labelZones ? `Z${index + 1}` : rangeLabel(bucket, unit),
    range: labelZones ? rangeLabel(bucket, unit) : null,
    seconds: bucket.time,
    percent: (bucket.time / total) * 100,
  }))
}

const MIN_EDGE_SHARE = 0.01

/** Los buckets de potencia son un histograma de 50 W: se recortan los extremos con menos del 1 % del tiempo. */
function trimEdges(buckets) {
  const total = buckets.reduce((sum, bucket) => sum + bucket.time, 0)
  const isRelevant = (bucket) => bucket.time >= total * MIN_EDGE_SHARE
  const first = buckets.findIndex(isRelevant)
  const last = buckets.findLastIndex(isRelevant)
  return first === -1 ? [] : buckets.slice(first, last + 1)
}

/** Convierte la respuesta de `/activities/{id}/zones` en filas para barras. */
export function parseZones(zones = []) {
  const byType = Object.fromEntries(zones.map((zone) => [zone.type, zone.distribution_buckets ?? []]))
  return {
    heartrate: byType.heartrate ? toRows(byType.heartrate, { unit: 'ppm', labelZones: true }) : null,
    power: byType.power ? toRows(trimEdges(byType.power), { unit: 'W', labelZones: false }) : null,
  }
}
