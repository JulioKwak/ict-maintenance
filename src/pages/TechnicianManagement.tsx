import { useState, useMemo, type FormEvent } from 'react'
import { Plus, Pencil, Trash2, X, HardHat } from 'lucide-react'
import { getTechnicians, addTechnician, updateTechnician, deleteTechnician, generateId } from '../utils/storage'
import type { Technician, TechnicianGrade } from '../types'

const GRADES: TechnicianGrade[] = ['특급기술자', '고급기술자', '중급기술자', '초급기술자']

const GRADE_COLORS: Record<TechnicianGrade, string> = {
  특급기술자: 'bg-yellow-100 text-yellow-800',
  고급기술자: 'bg-blue-100 text-blue-800',
  중급기술자: 'bg-green-100 text-green-800',
  초급기술자: 'bg-gray-100 text-gray-700',
}

const empty = (): Omit<Technician, 'id' | 'createdAt'> => ({
  name: '', grade: '초급기술자', phone: '', email: '',
})

export default function TechnicianManagement() {
  const [technicians, setTechnicians] = useState(() => getTechnicians())
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Technician | null>(null)
  const [form, setForm] = useState(empty())

  const gradeCounts = useMemo(() => {
    const counts: Record<TechnicianGrade, number> = { 특급기술자: 0, 고급기술자: 0, 중급기술자: 0, 초급기술자: 0 }
    technicians.forEach(t => { counts[t.grade]++ })
    return counts
  }, [technicians])

  const openAdd = () => { setEditing(null); setForm(empty()); setShowForm(true) }
  const openEdit = (t: Technician) => { setEditing(t); setForm({ name: t.name, grade: t.grade, phone: t.phone, email: t.email }); setShowForm(true) }
  const closeForm = () => setShowForm(false)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (editing) {
      const updated: Technician = { ...editing, ...form, }
      updateTechnician(updated)
    } else {
      const newT: Technician = { id: generateId(), ...form, createdAt: new Date().toISOString() }
      addTechnician(newT)
    }
    setTechnicians(getTechnicians())
    closeForm()
  }

  const handleDelete = (t: Technician) => {
    if (!window.confirm(`"${t.name}" 기술자를 삭제하시겠습니까?`)) return
    deleteTechnician(t.id)
    setTechnicians(getTechnicians())
  }

  return (
    <div className="max-w-4xl space-y-4">
      {/* 등급별 현황 */}
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

      {/* 목록 */}
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
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2.5 text-gray-500 font-medium">이름</th>
                  <th className="text-left py-2.5 text-gray-500 font-medium">등급</th>
                  <th className="text-left py-2.5 text-gray-500 font-medium">연락처</th>
                  <th className="text-left py-2.5 text-gray-500 font-medium">이메일</th>
                  <th className="text-right py-2.5 text-gray-500 font-medium">관리</th>
                </tr>
              </thead>
              <tbody>
                {technicians.map(t => (
                  <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 font-medium text-gray-900">{t.name}</td>
                    <td className="py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${GRADE_COLORS[t.grade]}`}>{t.grade}</span>
                    </td>
                    <td className="py-3 text-gray-600">{t.phone}</td>
                    <td className="py-3 text-gray-600">{t.email}</td>
                    <td className="py-3 text-right">
                      <button onClick={() => openEdit(t)} className="text-blue-500 hover:text-blue-700 p-1 mr-1">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => handleDelete(t)} className="text-red-400 hover:text-red-600 p-1">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 등록/수정 모달 */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="font-semibold text-gray-900">{editing ? '기술자 수정' : '기술자 등록'}</h3>
              <button onClick={closeForm} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">이름 *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="input-field"
                  placeholder="기술자 이름"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">기술자 등급 *</label>
                <select
                  value={form.grade}
                  onChange={e => setForm(f => ({ ...f, grade: e.target.value as TechnicianGrade }))}
                  className="input-field"
                >
                  {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">연락처</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  className="input-field"
                  placeholder="010-0000-0000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="input-field"
                  placeholder="email@example.com"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn-primary flex-1">{editing ? '수정' : '등록'}</button>
                <button type="button" onClick={closeForm} className="btn-secondary flex-1">취소</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
