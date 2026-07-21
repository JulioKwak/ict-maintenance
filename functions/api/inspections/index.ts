import type { PagesFunction } from '@cloudflare/workers-types'
import type { Env, Data } from '../../_types'

function genId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

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
    equipmentReviews: JSON.parse(r.equipment_reviews_json || '{}'),
    assignedInspectorIds: JSON.parse(r.assigned_inspectors_json || '[]'),
    createdBy: r.created_by,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

export const onRequestGet: PagesFunction<Env, string, Data> = async ({ request, env }) => {
  const url = new URL(request.url)
  const buildingId = url.searchParams.get('buildingId')

  const stmt = buildingId
    ? env.DB.prepare('SELECT * FROM inspection_forms WHERE building_id = ? ORDER BY created_at DESC').bind(buildingId)
    : env.DB.prepare('SELECT * FROM inspection_forms ORDER BY created_at DESC')

  const { results } = await stmt.all<Row>()
  return Response.json(results.map(rowToForm))
}

export const onRequestPost: PagesFunction<Env, string, Data> = async ({ request, env, data }) => {
  const b = await request.json<Record<string, unknown>>()
  const id = genId()
  const now = new Date().toISOString()

  await env.DB.prepare(`
    INSERT INTO inspection_forms
      (id, building_id, inspection_type, inspection_date, items_json, status, review_note, equipment_reviews_json, assigned_inspectors_json, created_by, created_at, updated_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
  `).bind(
    id,
    b.buildingId, b.inspectionType, b.inspectionDate,
    JSON.stringify(b.items ?? []),
    b.status ?? '작성중',
    b.reviewNote ?? '',
    JSON.stringify(b.equipmentReviews ?? {}),
    JSON.stringify(b.assignedInspectorIds ?? []),
    data.username ?? b.createdBy ?? '',
    now, now
  ).run()

  return Response.json({ ...b, id, createdAt: now, updatedAt: now }, { status: 201 })
}
