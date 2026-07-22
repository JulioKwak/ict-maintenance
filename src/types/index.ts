// 사용자 권한
export type UserRole = 'admin' | 'reviewer' | 'inspector'

// 사용자
export interface User {
  id: string
  username: string
  name: string
  phone: string
  email: string
  role: UserRole
  createdAt: string
}

// 기술자 등급
export type TechnicianGrade = '특급기술자' | '고급기술자' | '중급기술자' | '초급기술자'

// 기술자
export interface Technician {
  id: string
  name: string
  grade: TechnicianGrade
  phone: string
  email: string
  createdAt: string
}

// 연도별 기술자 등급 노임단가
export interface WageRateSet {
  year: number
  rates: Record<TechnicianGrade, number>
}

// 회사 정보
export interface CompanyInfo {
  representativeName: string
  address: string
  phone: string
  email: string
  businessNumber: string
  updatedAt: string
}

// 설비 카테고리
export type EquipmentCategory = '통신설비' | '방송설비' | '정보설비' | '기타설비'

// 대상 설비
export interface Equipment {
  id: string
  category: EquipmentCategory
  name: string
  unit: string
  standardPersonnel: number
  applyAdjustment: boolean
}

// 건축물 상태
export type BuildingStatus =
  | '등록'
  | '작성중'
  | '작성완료'
  | '점검표보완'
  | '검수중'
  | '검수완료'

// 건축물 등록 설비 (수량 포함)
export interface BuildingEquipment {
  equipmentId: string
  quantity: number
  checked: boolean
}

// 연간 청구되는 점검 항목 구성 (대가산정 시 횟수 산출에 사용)
export interface InspectionSchedule {
  maintenanceH1: boolean  // 유지관리점검 상반기
  maintenanceH2: boolean  // 유지관리점검 하반기
  performance: boolean    // 성능점검
}

// 건축물
export interface Building {
  id: string
  companyName: string
  name: string
  address: string
  floorArea: number
  technicianGrade: TechnicianGrade
  wageRate: number
  adjustmentFactor: number
  assignedTechnicianId?: string
  equipment: BuildingEquipment[]
  directCost: {
    travel: number
    vehicle: number
    fieldExpense: number
  }
  overheadRate: number
  techFeeRate: number
  discountRate: number
  inspectionSchedule: InspectionSchedule
  totalCost: number
  status: BuildingStatus
  createdAt: string
  updatedAt: string
}

// 점검 유형
export type InspectionType = '기능점검' | '성능점검'

// 점검 결과
export type InspectionResult = '적합' | '부적합' | '해당없음' | ''

// 점검 위치 항목
export interface InspectionLocation {
  id: string
  location: string
  result: InspectionResult
  deficiency: string
  opinion: string
  photos: InspectionPhoto[]
}

// 점검 사진
export interface InspectionPhoto {
  id: string
  dataUrl: string
  caption: string
}

// 점검 항목 (설비별)
export interface InspectionItem {
  id: string
  equipmentId: string
  subCategory: string
  range: string
  content: string
  method?: string[] // 점검 방법(무엇을, 어떻게 확인해야 하는지). 기존 점검표에는 없을 수 있어 optional.
  locations: InspectionLocation[]
}

// 점검표 상태
export type InspectionFormStatus =
  | '작성중'
  | '작성완료'
  | '점검표보완'
  | '검수중'
  | '검수완료'

// 설비별 검수 결과
export type EquipmentReviewResult = '보완' | '검수완료' | ''

// 설비별 검수 의견/보완 사유
export interface EquipmentReview {
  result: EquipmentReviewResult
  note: string
}

// 점검표
export interface InspectionForm {
  id: string
  buildingId: string
  inspectionType: InspectionType
  inspectionDate: string
  items: InspectionItem[]
  status: InspectionFormStatus
  reviewNote: string
  equipmentReviews: Record<string, EquipmentReview>
  assignedInspectorIds: string[]
  createdBy: string
  createdAt: string
  updatedAt: string
}

// 대가산정 계산 결과
export interface CostCalculation {
  directLaborCost: number
  directExpense: number
  overheadCost: number
  techFee: number
  supplyPrice: number
  discountAmount: number
  subtotal: number
  vat: number
  totalCost: number
}

// 자료실 파일
export interface ResourceFile {
  id: string
  filename: string
  size: number
  contentType: string
  uploadedBy: string
  createdAt: string
}
