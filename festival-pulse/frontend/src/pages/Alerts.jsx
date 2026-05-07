import AlertCard from "../components/AlertCard.jsx"
import { api } from "../api.js"

export default function Alerts({ activeAlerts, loading, error, refresh }) {
  if (loading) return <div className="page-loading">Loading…</div>
  if (error)   return <div className="page-error">Could not load alerts: {error}</div>

  async function handleResolve(id) {
    try { await api.resolveAlert(id); refresh() }
    catch (e) { alert("Failed to resolve: " + e.message) }
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Alerts</h1>
        {activeAlerts.length > 0 && (
          <span className="badge badge--active">{activeAlerts.length} active</span>
        )}
      </div>

      {activeAlerts.length === 0 ? (
        <div className="panel">
          <p className="empty-state">No active alerts — all areas are under control.</p>
        </div>
      ) : (
        <div className="alerts-list">
          {activeAlerts.map(a => (
            <AlertCard key={a.id} alert={a} onResolve={handleResolve} />
          ))}
        </div>
      )}
    </div>
  )
}
