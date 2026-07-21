import type { PagesFunction } from '@cloudflare/workers-types'
import type { Env, Data } from '../../_types'

type Row = Record<string, string>

function rowToForm(r: Row) {
  return {
    id: r.id,
    buildingId: r.building_id,
    inspectionType: r.inspection_type,
    inspectionDate: r.inspection_date,
    items: JSON.parse(r.items_json || '[]'),
    status: r.status,
    reviewNote: r.review_note,
    assignedInspectorIds: JSON.parse(r.assigned_inspectors_json || '[]'),
    createdBy: r.created_by,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

export const onRequestGet: PagesFunction<Env, string, Data> = async ({ env, params }) => {
  const row = await env.DB.prepare('SELECT * FROM inspection_forms WHERE id = ?').bind(params.id).first<Row>()
  if (!row) return Response.json({ error: '점검표를 찾을 수 없습니다.' }, { status: 404 })
  return Response.json(rowToForm(row))
}

export const onRequestPut: PagesFunction<Env, string, Data> = async ({ request, env, params }) => {
  const id = params.id as string
  const b = await request.json<Record<string, unknown>>()
  const now = new Date().toISOString()

  const row = await env.DB.prepare('SELECT * FROM inspection_forms WHERE id = ?').bind(id).first<Row>()
  if (!row) return Response.json({ error: '점검표를 찾을 수 없습니다.' }, { status: 404 })

  await env.DB.prepare(
    `UPDATE inspection_forms SET items_json=?, status=?, review_note=?, assigned_inspectors_json=?, updated_at=? WHERE id=?`
  ).bind(
    JSON.stringify(b.items ?? JSON.parse(row.items_json || '[]')),
    b.status ?? row.status,
    b.reviewNote ?? row.review_note,
    JSON.stringify(b.assignedInspectorIds ?? JSON.parse(row.assigned_inspectors_json || '[]')),
    now, id
  ).run()

  const updated = await env.DB.prepare('SELECT * FROM inspection_forms WHERE id = ?').bind(id).first<Row>()
  return Response.json(rowToForm(updated!))
}

export const onRequestDelete: PagesFunction<Env, string, Data> = async ({ env, params }) => {
  await env.DB.prepare('DELETE FROM inspection_forms WHERE id = ?').bind(params.id).run()
  return Response.json({ ok: true })
}
