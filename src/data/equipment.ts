import type { Equipment, EquipmentCategory, TechnicianGrade, WageRateSet, CostCalculation, InspectionSchedule } from '../types'

// 설비 카테고리별 색상 (AI 생성 메뉴의 설비 카테고리 선택 색상과 통일)
export const CATEGORY_COLORS: Record<EquipmentCategory, { bg: string; text: string; border: string }> = {
  통신설비: { bg: '#e8f0fa', text: '#0066cc', border: '#0066cc' },
  방송설비: { bg: '#e8f5ee', text: '#00aa44', border: '#00aa44' },
  정보설비: { bg: '#fff4ec', text: '#ff6600', border: '#ff6600' },
  기타설비: { bg: '#f0eaf5', text: '#7700cc', border: '#7700cc' },
}

export const EQUIPMENT_LIST: Equipment[] = [
  // 통신설비
  { id: 'comm-01', category: '통신설비', name: '케이블설비', unit: '식', standardPersonnel: 0.29, applyAdjustment: true },
  { id: 'comm-02', category: '통신설비', name: '배관설비', unit: '식', standardPersonnel: 0.58, applyAdjustment: true },
  { id: 'comm-03', category: '통신설비', name: '국선인입설비', unit: '식', standardPersonnel: 0.17, applyAdjustment: true },
  { id: 'comm-04', category: '통신설비', name: '단자함설비', unit: '식', standardPersonnel: 0.24, applyAdjustment: true },
  { id: 'comm-05', category: '통신설비', name: '이동통신구내선로설비', unit: '식', standardPersonnel: 0.06, applyAdjustment: true },
  { id: 'comm-06', category: '통신설비', name: '전화설비', unit: '식', standardPersonnel: 0.10, applyAdjustment: true },
  { id: 'comm-07', category: '통신설비', name: '방송 공동수신 안테나 시설', unit: '식', standardPersonnel: 0.89, applyAdjustment: true },
  { id: 'comm-08', category: '통신설비', name: '종합유선방송 구내전송선로설비', unit: '식', standardPersonnel: 0.52, applyAdjustment: true },
  // 방송설비
  { id: 'broad-01', category: '방송설비', name: '방송음향설비', unit: '식', standardPersonnel: 0.50, applyAdjustment: true },
  // 정보설비
  { id: 'info-01', category: '정보설비', name: '네트워크설비', unit: '식', standardPersonnel: 1.85, applyAdjustment: true },
  { id: 'info-02', category: '정보설비', name: '전자출입(통제)시스템', unit: '식', standardPersonnel: 0.83, applyAdjustment: true },
  { id: 'info-03', category: '정보설비', name: '원격검침시스템', unit: '식', standardPersonnel: 0.52, applyAdjustment: true },
  { id: 'info-04', category: '정보설비', name: '주차관제시스템', unit: '식', standardPersonnel: 2.45, applyAdjustment: true },
  { id: 'info-05', category: '정보설비', name: '주차유도시스템', unit: '식', standardPersonnel: 0.66, applyAdjustment: true },
  { id: 'info-06', category: '정보설비', name: '무인택배시스템', unit: '식', standardPersonnel: 0.77, applyAdjustment: true },
  { id: 'info-07', category: '정보설비', name: '비상벨설비', unit: '식', standardPersonnel: 0.44, applyAdjustment: true },
  { id: 'info-08', category: '정보설비', name: '영상정보처리기기 시스템', unit: '식', standardPersonnel: 0.81, applyAdjustment: true },
  { id: 'info-09', category: '정보설비', name: '홈네트워크 설비(전유부분)', unit: '세대', standardPersonnel: 0.03, applyAdjustment: false },
  { id: 'info-10', category: '정보설비', name: '빌딩안내시스템(BIS)', unit: '식', standardPersonnel: 1.69, applyAdjustment: true },
  { id: 'info-11', category: '정보설비', name: '전기시계시스템', unit: '식', standardPersonnel: 0.46, applyAdjustment: true },
  { id: 'info-12', category: '정보설비', name: '통합 SI시스템', unit: '식', standardPersonnel: 0.46, applyAdjustment: true },
  { id: 'info-13', category: '정보설비', name: '시설관리시스템(Facility Management System)', unit: '식', standardPersonnel: 0.54, applyAdjustment: true },
  { id: 'info-14', category: '정보설비', name: '건물에너지관리시스템(BEMS)', unit: '식', standardPersonnel: 0.76, applyAdjustment: true },
  { id: 'info-15', category: '정보설비', name: '지능형 인원계수 시스템', unit: '식', standardPersonnel: 0.56, applyAdjustment: true },
  { id: 'info-16', category: '정보설비', name: '지능형 경계 감시 시스템', unit: '식', standardPersonnel: 0.80, applyAdjustment: false },
  { id: 'info-17', category: '정보설비', name: '스마트 병원 설비(의료용 너스콜)', unit: '식', standardPersonnel: 2.12, applyAdjustment: true },
  { id: 'info-18', category: '정보설비', name: '스마트 도난방지 시스템', unit: '식', standardPersonnel: 0.17, applyAdjustment: true },
  { id: 'info-19', category: '정보설비', name: '스마트 공장 시스템', unit: '식', standardPersonnel: 0.31, applyAdjustment: true },
  { id: 'info-20', category: '정보설비', name: '스마트 도서관 시스템', unit: '개소', standardPersonnel: 0.52, applyAdjustment: false },
  { id: 'info-21', category: '정보설비', name: '지능형 이상음원 시스템', unit: '개소', standardPersonnel: 0.64, applyAdjustment: false },
  { id: 'info-22', category: '정보설비', name: 'IoT기반 지하공간 안전관리 시스템', unit: '개소', standardPersonnel: 0.13, applyAdjustment: false },
  { id: 'info-23', category: '정보설비', name: '디지털 사이니지', unit: '개소', standardPersonnel: 0.56, applyAdjustment: false },
  // 기타설비
  { id: 'etc-01', category: '기타설비', name: '통신용 전원설비', unit: '식', standardPersonnel: 1.66, applyAdjustment: true },
  { id: 'etc-02', category: '기타설비', name: '통신접지설비', unit: '식', standardPersonnel: 0.12, applyAdjustment: true },
]

// 연도별 노임단가 중 기준 연도 이하 가장 최근 값을 찾는다(해당 연도 단가가 아직 등록되지 않았으면 이전 연도 값을 그대로 적용).
export function resolveWageRates(sets: WageRateSet[], year: number): Record<TechnicianGrade, number> | null {
  const candidates = sets.filter(s => s.year <= year).sort((a, b) => b.year - a.year)
  return candidates[0]?.rates ?? null
}

// 연면적에 따른 기술자 등급 결정
export function getTechnicianGrade(floorArea: number): string {
  if (floorArea >= 60000) return '특급기술자'
  if (floorArea >= 30000) return '고급기술자'
  if (floorArea >= 15000) return '중급기술자'
  return '초급기술자'
}

// 기술자 등급 우선순위(숫자가 클수록 상위 등급)
export const TECHNICIAN_GRADE_RANK: Record<string, number> = {
  '초급기술자': 1,
  '중급기술자': 2,
  '고급기술자': 3,
  '특급기술자': 4,
}

// 기술자 등급(grade)이 연면적 기준 최소 요구 등급(minGrade) 이상인지 확인
export function meetsGradeRequirement(grade: string, minGrade: string): boolean {
  return (TECHNICIAN_GRADE_RANK[grade] ?? 0) >= (TECHNICIAN_GRADE_RANK[minGrade] ?? 0)
}

// 연면적 조정계수
export function getAdjustmentFactor(floorArea: number): number {
  if (floorArea >= 60000) return 2.80
  if (floorArea >= 55000) return 2.65
  if (floorArea >= 50000) return 2.50
  if (floorArea >= 45000) return 2.35
  if (floorArea >= 40000) return 2.20
  if (floorArea >= 35000) return 2.05
  if (floorArea >= 30000) return 1.90
  if (floorArea >= 25000) return 1.75
  if (floorArea >= 20000) return 1.60
  if (floorArea >= 15000) return 1.45
  if (floorArea >= 10000) return 1.30
  return 1.15
}

// 직접인건비 계산
export function calcDirectLaborCost(
  selectedEquipment: { equipment: Equipment; quantity: number }[],
  adjustmentFactor: number,
  wageRate: number
): number {
  return selectedEquipment.reduce((sum, { equipment, quantity }) => {
    if (equipment.applyAdjustment) {
      return sum + quantity * equipment.standardPersonnel * adjustmentFactor * wageRate
    } else {
      return sum + quantity * equipment.standardPersonnel * wageRate
    }
  }, 0)
}

// 대가산정 전체 내역 계산 (제경비 → 기술료 → 소계 → 할인 → 부가가치세 → 총 대가)
export function calcCostBreakdown(
  directLaborCost: number,
  directExpense: number,
  overheadRate: number,
  techFeeRate: number,
  discountRate: number,
  count: number = 1
): CostCalculation {
  const overheadCost = Math.round(directLaborCost * overheadRate / 100)
  const techFee = Math.round((directLaborCost + overheadCost) * techFeeRate / 100)
  const perInstanceTotal = directLaborCost + directExpense + overheadCost + techFee
  const supplyPrice = perInstanceTotal * count
  const discountAmount = Math.round(supplyPrice * discountRate / 100)
  const subtotal = supplyPrice - discountAmount
  const vat = Math.round(subtotal * 0.1)
  const totalCost = Math.round(subtotal + vat)
  return { directLaborCost, directExpense, overheadCost, techFee, supplyPrice, discountAmount, subtotal, vat, totalCost }
}

// 유지관리점검(상반기/하반기)/성능점검 중 체크된 항목 수 — 대가산정 시 공급가 계산의 "횟수"
export function countCheckedInspections(schedule: InspectionSchedule): number {
  return (schedule.maintenanceH1 ? 1 : 0) + (schedule.maintenanceH2 ? 1 : 0) + (schedule.performance ? 1 : 0)
}
