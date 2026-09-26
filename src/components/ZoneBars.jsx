import { formatClock } from '../utils/format.js'

const percentFormat = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 0 })

export default function ZoneBars({ rows, colors }) {
  return (
    <ul className="zone-bars">
      {rows.map((row, index) => (
        <li key={row.key} className="zone-bar" style={{ '--zone-color': colors[Math.min(index, colors.length - 1)] }}>
          <span className="zone-label">
            <strong>{row.label}</strong>
            {row.range && <span className="muted">{row.range}</span>}
          </span>
          <span className="zone-track">
            <span className="zone-fill" style={{ width: `${row.percent}%` }} />
          </span>
          <span className="zone-value">
            {formatClock(row.seconds)}
            <span className="muted"> · {percentFormat.format(row.percent)}%</span>
          </span>
        </li>
      ))}
    </ul>
  )
}
