import { useState, useEffect, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (sessionStorage.getItem('ict_session_expired')) {
      sessionStorage.removeItem('ict_session_expired')
      setError('장시간(1시간 이상) 활동이 없어 자동으로 로그아웃되었습니다. 다시 로그인해주세요.')
    }
  }, [])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const ok = await login(username, password)
      if (ok) {
        navigate('/dashboard')
      } else {
        setError('아이디 또는 비밀번호가 올바르지 않습니다.')
      }
    } catch {
      setError('로그인 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ backgroundColor: '#f5f5f7' }}
    >
      <div className="w-full max-w-[360px]">

        {/* 로고 & 타이틀 */}
        <div className="text-center mb-8">
          <img
            src="/logo.png"
            alt="로고"
            className="mx-auto mb-5"
            style={{ height: '68px', width: 'auto', objectFit: 'contain' }}
          />
          <h1
            className="font-semibold"
            style={{
              fontFamily: '"SF Pro Display", system-ui, -apple-system, sans-serif',
              fontSize: '28px',
              letterSpacing: '-0.028em',
              color: '#1d1d1f',
              lineHeight: 1.1,
            }}
          >
            정보통신설비<br />유지보수·관리 시스템
          </h1>
          <p
            className="mt-1.5"
            style={{ fontSize: '15px', color: '#7a7a7a', letterSpacing: '-0.022em' }}
          >
            한국전파진흥협회
          </p>
        </div>

        {/* 폼 카드 */}
        <div className="card" style={{ padding: '28px 24px' }}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                className="block font-medium mb-1.5"
                style={{ fontSize: '13px', color: '#1d1d1f', letterSpacing: '-0.014em' }}
              >
                아이디
              </label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="input-field"
                placeholder="아이디를 입력하세요"
                autoComplete="username"
                required
              />
            </div>

            <div>
              <label
                className="block font-medium mb-1.5"
                style={{ fontSize: '13px', color: '#1d1d1f', letterSpacing: '-0.014em' }}
              >
                비밀번호
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="input-field"
                placeholder="비밀번호를 입력하세요"
                autoComplete="current-password"
                required
              />
            </div>

            {error && (
              <div
                className="px-4 py-2.5 rounded-[11px] text-sm"
                style={{ backgroundColor: 'rgba(255,59,48,0.08)', color: '#ff3b30', fontSize: '13px' }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn-primary w-full disabled:opacity-50"
              style={{ padding: '13px 22px', fontSize: '16px', marginTop: '4px' }}
              disabled={loading}
            >
              {loading ? '로그인 중...' : '로그인'}
            </button>
          </form>
        </div>

        <p
          className="text-center mt-5"
          style={{ fontSize: '12px', color: '#7a7a7a', letterSpacing: '-0.012px' }}
        >
          계정 발급은 관리자에게 문의하세요.
        </p>
      </div>
    </div>
  )
}
