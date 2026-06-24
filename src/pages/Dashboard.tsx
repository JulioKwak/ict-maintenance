import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Building2, ClipboardCheck, Users, HardHat, AlertCircle } from 'lucide-react'
import { buildingsApi, techniciansApi, inspectionsApi } from '../utils/api'
import type { Building, Technician, InspectionForm, BuildingStatus } from '../types'

const STATUS_LABELS: Record<BuildingStatus, string> = {
  등록: '등록', 작성중: '작성 중', 작성완료: '작성 완료', 점검표보완: '보완 필요', 검수완료: '검수 완료',
}

const STATUS_COLORS: Record<BuildingStatus, string> = {
  등록: 'bg-gray-100 text-gray-700',
  작성중: 'bg-yellow-100 text-yellow-700',
  작성완료: 'bg-blue-100 text-blue-700',
  점검표보완: 'bg-orange-100 text-orange-700',
  검수완료: 'bg-green-100 text-green-700',
}

export default function Dashboard() {
  const [buildings, setBuildings] = useState<Building[]>([])
  const [technicians, setTechnicians] = useState<Technician[]>([])
  const [inspections, setInspections] = useState<InspectionForm[]>([])

  useEffect(() => {
    buildingsApi.getAll().then(setBuildings).catch(() => {})
    techniciansApi.getAll().then(setTechnicians).catch(() => {})
    inspectionsApi.getAll().then(setInspections).catch(() => {})
  }, [])

  const statusCounts = useMemo(() => {
    const counts: Record<BuildingStatus, number> = {
      등록: 0, 작성중: 0, 작성완료: 0, 점검표보완: 0, 검수완료: 0,
    }
    buildings.forEach(b => { counts[b.status]++ })
    return counts
  }, [buildings])

  const gradeCounts = useMemo(() => {
    const counts: Record<string, number> = { 특급기술자: 0, 고급기술자: 0, 중급기술자: 0, 초급기술자: 0 }
    technicians.forEach(t => { counts[t.grade] = (counts[t.grade] || 0) + 1 })
    return counts
  }, [technicians])

  const recentInspections = useMemo(
    () => [...inspections].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 5),
    [inspections]
  )

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Building2 className="text-blue-600" size={24} />} label="전체 건축물" value={buildings.length} sub="등록된 건축물 수" color="bg-blue-50" />
        <StatCard icon={<ClipboardCheck className="text-green-600" size={24} />} label="점검 완료" value={statusCounts['검수완료']} sub="검수 완료 건축물" color="bg-green-50" />
        <StatCard icon={<AlertCircle className="text-orange-600" size={24} />} label="보완 필요" value={statusCounts['점검표보완']} sub="보완 처리 필요" color="bg-orange-50" />
        <StatCard icon={<HardHat className="text-purple-600" size={24} />} label="기술자" value={technicians.length} sub="등록된 기술자 수" color="bg-purple-50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="font-semibold text-gray-800 mb-4">건축물 상태별 현황</h2>
          {buildings.length === 0 ? (
            <EmptyState text="등록된 건축물이 없습니다." link="/building-register" linkText="건축물 등록하기" />
          ) : (
            <div className="space-y-3">
              {(Object.entries(STATUS_LABELS) as [BuildingStatus, string][]).map(([key, label]) => (
                <div key={key} className="flex items-center justify-between">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[key]}`}>{label}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-32 bg-gray-100 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: buildings.length ? `${(statusCounts[key] / buildings.length) * 100}%` : '0%' }}
                      />
                    </div>
                    <span className="text-sm font-medium w-8 text-right">{statusCounts[key]}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800">기술자 현황</h2>
            <Link to="/technicians" className="text-xs text-blue-600 hover:underline">전체 보기</Link>
          </div>
          {technicians.length === 0 ? (
            <EmptyState text="등록된 기술자가 없습니다." link="/technicians" linkText="기술자 등록하기" />
          ) : (
            <div className="space-y-2">
              {(['특급기술자', '고급기술자', '중급기술자', '초급기술자'] as const).map(grade => (
                <div key={grade} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                  <span className="text-sm text-gray-700">{grade}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900">{gradeCounts[grade] || 0}명</span>
                    <Users size={14} className="text-gray-400" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-800">최근 점검 활동</h2>
          <Link to="/inspection" className="text-xs text-blue-600 hover:underline">점검표 작성</Link>
        </div>
        {recentInspections.length === 0 ? (
          <EmptyState text="점검 내역이 없습니다." link="/inspection" linkText="점검표 작성하기" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 text-gray-500 font-medium">건축물</th>
                  <th className="text-left py-2 text-gray-500 font-medium">점검유형</th>
                  <th className="text-left py-2 text-gray-500 font-medium">점검일자</th>
                  <th className="text-left py-2 text-gray-500 font-medium">상태</th>
                </tr>
              </thead>
              <tbody>
                {recentInspections.map(insp => {
                  const building = buildings.find(b => b.id === insp.buildingId)
                  return (
                    <tr key={insp.id} className="border-b border-[#f0f0f0] hover:bg-[#f5f5f7]">
                      <td className="py-2 text-gray-900">{building?.name ?? '-'}</td>
                      <td className="py-2">
                        <span className={`text-xs px-2 py-0.5 rounded ${insp.inspectionType === '기능점검' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'}`}>
                          {insp.inspectionType}
                        </span>
                      </td>
                      <td className="py-2 text-gray-600">{insp.inspectionDate}</td>
                      <td className="py-2">
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          insp.status === '검수완료' ? 'bg-green-50 text-green-700' :
                          insp.status === '점검표보완' ? 'bg-orange-50 text-orange-700' :
                          insp.status === '작성완료' ? 'bg-blue-50 text-blue-700' :
                          'bg-yellow-50 text-yellow-700'
                        }`}>{insp.status}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, sub, color }: {
  icon: React.ReactNode; label: string; value: number; sub: string; color: string
}) {
  return (
    <div className="card flex items-start gap-4">
      <div className={`p-2.5 rounded-lg ${color}`}>{icon}</div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm font-medium text-gray-700">{label}</p>
        <p className="text-xs text-gray-400">{sub}</p>
      </div>
    </div>
  )
}

function EmptyState({ text, link, linkText }: { text: string; link: string; linkText: string }) {
  return (
    <div className="text-center py-6">
      <p className="text-sm text-gray-400 mb-2">{text}</p>
      <Link to={link} className="text-sm text-blue-600 hover:underline">{linkText}</Link>
    </div>
  )
}
