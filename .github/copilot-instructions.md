# strideRide

Aplicación personal (un solo usuario) que sustituye a RestorTrain: dashboard responsive de mis entrenos, calendario sincronizado con Garmin y, más adelante, un asistente IA que responda preguntas y genere/ajuste planes de entrenamiento.

## Stack

- **Frontend**: React 19 + Vite 8, JavaScript (ESM), en `src/`. Sin TypeScript.
- **Servidor**: Node 24 + Express 5, en `server/`. Escucha solo en `127.0.0.1:3001`; Vite hace de proxy de `/api` y `/auth`.
- **Datos**:
  - **Strava** (OAuth, `server/strava/`): solo para el dashboard. Tokens en `.data/strava-tokens.json` (ignorado por Git).
  - **Intervals.icu** (clave API personal, `server/intervals/`): calendario, entrenos planificados y datos de Garmin. Intervals.icu sincroniza con Garmin Connect de forma oficial.
- **Lint**: oxlint (`.oxlintrc.json`).
- **Formato**: Prettier (`.prettierrc.json`): comillas dobles, punto y coma, comas finales y 80 columnas. Escribe el código ya con ese estilo y ejecuta `npm.cmd run format` tras editar.

## Comandos (Windows / PowerShell)

PowerShell bloquea `npm.ps1`: usa siempre `npm.cmd`.

- `npm.cmd run dev` — frontend + servidor a la vez
- `npm.cmd run dev:mobile` — igual, pero accesible desde el móvil en la misma red
- `npm.cmd run build` — build de producción
- `npm.cmd run lint` — lint
- `npm.cmd run format` — formatea con Prettier (`format:check` solo comprueba)

## Arquitectura y reglas

- **Secretos solo en el servidor.** `STRAVA_CLIENT_SECRET`, `INTERVALS_API_KEY`, tokens y futuras claves de IA viven en `.env` / `.data/` y nunca se importan ni se exponen en `src/`. El frontend solo llama a `/api/*`.
- **Los datos de Strava nunca se usan con IA.** La API Policy de Strava (sección 5.3) prohíbe meter sus datos en cualquier aplicación de IA, incluido el contexto de un modelo, y (5.5) guardarlos más de 7 días. El asistente IA solo usará datos de Intervals.icu.
- **Toda llamada a un servicio externo pasa por su cliente** (`server/strava/client.js`, `server/intervals/client.js`). Las rutas de `server/index.js` solo validan la entrada y llaman al cliente. Las funciones de `server/intervals/client.js` serán las _tools_ del futuro asistente IA, así que deben ser puras, con parámetros claros y sin lógica de HTTP de Express.
- Errores del servidor: lanzar `Error` con propiedad `status`; el manejador global de `server/index.js` responde `{ error }`.
- Valida y acota parámetros de entrada (`page`, `per_page`, ids, rangos de fechas) en las rutas.
- Respeta los límites de Strava e Intervals.icu: evita pedir datos en bucle; cachea cuando tenga sentido.
- Si se muestran datos que vienen de Garmin (actividades de Intervals.icu con `source: GARMIN_CONNECT`), incluye la atribución a Garmin.

## Frontend

- UI en **español**.
- **Mobile-first**: estilos base para móvil y `@media (min-width: ...)` para pantallas mayores. Nada de anchos fijos en px para contenedores.
- Componentes funcionales con hooks; un componente por archivo en `src/components/`.
- Unidades de Strava: distancia en metros, tiempo en segundos, velocidad en m/s. Convierte a km, h:mm y min/km en funciones de `src/utils/`, no dentro de los componentes.

## Conocimiento adicional

- Detalles de la API de Strava (endpoints, campos, límites, cómo añadir un endpoint): skill `strava-api`.
- Detalles de la API de Intervals.icu (calendario, entrenos, actividades, wellness): skill `intervals-api`.
