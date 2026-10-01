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

export function postJson(path, data, signal, headers = {}) {
  return request(path, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(data),
    signal,
  });
}
