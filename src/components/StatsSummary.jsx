import { useState } from 'react'
import { SPORT_GROUPS } from '../utils/sports.js'
import SportTotalsCard from './SportTotalsCard.jsx'

const PERIODS = [
  { id: 'recent', label: '4 semanas' },
  { id: 'ytd', label: 'Este año' },
  { id: 'all', label: 'Total' },
]

const SPORTS = ['run', 'ride', 'swim']

export default function StatsSummary({ stats }) {
  const [period, setPeriod] = useState('recent')

  const cards = SPORTS.map((sport) => ({ sport, totals: stats[`${period}_${sport}_totals`] })).filter(
    ({ totals }) => totals?.count > 0,
  )

  return (
    <section className="section">
      <div className="section-header">
        <h2>Resumen</h2>
        <div className="tabs" role="tablist" aria-label="Periodo">
          {PERIODS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={period === id}
              className={period === id ? 'tab active' : 'tab'}
              onClick={() => setPeriod(id)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {cards.length === 0 ? (
        <p className="muted">Sin actividades en este periodo.</p>
      ) : (
        <div className="totals-grid">
          {cards.map(({ sport, totals }) => (
            <SportTotalsCard key={sport} label={SPORT_GROUPS[sport].label} color={SPORT_GROUPS[sport].color} totals={totals} />
          ))}
        </div>
      )}
    </section>
  )
}
