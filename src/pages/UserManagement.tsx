import { useState, useEffect, type FormEvent } from 'react'
import { Plus, Pencil, Trash2, X, Users } from 'lucide-react'
import { usersApi } from '../utils/api'
import { formatPhone } from '../utils/phone'
import { useAuth } from '../context/AuthContext'
import { canDelete } from '../utils/permissions'
import type { User, UserRole } from '../types'

const ROLES: { value: UserRole; label: string }[] = [
  { value: 'admin', label: '관리자' },
  { value: 'reviewer', label: '검토자' },
  { value: 'inspector', label: '점검자' },
]

const ROLE_COLORS: Record<UserRole, string> = {
  admin: 'bg-red-100 text-red-700',
  reviewer: 'bg-blue-100 text-blue-700',
  inspector: 'bg-green-100 text-green-700',
}

type FormState = { username: string; name: string; phone: string; email: string; role: UserRole; password: string }
const emptyForm = (): FormState => ({ username: '', name: '', phone: '', email: '', role: 'inspector', password: '' })

export default function UserManagement() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<User | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm())
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    usersApi.getAll().then(setUsers).catch(() => {})
  }, [])

  const openAdd = () => { setEditing(null); setForm(emptyForm()); setShowForm(true) }
  const openEdit = (u: User) => {
    setEditing(u)
    setForm({ username: u.username, name: u.name, phone: u.phone, email: u.email, role: u.role, password: '' })
    setShowForm(true)
  }
  const closeForm = () => setShowForm(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (editing) {
        const updated = await usersApi.update(editing.id, {
          name: form.name, phone: form.phone, email: form.email, role: form.role,
          ...(form.password ? { password: form.password } : {}),
        })
        setUsers(prev => prev.map(u => u.id === editing.id ? updated : u))
      } else {
        if (!form.password) { alert('비밀번호를 입력하세요.'); return }
        const created = await usersApi.create({
          username: form.username, name: form.name, phone: form.phone,
          email: form.email, role: form.role, password: form.password,
        })
        setUsers(prev => [...prev, created])
      }
      closeForm()
    } catch (err) {
      alert(err instanceof Error ? err.message : '저장 중 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (u: User) => {
    if (u.id === currentUser?.id) { alert('현재 로그인 중인 계정은 삭제할 수 없습니다.'); return }
    if (!window.confirm(`"${u.name}" 사용자를 삭제하시겠습니까?`)) return
    try {
      await usersApi.delete(u.id)
      setUsers(prev => prev.filter(x => x.id !== u.id))
    } catch (err) {
      alert(err instanceof Error ? err.message : '삭제 중 오류가 발생했습니다.')
    }
  }

  return (
    <div className="max-w-4xl space-y-4">
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-800">사용자 목록 ({users.length}명)</h2>
          <button onClick={openAdd} className="btn-primary text-sm flex items-center gap-1.5">
            <Plus size={14} />사용자 등록
          </button>
        </div>

        {users.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <Users size={32} className="mx-auto mb-2 opacity-40" />
            <p>등록된 사용자가 없습니다.</p>
          </div>
        ) : (
          <>
            {/* 모바일 카드 리스트 */}
            <div className="md:hidden divide-y divide-[#f0f0f0]">
              {users.map(u => (
                <div key={u.id} className="flex items-center justify-between py-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-[#1d1d1f] text-sm">
                        {u.name}
                        {u.id === currentUser?.id && <span className="ml-1 text-xs" style={{ color: '#0066cc' }}>(나)</span>}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${ROLE_COLORS[u.role]}`}>
                        {ROLES.find(r => r.value === u.role)?.label}
                      </span>
                    </div>
                    <p className="text-xs text-[#7a7a7a] mt-0.5">
                      {u.username} · {u.phone || '연락처 없음'}
                    </p>
                  </div>
                  <div className="flex items-center gap-0.5 shrink-0 ml-3">
                    <button onClick={() => openEdit(u)} className="p-2" style={{ color: '#0066cc' }}>
                      <Pencil size={15} />
                    </button>
                    {canDelete(currentUser?.role) && (
                    <button
                      onClick={() => handleDelete(u)}
                      disabled={u.id === currentUser?.id}
                      className="p-2 disabled:opacity-30 disabled:cursor-not-allowed"
                      style={{ color: '#ff3b30' }}
                    >
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
                    <th className="text-left py-2.5 text-[#7a7a7a] font-medium">아이디</th>
                    <th className="text-left py-2.5 text-[#7a7a7a] font-medium">이름</th>
                    <th className="text-left py-2.5 text-[#7a7a7a] font-medium">권한</th>
                    <th className="text-left py-2.5 text-[#7a7a7a] font-medium">연락처</th>
                    <th className="text-left py-2.5 text-[#7a7a7a] font-medium">이메일</th>
                    <th className="text-right py-2.5 text-[#7a7a7a] font-medium">관리</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} className="border-b border-[#f0f0f0] hover:bg-[#f5f5f7]">
                      <td className="py-3 font-mono text-[#1d1d1f] whitespace-nowrap">{u.username}</td>
                      <td className="py-3 font-medium text-[#1d1d1f] whitespace-nowrap">
                        {u.name}
                        {u.id === currentUser?.id && <span className="ml-1.5 text-xs" style={{ color: '#0066cc' }}>(나)</span>}
                      </td>
                      <td className="py-3 whitespace-nowrap">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${ROLE_COLORS[u.role]}`}>
                          {ROLES.find(r => r.value === u.role)?.label}
                        </span>
                      </td>
                      <td className="py-3 text-[#333333] whitespace-nowrap">{u.phone}</td>
                      <td className="py-3 text-[#333333]">{u.email}</td>
                      <td className="py-3 text-right whitespace-nowrap">
                        <button onClick={() => openEdit(u)} className="p-1 mr-1" style={{ color: '#0066cc' }}>
                          <Pencil size={14} />
                        </button>
                        {canDelete(currentUser?.role) && (
                        <button onClick={() => handleDelete(u)} disabled={u.id === currentUser?.id}
                          className="p-1 disabled:opacity-30 disabled:cursor-not-allowed" style={{ color: '#ff3b30' }}>
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
              <h3 className="font-semibold text-gray-900">{editing ? '사용자 수정' : '사용자 등록'}</h3>
              <button onClick={closeForm} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">아이디 *</label>
                <input type="text" value={form.username}
                  onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                  className="input-field" placeholder="로그인 아이디" required disabled={!!editing} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">이름 *</label>
                <input type="text" value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="input-field" placeholder="사용자 이름" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  비밀번호 {editing ? '(변경 시 입력)' : '*'}
                </label>
                <input type="password" value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  className="input-field"
                  placeholder={editing ? '변경하지 않으면 비워두세요' : '비밀번호 입력'}
                  required={!editing} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">권한 *</label>
                <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value as UserRole }))}
                  className="input-field">
                  {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">연락처</label>
                <input type="tel" value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: formatPhone(e.target.value) }))}
                  className="input-field" placeholder="010-0000-0000" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
                <input type="email" value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
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
