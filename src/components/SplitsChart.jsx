import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatHeartRate, formatPace, formatPaceShort } from '../utils/format.js'

function SplitTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const row = payload[0].payload
  return (
    <div className="chart-tooltip">
      <strong>Km {row.label}</strong>
      <span>{formatPace(row.speed)}</span>
      {row.heartrate && <span>{formatHeartRate(row.heartrate)}</span>}
    </div>
  )
}

/** Barras más altas = más rápido; el eje muestra el ritmo en min/km. */
export default function SplitsChart({ rows, color }) {
  return (
    <div className="chart">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ top: 8, right: 4, bottom: 0, left: -12 }}>
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} interval="preserveStartEnd" />
          <YAxis
            dataKey="speed"
            domain={[(min) => min * 0.9, 'auto']}
            tickFormatter={(speed) => formatPaceShort(speed)}
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<SplitTooltip />} cursor={{ fill: 'var(--border)', opacity: 0.4 }} />
          <Bar dataKey="speed" radius={[4, 4, 0, 0]}>
            {rows.map((row) => (
              <Cell key={row.key} fill={color} fillOpacity={row.isPartial ? 0.45 : 1} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
