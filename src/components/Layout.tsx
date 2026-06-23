import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Building2,
  ClipboardList,
  ClipboardCheck,
  Wrench,
  Sparkles,
  HardHat,
  Users,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const NAV_ITEMS = [
  { path: '/dashboard', label: '대시보드', icon: LayoutDashboard },
  { path: '/building-register', label: '건축물 등록', icon: Building2 },
  { path: '/inspection', label: '건축물별 점검표 작성', icon: ClipboardList },
  { path: '/inspection-review', label: '점검표 검수 및 관리', icon: ClipboardCheck },
  { path: '/buildings', label: '건축물 관리', icon: Wrench },
  { path: '/ai-generate', label: 'AI생성', icon: Sparkles },
  { path: '/technicians', label: '기술자관리', icon: HardHat },
  { path: '/users', label: '사용자관리', icon: Users },
]

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const roleLabel = {
    admin: '관리자',
    reviewer: '검토자',
    inspector: '점검자',
  }[user?.role ?? 'inspector']

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-60' : 'w-16'
        } bg-slate-900 text-white flex flex-col transition-all duration-200 shrink-0`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-14 px-4 border-b border-slate-700">
          {sidebarOpen && (
            <span className="font-bold text-sm leading-tight text-blue-300">
              정보통신설비<br />유지보수관리
            </span>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-slate-400 hover:text-white p-1 rounded"
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 overflow-y-auto">
          {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
            const active = location.pathname.startsWith(path)
            return (
              <Link
                key={path}
                to={path}
                className={`flex items-center gap-3 px-4 py-2.5 mx-2 rounded-md text-sm transition-colors ${
                  active
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
                title={!sidebarOpen ? label : undefined}
              >
                <Icon size={18} className="shrink-0" />
                {sidebarOpen && (
                  <>
                    <span className="flex-1 text-xs leading-tight">{label}</span>
                    {active && <ChevronRight size={14} />}
                  </>
                )}
              </Link>
            )
          })}
        </nav>

        {/* User info */}
        <div className="border-t border-slate-700 p-3">
          {sidebarOpen ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{user?.name}</p>
                <p className="text-xs text-slate-400">{roleLabel}</p>
              </div>
              <button
                onClick={handleLogout}
                className="text-slate-400 hover:text-white p-1.5 rounded hover:bg-slate-700"
                title="로그아웃"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogout}
              className="text-slate-400 hover:text-white p-1.5 rounded hover:bg-slate-700 w-full flex justify-center"
              title="로그아웃"
            >
              <LogOut size={16} />
            </button>
          )}
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 h-14 flex items-center px-6 shrink-0">
          <h1 className="text-base font-semibold text-gray-700">
            {NAV_ITEMS.find(n => location.pathname.startsWith(n.path))?.label ?? '정보통신설비 유지보수관리'}
          </h1>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
