import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/auth.store'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import RiskMonitorPage from './pages/RiskMonitorPage'
import AlertsPage from './pages/AlertsPage'

function App() {
  const { isAuthenticated } = useAuthStore()

  return (
    <Routes>
      <Route
        path="/login"
        element={!isAuthenticated ? <LoginPage /> : <Navigate to="/dashboard" />}
      />
      <Route
        path="/dashboard"
        element={isAuthenticated ? <DashboardPage /> : <Navigate to="/login" />}
      />
      <Route
        path="/monitor"
        element={isAuthenticated ? <RiskMonitorPage /> : <Navigate to="/login" />}
      />
      <Route
        path="/alerts"
        element={isAuthenticated ? <AlertsPage /> : <Navigate to="/login" />}
      />
      <Route path="/" element={<Navigate to="/dashboard" />} />
    </Routes>
  )
}

export default App
