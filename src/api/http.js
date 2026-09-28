async function request(path, options) {
  const res = await fetch(path, options);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw Object.assign(new Error(body.error ?? `Error ${res.status}`), {
      status: res.status,
    });
  }
  return body;
}

export function getJson(path, signal) {
  return request(path, { signal });
}

export function postJson(path, data, signal) {
  return request(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    signal,
  });
}
