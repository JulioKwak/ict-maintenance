import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ModalProvider } from './context/ModalContext'
import { canAccessPath, homePathForRole } from './utils/permissions'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import BuildingRegister from './pages/BuildingRegister'
import Inspection from './pages/Inspection'
import InspectionReview from './pages/InspectionReview'
import BuildingManagement from './pages/BuildingManagement'
import AIGenerate from './pages/AIGenerate'
import ResourceLibrary from './pages/ResourceLibrary'
import TechnicianManagement from './pages/TechnicianManagement'
import UserManagement from './pages/UserManagement'
import MyInspections from './pages/MyInspections'
import WageRateManagement from './pages/WageRateManagement'
import CompanyManagement from './pages/CompanyManagement'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const location = useLocation()
  if (!user) return <Navigate to="/login" replace />
  if (!canAccessPath(user.role, location.pathname)) {
    return <Navigate to={homePathForRole(user.role)} replace />
  }
  return <Layout>{children}</Layout>
}

function AppRoutes() {
  const { user } = useAuth()
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to={homePathForRole(user.role)} replace /> : <Login />} />
      <Route path="/" element={<Navigate to={homePathForRole(user?.role)} replace />} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/building-register" element={<ProtectedRoute><BuildingRegister /></ProtectedRoute>} />
      <Route path="/inspection" element={<ProtectedRoute><Inspection /></ProtectedRoute>} />
      <Route path="/inspection-review" element={<ProtectedRoute><InspectionReview /></ProtectedRoute>} />
      <Route path="/buildings" element={<ProtectedRoute><BuildingManagement /></ProtectedRoute>} />
      <Route path="/ai-generate" element={<ProtectedRoute><AIGenerate /></ProtectedRoute>} />
      <Route path="/resources" element={<ProtectedRoute><ResourceLibrary /></ProtectedRoute>} />
      <Route path="/technicians" element={<ProtectedRoute><TechnicianManagement /></ProtectedRoute>} />
      <Route path="/users" element={<ProtectedRoute><UserManagement /></ProtectedRoute>} />
      <Route path="/my-inspections" element={<ProtectedRoute><MyInspections /></ProtectedRoute>} />
      <Route path="/wage-rates" element={<ProtectedRoute><WageRateManagement /></ProtectedRoute>} />
      <Route path="/company" element={<ProtectedRoute><CompanyManagement /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to={homePathForRole(user?.role)} replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ModalProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ModalProvider>
    </BrowserRouter>
  )
}
