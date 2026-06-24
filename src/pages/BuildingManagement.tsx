import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Building2, Search, ChevronRight, Trash2, Eye, FileText, Download } from 'lucide-react'
import { buildingsApi, inspectionsApi } from '../utils/api'
import { EQUIPMENT_LIST } from '../data/equipment'
import type { Building, BuildingStatus, InspectionForm } from '../types'
import * as XLSX from 'xlsx'

const STATUS_LABELS: Record<BuildingStatus, string> = {
  등록: '등록', 작성중: '작성 중', 작성완료: '작성 완료', 점검표보완: '보완 필요', 검수완료: '검수 완료',
}

const STATUS_COLORS: Record<BuildingStatus, string> = {
  등록: 'status-registered', 작성중: 'status-in-progress', 작성완료: 'status-completed',
  점검표보완: 'status-supplement', 검수완료: 'status-approved',
}

export default function BuildingManagement() {
  const [buildings, setBuildings] = useState<Building[]>([])
  const [allInspections, setAllInspections] = useState<InspectionForm[]>([])
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<BuildingStatus | '전체'>('전체')

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
    () => allInspections.filter(i => i.buildingId === selectedId),
    [allInspections, selectedId]
  )

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`"${name}" 건축물을 삭제하시겠습니까?`)) return
    try {
      await buildingsApi.delete(id)
      setBuildings(prev => prev.filter(b => b.id !== id))
      if (selectedId === id) setSelectedId(null)
    } catch (err) {
      alert(err instanceof Error ? err.message : '삭제 중 오류가 발생했습니다.')
    }
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
    <div className="flex flex-col md:flex-row gap-4 md:gap-6 md:h-[calc(100vh-7rem)]">
      {/* 목록 */}
      <div className="w-full md:w-80 shrink-0 flex flex-col gap-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              className="input-field pl-9 text-sm" placeholder="건축물명, 주소 검색" />
          </div>
          <Link to="/building-register" className="btn-primary text-sm flex items-center gap-1 shrink-0">
            + 등록
          </Link>
        </div>

        <div className="flex flex-wrap gap-1">
          {(['전체', '등록', '작성중', '작성완료', '점검표보완', '검수완료'] as const).map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                statusFilter === s ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
              }`}>
              {s}
            </button>
          ))}
        </div>

        <div className="overflow-y-auto flex-1 space-y-2">
          {filtered.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">
              {buildings.length === 0 ? '등록된 건축물이 없습니다.' : '검색 결과가 없습니다.'}
            </p>
          ) : (
            filtered.map(b => (
              <button key={b.id} onClick={() => setSelectedId(b.id)}
                className={`w-full text-left p-3 rounded-lg border transition-all ${
                  selectedId === b.id ? 'bg-blue-50 border-blue-300' : 'bg-white border-gray-200 hover:border-gray-300'
                }`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{b.name}</p>
                    <p className="text-xs text-gray-400 truncate mt-0.5">{b.address}</p>
                    <p className="text-xs text-gray-400">{b.floorArea.toLocaleString()}㎡</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className={STATUS_COLORS[b.status]}>{STATUS_LABELS[b.status]}</span>
                    <ChevronRight size={12} className="text-gray-300" />
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* 상세 */}
      <div className="flex-1 overflow-y-auto">
        {!selected ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            <div className="text-center">
              <Building2 size={40} className="mx-auto mb-3 opacity-30" />
              <p>건축물을 선택하면 상세 정보를 확인할 수 있습니다.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4 max-w-3xl">
            <div className="card">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{selected.name}</h2>
                  <p className="text-sm text-gray-500 mt-1">{selected.address}</p>
                </div>
                <span className={STATUS_COLORS[selected.status]}>{STATUS_LABELS[selected.status]}</span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-100">
                <InfoItem label="연면적" value={`${selected.floorArea.toLocaleString()}㎡`} />
                <InfoItem label="기술자 등급" value={selected.technicianGrade} />
                <InfoItem label="노임단가" value={`${selected.wageRate.toLocaleString()}원`} />
                <InfoItem label="조정계수" value={String(selected.adjustmentFactor)} />
              </div>

              <div className="flex gap-2 mt-4">
                <Link to="/inspection" className="btn-secondary text-sm flex items-center gap-1.5">
                  <Eye size={14} />점검표 작성
                </Link>
                <button onClick={() => exportEstimate(selected)} className="btn-secondary text-sm flex items-center gap-1.5">
                  <Download size={14} />견적서 엑셀
                </button>
                <button onClick={() => handleDelete(selected.id, selected.name)}
                  className="btn-danger text-sm flex items-center gap-1.5 ml-auto">
                  <Trash2 size={14} />삭제
                </button>
              </div>
            </div>

            <div className="card">
              <h3 className="font-semibold text-gray-800 mb-3">등록 설비</h3>
              <div className="flex flex-wrap gap-2">
                {selected.equipment.filter(e => e.checked).length === 0 ? (
                  <p className="text-sm text-gray-400">등록된 설비가 없습니다.</p>
                ) : (
                  selected.equipment.filter(e => e.checked).map(be => {
                    const eq = EQUIPMENT_LIST.find(e => e.id === be.equipmentId)
                    return (
                      <span key={be.equipmentId} className="text-xs px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full">
                        {eq?.name ?? be.equipmentId}
                        {!eq?.applyAdjustment && ` (${be.quantity}${eq?.unit})`}
                      </span>
                    )
                  })
                )}
              </div>
            </div>

            <div className="card">
              <h3 className="font-semibold text-gray-800 mb-3">대가산정 요약</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex justify-between py-1 border-b border-gray-50">
                  <span className="text-gray-500">여비</span><span>{selected.directCost.travel.toLocaleString()}원</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-50">
                  <span className="text-gray-500">차량운행비</span><span>{selected.directCost.vehicle.toLocaleString()}원</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-50">
                  <span className="text-gray-500">현장소요경비</span><span>{selected.directCost.fieldExpense.toLocaleString()}원</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-50">
                  <span className="text-gray-500">제경비율</span><span>{selected.overheadRate}%</span>
                </div>
                <div className="col-span-2 flex justify-between py-2 font-bold text-blue-700">
                  <span>총 대가</span><span>{selected.totalCost.toLocaleString()}원</span>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-800">점검 내역</h3>
                <Link to="/inspection" className="text-xs text-blue-600 hover:underline">+ 새 점검표</Link>
              </div>
              {selectedInspections.length === 0 ? (
                <p className="text-sm text-gray-400">점검 내역이 없습니다.</p>
              ) : (
                <div className="space-y-2">
                  {selectedInspections.map(insp => (
                    <div key={insp.id} className="flex items-center justify-between p-2.5 bg-[#f5f5f7] rounded-[8px]">
                      <div>
                        <span className={`text-xs px-2 py-0.5 rounded mr-2 ${
                          insp.inspectionType === '기능점검' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'
                        }`}>{insp.inspectionType}</span>
                        <span className="text-sm text-gray-700">{insp.inspectionDate}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          insp.status === '검수완료' ? 'bg-green-50 text-green-700' :
                          insp.status === '점검표보완' ? 'bg-orange-50 text-orange-700' :
                          insp.status === '작성완료' ? 'bg-blue-50 text-blue-700' :
                          'bg-yellow-50 text-yellow-700'
                        }`}>{insp.status}</span>
                        <FileText size={14} className="text-gray-400" />
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
  )
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-sm font-medium text-gray-900 mt-0.5">{value}</p>
    </div>
  )
}
