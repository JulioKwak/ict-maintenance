import { Workbook, type Worksheet } from 'exceljs'
import estimateTemplateUrl from '../assets/estimate-template.xlsx?url'
import type { Building, CompanyInfo, Equipment, EquipmentCategory } from '../types'
import { EQUIPMENT_LIST, calcCostBreakdown, countCheckedInspections } from '../data/equipment'

interface CheckedItem {
  equipment: Equipment
  quantity: number
}

const CATEGORY_ORDER: EquipmentCategory[] = ['통신설비', '방송설비', '정보설비', '기타설비']
const CATEGORY_LABELS: Record<EquipmentCategory, string> = {
  통신설비: '통 신 설 비',
  방송설비: '방 송 설 비',
  정보설비: '정 보 설 비',
  기타설비: '기 타 설 비',
}

const DETAIL_DATA_START_ROW = 21
const DETAIL_TEMPLATE_ROWS = 18

function getCheckedItems(building: Building): CheckedItem[] {
  return building.equipment
    .filter(be => be.checked)
    .map(be => ({ equipment: EQUIPMENT_LIST.find(eq => eq.id === be.equipmentId), quantity: be.quantity }))
    .filter((x): x is CheckedItem => !!x.equipment)
}

function personnelOf(item: CheckedItem, adjustmentFactor: number): number {
  return item.equipment.applyAdjustment
    ? item.quantity * item.equipment.standardPersonnel * adjustmentFactor
    : item.quantity * item.equipment.standardPersonnel
}

function extractRegion(address: string): string {
  return address.trim().split(/\s+/)[0] ?? ''
}

// 이미 병합돼 있으면 예외가 나므로, 병합 상태를 모르는 셀 범위에 안전하게 병합을 적용한다.
function safeMerge(ws: Worksheet, range: string) {
  try {
    ws.mergeCells(range)
  } catch {
    // 이미 병합된 범위면 무시
  }
}

function safeUnmerge(ws: Worksheet, range: string) {
  try {
    ws.unMergeCells(range)
  } catch {
    // 이미 병합 해제된 범위면 무시
  }
}

function fillEstimateSheet(
  ws: Worksheet,
  building: Building,
  company: CompanyInfo,
  recipient: string,
  issueDate: string,
  perInstanceTotal: number,
) {
  ws.getCell('A3').value = building.companyName
  ws.getCell('C6').value = recipient
  ws.getCell('C7').value = '한국전파진흥협회'
  ws.getCell('C8').value = issueDate
  ws.getCell('C9').value = `   정보통신설비 유지관리 및 성능 점검(${building.address})`
  ws.getCell('E5').value = `   사업자번호 : ${company.businessNumber} / 대 표 : ${company.representativeName} (인)`
  ws.getCell('E6').value = `   주소 : ${company.address}`
  ws.getCell('E7').value = `   연락처 : ${company.phone}`
  ws.getCell('E8').value = `   e-mail : ${company.email}`
  ws.getCell('G25').value = building.discountRate / 100

  const inspectionRows: { row: number; checked: boolean }[] = [
    { row: 13, checked: building.inspectionSchedule.maintenanceH1 },
    { row: 14, checked: building.inspectionSchedule.maintenanceH2 },
    { row: 15, checked: building.inspectionSchedule.performance },
  ]
  inspectionRows.forEach(({ row, checked }) => {
    ws.getCell(`C${row}`).value = building.floorArea
    ws.getCell(`D${row}`).value = checked ? 1 : 0
    ws.getCell(`E${row}`).value = '-'
    ws.getCell(`F${row}`).value = perInstanceTotal
  })
}

function fillDetailSheet(
  ws: Worksheet,
  building: Building,
  items: CheckedItem[],
  directLaborCost: number,
  totalPersonnel: number,
  directExpense: number,
  overheadCost: number,
  techFee: number,
) {
  ws.getCell('A6').value = extractRegion(building.address)
  ws.getCell('B6').value = building.name
  ws.getCell('C6').value = building.floorArea
  ws.getCell('E6').value = building.technicianGrade
  ws.getCell('F6').value = building.adjustmentFactor

  ws.getCell('F9').value = directLaborCost
  ws.getCell('G9').value = totalPersonnel

  ws.getCell('F10').value = building.directCost.travel
  ws.getCell('F11').value = building.directCost.vehicle
  ws.getCell('F12').value = building.directCost.fieldExpense
  ws.getCell('F13').value = directExpense // 소계 (공식이 아닌 값으로 대체)

  ws.getCell('F14').value = overheadCost
  ws.getCell('G14').value = building.overheadRate / 100
  ws.getCell('F15').value = techFee
  ws.getCell('G15').value = building.techFeeRate / 100
  ws.getCell('F16').value = overheadCost + techFee
  ws.getCell('F17').value = directLaborCost + directExpense + overheadCost + techFee

  // 설비별 세부 산정 내역 표: 체크된 설비 수만큼 행을 늘리거나 줄인다.
  const grouped = CATEGORY_ORDER
    .map(category => ({ category, items: items.filter(it => it.equipment.category === category) }))
    .filter(g => g.items.length > 0)
  const totalCount = grouped.reduce((n, g) => n + g.items.length, 0)

  // 세로 병합된 분류 라벨(A열)은 행 수가 바뀌면 범위가 깨지므로 먼저 해제한다.
  safeUnmerge(ws, 'A21:A28')
  safeUnmerge(ws, 'A30:A36')
  safeUnmerge(ws, 'A37:A38')

  if (totalCount > DETAIL_TEMPLATE_ROWS) {
    ws.duplicateRow(DETAIL_DATA_START_ROW + DETAIL_TEMPLATE_ROWS - 1, totalCount - DETAIL_TEMPLATE_ROWS, true)
  } else if (totalCount < DETAIL_TEMPLATE_ROWS) {
    ws.spliceRows(DETAIL_DATA_START_ROW + totalCount, DETAIL_TEMPLATE_ROWS - totalCount)
  }

  let row = DETAIL_DATA_START_ROW
  grouped.forEach(g => {
    const startRow = row
    g.items.forEach(item => {
      const personnel = personnelOf(item, building.adjustmentFactor)
      ws.getCell(`B${row}`).value = item.equipment.name
      ws.getCell(`F${row}`).value = item.equipment.unit
      ws.getCell(`G${row}`).value = personnel
      ws.getCell(`H${row}`).value = personnel * building.wageRate
      safeMerge(ws, `B${row}:E${row}`)
      row += 1
    })
    const endRow = row - 1
    ws.getCell(`A${startRow}`).value = CATEGORY_LABELS[g.category]
    if (endRow > startRow) safeMerge(ws, `A${startRow}:A${endRow}`)
  })

  const totalRow = DETAIL_DATA_START_ROW + totalCount
  ws.getCell(`A${totalRow}`).value = '전체'
  ws.getCell(`B${totalRow}`).value = `${totalCount}건`
  safeMerge(ws, `B${totalRow}:F${totalRow}`)
  ws.getCell(`G${totalRow}`).value = totalPersonnel
  ws.getCell(`H${totalRow}`).value = directLaborCost
}

export async function buildEstimateWorkbook(
  building: Building,
  company: CompanyInfo,
  recipient: string,
  issueDate: string,
): Promise<Workbook> {
  const res = await fetch(estimateTemplateUrl)
  const buf = await res.arrayBuffer()
  const wb = new Workbook()
  await wb.xlsx.load(buf)
  wb.calcProperties.fullCalcOnLoad = true

  const items = getCheckedItems(building)
  const directLaborCost = items.reduce((sum, it) => sum + personnelOf(it, building.adjustmentFactor) * building.wageRate, 0)
  const totalPersonnel = items.reduce((sum, it) => sum + personnelOf(it, building.adjustmentFactor), 0)
  const directExpense = building.directCost.travel + building.directCost.vehicle + building.directCost.fieldExpense
  const count = countCheckedInspections(building.inspectionSchedule)
  const cost = calcCostBreakdown(directLaborCost, directExpense, building.overheadRate, building.techFeeRate, building.discountRate, count)
  const perInstanceTotal = directLaborCost + directExpense + cost.overheadCost + cost.techFee

  const estimateSheet = wb.getWorksheet('견적서')
  const detailSheet = wb.getWorksheet('세부내역')
  if (!estimateSheet || !detailSheet) throw new Error('견적서 양식 파일의 시트 구조가 올바르지 않습니다.')

  fillEstimateSheet(estimateSheet, building, company, recipient, issueDate, perInstanceTotal)
  fillDetailSheet(detailSheet, building, items, directLaborCost, totalPersonnel, directExpense, cost.overheadCost, cost.techFee)

  return wb
}

export async function downloadEstimateXlsx(
  building: Building,
  company: CompanyInfo,
  recipient: string,
  issueDate: string,
): Promise<void> {
  const wb = await buildEstimateWorkbook(building, company, recipient, issueDate)

  const outBuf = await wb.xlsx.writeBuffer()
  const blob = new Blob([outBuf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `견적서_${building.name}_${issueDate}.xlsx`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
