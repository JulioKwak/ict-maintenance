import { useState } from 'react'
import { X, Lock } from 'lucide-react'
import { authApi } from '../utils/api'
import { useAuth } from '../context/AuthContext'

interface Props {
  isOpen: boolean
  title: string
  onClose: () => void
  onConfirm: () => Promise<void> | void
}

export default function PasswordConfirmModal({ isOpen, title, onClose, onConfirm }: Props) {
  const { user } = useAuth()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [checking, setChecking] = useState(false)

  if (!isOpen) return null

  const handleConfirm = async () => {
    if (!password) { setError('비밀번호를 입력하세요.'); return }
    setChecking(true)
    setError('')
    try {
      const ok = await authApi.verifyPassword(user?.username ?? '', password)
      if (ok) {
        await onConfirm()
        handleClose()
      } else {
        setError('비밀번호가 올바르지 않습니다.')
      }
    } catch {
      setError('오류가 발생했습니다.')
    } finally {
      setChecking(false)
    }
  }

  const handleClose = () => {
    setPassword('')
    setError('')
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-sm" style={{ borderRadius: '18px', border: '1px solid #e0e0e0' }}>
        <div className="flex items-center justify-between p-5" style={{ borderBottom: '1px solid #f0f0f0' }}>
          <div className="flex items-center gap-2">
            <Lock size={16} style={{ color: '#ff3b30' }} />
            <h3 className="font-semibold" style={{ color: '#1d1d1f', fontSize: '15px' }}>{title}</h3>
          </div>
          <button onClick={handleClose} style={{ color: '#7a7a7a' }}><X size={20} /></button>
        </div>
        <div className="p-5 space-y-4">
          <p style={{ fontSize: '14px', color: '#333333' }}>
            삭제하려면 현재 계정(<strong>{user?.username}</strong>)의 비밀번호를 입력하세요.
          </p>
          <input
            type="password"
            value={password}
            onChange={e => { setPassword(e.target.value); setError('') }}
            onKeyDown={e => e.key === 'Enter' && handleConfirm()}
            className="input-field"
            placeholder="비밀번호 입력"
            autoFocus
          />
          {error && (
            <div className="px-3 py-2 rounded-[11px]" style={{ backgroundColor: 'rgba(255,59,48,0.08)', color: '#ff3b30', fontSize: '13px' }}>
              {error}
            </div>
          )}
          <div className="flex gap-3">
            <button onClick={handleConfirm} disabled={checking} className="btn-danger flex-1">
              {checking ? '확인 중...' : '삭제 확인'}
            </button>
            <button onClick={handleClose} className="btn-secondary flex-1">취소</button>
          </div>
        </div>
      </div>
    </div>
  )
}
