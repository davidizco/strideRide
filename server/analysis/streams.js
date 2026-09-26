const CURVE_DURATIONS = [
  5, 15, 30, 60, 120, 300, 600, 1200, 1800, 3600, 5400, 7200,
];
// Huecos mayores (pausas, auto-pause) cuentan como 0 W en la curva de potencia.
const MAX_FILL_GAP_S = 5;

/** Reduce una serie a como mucho `maxPoints` puntos promediando por tramos de tiempo. */
function downsample(time, channels, maxPoints) {
  const duration = time.at(-1) ?? 0;
  if (time.length <= maxPoints || duration === 0) {
    return time.map((t, i) => ({ time: t, ...pick(channels, i) }));
  }

  const step = duration / maxPoints;
  const points = [];
  let start = 0;
  for (let bucket = 0; bucket < maxPoints && start < time.length; bucket++) {
    const limit = (bucket + 1) * step;
    let end = start;
    while (end < time.length && time[end] <= limit) end++;
    if (end === start) continue;

    const point = { time: Math.round(time[start]) };
    for (const [key, data] of Object.entries(channels)) {
      let sum = 0;
      for (let i = start; i < end; i++) sum += data[i] ?? 0;
      point[key] = Math.round(sum / (end - start));
    }
    points.push(point);
    start = end;
  }
  return points;
}

function pick(channels, index) {
  return Object.fromEntries(
    Object.entries(channels).map(([key, data]) => [key, data[index]]),
  );
}

/** Mejor potencia media para cada duración, remuestreando a 1 Hz. */
export function powerCurve(time, watts) {
  const duration = time.at(-1) ?? 0;
  const perSecond = new Float64Array(duration + 1);
  for (let i = 0; i < time.length; i++) {
    const next = time[i + 1] ?? time[i] + 1;
    const fillUntil = next - time[i] <= MAX_FILL_GAP_S ? next : time[i] + 1;
    for (let t = time[i]; t < fillUntil && t <= duration; t++)
      perSecond[t] = watts[i] ?? 0;
  }

  const prefix = new Float64Array(perSecond.length + 1);
  for (let i = 0; i < perSecond.length; i++)
    prefix[i + 1] = prefix[i] + perSecond[i];

  return CURVE_DURATIONS.filter((d) => d <= perSecond.length).map((d) => {
    let best = 0;
    for (let i = 0; i + d <= perSecond.length; i++) {
      const sum = prefix[i + d] - prefix[i];
      if (sum > best) best = sum;
    }
    return { duration: d, watts: Math.round(best / d) };
  });
}

/** Resume los streams de Strava para gráficas: serie reducida de FC/potencia y curva de potencia. */
export function summarizeStreams(streams, { maxPoints = 300 } = {}) {
  const time = streams.time?.data;
  if (!time?.length) return { series: [], powerCurve: null };

  const channels = {};
  if (streams.heartrate?.data) channels.heartrate = streams.heartrate.data;
  if (streams.watts?.data) channels.watts = streams.watts.data;

  return {
    series: Object.keys(channels).length
      ? downsample(time, channels, maxPoints)
      : [],
    powerCurve: channels.watts ? powerCurve(time, channels.watts) : null,
  };
}
