import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const TOKENS_FILE = join(dirname(fileURLToPath(import.meta.url)), '..', '.data', 'strava-tokens.json')

export async function loadTokens() {
  try {
    return JSON.parse(await readFile(TOKENS_FILE, 'utf8'))
  } catch (error) {
    if (error.code === 'ENOENT') return null
    throw error
  }
}

export async function saveTokens({ access_token, refresh_token, expires_at, athlete }) {
  const previous = await loadTokens()
  const tokens = {
    access_token,
    refresh_token,
    expires_at,
    athlete_id: athlete?.id ?? previous?.athlete_id,
  }
  await mkdir(dirname(TOKENS_FILE), { recursive: true })
  await writeFile(TOKENS_FILE, JSON.stringify(tokens, null, 2))
  return tokens
}
