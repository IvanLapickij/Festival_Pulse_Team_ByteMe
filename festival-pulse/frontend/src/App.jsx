import { Routes, Route, Navigate, useNavigate } from "react-router-dom"
import { useCallback, useEffect } from "react"
import Sidebar from "./components/Sidebar.jsx"
import Dashboard from "./pages/Dashboard.jsx"
import Areas from "./pages/Areas.jsx"
import Reports from "./pages/Reports.jsx"
import Alerts from "./pages/Alerts.jsx"
import { useData } from "./hooks/useData.js"
import { useSSE } from "./hooks/useSSE.js"

export default function App() {
  const data = useData()
  const navigate = useNavigate()

  const handleAlert = useCallback(() => {
    data.refresh()
  }, [data.refresh])

  useSSE(handleAlert)

  return (
    <div className="app-shell">
      <Sidebar activeAlertCount={data.activeAlerts.length} />
      <main className="content">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard {...data} />} />
          <Route path="/areas" element={<Areas {...data} />} />
          <Route path="/reports" element={<Reports {...data} />} />
          <Route path="/alerts" element={<Alerts {...data} />} />
        </Routes>
      </main>
    </div>
  )
}
