import { useState, useEffect, useMemo, useCallback, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Minus, AlertCircle, CheckCircle2 } from 'lucide-react'
import {
  EQUIPMENT_LIST,
  WAGE_RATES,
  getTechnicianGrade,
  getAdjustmentFactor,
  calcDirectLaborCost,
} from '../data/equipment'
import { buildingsApi, techniciansApi } from '../utils/api'
import type { Building, Technician, TechnicianGrade, EquipmentCategory } from '../types'

const CATEGORIES: EquipmentCategory[] = ['통신설비', '방송설비', '정보설비', '기타설비']

export default function BuildingRegister() {
  const navigate = useNavigate()
  const [technicians, setTechnicians] = useState<Technician[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    techniciansApi.getAll().then(setTechnicians).catch(() => {})
  }, [])

  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [floorArea, setFloorArea] = useState('')
  const [floorAreaError, setFloorAreaError] = useState('')
  const [assignedTechnicianId, setAssignedTechnicianId] = useState('')

  // 설비 체크 및 수량
  const [checkedEquipment, setCheckedEquipment] = useState<Record<string, boolean>>({})
  const [equipmentQty, setEquipmentQty] = useState<Record<string, number>>({})

  // 직접경비
  const [travel, setTravel] = useState('')
  const [vehicle, setVehicle] = useState('')
  const [fieldExpense, setFieldExpense] = useState('')

  // 제경비율, 기술료율
  const [overheadRate, setOverheadRate] = useState(110)
  const [techFeeRate, setTechFeeRate] = useState(20)

  const area = parseFloat(floorArea) || 0
  const techGrade = area >= 5000 ? (getTechnicianGrade(area) as TechnicianGrade) : ''
  const adjustFactor = area >= 5000 ? getAdjustmentFactor(area) : 0
  const wageRate = techGrade ? WAGE_RATES[techGrade] : 0

  const selectedEquipmentItems = useMemo(() => {
    return EQUIPMENT_LIST
      .filter(eq => checkedEquipment[eq.id])
      .map(eq => ({ equipment: eq, quantity: equipmentQty[eq.id] || 1 }))
  }, [checkedEquipment, equipmentQty])

  const directLaborCost = useMemo(
    () => area >= 5000 ? calcDirectLaborCost(selectedEquipmentItems, adjustFactor, wageRate) : 0,
    [selectedEquipmentItems, adjustFactor, wageRate, area]
  )

  const directExpense = (parseFloat(travel) || 0) + (parseFloat(vehicle) || 0) + (parseFloat(fieldExpense) || 0)
  const overheadCost = Math.round(directLaborCost * overheadRate / 100)
  const techFee = Math.round((directLaborCost + overheadCost) * techFeeRate / 100)
  const vat = Math.round((directLaborCost + directExpense + overheadCost + techFee) * 0.1)
  const totalCost = Math.round(directLaborCost + directExpense + overheadCost + techFee + vat)

  const fmt = (n: number) => Math.round(n).toLocaleString('ko-KR') + '원'

  const handleFloorAreaChange = useCallback((val: string) => {
    setFloorArea(val)
    const n = parseFloat(val)
    if (val && !isNaN(n) && n < 5000) {
      setFloorAreaError('유지보수관리 대상 건축물이 아닙니다. (연면적 5,000㎡ 미만)')
    } else {
      setFloorAreaError('')
    }
  }, [])

  const handleFloorAreaBlur = useCallback(() => {
    if (floorAreaError) {
      setFloorArea('')
      setFloorAreaError('')
    }
  }, [floorAreaError])

  const toggleEquipment = (id: string) => {
    setCheckedEquipment(prev => ({ ...prev, [id]: !prev[id] }))
    if (!checkedEquipment[id]) {
      setEquipmentQty(prev => ({ ...prev, [id]: 1 }))
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!name || !address || area < 5000 || !assignedTechnicianId) return

    const buildingData: Omit<Building, 'id' | 'createdAt' | 'updatedAt'> = {
      name,
      address,
      floorArea: area,
      technicianGrade: techGrade as TechnicianGrade,
      wageRate,
      adjustmentFactor: adjustFactor,
      assignedTechnicianId: assignedTechnicianId || undefined,
      equipment: EQUIPMENT_LIST
        .filter(eq => checkedEquipment[eq.id])
        .map(eq => ({
          equipmentId: eq.id,
          quantity: equipmentQty[eq.id] || 1,
          checked: true,
        })),
      directCost: {
        travel: parseFloat(travel) || 0,
        vehicle: parseFloat(vehicle) || 0,
        fieldExpense: parseFloat(fieldExpense) || 0,
      },
      overheadRate,
      techFeeRate,
      totalCost,
      status: '등록',
    }

    setSaving(true)
    try {
      await buildingsApi.create(buildingData)
      navigate('/buildings')
    } catch (err) {
      alert(err instanceof Error ? err.message : '등록 중 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl space-y-6">
      {/* 기본정보 */}
      <div className="card">
        <h2 className="font-semibold text-gray-800 mb-4 pb-2 border-b">기본 정보</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">건축물명 <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="input-field"
              placeholder="건축물명을 입력하세요"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">주소 <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={address}
              onChange={e => setAddress(e.target.value)}
              className="input-field"
              placeholder="건축물 주소를 입력하세요"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              연면적 (㎡) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={floorArea}
              onChange={e => handleFloorAreaChange(e.target.value)}
              onBlur={handleFloorAreaBlur}
              className={`input-field ${floorAreaError ? 'border-red-400' : ''}`}
              placeholder="연면적을 입력하세요"
              min="0"
            />
            {floorAreaError && (
              <div className="flex items-center gap-1.5 mt-1.5 text-red-600">
                <AlertCircle size={14} />
                <span className="text-xs">{floorAreaError}</span>
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">담당 기술자 <span className="text-red-500">*</span></label>
            <select
              value={assignedTechnicianId}
              onChange={e => setAssignedTechnicianId(e.target.value)}
              className="input-field"
              required
            >
              <option value="">기술자를 선택하세요</option>
              {technicians.map(t => (
                <option key={t.id} value={t.id}>{t.name} ({t.grade})</option>
              ))}
            </select>
          </div>
        </div>

        {/* 자동산정 결과 */}
        {area >= 5000 && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg flex flex-wrap gap-6 text-sm">
            <div>
              <span className="text-gray-500">기술자 등급:</span>
              <span className="ml-2 font-semibold text-blue-700">{techGrade}</span>
            </div>
            <div>
              <span className="text-gray-500">노임단가:</span>
              <span className="ml-2 font-semibold text-blue-700">{wageRate.toLocaleString()}원</span>
            </div>
            <div>
              <span className="text-gray-500">연면적 조정계수:</span>
              <span className="ml-2 font-semibold text-blue-700">{adjustFactor}</span>
            </div>
          </div>
        )}
      </div>

      {/* 대상설비 선택 */}
      <div className="card">
        <h2 className="font-semibold text-gray-800 mb-4 pb-2 border-b">대상 설비 선택</h2>
        {CATEGORIES.map(cat => (
          <div key={cat} className="mb-5">
            <h3 className="text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wide">{cat}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {EQUIPMENT_LIST.filter(eq => eq.category === cat).map(eq => (
                <div
                  key={eq.id}
                  className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${
                    checkedEquipment[eq.id]
                      ? 'border-blue-400 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => toggleEquipment(eq.id)}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                      checkedEquipment[eq.id] ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                    }`}>
                      {checkedEquipment[eq.id] && <CheckCircle2 size={12} className="text-white" />}
                    </div>
                    <span className="text-sm text-gray-800">{eq.name}</span>
                  </div>
                  {checkedEquipment[eq.id] && !eq.applyAdjustment && (
                    <div className="flex items-center gap-1.5 ml-2" onClick={e => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => setEquipmentQty(prev => ({ ...prev, [eq.id]: Math.max(1, (prev[eq.id] || 1) - 1) }))}
                        className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="text-sm font-medium w-8 text-center">{equipmentQty[eq.id] || 1}</span>
                      <button
                        type="button"
                        onClick={() => setEquipmentQty(prev => ({ ...prev, [eq.id]: (prev[eq.id] || 1) + 1 }))}
                        className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300"
                      >
                        <Plus size={12} />
                      </button>
                      <span className="text-xs text-gray-500">{eq.unit}</span>
                    </div>
                  )}
                  {checkedEquipment[eq.id] && eq.applyAdjustment && (
                    <span className="text-xs text-gray-400 ml-2">1식</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* 대가산정 */}
      <div className="card">
        <h2 className="font-semibold text-gray-800 mb-4 pb-2 border-b">대가산정</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">여비 (원)</label>
            <input
              type="number"
              value={travel}
              onChange={e => setTravel(e.target.value)}
              className="input-field"
              placeholder="직접 입력"
              min="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">차량운행비 (원)</label>
            <input
              type="number"
              value={vehicle}
              onChange={e => setVehicle(e.target.value)}
              className="input-field"
              placeholder="직접 입력"
              min="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">현장소요경비 (원)</label>
            <input
              type="number"
              value={fieldExpense}
              onChange={e => setFieldExpense(e.target.value)}
              className="input-field"
              placeholder="직접 입력"
              min="0"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              제경비율 ({overheadRate}%)
            </label>
            <input
              type="range"
              min={110}
              max={120}
              step={1}
              value={overheadRate}
              onChange={e => setOverheadRate(Number(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>110%</span><span>115%</span><span>120%</span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              기술료율 ({techFeeRate}%)
            </label>
            <input
              type="range"
              min={20}
              max={40}
              step={1}
              value={techFeeRate}
              onChange={e => setTechFeeRate(Number(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>20%</span><span>30%</span><span>40%</span>
            </div>
          </div>
        </div>

        {/* 산출 내역 */}
        <div className="bg-[#f5f5f7] rounded-[11px] p-4 text-sm space-y-2">
          <CostRow label="직접인건비" value={fmt(Math.round(directLaborCost))} />
          <CostRow label="직접경비" value={fmt(Math.round(directExpense))} sub="여비 + 차량운행비 + 현장소요경비" />
          <CostRow label={`제경비 (${overheadRate}%)`} value={fmt(overheadCost)} />
          <CostRow label={`기술료 (${techFeeRate}%)`} value={fmt(techFee)} />
          <CostRow label="부가가치세 (10%)" value={fmt(vat)} />
          <div className="border-t pt-2 mt-2 flex justify-between">
            <span className="font-bold text-gray-900">총 대가</span>
            <span className="font-bold text-blue-700 text-base">{fmt(totalCost)}</span>
          </div>
        </div>
      </div>

      {/* 등록 버튼 */}
      <div className="flex gap-3">
        <button type="submit" className="btn-primary px-8 disabled:opacity-60" disabled={saving}>
          {saving ? '등록 중...' : '건축물 등록'}
        </button>
        <button type="button" onClick={() => navigate('/buildings')} className="btn-secondary px-8">취소</button>
      </div>
    </form>
  )
}

function CostRow({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex justify-between items-start">
      <div>
        <span className="text-gray-700">{label}</span>
        {sub && <p className="text-xs text-gray-400">{sub}</p>}
      </div>
      <span className="text-gray-900 font-medium">{value}</span>
    </div>
  )
}
