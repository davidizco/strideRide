# Handoff — Mejoras futuras de strideRide

Documento de traspaso con el trabajo pendiente, priorizado. Cada punto incluye
contexto, archivos implicados y criterios de aceptación para poder retomarlo sin
volver a investigar. Marca con `[x]` lo que se vaya completando.

> Reglas del proyecto que afectan a todo lo de abajo:
>
> - Secretos solo en el servidor; el frontend solo llama a `/api/*`.
> - Los datos de Strava **nunca** se usan con IA (API Policy 5.3) ni se guardan
>   más de 7 días (5.5). El asistente solo usa datos de Intervals.icu.
> - Toda llamada externa pasa por su cliente (`server/*/client.js`); las rutas
>   solo validan y delegan. Las funciones de `intervals/client.js` son _tools_
>   del asistente: puras, sin HTTP de Express.
> - Tras editar: `npm.cmd run format` y `npm.cmd run lint`.

---

## Prioridad alta

### 1. Tests de utils del frontend y validaciones de tools

- **Por qué**: hoy solo hay cobertura en `server/assistant/proposals.test.js`.
  La lógica pura (conversión de unidades, zonas, validación de rangos/fechas)
  es barata de testear y propensa a regresiones.
- **Archivos**: `src/utils/format.js`, `src/utils/zones.js`,
  `src/utils/weekly.js`, `src/utils/splits.js`, `server/assistant/tools.js`
  (`dateRange`, validación de `type`/`limit`/`id`), `server/assistant/dates.js`.
- **Hacer**:
  - Añadir tests con el runner nativo de Node (`node --test`), igual que el test
    existente. Ampliar el script `test` de `package.json` a un glob
    (p. ej. `node --test "server/**/*.test.js"`) o añadir un `test:web`.
  - Para los utils del frontend (ESM, sin DOM) se pueden testear con
    `node --test` directamente si no dependen del navegador.
- **Aceptación**: `npm.cmd test` ejecuta los nuevos tests y pasan; cubren casos
  límite (rango > 42 días, fecha mal formada, m/s→min/km, segundos→h:mm).

### 2. Cerrar el bucle de publicación de entrenos

- **Por qué**: `proposeWorkout` solo prepara una propuesta; ya existe
  `createPlannedWorkout` en el cliente pero falta conectar confirmar → publicar.
- **Archivos**: `server/intervals/client.js` (`createPlannedWorkout` ya existe),
  `server/assistant/proposals.js`, `server/index.js` (ruta de confirmación),
  `src/components/WorkoutProposal.jsx`, `src/api/assistant.js`,
  `src/hooks/useAssistantChat.js`.
- **Hacer**:
  - Ruta `POST /api/assistant/proposals/:id/confirm` que valide el id, recupere
    la propuesta y llame a `createPlannedWorkout`. Invalidar caché del calendario
    (ya hace `cache.clear()` en el cliente).
  - Botón de confirmar en `WorkoutProposal.jsx` que refleje estados
    (pendiente / publicando / publicado / error).
- **Aceptación**: desde el asistente se confirma una propuesta, aparece en el
  calendario de Intervals.icu y, por tanto, sincroniza a Garmin. Doble envío
  controlado (no publicar dos veces el mismo id).

---

## Prioridad media

### 3. Caché: purga y anti-stampede

- **Por qué**: el `Map` de caché en `strava/client.js` e `intervals/client.js`
  caduca en lectura pero nunca se purga (crece sin límite), y dos peticiones
  concurrentes iguales golpean la API externa dos veces.
- **Archivos**: `server/strava/client.js`, `server/intervals/client.js`.
- **Hacer**:
  - Cachear la _promesa_ en vuelo para deduplicar llamadas concurrentes.
  - Purga periódica o límite LRU sencillo de entradas caducadas.
- **Aceptación**: dos llamadas simultáneas al mismo recurso hacen un único
  `fetch`; el `Map` no retiene entradas caducadas indefinidamente.

### 4. Reintento controlado ante 429

- **Por qué**: hoy un 429 aborta con error. Un único reintento con backoff
  respetando `Retry-After` mejora la experiencia sin violar límites.
- **Archivos**: `server/strava/client.js`, `server/intervals/client.js`.
- **Hacer**: un solo reintento con espera corta; si vuelve a fallar, propagar el
  error 429 actual. No crear bucles de reintento.
- **Aceptación**: un 429 transitorio se resuelve con un reintento; no se generan
  ráfagas de peticiones.

### 5. Panel de forma/fatiga (CTL/ATL/Form) en el dashboard

- **Por qué**: `getFitness`/`getWellness` ya exponen CTL, ATL, rampRate, VFC,
  sueño y peso, pero hoy solo los ve la IA.
- **Archivos**: `server/intervals/client.js` (lectura ya existe),
  nueva ruta en `server/index.js`, nuevo componente de gráfica en
  `src/components/` (reutilizar patrón de `WeeklyChart.jsx` con recharts),
  `src/api/intervals.js`, `src/hooks/`.
- **Aceptación**: gráfica de evolución de forma (CTL), fatiga (ATL) y
  form = CTL − ATL en el dashboard, mobile-first, en español.

### 6. Análisis de cumplimiento (planificado vs. realizado)

- **Por qué**: ya se recogen `compliance`, `paired_event_id`, `feel`, `icu_rpe`.
- **Archivos**: `server/intervals/client.js`, `src/components/CalendarDay.jsx` o
  vista nueva, `src/utils/`.
- **Aceptación**: para un día con entreno planificado y su actividad emparejada,
  se muestra la desviación (carga/tiempo/sensación) de forma clara.

---

## Prioridad baja / exploratorio

### 7. Persistencia del historial del asistente

- **Contexto**: en `server/assistant/chat.js` el historial llega del cliente y
  no se guarda. Guardarlo en `.data/` permitiría retomar hilos.
- **Ojo**: nunca persistir datos de Strava en ese contexto (solo Intervals.icu).

### 8. Resumen semanal proactivo generado por IA

- Resumen automático ("tu semana": carga, tendencia, sugerencia) al abrir la app.

### 9. PWA instalable con caché del último dashboard

- Encaja con el enfoque mobile-first y de un solo usuario.

### 10. Robustez/operación

- `/api/status` ampliado a _health check_ (qué está configurado: Strava,
  Intervals, IA) usando `isIntervalsConfigured()` e `isAiConfigured()`.
- Rate limiting básico en `/api/*` para evitar bucles accidentales del frontend.
- Log estructurado de llamadas externas (latencia, aciertos de caché, 429).

---

## Notas de arranque rápido

- `npm.cmd run dev` — frontend + servidor.
- `npm.cmd test` — tests (ampliar glob al añadir nuevos).
- `npm.cmd run lint` / `npm.cmd run format`.
- Servidor: `127.0.0.1:3001`; frontend Vite: `localhost:5173` (proxy de
  `/api` y `/auth`).
