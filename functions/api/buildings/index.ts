import type { PagesFunction } from '@cloudflare/workers-types'
import type { Env, Data } from '../../_types'

function genId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

type Row = Record<string, string | number | null>

function rowToBuilding(r: Row) {
  return {
    id: r.id,
    companyName: r.company_name ?? '',
    name: r.name,
    address: r.address,
    latitude: r.latitude ?? undefined,
    longitude: r.longitude ?? undefined,
    sido: r.sido ?? undefined,
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
    discountRate: r.discount_rate ?? 0,
    inspectionSchedule: {
      maintenanceH1: !!(r.maintenance_h1 ?? 1),
      maintenanceH2: !!(r.maintenance_h2 ?? 1),
      performance: !!(r.performance_check ?? 1),
    },
    totalCost: r.total_cost,
    status: r.status,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

export const onRequestGet: PagesFunction<Env, string, Data> = async ({ env }) => {
  const { results } = await env.DB.prepare(
    'SELECT * FROM buildings ORDER BY created_at DESC'
  ).all<Row>()

  return Response.json(results.map(rowToBuilding))
}

export const onRequestPost: PagesFunction<Env, string, Data> = async ({ request, env }) => {
  const b = await request.json<Record<string, unknown>>()
  const id = genId()
  const now = new Date().toISOString()

  const directCost = (b.directCost as Record<string, number>) ?? {}
  const schedule = (b.inspectionSchedule as Record<string, boolean>) ?? {}

  await env.DB.prepare(`
    INSERT INTO buildings (
      id, company_name, name, address, latitude, longitude, sido, floor_area, technician_grade, wage_rate, adjustment_factor,
      assigned_technician_id, equipment_json,
      direct_cost_travel, direct_cost_vehicle, direct_cost_field_expense,
      overhead_rate, tech_fee_rate, discount_rate,
      maintenance_h1, maintenance_h2, performance_check,
      total_cost, status, created_at, updated_at
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `).bind(
    id,
    b.companyName ?? '', b.name, b.address,
    (b.latitude as number) ?? null, (b.longitude as number) ?? null, (b.sido as string) || null,
    b.floorArea, b.technicianGrade, b.wageRate, b.adjustmentFactor,
    (b.assignedTechnicianId as string) || null,
    JSON.stringify(b.equipment ?? []),
    directCost.travel ?? 0, directCost.vehicle ?? 0, directCost.fieldExpense ?? 0,
    b.overheadRate ?? 110, b.techFeeRate ?? 20, b.discountRate ?? 0,
    (schedule.maintenanceH1 ?? true) ? 1 : 0,
    (schedule.maintenanceH2 ?? true) ? 1 : 0,
    (schedule.performance ?? true) ? 1 : 0,
    b.totalCost ?? 0,
    b.status ?? '등록', now, now
  ).run()

  return Response.json({ ...b, id, createdAt: now, updatedAt: now }, { status: 201 })
}
