import express from 'express'
import { config } from './config.js'
import { buildAuthorizeUrl, consumeState, exchangeCode, isConnected } from './strava/auth.js'
import { getActivities, getActivity, getAthlete, getAthleteStats } from './strava/client.js'

const app = express()

app.get('/auth/strava', (req, res) => {
  res.redirect(buildAuthorizeUrl())
})

app.get('/auth/strava/callback', async (req, res) => {
  const { code, state, error } = req.query
  if (error || typeof code !== 'string' || typeof state !== 'string' || !consumeState(state)) {
    return res.redirect(`${config.appUrl}/?strava=error`)
  }
  await exchangeCode(code)
  res.redirect(`${config.appUrl}/?strava=connected`)
})

app.get('/api/status', async (req, res) => {
  res.json({ connected: await isConnected() })
})

app.get('/api/athlete', async (req, res) => {
  res.json(await getAthlete())
})

app.get('/api/stats', async (req, res) => {
  res.json(await getAthleteStats())
})

app.get('/api/activities', async (req, res) => {
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1)
  const perPage = Math.min(200, Math.max(1, Number.parseInt(req.query.per_page, 10) || 30))
  res.json(await getActivities({ page, perPage }))
})

app.get('/api/activities/:id', async (req, res) => {
  if (!/^\d+$/.test(req.params.id)) {
    return res.status(400).json({ error: 'Id de actividad no válido' })
  }
  res.json(await getActivity(req.params.id))
})

app.use((err, req, res, _next) => {
  const status = err.status ?? 500
  if (!err.status) console.error(err)
  res.status(status).json({ error: err.status ? err.message : 'Error interno del servidor' })
})

// Solo escucha en local: el acceso desde el móvil pasa por el proxy de Vite.
app.listen(config.port, '127.0.0.1', () => {
  console.log(`API de strideRide en http://127.0.0.1:${config.port}`)
})
