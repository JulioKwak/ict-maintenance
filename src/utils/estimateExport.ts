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
const DETAIL_TEMPLATE_ROWS = 4 // 샘플 양식엔 통신/방송/정보/기타 각 1건씩 예시 행만 있음(21~24행), 25행이 합계

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
  totalCost: number,
) {
  ws.getCell('A3').value = building.companyName
  ws.getCell('C6').value = recipient
  ws.getCell('C7').value = '한국전파진흥협회'
  ws.getCell('C8').value = issueDate

  ws.getCell('C9').value = `   정보통신설비 유지관리 및 성능 점검(${building.address})`

  ws.getCell('E5').value = `   사업자번호 : ${company.businessNumber} / 대 표 : ${company.representativeName} (인)`
  const companyAddressCell = ws.getCell('E6')
  companyAddressCell.value = `   주소 : ${company.address}`
  // 주의: cell.alignment = {...}는 내부적으로 shared style 객체를 직접 변형(mutate)해서
  // 같은 서식을 공유하는 다른 셀에도 영향을 줄 수 있다. cell.style 전체를 새 객체로 교체해 회피한다.
  companyAddressCell.style = {
    ...companyAddressCell.style,
    alignment: { ...companyAddressCell.alignment, wrapText: false, shrinkToFit: true },
  }
  ws.getCell('E7').value = `   연락처 : ${company.phone}`
  ws.getCell('E8').value = `   e-mail : ${company.email}`
  ws.getCell('G25').value = building.discountRate / 100

  // 합계(G28)·금액(C10)은 템플릿에 천원 단위 이하 절사(ROUNDDOWN(...,-3)) 수식이 걸려 있지만,
  // 수식은 Excel이 다시 계산해줘야 값이 갱신되므로 재계산 없이 열어도 맞게 보이도록 직접 절사한 값을 넣는다.
  const truncatedTotal = Math.floor(totalCost / 1000) * 1000
  ws.getCell('G28').value = truncatedTotal
  ws.getCell('C10').value = truncatedTotal

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
const originalTotalRow = DETAIL_DATA_START_ROW + DETAIL_TEMPLATE_ROWS // 원본 템플릿의 "전체" 합계 행(25) — 통신/방송/정보/기타 각 1건 예시(21~24) 다음 행

  // exceljs는 duplicateRow/spliceRows로 행 수를 바꿔도 병합 범위를 따라가지 않고 원래 좌표에 그대로 남겨둔다.
  // 병합된 채로 행을 복제/삭제하면 값이 인접 셀에 그대로 복사되거나(예: B24:E24 → 새 행에 텍스트가 4칸 다 채워짐)
  // 옛 병합 좌표가 새 데이터 행과 겹쳐 재병합이 조용히 실패하는 문제가 생기므로, 리사이즈 전에 관련 병합을 모두 해제한다.
  // (unMergeCells는 마스터가 아닌 셀의 채우기색 등 스타일도 초기화해버리므로, 리사이즈 후 되돌릴 수 있게 스타일을 미리 캡처해둔다.)
  const categoryLabelStyle = { ...ws.getCell(`A${DETAIL_DATA_START_ROW}`).style }
  const dataCellStyle = {
    B: { ...ws.getCell(`B${DETAIL_DATA_START_ROW}`).style },
    F: { ...ws.getCell(`F${DETAIL_DATA_START_ROW}`).style },
    G: { ...ws.getCell(`G${DETAIL_DATA_START_ROW}`).style },
    H: { ...ws.getCell(`H${DETAIL_DATA_START_ROW}`).style },
  }
  const totalRowStyle = {
    A: { ...ws.getCell(`A${originalTotalRow}`).style },
    B: { ...ws.getCell(`B${originalTotalRow}`).style },
    G: { ...ws.getCell(`G${originalTotalRow}`).style },
    H: { ...ws.getCell(`H${originalTotalRow}`).style },
  }

  // 샘플 양식은 통신/방송/정보/기타 각 1행씩만 예시로 담고 있어 카테고리별 세로 병합이 애초에 없다.
  // (실제 데이터에서 한 카테고리가 여러 건이면 아래 쓰기 루프에서 그때그때 병합을 새로 건다.)
  for (let r = DETAIL_DATA_START_ROW; r < originalTotalRow; r += 1) safeUnmerge(ws, `B${r}:E${r}`)
  safeUnmerge(ws, `B${originalTotalRow}:F${originalTotalRow}`)

  // 행이 늘어날 때는 duplicateRow로 물리적으로 행을 추가한다(정상 동작 확인됨).
  // 반대로 줄어들 때는 exceljs의 spliceRows가 삭제 대상 행을 온전히 지우지 못하고
  // 옛 내용을 꼬리에 남기는 버그가 있어(실측 확인), 행을 삭제하는 대신 남는 뒷부분을
  // 아래에서 직접 비우는 방식으로 우회한다.
  if (totalCount > DETAIL_TEMPLATE_ROWS) {
    ws.duplicateRow(DETAIL_DATA_START_ROW + DETAIL_TEMPLATE_ROWS - 1, totalCount - DETAIL_TEMPLATE_ROWS, true)
  }

  let row = DETAIL_DATA_START_ROW
  grouped.forEach(g => {
    const startRow = row
    g.items.forEach(item => {
      const personnel = personnelOf(item, building.adjustmentFactor)
      const bCell = ws.getCell(`B${row}`)
      const fCell = ws.getCell(`F${row}`)
      const gCell = ws.getCell(`G${row}`)
      const hCell = ws.getCell(`H${row}`)
      bCell.value = item.equipment.name
      fCell.value = `${item.quantity}${item.equipment.unit}`
      gCell.value = personnel
      hCell.value = personnel * building.wageRate
      bCell.style = dataCellStyle.B
      fCell.style = dataCellStyle.F
      gCell.style = dataCellStyle.G
      hCell.style = dataCellStyle.H
      safeMerge(ws, `B${row}:E${row}`)
      row += 1
    })
    const endRow = row - 1
    const labelCell = ws.getCell(`A${startRow}`)
    labelCell.value = CATEGORY_LABELS[g.category]
    labelCell.style = categoryLabelStyle
    if (endRow > startRow) safeMerge(ws, `A${startRow}:A${endRow}`)
  })

  const totalRow = DETAIL_DATA_START_ROW + totalCount
  const totalA = ws.getCell(`A${totalRow}`)
  const totalB = ws.getCell(`B${totalRow}`)
  const totalG = ws.getCell(`G${totalRow}`)
  const totalH = ws.getCell(`H${totalRow}`)
  totalA.value = '전체'
  totalB.value = `${totalCount}건`
  totalG.value = totalPersonnel
  totalH.value = directLaborCost
  totalA.style = totalRowStyle.A
  totalB.style = totalRowStyle.B
  totalG.style = totalRowStyle.G
  totalH.style = totalRowStyle.H
  safeMerge(ws, `B${totalRow}:F${totalRow}`)

  // 체크된 설비가 템플릿 기본 4행(카테고리당 예시 1건)보다 적을 때 남는 뒷부분(옛 데이터 행 + 옛 합계 행 자리)은
  // 테두리·채우기색·글자까지 전부 없는 완전히 빈 셀이어야 한다.
  // 주의: cell.fill = {...}/cell.border = {...}는 shared style 객체를 직접 변형해 같은 서식을 공유하는
  // 다른 셀(예: 헤더 행)까지 오염시킬 수 있으므로, cell.style 전체를 새 객체로 교체하는 방식으로 처리한다.
  for (let r = totalRow + 1; r <= originalTotalRow; r += 1) {
    ['A', 'B', 'F', 'G', 'H'].forEach(col => {
      const cell = ws.getCell(`${col}${r}`)
      cell.value = null
      cell.style = { ...cell.style, fill: { type: 'pattern', pattern: 'none' }, border: {} }
    })
  }

  // 인쇄 영역이 템플릿 기본값(A1:H26, 합계 행 다음 한 줄까지)으로 고정돼 있어, 표가
  // 그보다 늘어나면 뒷부분이 인쇄/미리보기 레이아웃 밖으로 잘려나간다. 실제 합계 행
  // 위치에 맞춰 매번 다시 계산한다.
  ws.pageSetup.printArea = `A1:H${totalRow + 1}`
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

  fillEstimateSheet(estimateSheet, building, company, recipient, issueDate, perInstanceTotal, cost.totalCost)
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
