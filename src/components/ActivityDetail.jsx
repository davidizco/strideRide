import { useActivityDetail } from '../hooks/useActivityDetail.js'
import { hasRealPower, showSplits, visibleLaps } from '../utils/detail.js'
import { toSplitRows } from '../utils/splits.js'
import { SPORT_GROUPS, getSportGroup } from '../utils/sports.js'
import { parseZones } from '../utils/zones.js'
import ActivityDetailHeader from './ActivityDetailHeader.jsx'
import HeartRateChart from './HeartRateChart.jsx'
import LapsTable from './LapsTable.jsx'
import PowerSummary from './PowerSummary.jsx'
import SplitsChart from './SplitsChart.jsx'
import SplitsTable from './SplitsTable.jsx'
import ZoneBars from './ZoneBars.jsx'

const HR_ZONE_COLORS = ['#8a8f98', '#2f80ed', '#27ae60', '#f2a900', '#e53935']

function DetailContent({ activity, zones, streams }) {
  const group = getSportGroup(activity.sport_type)
  const color = SPORT_GROUPS[group].color
  const realPower = hasRealPower(activity)
  const { heartrate: hrZones, power: powerZones } = parseZones(zones ?? [])
  const splitRows = showSplits(activity) ? toSplitRows(activity.splits_metric) : []
  const laps = visibleLaps(activity)
  const hrSeries = streams?.series?.some((point) => point.heartrate) ? streams.series : null

  return (
    <>
      <ActivityDetailHeader activity={activity} />

      {splitRows.length > 0 && (
        <section className="section card">
          <h2>Splits</h2>
          <SplitsChart rows={splitRows} color={color} />
          <SplitsTable rows={splitRows} showGap={activity.sport_type === 'TrailRun'} />
        </section>
      )}

      {laps.length > 0 && <LapsTable laps={laps} group={group} showPower={realPower} />}

      {hrSeries && <HeartRateChart series={hrSeries} />}

      {activity.has_heartrate && (
        <section className="section card">
          <h2>Zonas de frecuencia cardiaca</h2>
          {hrZones ? <ZoneBars rows={hrZones} colors={HR_ZONE_COLORS} /> : <p className="muted">Zonas no disponibles.</p>}
        </section>
      )}

      {realPower && <PowerSummary activity={activity} curve={streams?.powerCurve} zones={powerZones} />}
    </>
  )
}

export default function ActivityDetail({ id, onBack }) {
  const detail = useActivityDetail(id)

  return (
    <>
      <button type="button" className="back-button" onClick={onBack}>
        ← Volver
      </button>
      {detail.status === 'loading' && <p className="muted center">Cargando actividad…</p>}
      {detail.status === 'error' && <p className="error card">{detail.message}</p>}
      {detail.status === 'ready' && <DetailContent {...detail} />}
    </>
  )
}
