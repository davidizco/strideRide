import { useEffect, useState } from 'react'
import { getActivities, getAthlete, getStats, getStatus } from '../api/strava.js'
import { weeksAgoEpoch } from '../utils/weekly.js'

export const DASHBOARD_WEEKS = 12

export function useDashboardData() {
  const [state, setState] = useState({ status: 'loading' })

  useEffect(() => {
    const controller = new AbortController()
    const { signal } = controller

    async function load() {
      const { connected } = await getStatus(signal)
      if (!connected) return setState({ status: 'disconnected' })

      const [athlete, stats, activities] = await Promise.all([
        getAthlete(signal),
        getStats(signal),
        getActivities({ after: weeksAgoEpoch(DASHBOARD_WEEKS), perPage: 200 }, signal),
      ])
      activities.sort((a, b) => b.start_date.localeCompare(a.start_date))
      setState({ status: 'ready', athlete, stats, activities })
    }

    load().catch((error) => {
      if (signal.aborted) return
      setState(error.status === 401 ? { status: 'disconnected' } : { status: 'error', message: error.message })
    })

    return () => controller.abort()
  }, [])

  return state
}
