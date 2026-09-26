import { formatEnergy, formatPower } from '../utils/format.js'
import PowerCurveChart from './PowerCurveChart.jsx'
import ZoneBars from './ZoneBars.jsx'

const POWER_COLOR = '#f2a900'

export default function PowerSummary({ activity, curve, zones }) {
  const metrics = [
    { label: 'Media', value: formatPower(activity.average_watts) },
    activity.weighted_average_watts && { label: 'Normalizada', value: formatPower(activity.weighted_average_watts) },
    activity.max_watts && { label: 'Máxima', value: formatPower(activity.max_watts) },
    activity.kilojoules && { label: 'Trabajo', value: formatEnergy(activity.kilojoules) },
  ].filter(Boolean)

  return (
    <section className="section card">
      <h2>Potencia</h2>
      <dl className="detail-metrics">
        {metrics.map(({ label, value }) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>

      {curve?.length > 1 && (
        <>
          <h3>Curva de potencia</h3>
          <PowerCurveChart curve={curve} color={POWER_COLOR} />
        </>
      )}

      {zones && (
        <>
          <h3>Distribución de potencia</h3>
          <ZoneBars rows={zones} colors={[POWER_COLOR]} />
        </>
      )}
    </section>
  )
}
