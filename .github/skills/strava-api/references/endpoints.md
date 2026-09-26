# Endpoints de Strava más útiles

Base: `https://www.strava.com/api/v3`. Todos requieren `Authorization: Bearer <access_token>`.

| Endpoint | Scope | Uso |
|---|---|---|
| `GET /athlete` | `profile:read_all` para datos completos | Perfil (nombre, foto, peso, FTP, bicis y zapatillas) |
| `GET /athletes/{id}/stats` | `read` | Totales `recent_*` (4 semanas), `ytd_*`, `all_*` para run/ride/swim |
| `GET /athlete/activities` | `activity:read_all` | Lista de `SummaryActivity`. Query: `before`, `after`, `page`, `per_page` |
| `GET /activities/{id}` | `activity:read_all` | `DetailedActivity`: `splits_metric`, `laps`, `best_efforts`, `calories`, `description` |
| `GET /activities/{id}/zones` | `activity:read_all` | Tiempo en zonas de FC / potencia |
| `GET /activities/{id}/streams` | `activity:read_all` | Series temporales. Query: `keys=time,distance,heartrate,altitude,velocity_smooth,cadence,watts,latlng`, `key_by_type=true` |
| `GET /athlete/zones` | `profile:read_all` | Zonas de FC y potencia configuradas |
| `GET /gear/{id}` | `read` | Detalle de bici/zapatillas y distancia acumulada |

## Campos clave de SummaryActivity

- `id`, `name`, `sport_type`, `start_date_local`
- `distance` (m), `moving_time` (s), `elapsed_time` (s), `total_elevation_gain` (m)
- `average_speed`, `max_speed` (m/s)
- `average_heartrate`, `max_heartrate` (si `has_heartrate`)
- `average_watts`, `kilojoules` (ciclismo)
- `map.summary_polyline` (polilínea codificada de Google)
- `kudos_count`, `achievement_count`, `pr_count`

## OAuth

- Autorizar: `https://www.strava.com/oauth/authorize?client_id&redirect_uri&response_type=code&scope&state`
- Token: `POST https://www.strava.com/oauth/token` con `grant_type=authorization_code` + `code`, o `grant_type=refresh_token` + `refresh_token`.
- El dominio de `redirect_uri` debe coincidir con el *Authorization Callback Domain* de la app (`localhost`).
