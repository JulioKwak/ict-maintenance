import type { PagesFunction } from '@cloudflare/workers-types'
import type { Env, Data } from '../../_types'

export const onRequestPut: PagesFunction<Env, string, Data> = async ({ request, env, params }) => {
  const year = Number(params.year)
  const body = await request.json<{ rates: Record<string, number> }>()
  const rates = body.rates ?? {}

  const entries = Object.entries(rates)
  if (!year || entries.length === 0) {
    return Response.json({ error: '연도와 등급별 단가를 입력하세요.' }, { status: 400 })
  }

  await env.DB.batch(
    entries.map(([grade, rate]) =>
      env.DB.prepare('INSERT OR REPLACE INTO wage_rates (year, grade, rate) VALUES (?,?,?)')
        .bind(year, grade, rate)
    )
  )

  return Response.json({ year, rates })
}

export const onRequestDelete: PagesFunction<Env, string, Data> = async ({ env, params }) => {
  const year = Number(params.year)
  await env.DB.prepare('DELETE FROM wage_rates WHERE year = ?').bind(year).run()
  return Response.json({ ok: true })
}
