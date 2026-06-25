import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, Search, ChevronRight, Trash2, Download, ClipboardCheck, Plus, FileText, X, ClipboardList } from 'lucide-react'
import { buildingsApi, inspectionsApi } from '../utils/api'
import { EQUIPMENT_LIST } from '../data/equipment'
import type { Building, BuildingStatus, InspectionForm, InspectionType } from '../types'
import PasswordConfirmModal from '../components/PasswordConfirmModal'
import { format } from 'date-fns'
import * as XLSX from 'xlsx'

const STATUS_LABELS: Record<BuildingStatus, string> = {
  등록: '등록', 작성중: '작성 중', 작성완료: '작성 완료', 점검표보완: '보완 필요', 검수완료: '검수 완료',
}

const STATUS_COLORS: Record<BuildingStatus, string> = {
  등록: 'status-registered', 작성중: 'status-in-progress', 작성완료: 'status-completed',
  점검표보완: 'status-supplement', 검수완료: 'status-approved',
}

const INSP_STATUS_STYLE: Record<string, string> = {
  작성중:   'bg-yellow-50 text-yellow-700',
  작성완료: 'bg-blue-50 text-blue-700',
  점검표보완: 'bg-orange-50 text-orange-700',
  검수완료: 'bg-green-50 text-green-700',
}

export default function BuildingManagement() {
  const navigate = useNavigate()
  const [buildings, setBuildings] = useState<Building[]>([])
  const [allInspections, setAllInspections] = useState<InspectionForm[]>([])
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<BuildingStatus | '전체'>('전체')

  // 새 점검표 모달
  const [showNewInspModal, setShowNewInspModal] = useState(false)
  const [newInspDate, setNewInspDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [newInspType, setNewInspType] = useState<InspectionType>('기능점검')

  // 비밀번호 확인 모달
  const [pwModal, setPwModal] = useState<{ open: boolean; title: string; onConfirm: () => Promise<void> }>({
    open: false, title: '', onConfirm: async () => {},
  })

  useEffect(() => {
    buildingsApi.getAll().then(setBuildings).catch(() => {})
    inspectionsApi.getAll().then(setAllInspections).catch(() => {})
  }, [])

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

  const exportEstimate = (building: Building) => {
    const checkedEquipment = building.equipment.filter(e => e.checked)
    const wb = XLSX.utils.book_new()
    const data = [
      ['정보통신설비 유지보수·관리 견적서'],
      [],
      ['건축물명', building.name],
      ['주소', building.address],
      ['연면적', `${building.floorArea.toLocaleString()}㎡`],
      ['기술자 등급', building.technicianGrade],
      ['노임단가', `${building.wageRate.toLocaleString()}원`],
      ['연면적 조정계수', building.adjustmentFactor],
      [],
      ['대상설비'],
      ['설비명', '카테고리', '단위', '기준인원', '조정계수 적용'],
      ...checkedEquipment.map(be => {
        const eq = EQUIPMENT_LIST.find(e => e.id === be.equipmentId)
        return [eq?.name ?? '', eq?.category ?? '', eq?.unit ?? '', eq?.standardPersonnel ?? '', eq?.applyAdjustment ? '√' : '-']
      }),
      [],
      ['대가산정 내역'],
      ['항목', '금액'],
      ['여비', `${building.directCost.travel.toLocaleString()}원`],
      ['차량운행비', `${building.directCost.vehicle.toLocaleString()}원`],
      ['현장소요경비', `${building.directCost.fieldExpense.toLocaleString()}원`],
      ['제경비율', `${building.overheadRate}%`],
      ['기술료율', `${building.techFeeRate}%`],
      ['총 대가', `${building.totalCost.toLocaleString()}원`],
      [],
      ['작성일', new Date().toLocaleDateString('ko-KR')],
    ]
    const ws = XLSX.utils.aoa_to_sheet(data)
    ws['!cols'] = [{ wch: 20 }, { wch: 30 }, { wch: 15 }, { wch: 12 }, { wch: 12 }]
    XLSX.utils.book_append_sheet(wb, ws, '견적서')
    XLSX.writeFile(wb, `견적서_${building.name}_${new Date().toLocaleDateString('ko-KR')}.xlsx`)
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
            {(['전체', '등록', '작성중', '작성완료', '점검표보완', '검수완료'] as const).map(s => (
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
                  <span className={STATUS_COLORS[selected.status]}>{STATUS_LABELS[selected.status]}</span>
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
                  <button onClick={() => exportEstimate(selected)} className="btn-secondary text-sm flex items-center gap-1.5">
                    <Download size={14} />견적서 엑셀
                  </button>
                  <button
                    onClick={() => confirmDeleteBuilding(selected)}
                    className="btn-danger text-sm flex items-center gap-1.5 ml-auto"
                  >
                    <Trash2 size={14} />삭제
                  </button>
                </div>
              </div>

              {/* 등록 설비 */}
              <div className="card">
                <h3 className="font-semibold mb-3" style={{ color: '#1d1d1f' }}>등록 설비</h3>
                <div className="flex flex-wrap gap-2">
                  {selected.equipment.filter(e => e.checked).length === 0 ? (
                    <p className="text-sm" style={{ color: '#7a7a7a' }}>등록된 설비가 없습니다.</p>
                  ) : (
                    selected.equipment.filter(e => e.checked).map(be => {
                      const eq = EQUIPMENT_LIST.find(e => e.id === be.equipmentId)
                      return (
                        <span key={be.equipmentId} className="text-xs px-2.5 py-1 rounded-full" style={{ backgroundColor: 'rgba(0,102,204,0.08)', color: '#0066cc' }}>
                          {eq?.name ?? be.equipmentId}
                          {!eq?.applyAdjustment && ` (${be.quantity}${eq?.unit})`}
                        </span>
                      )
                    })
                  )}
                </div>
              </div>

              {/* 대가산정 요약 */}
              <div className="card">
                <h3 className="font-semibold mb-3" style={{ color: '#1d1d1f' }}>대가산정 요약</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {[
                    ['여비', `${selected.directCost.travel.toLocaleString()}원`],
                    ['차량운행비', `${selected.directCost.vehicle.toLocaleString()}원`],
                    ['현장소요경비', `${selected.directCost.fieldExpense.toLocaleString()}원`],
                    [`제경비 (${selected.overheadRate}%)`, ''],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between py-1" style={{ borderBottom: '1px solid #f0f0f0' }}>
                      <span style={{ color: '#7a7a7a' }}>{label}</span>
                      <span style={{ color: '#1d1d1f' }}>{value}</span>
                    </div>
                  ))}
                  <div className="col-span-2 flex justify-between py-2 font-bold" style={{ color: '#0066cc' }}>
                    <span>총 대가</span><span>{selected.totalCost.toLocaleString()}원</span>
                  </div>
                </div>
              </div>

              {/* 점검 내역 */}
              <div className="card">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold" style={{ color: '#1d1d1f' }}>
                    점검 내역 {selectedInspections.length > 0 && `(${selectedInspections.length}건)`}
                  </h3>
                  <button
                    onClick={() => { setShowNewInspModal(true); setNewInspDate(format(new Date(), 'yyyy-MM-dd')); setNewInspType('기능점검') }}
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
                      onClick={() => setShowNewInspModal(true)}
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
                          <span className={`text-xs px-2 py-0.5 rounded ${INSP_STATUS_STYLE[insp.status] ?? 'bg-gray-100 text-gray-600'}`}>
                            {insp.status}
                          </span>
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
              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => {
                    navigate(`/inspection?buildingId=${selected.id}&date=${newInspDate}&type=${encodeURIComponent(newInspType)}`)
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
