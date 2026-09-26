import { useSyncExternalStore } from 'react'

function subscribe(callback) {
  window.addEventListener('hashchange', callback)
  return () => window.removeEventListener('hashchange', callback)
}

const getHash = () => window.location.hash

/** Router mínimo por hash: `#/actividad/:id` o el dashboard. */
export function useHashRoute() {
  const hash = useSyncExternalStore(subscribe, getHash)
  const match = hash.match(/^#\/actividad\/(\d+)$/)
  return match ? { name: 'activity', id: match[1] } : { name: 'dashboard' }
}

export const activityHref = (id) => `#/actividad/${id}`
