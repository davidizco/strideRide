---
name: intervals-api
description: "Referencia de la API de Intervals.icu para strideRide. Use when: calendario de entrenos, eventos planificados (WORKOUT, NOTE, RACE), crear o editar entrenos que se sincronizan con Garmin, actividades de Garmin, wellness (VFC, sueño, peso), fitness/fatiga (CTL/ATL), clave API, límites 429, o preparar tools para el asistente IA."
---

# API de Intervals.icu en strideRide

Intervals.icu es la fuente de datos para el calendario y para el futuro asistente IA. Recibe actividades y wellness de Garmin Connect y envía los entrenos planificados a Garmin (y al reloj) mediante su integración oficial.

## Arquitectura existente

| Archivo                       | Responsabilidad                                                                                                                                                    |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `server/intervals/client.js`  | `intervalsGet()` con Basic auth, `User-Agent` y caché de 2 min; `getCalendar()`                                                                                    |
| `server/intervals/client.js`  | Lecturas compactas para la IA: `getAthleteProfile`, `getWellness`, `listActivities`, `getActivityIntervals`, `getPlannedEvents` (filtran Strava y datos de cuenta) |
| `server/assistant/`           | Chat IA: `tools.js` (tools de solo lectura y validación), `prompt.js`, `chat.js` (bucle de tools)                                                                  |
| `server/index.js`             | `GET /api/intervals/status`, `GET /api/calendar?oldest&newest` (máx. 42 días)                                                                                      |
| `src/components/CalendarView` | Vista semanal (lista en móvil, 7 columnas desde 960 px)                                                                                                            |

## Autenticación y límites

- Basic auth: usuario `API_KEY`, contraseña `INTERVALS_API_KEY`. Id de atleta `0` = dueño de la clave.
- Envía siempre `User-Agent`: Cloudflare puede bloquear clientes sin él.
- Límites con clave API: 2.500 peticiones por ventana móvil de 15 min y 5.000/día; además 10/s por IP. Un 429 trae `Retry-After`.
- Condiciones de uso: cualquier uso legal; si se muestran datos de Garmin hay que atribuirlos a Garmin.

## Endpoints útiles (base `https://intervals.icu/api/v1`)

| Endpoint                                            | Uso                                                                                     |
| --------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `GET /athlete/{id}/events?oldest&newest&category`   | Calendario: `WORKOUT`, `NOTE`, `RACE_A/B/C`, `HOLIDAY`, `SICK`, `INJURED`...            |
| `POST /athlete/{id}/events`                         | Crear evento. Entreno en texto nativo en `description`, o `file_contents(_base64)`      |
| `POST /athlete/{id}/events/bulk?upsert=true`        | Crear/actualizar varios usando `external_id` propio                                     |
| `PUT /athlete/{id}/events/{eventId}` / `DELETE`     | Editar o borrar un evento                                                               |
| `GET /athlete/{id}/activities?oldest&newest&fields` | Actividades hechas (`fields` reduce la respuesta). `paired_event_id` enlaza con el plan |
| `GET /athlete/{id}/wellness?oldest&newest`          | `ctl`, `atl`, `rampRate`, `hrv`, `restingHR`, `sleepSecs`, `sleepScore`, `weight`...    |
| `GET /activity/{id}?intervals=true`                 | Detalle con intervalos detectados                                                       |
| `GET /athlete/{id}` / `sport-settings`              | Umbrales y zonas (FTP, LTHR, ritmo umbral)                                              |

## Reglas clave

- Fechas `start_date_local` sin zona (`2026-09-28T00:00:00`): son hora local; en el frontend se tratan como días `YYYY-MM-DD`.
- Unidades como Strava: metros, segundos, m/s. `icu_training_load` es la carga.
- Actividades con origen Strava llegan como _stubs_ vacíos (`_note`): se descartan. La fuente buena es Garmin (`source: GARMIN_CONNECT`).
- Escribir en el calendario llega al reloj: cualquier creación o borrado desde la IA debe pedir confirmación al usuario.
- Nunca copies la clave API ni datos personales al código o a los commits.
