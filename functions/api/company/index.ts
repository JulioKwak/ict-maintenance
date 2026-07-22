import type { PagesFunction } from '@cloudflare/workers-types'
import type { Env, Data } from '../../_types'

const COMPANY_ID = 'main'

type Row = Record<string, string>

function rowToCompany(r: Row | null) {
  return {
    representativeName: r?.representative_name ?? '',
    address: r?.address ?? '',
    phone: r?.phone ?? '',
    email: r?.email ?? '',
    businessNumber: r?.business_number ?? '',
    updatedAt: r?.updated_at ?? '',
  }
}

export const onRequestGet: PagesFunction<Env, string, Data> = async ({ env }) => {
  const row = await env.DB.prepare('SELECT * FROM company_info WHERE id = ?').bind(COMPANY_ID).first<Row>()
  return Response.json(rowToCompany(row))
}

export const onRequestPut: PagesFunction<Env, string, Data> = async ({ request, env }) => {
  const b = await request.json<Record<string, string>>()
  const now = new Date().toISOString()

  const row = await env.DB.prepare('SELECT * FROM company_info WHERE id = ?').bind(COMPANY_ID).first<Row>()

  const representativeName = b.representativeName ?? row?.representative_name ?? ''
  const address = b.address ?? row?.address ?? ''
  const phone = b.phone ?? row?.phone ?? ''
  const email = b.email ?? row?.email ?? ''
  const businessNumber = b.businessNumber ?? row?.business_number ?? ''

  await env.DB.prepare(
    `INSERT OR REPLACE INTO company_info (id, representative_name, address, phone, email, business_number, updated_at) VALUES (?,?,?,?,?,?,?)`
  ).bind(COMPANY_ID, representativeName, address, phone, email, businessNumber, now).run()

  return Response.json({ representativeName, address, phone, email, businessNumber, updatedAt: now })
}
