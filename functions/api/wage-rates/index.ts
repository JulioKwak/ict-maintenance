import type { PagesFunction } from '@cloudflare/workers-types'
import type { Env, Data } from '../../_types'

type Row = { year: number; grade: string; rate: number }

export const onRequestGet: PagesFunction<Env, string, Data> = async ({ env }) => {
  const { results } = await env.DB.prepare(
    'SELECT year, grade, rate FROM wage_rates ORDER BY year DESC'
  ).all<Row>()

  const byYear = new Map<number, Record<string, number>>()
  for (const r of results) {
    if (!byYear.has(r.year)) byYear.set(r.year, {})
    byYear.get(r.year)![r.grade] = r.rate
  }

  const sets = Array.from(byYear.entries()).map(([year, rates]) => ({ year, rates }))
  return Response.json(sets)
}
