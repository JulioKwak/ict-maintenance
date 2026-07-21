import { useState, useEffect, useMemo, type FormEvent } from 'react'
import { Plus, Pencil, Trash2, X, HardHat } from 'lucide-react'
import { techniciansApi } from '../utils/api'
import { formatPhone } from '../utils/phone'
import { useAuth } from '../context/AuthContext'
import { canDelete } from '../utils/permissions'
import type { Technician, TechnicianGrade } from '../types'

const GRADES: TechnicianGrade[] = ['특급기술자', '고급기술자', '중급기술자', '초급기술자']

const GRADE_COLORS: Record<TechnicianGrade, string> = {
  특급기술자: 'bg-yellow-100 text-yellow-800',
  고급기술자: 'bg-blue-100 text-blue-800',
  중급기술자: 'bg-green-100 text-green-800',
  초급기술자: 'bg-gray-100 text-gray-700',
}

const emptyForm = (): Omit<Technician, 'id' | 'createdAt'> => ({
  name: '', grade: '초급기술자', phone: '', email: '',
})

export default function TechnicianManagement() {
  const { user } = useAuth()
  const [technicians, setTechnicians] = useState<Technician[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Technician | null>(null)
  const [form, setForm] = useState(emptyForm())
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    techniciansApi.getAll().then(setTechnicians).catch(() => {})
  }, [])

  const gradeCounts = useMemo(() => {
    const counts: Record<TechnicianGrade, number> = { 특급기술자: 0, 고급기술자: 0, 중급기술자: 0, 초급기술자: 0 }
    technicians.forEach(t => { counts[t.grade]++ })
    return counts
  }, [technicians])

  const openAdd = () => { setEditing(null); setForm(emptyForm()); setShowForm(true) }
  const openEdit = (t: Technician) => {
    setEditing(t)
    setForm({ name: t.name, grade: t.grade, phone: t.phone, email: t.email })
    setShowForm(true)
  }
  const closeForm = () => setShowForm(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (editing) {
        const updated = await techniciansApi.update(editing.id, form)
        setTechnicians(prev => prev.map(t => t.id === editing.id ? updated : t))
      } else {
        const created = await techniciansApi.create(form)
        setTechnicians(prev => [...prev, created])
      }
      closeForm()
    } catch (err) {
      alert(err instanceof Error ? err.message : '저장 중 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (t: Technician) => {
    if (!window.confirm(`"${t.name}" 기술자를 삭제하시겠습니까?`)) return
    try {
      await techniciansApi.delete(t.id)
      setTechnicians(prev => prev.filter(x => x.id !== t.id))
    } catch (err) {
      alert(err instanceof Error ? err.message : '삭제 중 오류가 발생했습니다.')
    }
  }

  return (
    <div className="max-w-4xl space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {GRADES.map(grade => (
          <div key={grade} className="card flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${GRADE_COLORS[grade]}`}>
              <HardHat size={18} />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{gradeCounts[grade]}</p>
              <p className="text-xs text-gray-500">{grade}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-800">기술자 목록 ({technicians.length}명)</h2>
          <button onClick={openAdd} className="btn-primary text-sm flex items-center gap-1.5">
            <Plus size={14} />기술자 등록
          </button>
        </div>

        {technicians.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <HardHat size={32} className="mx-auto mb-2 opacity-40" />
            <p>등록된 기술자가 없습니다.</p>
          </div>
        ) : (
          <>
            {/* 모바일 카드 리스트 */}
            <div className="md:hidden divide-y divide-[#f0f0f0]">
              {technicians.map(t => (
                <div key={t.id} className="flex items-center justify-between py-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-[#1d1d1f] text-sm">{t.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${GRADE_COLORS[t.grade]}`}>{t.grade}</span>
                    </div>
                    <p className="text-xs text-[#7a7a7a] mt-0.5">{t.phone || '연락처 없음'}</p>
                  </div>
                  <div className="flex items-center gap-0.5 shrink-0 ml-3">
                    <button onClick={() => openEdit(t)} className="p-2" style={{ color: '#0066cc' }}>
                      <Pencil size={15} />
                    </button>
                    {canDelete(user?.role) && (
                    <button onClick={() => handleDelete(t)} className="p-2" style={{ color: '#ff3b30' }}>
                      <Trash2 size={15} />
                    </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* 데스크탑 테이블 */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#f0f0f0]">
                    <th className="text-left py-2.5 text-[#7a7a7a] font-medium">이름</th>
                    <th className="text-left py-2.5 text-[#7a7a7a] font-medium">등급</th>
                    <th className="text-left py-2.5 text-[#7a7a7a] font-medium">연락처</th>
                    <th className="text-left py-2.5 text-[#7a7a7a] font-medium">이메일</th>
                    <th className="text-right py-2.5 text-[#7a7a7a] font-medium">관리</th>
                  </tr>
                </thead>
                <tbody>
                  {technicians.map(t => (
                    <tr key={t.id} className="border-b border-[#f0f0f0] hover:bg-[#f5f5f7]">
                      <td className="py-3 font-medium text-[#1d1d1f] whitespace-nowrap">{t.name}</td>
                      <td className="py-3 whitespace-nowrap">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${GRADE_COLORS[t.grade]}`}>{t.grade}</span>
                      </td>
                      <td className="py-3 text-[#333333] whitespace-nowrap">{t.phone}</td>
                      <td className="py-3 text-[#333333]">{t.email}</td>
                      <td className="py-3 text-right whitespace-nowrap">
                        <button onClick={() => openEdit(t)} className="p-1 mr-1" style={{ color: '#0066cc' }}>
                          <Pencil size={14} />
                        </button>
                        {canDelete(user?.role) && (
                        <button onClick={() => handleDelete(t)} className="p-1" style={{ color: '#ff3b30' }}>
                          <Trash2 size={14} />
                        </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md" style={{ borderRadius: '18px', border: '1px solid #e0e0e0' }}>
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="font-semibold text-gray-900">{editing ? '기술자 수정' : '기술자 등록'}</h3>
              <button onClick={closeForm} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">이름 *</label>
                <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="input-field" placeholder="기술자 이름" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">기술자 등급 *</label>
                <select value={form.grade} onChange={e => setForm(f => ({ ...f, grade: e.target.value as TechnicianGrade }))}
                  className="input-field">
                  {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">연락처</label>
                <input type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: formatPhone(e.target.value) }))}
                  className="input-field" placeholder="010-0000-0000" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
                <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="input-field" placeholder="email@example.com" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn-primary flex-1 disabled:opacity-60" disabled={saving}>
                  {saving ? '저장 중...' : editing ? '수정' : '등록'}
                </button>
                <button type="button" onClick={closeForm} className="btn-secondary flex-1">취소</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
