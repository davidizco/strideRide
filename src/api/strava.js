import { getJson } from "./http.js";

export const getStatus = (signal) => getJson("/api/status", signal);
export const getAthlete = (signal) => getJson("/api/athlete", signal);
export const getStats = (signal) => getJson("/api/stats", signal);

export function getActivities({ after, perPage = 100 } = {}, signal) {
  const params = new URLSearchParams({ per_page: perPage });
  if (after) params.set("after", after);
  return getJson(`/api/activities?${params}`, signal);
}

export const getActivity = (id, signal) =>
  getJson(`/api/activities/${id}`, signal);
export const getActivityZones = (id, signal) =>
  getJson(`/api/activities/${id}/zones`, signal);
export const getActivityStreams = (id, signal) =>
  getJson(`/api/activities/${id}/streams`, signal);
