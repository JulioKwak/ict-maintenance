import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, Search, ChevronRight, Trash2, Download, ClipboardCheck, Plus, FileText, X, ClipboardList, Pencil } from 'lucide-react'
import { buildingsApi, inspectionsApi, techniciansApi, wageRatesApi, companyApi } from '../utils/api'
import { EQUIPMENT_LIST, CATEGORY_COLORS, calcDirectLaborCost, calcCostBreakdown, countCheckedInspections, getTechnicianGrade, getAdjustmentFactor, meetsGradeRequirement, resolveWageRates } from '../data/equipment'
import { onlyDigits, toMoneyDisplay } from '../utils/money'
import AddressSearchModal from '../components/AddressSearchModal'
import type { Building, BuildingStatus, Equipment, EquipmentCategory, InspectionForm, InspectionType, Technician, TechnicianGrade, WageRateSet } from '../types'
import PasswordConfirmModal from '../components/PasswordConfirmModal'
import EquipmentSelector from '../components/EquipmentSelector'
import AssignInspectorsModal from '../components/AssignInspectorsModal'
import { useAuth } from '../context/AuthContext'
import { canDelete } from '../utils/permissions'
import { INSPECTION_STATUS_STYLE } from '../utils/inspectionStatus'
import { format } from 'date-fns'
import { downloadEstimateXlsx } from '../utils/estimateExport'

const STATUS_LABELS: Record<BuildingStatus, string> = {
  등록: '등록', 작성중: '작성 중', 작성완료: '작성 완료', 점검표보완: '보완 필요', 검수중: '검수 중', 검수완료: '검수 완료',
}

const STATUS_COLORS: Record<BuildingStatus, string> = {
  등록: 'status-registered', 작성중: 'status-in-progress', 작성완료: 'status-completed',
  점검표보완: 'status-supplement', 검수중: 'status-review', 검수완료: 'status-approved',
}

export default function BuildingManagement() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [buildings, setBuildings] = useState<Building[]>([])
  const [allInspections, setAllInspections] = useState<InspectionForm[]>([])
  const [technicians, setTechnicians] = useState<Technician[]>([])
  const [wageRateSets, setWageRateSets] = useState<WageRateSet[]>([])
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<BuildingStatus | '전체'>('전체')

  // 새 점검표 모달
  const [showNewInspModal, setShowNewInspModal] = useState(false)
  const [newInspDate, setNewInspDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [newInspType, setNewInspType] = useState<InspectionType>('기능점검')
  const [newInspInspectorIds, setNewInspInspectorIds] = useState<string[]>([])
  const [showAssignModal, setShowAssignModal] = useState(false)

  // 비밀번호 확인 모달
  const [pwModal, setPwModal] = useState<{ open: boolean; title: string; onConfirm: () => Promise<void> }>({
    open: false, title: '', onConfirm: async () => {},
  })

  // 직접인건비 상세 팝업
  const [showLaborPopup, setShowLaborPopup] = useState(false)

  // 견적서 수정 팝업
  const [showEstimateEdit, setShowEstimateEdit] = useState(false)
  const [estimateForm, setEstimateForm] = useState({
    travel: '', vehicle: '', fieldExpense: '', overheadRate: 110, techFeeRate: 20, discountRate: 0,
    maintenanceH1: true, maintenanceH2: true, performance: true,
  })
  const [savingEstimate, setSavingEstimate] = useState(false)

  // 견적서 엑셀 다운로드 팝업 (수신자 입력)
  const [showEstimateExport, setShowEstimateExport] = useState(false)
  const [estimateExportForm, setEstimateExportForm] = useState({ recipient: '' })
  const [exportingEstimate, setExportingEstimate] = useState(false)

  // 등록 설비 수정
  const [editingEquipment, setEditingEquipment] = useState(false)
  const [editChecked, setEditChecked] = useState<Record<string, boolean>>({})
  const [editQty, setEditQty] = useState<Record<string, number>>({})
  const [savingEquipment, setSavingEquipment] = useState(false)

  // 건축물 수정 팝업 (기본 정보)
  const [showBuildingEdit, setShowBuildingEdit] = useState(false)
  const [showAddressSearchEdit, setShowAddressSearchEdit] = useState(false)
  const [buildingEditForm, setBuildingEditForm] = useState({
    companyName: '', name: '', address: '', floorArea: '', assignedTechnicianId: '',
  })
  const [savingBuildingEdit, setSavingBuildingEdit] = useState(false)

  useEffect(() => {
    buildingsApi.getAll().then(setBuildings).catch(() => {})
    wageRatesApi.getAll().then(setWageRateSets).catch(() => {})
    inspectionsApi.getAll().then(setAllInspections).catch(() => {})
    techniciansApi.getAll().then(setTechnicians).catch(() => {})
  }, [])

  useEffect(() => {
    setEditingEquipment(false)
  }, [selectedId])

  const filtered = useMemo(() => buildings.filter(b => {
    const matchSearch = b.name.includes(search) || b.address.includes(search)
    const matchStatus = statusFilter === '전체' || b.status === statusFilter
    return matchSearch && matchStatus
  }), [buildings, search, statusFilter])

  const selected = useMemo(() => buildings.find(b => b.id === selectedId) ?? null, [buildings, selectedId])
  const selectedInspections = useMemo(
    () => allInspections.filter(i => i.buildingId === selectedId).sort((a, b) => b.inspectionDate.localeCompare(a.inspectionDate)),
    [allInspections, selectedId]
  )

  // 건축물 수정 팝업 - 연면적 기준 파생값(건축물 등록 화면과 동일한 로직)
  const editArea = parseFloat(buildingEditForm.floorArea) || 0
  const editTechGrade = editArea >= 5000 ? (getTechnicianGrade(editArea) as TechnicianGrade) : ''
  const editAdjustFactor = editArea >= 5000 ? getAdjustmentFactor(editArea) : 0
  const editCurrentYearRates = resolveWageRates(wageRateSets, new Date().getFullYear())
  const editWageRate = editTechGrade && editCurrentYearRates ? editCurrentYearRates[editTechGrade] : 0
  const editEligibleTechnicians = useMemo(
    () => (editTechGrade ? technicians.filter(t => meetsGradeRequirement(t.grade, editTechGrade)) : technicians),
    [technicians, editTechGrade]
  )

  useEffect(() => {
    if (buildingEditForm.assignedTechnicianId && !editEligibleTechnicians.some(t => t.id === buildingEditForm.assignedTechnicianId)) {
      setBuildingEditForm(f => ({ ...f, assignedTechnicianId: '' }))
    }
  }, [editEligibleTechnicians, buildingEditForm.assignedTechnicianId])

  const openBuildingEdit = (building: Building) => {
    setBuildingEditForm({
      companyName: building.companyName ?? '',
      name: building.name,
      address: building.address,
      floorArea: String(building.floorArea),
      assignedTechnicianId: building.assignedTechnicianId ?? '',
    })
    setShowBuildingEdit(true)
  }

  const handleSaveBuildingEdit = async (building: Building) => {
    if (!buildingEditForm.name || !buildingEditForm.address || editArea < 5000 || !buildingEditForm.assignedTechnicianId) return

    const eqItems = building.equipment.filter(e => e.checked).map(be => ({
      equipment: EQUIPMENT_LIST.find(eq => eq.id === be.equipmentId),
      quantity: be.quantity,
    })).filter((x): x is { equipment: Equipment; quantity: number } => !!x.equipment)

    const directLaborCost = calcDirectLaborCost(eqItems, editAdjustFactor, editWageRate)
    const directExpense = building.directCost.travel + building.directCost.vehicle + building.directCost.fieldExpense
    const count = countCheckedInspections(building.inspectionSchedule ?? { maintenanceH1: true, maintenanceH2: true, performance: true })
    const { totalCost } = calcCostBreakdown(directLaborCost, directExpense, building.overheadRate, building.techFeeRate, building.discountRate ?? 0, count)

    setSavingBuildingEdit(true)
    try {
      const updated = await buildingsApi.update(building.id, {
        companyName: buildingEditForm.companyName,
        name: buildingEditForm.name,
        address: buildingEditForm.address,
        floorArea: editArea,
        technicianGrade: editTechGrade as TechnicianGrade,
        wageRate: editWageRate,
        adjustmentFactor: editAdjustFactor,
        assignedTechnicianId: buildingEditForm.assignedTechnicianId,
        totalCost,
      })
      setBuildings(prev => prev.map(b => (b.id === building.id ? updated : b)))
      setShowBuildingEdit(false)
    } catch (err) {
      alert(err instanceof Error ? err.message : '건축물 수정 중 오류가 발생했습니다.')
    } finally {
      setSavingBuildingEdit(false)
    }
  }

  const confirmDeleteBuilding = (building: Building) => {
    setPwModal({
      open: true,
      title: `"${building.name}" 건축물 삭제`,
      onConfirm: async () => {
        await buildingsApi.delete(building.id)
        setBuildings(prev => prev.filter(b => b.id !== building.id))
        if (selectedId === building.id) setSelectedId(null)
      },
    })
  }

  const startEditEquipment = (building: Building) => {
    const checked: Record<string, boolean> = {}
    const qty: Record<string, number> = {}
    building.equipment.filter(e => e.checked).forEach(e => {
      checked[e.equipmentId] = true
      qty[e.equipmentId] = e.quantity
    })
    setEditChecked(checked)
    setEditQty(qty)
    setEditingEquipment(true)
  }

  const cancelEditEquipment = () => setEditingEquipment(false)

  const saveEditEquipment = async (building: Building) => {
    const newEquipment = EQUIPMENT_LIST
      .filter(eq => editChecked[eq.id])
      .map(eq => ({ equipmentId: eq.id, quantity: editQty[eq.id] || 1, checked: true }))

    const eqItems = newEquipment
      .map(be => ({ equipment: EQUIPMENT_LIST.find(eq => eq.id === be.equipmentId), quantity: be.quantity }))
      .filter((x): x is { equipment: typeof EQUIPMENT_LIST[number]; quantity: number } => !!x.equipment)

    const directLaborCost = calcDirectLaborCost(eqItems, building.adjustmentFactor, building.wageRate)
    const directExpense = building.directCost.travel + building.directCost.vehicle + building.directCost.fieldExpense
    const count = countCheckedInspections(building.inspectionSchedule ?? { maintenanceH1: true, maintenanceH2: true, performance: true })
    const { totalCost } = calcCostBreakdown(directLaborCost, directExpense, building.overheadRate, building.techFeeRate, building.discountRate ?? 0, count)

    setSavingEquipment(true)
    try {
      const updated = await buildingsApi.update(building.id, { equipment: newEquipment, totalCost })
      setBuildings(prev => prev.map(b => (b.id === building.id ? updated : b)))
      setEditingEquipment(false)
    } catch (err) {
      alert(err instanceof Error ? err.message : '설비 수정 중 오류가 발생했습니다.')
    } finally {
      setSavingEquipment(false)
    }
  }

  const openEstimateEdit = (building: Building) => {
    setEstimateForm({
      travel: String(building.directCost.travel || ''),
      vehicle: String(building.directCost.vehicle || ''),
      fieldExpense: String(building.directCost.fieldExpense || ''),
      overheadRate: building.overheadRate,
      techFeeRate: building.techFeeRate,
      discountRate: building.discountRate ?? 0,
      maintenanceH1: building.inspectionSchedule?.maintenanceH1 ?? true,
      maintenanceH2: building.inspectionSchedule?.maintenanceH2 ?? true,
      performance: building.inspectionSchedule?.performance ?? true,
    })
    setShowEstimateEdit(true)
  }

  const handleSaveEstimate = async (building: Building) => {
    const eqItems = building.equipment.filter(e => e.checked).map(be => ({
      equipment: EQUIPMENT_LIST.find(eq => eq.id === be.equipmentId),
      quantity: be.quantity,
    })).filter((x): x is { equipment: Equipment; quantity: number } => !!x.equipment)

    const directLaborCost = calcDirectLaborCost(eqItems, building.adjustmentFactor, building.wageRate)
    const directCost = {
      travel: Number(estimateForm.travel) || 0,
      vehicle: Number(estimateForm.vehicle) || 0,
      fieldExpense: Number(estimateForm.fieldExpense) || 0,
    }
    const directExpense = directCost.travel + directCost.vehicle + directCost.fieldExpense
    const inspectionSchedule = {
      maintenanceH1: estimateForm.maintenanceH1,
      maintenanceH2: estimateForm.maintenanceH2,
      performance: estimateForm.performance,
    }
    const count = countCheckedInspections(inspectionSchedule)
    const { totalCost } = calcCostBreakdown(
      directLaborCost, directExpense, estimateForm.overheadRate, estimateForm.techFeeRate, estimateForm.discountRate, count
    )

    setSavingEstimate(true)
    try {
      const updated = await buildingsApi.update(building.id, {
        directCost,
        overheadRate: estimateForm.overheadRate,
        techFeeRate: estimateForm.techFeeRate,
        discountRate: estimateForm.discountRate,
        inspectionSchedule,
        totalCost,
      })
      setBuildings(prev => prev.map(b => (b.id === building.id ? updated : b)))
      setShowEstimateEdit(false)
    } catch (err) {
      alert(err instanceof Error ? err.message : '견적서 수정 중 오류가 발생했습니다.')
    } finally {
      setSavingEstimate(false)
    }
  }

  const confirmDeleteInspection = (insp: InspectionForm) => {
    setPwModal({
      open: true,
      title: `[${insp.inspectionType}] ${insp.inspectionDate} 점검표 삭제`,
      onConfirm: async () => {
        await inspectionsApi.delete(insp.id)
        setAllInspections(prev => prev.filter(i => i.id !== insp.id))
      },
    })
  }

  const openEstimateExport = () => {
    setEstimateExportForm({ recipient: '' })
    setShowEstimateExport(true)
  }

  const handleConfirmExport = async (building: Building) => {
    setExportingEstimate(true)
    try {
      const company = await companyApi.get()
      const issueDate = format(new Date(), 'yyyy-MM-dd')
      await downloadEstimateXlsx(building, company, estimateExportForm.recipient, issueDate)
      setShowEstimateExport(false)
    } catch (err) {
      alert(err instanceof Error ? err.message : '견적서 다운로드 중 오류가 발생했습니다.')
    } finally {
      setExportingEstimate(false)
    }
  }

  return (
    <>
      <div className="flex flex-col md:flex-row gap-4 md:gap-6 md:h-[calc(100vh-7rem)]">
        {/* ── 건축물 목록 ── */}
        <div className="w-full md:w-80 shrink-0 flex flex-col gap-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#7a7a7a' }} />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                className="input-field pl-9 text-sm" placeholder="건축물명, 주소 검색" />
            </div>
            <button onClick={() => navigate('/building-register')} className="btn-primary text-sm shrink-0">
              + 등록
            </button>
          </div>

          <div className="flex flex-wrap gap-1">
            {(['전체', '등록', '작성중', '작성완료', '점검표보완', '검수중', '검수완료'] as const).map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className="text-xs px-2.5 py-1 rounded-full border transition-colors"
                style={{
                  backgroundColor: statusFilter === s ? '#1d1d1f' : '#ffffff',
                  color: statusFilter === s ? '#ffffff' : '#333333',
                  borderColor: statusFilter === s ? '#1d1d1f' : '#e0e0e0',
                }}>
                {s}
              </button>
            ))}
          </div>

          <div className="overflow-y-auto flex-1 space-y-2">
            {filtered.length === 0 ? (
              <p className="text-sm text-center py-8" style={{ color: '#7a7a7a' }}>
                {buildings.length === 0 ? '등록된 건축물이 없습니다.' : '검색 결과가 없습니다.'}
              </p>
            ) : (
              filtered.map(b => (
                <button key={b.id} onClick={() => setSelectedId(b.id)}
                  className="w-full text-left p-3 rounded-[11px] border transition-all"
                  style={{
                    backgroundColor: selectedId === b.id ? 'rgba(0,102,204,0.05)' : '#ffffff',
                    borderColor: selectedId === b.id ? '#0066cc' : '#e0e0e0',
                  }}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: '#1d1d1f' }}>{b.name}</p>
                      <p className="text-xs truncate mt-0.5" style={{ color: '#7a7a7a' }}>{b.address}</p>
                      <p className="text-xs mt-0.5" style={{ color: '#7a7a7a' }}>
                        {b.floorArea.toLocaleString()}㎡
                        {b.createdAt && (
                          <span className="ml-2">· 등록 {new Date(b.createdAt).toLocaleDateString('ko-KR')}</span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className={STATUS_COLORS[b.status]}>{STATUS_LABELS[b.status]}</span>
                      <ChevronRight size={12} style={{ color: '#cccccc' }} />
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* ── 건축물 상세 ── */}
        <div className="flex-1 overflow-y-auto">
          {!selected ? (
            <div className="flex items-center justify-center h-full" style={{ color: '#7a7a7a' }}>
              <div className="text-center">
                <Building2 size={40} className="mx-auto mb-3 opacity-30" />
                <p>건축물을 선택하면 상세 정보를 확인할 수 있습니다.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4 max-w-3xl">
              {/* 기본 정보 */}
              <div className="card">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-bold" style={{ color: '#1d1d1f' }}>{selected.name}</h2>
                    <p className="text-sm mt-1" style={{ color: '#7a7a7a' }}>{selected.address}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0 ml-3">
                    <span className={STATUS_COLORS[selected.status]}>{STATUS_LABELS[selected.status]}</span>
                    {(() => {
                      const tech = technicians.find(t => t.id === selected.assignedTechnicianId)
                      return tech ? (
                        <span className="text-xs" style={{ color: '#7a7a7a' }}>
                          {tech.grade} · {tech.name}
                        </span>
                      ) : null
                    })()}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4" style={{ borderTop: '1px solid #f0f0f0' }}>
                  <InfoItem label="연면적" value={`${selected.floorArea.toLocaleString()}㎡`} />
                  <InfoItem label="기술자 등급" value={selected.technicianGrade} />
                  <InfoItem label="노임단가" value={`${selected.wageRate.toLocaleString()}원`} />
                  <InfoItem label="조정계수" value={String(selected.adjustmentFactor)} />
                </div>

                <div className="flex flex-wrap gap-2 mt-4">
                  <button
                    onClick={() => navigate(`/inspection-review?buildingId=${selected.id}`)}
                    className="btn-secondary text-sm flex items-center gap-1.5"
                  >
                    <ClipboardCheck size={14} />점검표 검수
                  </button>
                  <button onClick={() => openEstimateExport()} className="btn-secondary text-sm flex items-center gap-1.5">
                    <Download size={14} />견적서 엑셀
                  </button>
                  <button
                    onClick={() => openBuildingEdit(selected)}
                    className="btn-secondary text-sm flex items-center gap-1.5 ml-auto"
                  >
                    <Pencil size={14} />건축물 수정
                  </button>
                  {canDelete(user?.role) && (
                  <button
                    onClick={() => confirmDeleteBuilding(selected)}
                    className="btn-danger text-sm flex items-center gap-1.5"
                  >
                    <Trash2 size={14} />삭제
                  </button>
                  )}
                </div>
              </div>

              {/* 건축물 수정 팝업 */}
              {showBuildingEdit && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                  <div className="bg-white w-full max-w-lg max-h-[85vh] flex flex-col" style={{ borderRadius: '18px', border: '1px solid #e0e0e0' }}>
                    <div className="flex items-center justify-between p-5 shrink-0" style={{ borderBottom: '1px solid #f0f0f0' }}>
                      <h3 className="font-semibold" style={{ color: '#1d1d1f', fontSize: '15px' }}>건축물 수정</h3>
                      <button onClick={() => setShowBuildingEdit(false)} style={{ color: '#7a7a7a' }}><X size={20} /></button>
                    </div>
                    <div className="overflow-y-auto p-5 space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">회사명</label>
                        <input
                          type="text"
                          value={buildingEditForm.companyName}
                          onChange={e => setBuildingEditForm(f => ({ ...f, companyName: e.target.value }))}
                          className="input-field"
                          placeholder="발주처/고객사명을 입력하세요"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">건축물명 <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          value={buildingEditForm.name}
                          onChange={e => setBuildingEditForm(f => ({ ...f, name: e.target.value }))}
                          className="input-field"
                          placeholder="건축물명을 입력하세요"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">주소 <span className="text-red-500">*</span></label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={buildingEditForm.address}
                            onChange={e => setBuildingEditForm(f => ({ ...f, address: e.target.value }))}
                            className="input-field"
                            placeholder="건축물 주소를 입력하세요"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowAddressSearchEdit(true)}
                            className="btn-secondary text-sm px-3 shrink-0 flex items-center gap-1"
                          >
                            <Search size={14} />주소 검색
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">연면적 (㎡) <span className="text-red-500">*</span></label>
                        <input
                          type="number"
                          value={buildingEditForm.floorArea}
                          onChange={e => setBuildingEditForm(f => ({ ...f, floorArea: e.target.value }))}
                          className="input-field"
                          placeholder="연면적을 입력하세요 (예: 12345.67)"
                          min="0"
                          step="0.01"
                        />
                        {buildingEditForm.floorArea && editArea < 5000 && (
                          <div className="flex items-center gap-1.5 mt-1.5" style={{ color: '#ff3b30' }}>
                            <span className="text-xs">유지보수관리 대상 건축물이 아닙니다. (연면적 5,000㎡ 미만)</span>
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">담당 기술자 <span className="text-red-500">*</span></label>
                        <select
                          value={buildingEditForm.assignedTechnicianId}
                          onChange={e => setBuildingEditForm(f => ({ ...f, assignedTechnicianId: e.target.value }))}
                          className="input-field"
                          required
                        >
                          <option value="">기술자를 선택하세요</option>
                          {editEligibleTechnicians.map(t => (
                            <option key={t.id} value={t.id}>{t.name} ({t.grade})</option>
                          ))}
                        </select>
                        {editTechGrade && editEligibleTechnicians.length === 0 && (
                          <div className="flex items-center gap-1.5 mt-1.5" style={{ color: '#ff3b30' }}>
                            <span className="text-xs">연면적 기준({editTechGrade} 이상)을 충족하는 기술자가 없습니다.</span>
                          </div>
                        )}
                      </div>

                      {editArea >= 5000 && (
                        <div className="p-3 rounded-lg flex flex-wrap gap-6 text-sm" style={{ backgroundColor: 'rgba(0,102,204,0.06)' }}>
                          <div>
                            <span style={{ color: '#7a7a7a' }}>기술자 등급:</span>
                            <span className="ml-2 font-semibold" style={{ color: '#0066cc' }}>{editTechGrade}</span>
                          </div>
                          <div>
                            <span style={{ color: '#7a7a7a' }}>노임단가:</span>
                            <span className="ml-2 font-semibold" style={{ color: '#0066cc' }}>{editWageRate.toLocaleString()}원</span>
                          </div>
                          <div>
                            <span style={{ color: '#7a7a7a' }}>연면적 조정계수:</span>
                            <span className="ml-2 font-semibold" style={{ color: '#0066cc' }}>{editAdjustFactor}</span>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-3 p-5 shrink-0" style={{ borderTop: '1px solid #f0f0f0' }}>
                      <button
                        onClick={() => handleSaveBuildingEdit(selected)}
                        className="btn-primary flex-1 disabled:opacity-60"
                        disabled={savingBuildingEdit}
                      >
                        {savingBuildingEdit ? '저장 중...' : '저장'}
                      </button>
                      <button onClick={() => setShowBuildingEdit(false)} className="btn-secondary flex-1">취소</button>
                    </div>
                  </div>
                </div>
              )}

              <AddressSearchModal
                isOpen={showAddressSearchEdit}
                onClose={() => setShowAddressSearchEdit(false)}
                onSelect={addr => setBuildingEditForm(f => ({ ...f, address: addr }))}
              />

              {/* 등록 설비 */}
              <div className="card">
                <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="font-semibold" style={{ color: '#1d1d1f' }}>등록 설비</h3>
                    {!editingEquipment && (() => {
                      const checkedEq = selected.equipment
                        .filter(e => e.checked)
                        .map(be => EQUIPMENT_LIST.find(e => e.id === be.equipmentId))
                        .filter((e): e is Equipment => !!e)
                      const categoryCounts = checkedEq.reduce<Partial<Record<EquipmentCategory, number>>>((acc, eq) => {
                        acc[eq.category] = (acc[eq.category] ?? 0) + 1
                        return acc
                      }, {})
                      const presentCategories = Object.keys(categoryCounts) as EquipmentCategory[]
                      if (presentCategories.length === 0) return null
                      return (
                        <div className="flex items-center gap-2.5 flex-wrap">
                          {presentCategories.map(cat => (
                            <span key={cat} className="flex items-center gap-1 text-xs" style={{ color: '#7a7a7a' }}>
                              <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[cat].text }} />
                              {cat} ({categoryCounts[cat]})
                            </span>
                          ))}
                        </div>
                      )
                    })()}
                  </div>
                  {!editingEquipment && (
                    <button
                      onClick={() => startEditEquipment(selected)}
                      className="flex items-center gap-1 text-sm font-medium"
                      style={{ color: '#0066cc' }}
                    >
                      <Pencil size={14} />설비항목 수정
                    </button>
                  )}
                </div>

                {editingEquipment ? (
                  <>
                    <EquipmentSelector
                      checkedEquipment={editChecked}
                      equipmentQty={editQty}
                      onChange={(checked, qty) => { setEditChecked(checked); setEditQty(qty) }}
                    />
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => saveEditEquipment(selected)}
                        disabled={savingEquipment}
                        className="btn-primary text-sm disabled:opacity-60"
                      >
                        {savingEquipment ? '저장 중...' : '저장'}
                      </button>
                      <button onClick={cancelEditEquipment} disabled={savingEquipment} className="btn-secondary text-sm">
                        취소
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {selected.equipment.filter(e => e.checked).length === 0 ? (
                      <p className="text-sm" style={{ color: '#7a7a7a' }}>등록된 설비가 없습니다.</p>
                    ) : (
                      selected.equipment.filter(e => e.checked).map(be => {
                        const eq = EQUIPMENT_LIST.find(e => e.id === be.equipmentId)
                        const colors = eq ? CATEGORY_COLORS[eq.category] : CATEGORY_COLORS.기타설비
                        return (
                          <span key={be.equipmentId} className="text-xs px-2.5 py-1 rounded-full" style={{ backgroundColor: colors.bg, color: colors.text }}>
                            {eq?.name ?? be.equipmentId}
                            {!eq?.applyAdjustment && ` (${be.quantity}${eq?.unit})`}
                          </span>
                        )
                      })
                    )}
                  </div>
                )}
              </div>

              {/* 대가산정 요약 */}
              {(() => {
                const eqItems = selected.equipment.filter(e => e.checked).map(be => ({
                  equipment: EQUIPMENT_LIST.find(eq => eq.id === be.equipmentId)!,
                  quantity: be.quantity,
                })).filter(x => x.equipment)
                const directLaborCost = Math.round(calcDirectLaborCost(eqItems, selected.adjustmentFactor, selected.wageRate))
                const directExpense = selected.directCost.travel + selected.directCost.vehicle + selected.directCost.fieldExpense
                const schedule = selected.inspectionSchedule ?? { maintenanceH1: true, maintenanceH2: true, performance: true }
                const count = countCheckedInspections(schedule)
                const { overheadCost, techFee, supplyPrice, discountAmount, subtotal, vat } = calcCostBreakdown(
                  directLaborCost, directExpense, selected.overheadRate, selected.techFeeRate, selected.discountRate ?? 0, count
                )
                const totalPersonnel = eqItems.reduce((sum, { equipment, quantity }) => {
                  const personnel = equipment.applyAdjustment
                    ? quantity * equipment.standardPersonnel * selected.adjustmentFactor
                    : quantity * equipment.standardPersonnel
                  return sum + personnel
                }, 0)
                const fmt = (n: number) => Math.round(n).toLocaleString('ko-KR') + '원'
                return (
                  <div className="card">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold" style={{ color: '#1d1d1f' }}>대가산정 요약</h3>
                      <button
                        onClick={() => openEstimateEdit(selected)}
                        className="flex items-center gap-1 text-sm font-medium"
                        style={{ color: '#0066cc' }}
                      >
                        <Pencil size={14} />견적서 수정
                      </button>
                    </div>
                    <div className="text-sm space-y-0">
                      {[
                        { label: '직접인건비', value: fmt(directLaborCost), clickable: true },
                        { label: `직접경비 (여비 + 차량운행비 + 현장소요경비)`, value: fmt(directExpense) },
                        { label: `제경비 (${selected.overheadRate}%)`, value: fmt(overheadCost) },
                        { label: `기술료 (${selected.techFeeRate}%)`, value: fmt(techFee) },
                      ].map(({ label, value, clickable }) => (
                        <div key={label} className="flex justify-between items-center py-2" style={{ borderBottom: '1px solid #f0f0f0' }}>
                          {clickable ? (
                            <button
                              onClick={() => setShowLaborPopup(true)}
                              className="text-left underline decoration-dotted"
                              style={{ color: '#0066cc', fontSize: '14px' }}
                            >
                              {label}
                            </button>
                          ) : (
                            <span style={{ color: '#7a7a7a' }}>{label}</span>
                          )}
                          <span className="font-medium ml-4 shrink-0" style={{ color: '#1d1d1f' }}>{value}</span>
                        </div>
                      ))}
                      {schedule.maintenanceH1 && (
                        <div className="flex justify-between items-center py-2" style={{ borderBottom: '1px solid #f0f0f0' }}>
                          <span style={{ color: '#7a7a7a' }}>유지관리점검(상반기)</span>
                          <span className="font-medium ml-4 shrink-0" style={{ color: '#1d1d1f' }}>1회</span>
                        </div>
                      )}
                      {schedule.maintenanceH2 && (
                        <div className="flex justify-between items-center py-2" style={{ borderBottom: '1px solid #f0f0f0' }}>
                          <span style={{ color: '#7a7a7a' }}>유지관리점검(하반기)</span>
                          <span className="font-medium ml-4 shrink-0" style={{ color: '#1d1d1f' }}>1회</span>
                        </div>
                      )}
                      {schedule.performance && (
                        <div className="flex justify-between items-center py-2" style={{ borderBottom: '1px solid #f0f0f0' }}>
                          <span style={{ color: '#7a7a7a' }}>성능점검</span>
                          <span className="font-medium ml-4 shrink-0" style={{ color: '#1d1d1f' }}>1회</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center py-2 font-semibold" style={{ borderBottom: '1px solid #f0f0f0', color: '#0d9488' }}>
                        <span>공급가</span>
                        <span className="ml-4 shrink-0">{fmt(supplyPrice)}</span>
                      </div>
                      {[
                        { label: `할인 (${selected.discountRate ?? 0}%)`, value: discountAmount > 0 ? `-${fmt(discountAmount)}` : fmt(0), isDiscount: true },
                        { label: '최종제안가', value: fmt(subtotal), isSubtotal: true },
                        { label: '부가가치세 (10%)', value: fmt(vat) },
                      ].map(({ label, value, isDiscount, isSubtotal }) => (
                        <div
                          key={label}
                          className={`flex justify-between items-center py-2 ${isSubtotal ? 'font-semibold' : ''}`}
                          style={{ borderBottom: '1px solid #f0f0f0' }}
                        >
                          <span style={{ color: isDiscount ? '#ff3b30' : isSubtotal ? '#7c3aed' : '#7a7a7a' }}>{label}</span>
                          <span
                            className={isSubtotal ? 'ml-4 shrink-0' : 'font-medium ml-4 shrink-0'}
                            style={{ color: isDiscount ? '#ff3b30' : isSubtotal ? '#7c3aed' : '#1d1d1f' }}
                          >
                            {value}
                          </span>
                        </div>
                      ))}
                      <div className="flex justify-between py-2.5 font-bold" style={{ color: '#0066cc' }}>
                        <span>합계</span>
                        <span>{selected.totalCost.toLocaleString()}원</span>
                      </div>
                    </div>

                    {/* 직접인건비 상세 팝업 */}
                    {showLaborPopup && (
                      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white w-full max-w-lg max-h-[80vh] flex flex-col" style={{ borderRadius: '18px', border: '1px solid #e0e0e0' }}>
                          <div className="flex items-center justify-between p-5 shrink-0" style={{ borderBottom: '1px solid #f0f0f0' }}>
                            <div>
                              <h3 className="font-semibold" style={{ color: '#1d1d1f', fontSize: '15px' }}>직접인건비 세부 산정내역</h3>
                              <p className="text-xs mt-0.5" style={{ color: '#7a7a7a' }}>
                                노임단가 {selected.wageRate.toLocaleString()}원 · 조정계수 {selected.adjustmentFactor}
                              </p>
                            </div>
                            <button onClick={() => setShowLaborPopup(false)} style={{ color: '#7a7a7a' }}><X size={20} /></button>
                          </div>
                          <div className="overflow-y-auto p-4 space-y-2">
                            <div className="grid grid-cols-4 gap-2 px-3 py-1.5 text-xs font-medium" style={{ color: '#7a7a7a' }}>
                              <span className="col-span-2">설비명</span>
                              <span className="text-right">기준인원</span>
                              <span className="text-right">금액</span>
                            </div>
                            {eqItems.map(({ equipment, quantity }) => {
                              const personnel = equipment.applyAdjustment
                                ? quantity * equipment.standardPersonnel * selected.adjustmentFactor
                                : quantity * equipment.standardPersonnel
                              const cost = Math.round(personnel * selected.wageRate)
                              const colors = CATEGORY_COLORS[equipment.category]
                              return (
                                <div
                                  key={equipment.id}
                                  className="grid grid-cols-4 gap-2 px-3 py-2 rounded-[10px] text-sm"
                                  style={{ backgroundColor: colors.bg, borderLeft: `3px solid ${colors.border}` }}
                                >
                                  <div className="col-span-2">
                                    <p style={{ color: colors.text, fontWeight: 500 }}>{equipment.name}</p>
                                    {!equipment.applyAdjustment && (
                                      <p className="text-xs" style={{ color: '#7a7a7a' }}>{quantity}{equipment.unit} · 조정계수 미적용</p>
                                    )}
                                    {equipment.applyAdjustment && quantity > 1 && (
                                      <p className="text-xs" style={{ color: '#7a7a7a' }}>{quantity}{equipment.unit}</p>
                                    )}
                                  </div>
                                  <span className="text-right text-xs self-center" style={{ color: '#7a7a7a' }}>
                                    {personnel.toFixed(2)}인
                                  </span>
                                  <span className="text-right font-medium self-center" style={{ color: '#1d1d1f' }}>
                                    {cost.toLocaleString()}원
                                  </span>
                                </div>
                              )
                            })}
                          </div>
                          <div className="p-4 shrink-0" style={{ borderTop: '1px solid #f0f0f0' }}>
                            <div className="grid grid-cols-4 gap-2 px-3 items-center text-sm">
                              <span className="col-span-2 font-bold" style={{ color: '#0066cc' }}>전체 설비 {eqItems.length}건</span>
                              <span className="text-right font-bold" style={{ color: '#0066cc' }}>기준인원 {totalPersonnel.toFixed(2)}인</span>
                              <span className="text-right font-bold" style={{ color: '#0066cc' }}>합계 {fmt(directLaborCost)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 견적서 수정 팝업 */}
                    {showEstimateEdit && (() => {
                      const liveDirectExpense = (Number(estimateForm.travel) || 0) + (Number(estimateForm.vehicle) || 0) + (Number(estimateForm.fieldExpense) || 0)
                      const liveCount = countCheckedInspections({
                        maintenanceH1: estimateForm.maintenanceH1, maintenanceH2: estimateForm.maintenanceH2, performance: estimateForm.performance,
                      })
                      const live = calcCostBreakdown(
                        directLaborCost, liveDirectExpense, estimateForm.overheadRate, estimateForm.techFeeRate, estimateForm.discountRate, liveCount
                      )
                      return (
                      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white w-full max-w-md max-h-[85vh] flex flex-col" style={{ borderRadius: '18px', border: '1px solid #e0e0e0' }}>
                          <div className="flex items-center justify-between p-5 shrink-0" style={{ borderBottom: '1px solid #f0f0f0' }}>
                            <h3 className="font-semibold" style={{ color: '#1d1d1f', fontSize: '15px' }}>견적서 수정</h3>
                            <button onClick={() => setShowEstimateEdit(false)} style={{ color: '#7a7a7a' }}><X size={20} /></button>
                          </div>
                          <div className="overflow-y-auto p-5 space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">여비 (원)</label>
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  value={toMoneyDisplay(estimateForm.travel)}
                                  onChange={e => setEstimateForm(f => ({ ...f, travel: onlyDigits(e.target.value) }))}
                                  className="input-field text-sm"
                                  placeholder="직접 입력"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">차량운행비 (원)</label>
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  value={toMoneyDisplay(estimateForm.vehicle)}
                                  onChange={e => setEstimateForm(f => ({ ...f, vehicle: onlyDigits(e.target.value) }))}
                                  className="input-field text-sm"
                                  placeholder="직접 입력"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">현장소요경비 (원)</label>
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  value={toMoneyDisplay(estimateForm.fieldExpense)}
                                  onChange={e => setEstimateForm(f => ({ ...f, fieldExpense: onlyDigits(e.target.value) }))}
                                  className="input-field text-sm"
                                  placeholder="직접 입력"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">점검 항목</label>
                              <div className="flex items-center gap-4 flex-wrap">
                                <label className="flex items-center gap-1.5 text-sm text-gray-700">
                                  <input
                                    type="checkbox"
                                    checked={estimateForm.maintenanceH1 || estimateForm.maintenanceH2}
                                    onChange={e => {
                                      const checked = e.target.checked
                                      setEstimateForm(f => ({ ...f, maintenanceH1: checked, maintenanceH2: checked }))
                                    }}
                                  />
                                  유지관리점검
                                </label>
                                {(estimateForm.maintenanceH1 || estimateForm.maintenanceH2) && (
                                  <div className="flex items-center gap-3 ml-1">
                                    <label className="flex items-center gap-1.5 text-sm text-gray-600">
                                      <input
                                        type="checkbox"
                                        checked={estimateForm.maintenanceH1}
                                        onChange={e => setEstimateForm(f => ({ ...f, maintenanceH1: e.target.checked }))}
                                      />
                                      상반기
                                    </label>
                                    <label className="flex items-center gap-1.5 text-sm text-gray-600">
                                      <input
                                        type="checkbox"
                                        checked={estimateForm.maintenanceH2}
                                        onChange={e => setEstimateForm(f => ({ ...f, maintenanceH2: e.target.checked }))}
                                      />
                                      하반기
                                    </label>
                                  </div>
                                )}
                              </div>
                              <label className="flex items-center gap-1.5 text-sm text-gray-700 mt-2">
                                <input
                                  type="checkbox"
                                  checked={estimateForm.performance}
                                  onChange={e => setEstimateForm(f => ({ ...f, performance: e.target.checked }))}
                                />
                                성능점검
                              </label>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                제경비율 ({estimateForm.overheadRate}%)
                              </label>
                              <input
                                type="range"
                                min={110}
                                max={120}
                                step={1}
                                value={estimateForm.overheadRate}
                                onChange={e => setEstimateForm(f => ({ ...f, overheadRate: Number(e.target.value) }))}
                                className="w-full"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                기술료율 ({estimateForm.techFeeRate}%)
                              </label>
                              <input
                                type="range"
                                min={20}
                                max={40}
                                step={1}
                                value={estimateForm.techFeeRate}
                                onChange={e => setEstimateForm(f => ({ ...f, techFeeRate: Number(e.target.value) }))}
                                className="w-full"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                할인율 ({estimateForm.discountRate}%)
                              </label>
                              <input
                                type="range"
                                min={0}
                                max={100}
                                step={1}
                                value={estimateForm.discountRate}
                                onChange={e => setEstimateForm(f => ({ ...f, discountRate: Number(e.target.value) }))}
                                className="w-full"
                              />
                            </div>

                            {/* 산출 내역 미리보기 */}
                            <div className="bg-[#f5f5f7] rounded-[11px] p-4 text-sm space-y-2">
                              <div className="flex justify-between">
                                <span style={{ color: '#7a7a7a' }}>직접인건비</span>
                                <span className="font-medium" style={{ color: '#1d1d1f' }}>{fmt(live.directLaborCost)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span style={{ color: '#7a7a7a' }}>직접경비</span>
                                <span className="font-medium" style={{ color: '#1d1d1f' }}>{fmt(live.directExpense)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span style={{ color: '#7a7a7a' }}>제경비 ({estimateForm.overheadRate}%)</span>
                                <span className="font-medium" style={{ color: '#1d1d1f' }}>{fmt(live.overheadCost)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span style={{ color: '#7a7a7a' }}>기술료 ({estimateForm.techFeeRate}%)</span>
                                <span className="font-medium" style={{ color: '#1d1d1f' }}>{fmt(live.techFee)}</span>
                              </div>
                              {estimateForm.maintenanceH1 && (
                                <div className="flex justify-between">
                                  <span style={{ color: '#7a7a7a' }}>유지관리점검(상반기)</span>
                                  <span className="font-medium" style={{ color: '#1d1d1f' }}>1회</span>
                                </div>
                              )}
                              {estimateForm.maintenanceH2 && (
                                <div className="flex justify-between">
                                  <span style={{ color: '#7a7a7a' }}>유지관리점검(하반기)</span>
                                  <span className="font-medium" style={{ color: '#1d1d1f' }}>1회</span>
                                </div>
                              )}
                              {estimateForm.performance && (
                                <div className="flex justify-between">
                                  <span style={{ color: '#7a7a7a' }}>성능점검</span>
                                  <span className="font-medium" style={{ color: '#1d1d1f' }}>1회</span>
                                </div>
                              )}
                              <div className="flex justify-between pt-2 mt-1" style={{ borderTop: '1px solid #e5e5ea' }}>
                                <span className="font-semibold" style={{ color: '#0d9488' }}>공급가</span>
                                <span className="font-semibold" style={{ color: '#0d9488' }}>{fmt(live.supplyPrice)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span style={{ color: '#ff3b30' }}>할인 ({estimateForm.discountRate}%)</span>
                                <span className="font-medium" style={{ color: '#ff3b30' }}>
                                  {live.discountAmount > 0 ? `-${fmt(live.discountAmount)}` : fmt(0)}
                                </span>
                              </div>
                              <div className="flex justify-between pt-2 mt-1" style={{ borderTop: '1px solid #e5e5ea' }}>
                                <span className="font-semibold" style={{ color: '#7c3aed' }}>최종제안가</span>
                                <span className="font-semibold" style={{ color: '#7c3aed' }}>{fmt(live.subtotal)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span style={{ color: '#7a7a7a' }}>부가가치세 (10%)</span>
                                <span className="font-medium" style={{ color: '#1d1d1f' }}>{fmt(live.vat)}</span>
                              </div>
                              <div className="flex justify-between pt-2 mt-1" style={{ borderTop: '1px solid #e5e5ea' }}>
                                <span className="font-bold" style={{ color: '#1d1d1f' }}>합계</span>
                                <span className="font-bold text-base" style={{ color: '#0066cc' }}>{fmt(live.totalCost)}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-3 p-5 shrink-0" style={{ borderTop: '1px solid #f0f0f0' }}>
                            <button
                              onClick={() => handleSaveEstimate(selected)}
                              className="btn-primary flex-1 disabled:opacity-60"
                              disabled={savingEstimate}
                            >
                              {savingEstimate ? '저장 중...' : '저장'}
                            </button>
                            <button onClick={() => setShowEstimateEdit(false)} className="btn-secondary flex-1">취소</button>
                          </div>
                        </div>
                      </div>
                      )
                    })()}

                    {/* 견적서 엑셀 다운로드 팝업 (수신자 입력) */}
                    {showEstimateExport && (
                      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white w-full max-w-md" style={{ borderRadius: '18px', border: '1px solid #e0e0e0' }}>
                          <div className="flex items-center justify-between p-5" style={{ borderBottom: '1px solid #f0f0f0' }}>
                            <h3 className="font-semibold" style={{ color: '#1d1d1f', fontSize: '15px' }}>견적서 엑셀 다운로드</h3>
                            <button onClick={() => setShowEstimateExport(false)} style={{ color: '#7a7a7a' }}><X size={20} /></button>
                          </div>
                          <div className="p-5 space-y-4">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">수신자(Recipient)</label>
                              <input
                                type="text"
                                value={estimateExportForm.recipient}
                                onChange={e => setEstimateExportForm({ recipient: e.target.value })}
                                className="input-field text-sm"
                                placeholder="수신자를 입력하세요"
                                autoFocus
                              />
                            </div>
                            <p style={{ fontSize: '12px', color: '#7a7a7a' }}>
                              작성자: 한국전파진흥협회 · 발급일: 오늘 날짜로 자동 입력됩니다.
                            </p>
                            <div className="flex gap-3">
                              <button
                                onClick={() => handleConfirmExport(selected)}
                                className="btn-primary flex-1 disabled:opacity-60"
                                disabled={exportingEstimate}
                              >
                                {exportingEstimate ? '다운로드 중...' : '다운로드'}
                              </button>
                              <button onClick={() => setShowEstimateExport(false)} className="btn-secondary flex-1">취소</button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })()}

              {/* 점검 내역 */}
              <div className="card">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold" style={{ color: '#1d1d1f' }}>
                    점검 내역 {selectedInspections.length > 0 && `(${selectedInspections.length}건)`}
                  </h3>
                  <button
                    onClick={() => { setShowNewInspModal(true); setNewInspDate(format(new Date(), 'yyyy-MM-dd')); setNewInspType('기능점검'); setNewInspInspectorIds([]) }}
                    className="flex items-center gap-1 text-sm font-medium"
                    style={{ color: '#0066cc' }}
                  >
                    <Plus size={14} />새 점검표
                  </button>
                </div>

                {selectedInspections.length === 0 ? (
                  <div className="text-center py-6" style={{ color: '#7a7a7a' }}>
                    <ClipboardList size={28} className="mx-auto mb-2 opacity-40" />
                    <p className="text-sm">점검 내역이 없습니다.</p>
                    <button
                      onClick={() => { setShowNewInspModal(true); setNewInspInspectorIds([]) }}
                      className="btn-primary text-sm mt-3"
                    >
                      + 첫 점검표 작성
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedInspections.map(insp => (
                      <div
                        key={insp.id}
                        className="flex items-center justify-between p-3 rounded-[11px] cursor-pointer transition-colors"
                        style={{ backgroundColor: '#f5f5f7', border: '1px solid transparent' }}
                        onClick={() => navigate(`/inspection?inspectionId=${insp.id}&buildingId=${insp.buildingId}`)}
                        onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = '#e0e0e0'; (e.currentTarget as HTMLDivElement).style.backgroundColor = '#f0f0f0' }}
                        onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'transparent'; (e.currentTarget as HTMLDivElement).style.backgroundColor = '#f5f5f7' }}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText size={14} style={{ color: '#7a7a7a', flexShrink: 0 }} />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`text-xs px-2 py-0.5 rounded ${insp.inspectionType === '기능점검' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'}`}>
                                {insp.inspectionType}
                              </span>
                              <span className="text-sm font-medium" style={{ color: '#1d1d1f' }}>{insp.inspectionDate}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-2">
                          <span className={`text-xs px-2 py-0.5 rounded ${INSPECTION_STATUS_STYLE[insp.status] ?? 'bg-gray-100 text-gray-600'}`}>
                            {insp.status}
                          </span>
                          {canDelete(user?.role) && (
                          <button
                            onClick={e => { e.stopPropagation(); confirmDeleteInspection(insp) }}
                            className="p-1 rounded-md transition-colors"
                            style={{ color: '#cccccc' }}
                            onMouseEnter={e => (e.currentTarget.style.color = '#ff3b30')}
                            onMouseLeave={e => (e.currentTarget.style.color = '#cccccc')}
                            title="삭제"
                          >
                            <Trash2 size={13} />
                          </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── 새 점검표 모달 ── */}
      {showNewInspModal && selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-sm" style={{ borderRadius: '18px', border: '1px solid #e0e0e0' }}>
            <div className="flex items-center justify-between p-5" style={{ borderBottom: '1px solid #f0f0f0' }}>
              <h3 className="font-semibold" style={{ color: '#1d1d1f', fontSize: '15px' }}>새 점검표 작성</h3>
              <button onClick={() => setShowNewInspModal(false)} style={{ color: '#7a7a7a' }}><X size={20} /></button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-sm font-medium" style={{ color: '#7a7a7a' }}>{selected.name}</p>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: '#1d1d1f' }}>점검 일자</label>
                <input
                  type="date"
                  value={newInspDate}
                  onChange={e => setNewInspDate(e.target.value)}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: '#1d1d1f' }}>점검 유형</label>
                <div className="flex gap-2">
                  {(['기능점검', '성능점검'] as const).map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setNewInspType(type)}
                      className="flex-1 py-2.5 rounded-[11px] text-sm font-medium transition-colors"
                      style={{
                        backgroundColor: newInspType === type ? '#0066cc' : '#f5f5f7',
                        color: newInspType === type ? '#ffffff' : '#1d1d1f',
                      }}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: '#1d1d1f' }}>점검자 지정</label>
                <button
                  type="button"
                  onClick={() => setShowAssignModal(true)}
                  className="btn-secondary w-full text-sm"
                >
                  점검자 지정{newInspInspectorIds.length > 0 ? ` (${newInspInspectorIds.length}명)` : ''}
                </button>
              </div>
              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => {
                    const inspectorsParam = newInspInspectorIds.length > 0
                      ? `&inspectors=${newInspInspectorIds.join(',')}`
                      : ''
                    navigate(`/inspection?buildingId=${selected.id}&date=${newInspDate}&type=${encodeURIComponent(newInspType)}${inspectorsParam}`)
                    setShowNewInspModal(false)
                  }}
                  className="btn-primary flex-1"
                >
                  작성 시작
                </button>
                <button onClick={() => setShowNewInspModal(false)} className="btn-secondary flex-1">취소</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 점검자 지정 모달 ── */}
      <AssignInspectorsModal
        isOpen={showAssignModal}
        selectedIds={newInspInspectorIds}
        onClose={() => setShowAssignModal(false)}
        onApply={setNewInspInspectorIds}
      />

      {/* ── 비밀번호 확인 모달 ── */}
      <PasswordConfirmModal
        isOpen={pwModal.open}
        title={pwModal.title}
        onClose={() => setPwModal(p => ({ ...p, open: false }))}
        onConfirm={pwModal.onConfirm}
      />
    </>
  )
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs" style={{ color: '#7a7a7a' }}>{label}</p>
      <p className="text-sm font-medium mt-0.5" style={{ color: '#1d1d1f' }}>{value}</p>
    </div>
  )
}
