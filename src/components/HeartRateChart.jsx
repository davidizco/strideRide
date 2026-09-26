import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatClock, formatHeartRate } from '../utils/format.js'

const HR_COLOR = '#e53935'

export default function HeartRateChart({ series }) {
  return (
    <section className="section card">
      <h2>Frecuencia cardiaca</h2>
      <div className="chart">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={series} margin={{ top: 8, right: 4, bottom: 0, left: -20 }}>
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis
              dataKey="time"
              type="number"
              domain={['dataMin', 'dataMax']}
              tickFormatter={formatClock}
              tick={{ fontSize: 11 }}
              tickLine={false}
            />
            <YAxis domain={['dataMin - 5', 'dataMax + 5']} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <Tooltip
              labelFormatter={(time) => formatClock(time)}
              formatter={(value) => [formatHeartRate(value), 'FC']}
              contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8 }}
            />
            <Line dataKey="heartrate" stroke={HR_COLOR} strokeWidth={2} dot={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}
