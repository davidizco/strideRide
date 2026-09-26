import { useEffect, useState } from 'react'
import { getActivity, getActivityStreams, getActivityZones } from '../api/strava.js'

/** Carga detalle, zonas y streams en paralelo; zonas y streams son opcionales. */
export function useActivityDetail(id) {
  const [state, setState] = useState({ id, status: 'loading' })

  useEffect(() => {
    const controller = new AbortController()
    const { signal } = controller

    Promise.allSettled([getActivity(id, signal), getActivityZones(id, signal), getActivityStreams(id, signal)]).then(
      ([activity, zones, streams]) => {
        if (signal.aborted) return
        if (activity.status === 'rejected') {
          return setState({ id, status: 'error', message: activity.reason.message })
        }
        setState({
          id,
          status: 'ready',
          activity: activity.value,
          zones: zones.status === 'fulfilled' ? zones.value : null,
          streams: streams.status === 'fulfilled' ? streams.value : null,
        })
      },
    )

    return () => controller.abort()
  }, [id])

  return state.id === id ? state : { id, status: 'loading' }
}
