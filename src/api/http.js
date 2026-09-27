export async function getJson(path, signal) {
  const res = await fetch(path, { signal });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw Object.assign(new Error(body.error ?? `Error ${res.status}`), {
      status: res.status,
    });
  }
  return body;
}
