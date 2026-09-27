import { useSyncExternalStore } from "react";

function subscribe(callback) {
  window.addEventListener("hashchange", callback);
  return () => window.removeEventListener("hashchange", callback);
}

const getHash = () => window.location.hash;

/** Router mínimo por hash: `#/actividad/:id`, `#/calendario` o el dashboard. */
export function useHashRoute() {
  const hash = useSyncExternalStore(subscribe, getHash);
  const match = hash.match(/^#\/actividad\/(\d+)$/);
  if (match) return { name: "activity", id: match[1] };
  if (hash === "#/calendario") return { name: "calendar" };
  return { name: "dashboard" };
}

export const isDashboardHash = (hash) => hash === "" || hash === "#/";

export const activityHref = (id) => `#/actividad/${id}`;
