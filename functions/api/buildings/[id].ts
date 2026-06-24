import type { PagesFunction } from '@cloudflare/workers-types'
import type { Env, Data } from '../../_types'

type Row = Record<string, string | number | null>

function rowToBuilding(r: Row) {
  return {
    id: r.id,
    name: r.name,
    address: r.address,
    floorArea: r.floor_area,
    technicianGrade: r.technician_grade,
    wageRate: r.wage_rate,
    adjustmentFactor: r.adjustment_factor,
    assignedTechnicianId: r.assigned_technician_id ?? undefined,
    equipment: JSON.parse((r.equipment_json as string) || '[]'),
    directCost: {
      travel: r.direct_cost_travel,
      vehicle: r.direct_cost_vehicle,
      fieldExpense: r.direct_cost_field_expense,
    },
    overheadRate: r.overhead_rate,
    techFeeRate: r.tech_fee_rate,
    totalCost: r.total_cost,
    status: r.status,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

export const onRequestGet: PagesFunction<Env, string, Data> = async ({ env, params }) => {
  const row = await env.DB.prepare('SELECT * FROM buildings WHERE id = ?').bind(params.id).first<Row>()
  if (!row) return Response.json({ error: '건축물을 찾을 수 없습니다.' }, { status: 404 })
  return Response.json(rowToBuilding(row))
}

export const onRequestPut: PagesFunction<Env, string, Data> = async ({ request, env, params }) => {
  const id = params.id as string
  const b = await request.json<Record<string, unknown>>()
  const now = new Date().toISOString()

  const row = await env.DB.prepare('SELECT * FROM buildings WHERE id = ?').bind(id).first<Row>()
  if (!row) return Response.json({ error: '건축물을 찾을 수 없습니다.' }, { status: 404 })

  const directCost = (b.directCost as Record<string, number>) ?? {}
  const prevEquipment = JSON.parse((row.equipment_json as string) || '[]')

  await env.DB.prepare(`
    UPDATE buildings SET
      name=?, address=?, floor_area=?, technician_grade=?, wage_rate=?, adjustment_factor=?,
      assigned_technician_id=?, equipment_json=?,
      direct_cost_travel=?, direct_cost_vehicle=?, direct_cost_field_expense=?,
      overhead_rate=?, tech_fee_rate=?, total_cost=?, status=?, updated_at=?
    WHERE id=?
  `).bind(
    b.name ?? row.name, b.address ?? row.address, b.floorArea ?? row.floor_area,
    b.technicianGrade ?? row.technician_grade, b.wageRate ?? row.wage_rate,
    b.adjustmentFactor ?? row.adjustment_factor,
    b.assignedTechnicianId !== undefined ? ((b.assignedTechnicianId as string) || null) : row.assigned_technician_id,
    JSON.stringify(b.equipment ?? prevEquipment),
    directCost.travel ?? row.direct_cost_travel,
    directCost.vehicle ?? row.direct_cost_vehicle,
    directCost.fieldExpense ?? row.direct_cost_field_expense,
    b.overheadRate ?? row.overhead_rate, b.techFeeRate ?? row.tech_fee_rate,
    b.totalCost ?? row.total_cost, b.status ?? row.status,
    now, id
  ).run()

  const updated = await env.DB.prepare('SELECT * FROM buildings WHERE id = ?').bind(id).first<Row>()
  return Response.json(rowToBuilding(updated!))
}

export const onRequestDelete: PagesFunction<Env, string, Data> = async ({ env, params }) => {
  await env.DB.prepare('DELETE FROM buildings WHERE id = ?').bind(params.id).run()
  return Response.json({ ok: true })
}
