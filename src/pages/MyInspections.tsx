import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ClipboardList, ChevronRight, FileText } from 'lucide-react'
import { inspectionsApi, buildingsApi } from '../utils/api'
import { useAuth } from '../context/AuthContext'
import type { InspectionForm, Building } from '../types'

const INSP_STATUS_STYLE: Record<string, string> = {
  작성중:   'bg-yellow-50 text-yellow-700',
  작성완료: 'bg-blue-50 text-blue-700',
  점검표보완: 'bg-orange-50 text-orange-700',
  검수완료: 'bg-green-50 text-green-700',
}

export default function MyInspections() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [inspections, setInspections] = useState<InspectionForm[]>([])
  const [buildings, setBuildings] = useState<Building[]>([])

  useEffect(() => {
    Promise.all([
      inspectionsApi.getAll(),
      buildingsApi.getAll(),
    ]).then(([insp, blds]) => {
      setInspections(insp)
      setBuildings(blds)
    }).catch(() => {})
  }, [])

  const myInspections = useMemo(
    () => inspections.filter(i => i.assignedInspectorIds?.includes(user?.id ?? '')),
    [inspections, user]
  )

  return (
    <div className="max-w-2xl space-y-4">
      <h2 className="font-semibold" style={{ color: '#1d1d1f' }}>점검표 작성</h2>

      {myInspections.length === 0 ? (
        <div className="flex items-center justify-center py-20" style={{ color: '#7a7a7a' }}>
          <div className="text-center">
            <ClipboardList size={40} className="mx-auto mb-3 opacity-30" />
            <p style={{ fontSize: '14px' }}>배정된 점검표가 없습니다.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {myInspections.map(insp => {
            const building = buildings.find(b => b.id === insp.buildingId)
            return (
              <button
                key={insp.id}
                onClick={() => navigate(`/inspection?inspectionId=${insp.id}&buildingId=${insp.buildingId}`)}
                className="w-full text-left p-4 transition-all flex items-center justify-between gap-3"
                style={{ borderRadius: '12px', border: '1px solid #e0e0e0', backgroundColor: '#ffffff' }}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <FileText size={16} style={{ color: '#7a7a7a', flexShrink: 0 }} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: '#1d1d1f' }}>{building?.name ?? '-'}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-xs px-2 py-0.5 rounded ${insp.inspectionType === '기능점검' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'}`}>
                        {insp.inspectionType}
                      </span>
                      <span className="text-xs" style={{ color: '#7a7a7a' }}>{insp.inspectionDate}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded ${INSP_STATUS_STYLE[insp.status] ?? 'bg-gray-100 text-gray-600'}`}>
                    {insp.status}
                  </span>
                  <ChevronRight size={14} style={{ color: '#e0e0e0' }} />
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
