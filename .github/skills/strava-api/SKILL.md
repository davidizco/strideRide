---
name: strava-api
description: 'Referencia de la API de Strava v3 para strideRide. Use when: añadir o modificar endpoints de Strava, OAuth/tokens, actividades, estadísticas del atleta, splits, zonas, streams, límites de peticiones (rate limit 429), unidades y campos de SummaryActivity/DetailedActivity, o preparar tools para el asistente IA.'
---

# API de Strava en strideRide

## Cuándo usar

- Añadir un dato nuevo de Strava al dashboard o al servidor.
- Depurar errores 401/429/5xx de Strava.
- Diseñar funciones que usará el futuro asistente IA como *tools*.

## Arquitectura existente

| Archivo | Responsabilidad |
|---|---|
| `server/strava/auth.js` | URL de autorización con `state`, intercambio de `code`, refresco automático del token |
| `server/strava/tokenStore.js` | Lee/escribe `.data/strava-tokens.json` |
| `server/strava/client.js` | `stravaGet()` y funciones por endpoint (`getAthlete`, `getActivities`...) |
| `server/index.js` | Rutas `/auth/*` y `/api/*` |

## Procedimiento: añadir un endpoint

1. Consulta el endpoint en [la referencia](./references/endpoints.md) o en https://developers.strava.com/docs/reference/.
2. Añade una función en `server/strava/client.js` que use `stravaGet(path, params)`. Parámetros en camelCase, conviértelos a snake_case al llamar.
3. Expón una ruta `GET /api/...` en `server/index.js` validando y acotando la entrada.
4. Si necesita un scope nuevo, añádelo en `server/config.js` y avisa de que hay que volver a conectar Strava (`/auth/strava`).
5. En el frontend, consume la ruta desde `src/api/` y convierte unidades con `src/utils/`.

## Reglas clave

- **Unidades**: distancia en metros, tiempo en segundos, velocidad en m/s, fechas ISO 8601 (`start_date` UTC, `start_date_local` hora local).
- **Tipo de deporte**: usa `sport_type` (`Run`, `Ride`, `TrailRun`, `VirtualRide`...), no `type` (obsoleto).
- **Paginación**: `GET /athlete/activities` usa `page` y `per_page` (máx. 200). Para históricos usa `after`/`before` en epoch segundos.
- **Tokens**: el access token caduca a las 6 h; `getAccessToken()` lo refresca solo. El `refresh_token` puede cambiar: guarda siempre el último.
- **Límites** (por aplicación): lectura 100 peticiones/15 min y 1.000/día por defecto. Se reinician a los minutos 0/15/30/45 y a medianoche UTC. Cabeceras `X-ReadRateLimit-Limit` / `X-ReadRateLimit-Usage`. Un 429 no se reintenta en bucle.
- Para cargas masivas (histórico completo, IA), descarga una vez y guarda en local en vez de pedir a Strava en cada consulta.

## Datos reales durante el desarrollo

Si el MCP de Composio tiene Strava conectado, úsalo para inspeccionar la forma real de las respuestas antes de escribir código. Nunca copies tokens ni datos personales al código o a los commits.
