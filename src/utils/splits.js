const PARTIAL_THRESHOLD = 0.95

const kmFormat = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 2 })

/** Filas de splits por km; el último tramo incompleto se etiqueta con su distancia. */
export function toSplitRows(splits = []) {
  let covered = 0
  return splits.map((split) => {
    const isPartial = split.distance < 1000 * PARTIAL_THRESHOLD
    covered += split.distance
    return {
      key: split.split,
      label: isPartial ? `${kmFormat.format(split.distance / 1000)} km` : String(Math.round(covered / 1000)),
      speed: split.average_speed,
      gapSpeed: split.average_grade_adjusted_speed,
      heartrate: split.average_heartrate,
      elevation: split.elevation_difference,
      movingTime: split.moving_time,
      isPartial,
    }
  })
}
