import type { PagesFunction } from '@cloudflare/workers-types'
import type { Env, Data } from '../../_types'

const ITERATIONS = 100_000

async function verifyPassword(input: string, stored: string): Promise<boolean> {
  if (!stored.includes(':') || stored.length < 60) {
    return input === stored
  }
  const [saltHex, hashHex] = stored.split(':')
  const salt = new Uint8Array(saltHex.match(/.{2}/g)!.map(b => parseInt(b, 16)))
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(input), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256' }, key, 256)
  const computed = Array.from(new Uint8Array(bits)).map(b => b.toString(16).padStart(2, '0')).join('')
  return computed === hashHex
}

export const onRequestPost: PagesFunction<Env, string, Data> = async ({ request, env }) => {
  try {
    const { username, password } = await request.json<{ username: string; password: string }>()
    if (!username || !password) return Response.json({ error: 'Required' }, { status: 400 })

    const row = await env.DB.prepare(
      'SELECT password FROM user_passwords WHERE username = ?'
    ).bind(username).first<{ password: string }>()

    if (!row) return Response.json({ error: 'Invalid password' }, { status: 401 })

    const valid = await verifyPassword(password, row.password)
    if (!valid) return Response.json({ error: 'Invalid password' }, { status: 401 })

    return Response.json({ ok: true })
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 })
  }
}
