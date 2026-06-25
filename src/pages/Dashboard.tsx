import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Building2, ClipboardCheck, HardHat, AlertCircle, Users, X } from 'lucide-react'
import { buildingsApi, techniciansApi } from '../utils/api'
import type { Building, Technician, BuildingStatus, TechnicianGrade } from '../types'

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

const GRADES: TechnicianGrade[] = ['특급기술자', '고급기술자', '중급기술자', '초급기술자']

export default function Dashboard() {
  const [buildings, setBuildings] = useState<Building[]>([])
  const [technicians, setTechnicians] = useState<Technician[]>([])
  const [gradePopup, setGradePopup] = useState<TechnicianGrade | null>(null)

  useEffect(() => {
    buildingsApi.getAll().then(setBuildings).catch(() => {})
    techniciansApi.getAll().then(setTechnicians).catch(() => {})
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

  const popupTechnicians = useMemo(
    () => gradePopup ? technicians.filter(t => t.grade === gradePopup) : [],
    [technicians, gradePopup]
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
          <h2 className="font-semibold mb-4" style={{ color: '#1d1d1f' }}>건축물 상태별 현황</h2>
          {buildings.length === 0 ? (
            <EmptyState text="등록된 건축물이 없습니다." link="/building-register" linkText="건축물 등록하기" />
          ) : (
            <div className="space-y-3">
              {(Object.entries(STATUS_LABELS) as [BuildingStatus, string][]).map(([key, label]) => (
                <div key={key} className="flex items-center justify-between">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[key]}`}>{label}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-32 rounded-full h-2" style={{ backgroundColor: '#f0f0f0' }}>
                      <div
                        className="h-2 rounded-full"
                        style={{
                          backgroundColor: '#0066cc',
                          width: buildings.length ? `${(statusCounts[key] / buildings.length) * 100}%` : '0%',
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium w-8 text-right" style={{ color: '#1d1d1f' }}>{statusCounts[key]}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold" style={{ color: '#1d1d1f' }}>기술자 현황</h2>
            <Link to="/technicians" className="text-xs" style={{ color: '#0066cc' }}>전체 보기</Link>
          </div>
          {technicians.length === 0 ? (
            <EmptyState text="등록된 기술자가 없습니다." link="/technicians" linkText="기술자 등록하기" />
          ) : (
            <div className="space-y-2">
              {GRADES.map(grade => (
                <div key={grade} className="flex items-center justify-between py-1.5" style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <span className="text-sm" style={{ color: '#333333' }}>{grade}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold" style={{ color: '#1d1d1f' }}>{gradeCounts[grade] || 0}명</span>
                    <button
                      onClick={() => gradeCounts[grade] > 0 && setGradePopup(grade)}
                      className="p-1 rounded-md transition-colors"
                      style={{ color: gradeCounts[grade] > 0 ? '#0066cc' : '#cccccc', cursor: gradeCounts[grade] > 0 ? 'pointer' : 'default' }}
                      title={gradeCounts[grade] > 0 ? `${grade} 목록 보기` : undefined}
                    >
                      <Users size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 기술자 등급별 목록 팝업 */}
      {gradePopup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-sm" style={{ borderRadius: '18px', border: '1px solid #e0e0e0' }}>
            <div className="flex items-center justify-between p-5" style={{ borderBottom: '1px solid #f0f0f0' }}>
              <div className="flex items-center gap-2">
                <HardHat size={16} style={{ color: '#0066cc' }} />
                <h3 className="font-semibold" style={{ color: '#1d1d1f', fontSize: '15px' }}>{gradePopup}</h3>
                <span className="text-sm" style={{ color: '#7a7a7a' }}>{popupTechnicians.length}명</span>
              </div>
              <button onClick={() => setGradePopup(null)} style={{ color: '#7a7a7a' }}><X size={20} /></button>
            </div>
            <div className="p-4 space-y-2 max-h-80 overflow-y-auto">
              {popupTechnicians.map(t => (
                <div key={t.id} className="flex items-center justify-between px-3 py-2.5 rounded-[11px]" style={{ backgroundColor: '#f5f5f7' }}>
                  <span className="text-sm font-medium" style={{ color: '#1d1d1f' }}>{t.name}</span>
                  <span className="text-xs" style={{ color: '#7a7a7a' }}>{t.phone}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
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
        <p className="text-2xl font-bold" style={{ color: '#1d1d1f' }}>{value}</p>
        <p className="text-sm font-medium" style={{ color: '#333333' }}>{label}</p>
        <p className="text-xs" style={{ color: '#7a7a7a' }}>{sub}</p>
      </div>
    </div>
  )
}

function EmptyState({ text, link, linkText }: { text: string; link: string; linkText: string }) {
  return (
    <div className="text-center py-6">
      <p className="text-sm mb-2" style={{ color: '#7a7a7a' }}>{text}</p>
      <Link to={link} className="text-sm" style={{ color: '#0066cc' }}>{linkText}</Link>
    </div>
  )
}
