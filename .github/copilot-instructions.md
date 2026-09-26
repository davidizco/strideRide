# strideRide

Aplicación personal (un solo usuario) para visualizar mis datos de Strava en un dashboard responsive. En el futuro incluirá un asistente IA que responda preguntas sobre mis datos y genere planes de entrenamiento.

## Stack

- **Frontend**: React 19 + Vite 8, JavaScript (ESM), en `src/`. Sin TypeScript.
- **Servidor**: Node 24 + Express 5, en `server/`. Escucha solo en `127.0.0.1:3001`; Vite hace de proxy de `/api` y `/auth`.
- **Datos**: API oficial de Strava con OAuth. Los tokens se guardan en `.data/strava-tokens.json` (ignorado por Git).
- **Lint**: oxlint (`.oxlintrc.json`).

## Comandos (Windows / PowerShell)

PowerShell bloquea `npm.ps1`: usa siempre `npm.cmd`.

- `npm.cmd run dev` — frontend + servidor a la vez
- `npm.cmd run dev:mobile` — igual, pero accesible desde el móvil en la misma red
- `npm.cmd run build` — build de producción
- `npm.cmd run lint` — lint

## Arquitectura y reglas

- **Secretos solo en el servidor.** `STRAVA_CLIENT_SECRET`, tokens y futuras claves de IA viven en `.env` / `.data/` y nunca se importan ni se exponen en `src/`. El frontend solo llama a `/api/*`.
- **Toda llamada a Strava pasa por `server/strava/client.js`.** Las rutas de `server/index.js` solo validan la entrada y llaman al cliente. Estas funciones serán también las *tools* del futuro asistente IA, así que deben ser puras, con parámetros claros y sin lógica de HTTP de Express.
- Errores del servidor: lanzar `Error` con propiedad `status`; el manejador global de `server/index.js` responde `{ error }`.
- Valida y acota parámetros de entrada (`page`, `per_page`, ids) en las rutas.
- Respeta los límites de Strava: evita pedir datos en bucle; cachea cuando tenga sentido.

## Frontend

- UI en **español**.
- **Mobile-first**: estilos base para móvil y `@media (min-width: ...)` para pantallas mayores. Nada de anchos fijos en px para contenedores.
- Componentes funcionales con hooks; un componente por archivo en `src/components/`.
- Unidades de Strava: distancia en metros, tiempo en segundos, velocidad en m/s. Convierte a km, h:mm y min/km en funciones de `src/utils/`, no dentro de los componentes.

## Conocimiento adicional

- Detalles de la API de Strava (endpoints, campos, límites, cómo añadir un endpoint): skill `strava-api`.
- Para ver datos reales de Strava durante el desarrollo se puede usar el MCP de Composio (si el toolkit de Strava está conectado).
