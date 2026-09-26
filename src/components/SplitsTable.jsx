import { formatHeartRate, formatPaceShort, formatSignedElevation } from '../utils/format.js'

export default function SplitsTable({ rows, showGap }) {
  const hasHeartRate = rows.some((row) => row.heartrate)

  return (
    <details className="detail-table">
      <summary>Ver tabla de splits</summary>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Km</th>
              <th>Ritmo</th>
              {showGap && <th title="Ritmo ajustado a la pendiente">GAP</th>}
              {hasHeartRate && <th>FC</th>}
              <th>Desnivel</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key}>
                <td>{row.label}</td>
                <td>{formatPaceShort(row.speed)}</td>
                {showGap && <td>{formatPaceShort(row.gapSpeed)}</td>}
                {hasHeartRate && <td>{row.heartrate ? formatHeartRate(row.heartrate) : '—'}</td>}
                <td>{formatSignedElevation(row.elevation)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  )
}
