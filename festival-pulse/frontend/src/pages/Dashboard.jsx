import { Link } from "react-router-dom"
import AlertCard from "../components/AlertCard.jsx"
import CrowdBadge from "../components/CrowdBadge.jsx"
import { formatDate, sortedDesc } from "../utils.js"
import { api } from "../api.js"

export default function Dashboard({ areas, reports, activeAlerts, loading, error, refresh }) {
  if (loading) return <div className="page-loading">Loading…</div>
  if (error)   return <div className="page-error">Could not load dashboard: {error}</div>

  const recent = sortedDesc(reports, "reportedAt").slice(0, 5)

  async function handleResolve(id) {
    try { await api.resolveAlert(id); refresh() }
    catch (e) { alert("Failed to resolve: " + e.message) }
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
      </div>

      <div className="summary-grid">
        <div className="summary-card">
          <span className="summary-label">Total Areas</span>
          <span className="summary-value">{areas.length}</span>
        </div>
        <div className="summary-card summary-card--alert">
          <span className="summary-label">Active Alerts</span>
          <span className="summary-value">{activeAlerts.length}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Total Reports</span>
          <span className="summary-value">{reports.length}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Areas Monitored</span>
          <span className="summary-value">{areas.length}</span>
        </div>
      </div>

      <div className="content-grid">
        <section className="panel">
          <h2 className="panel-title">Recent Reports</h2>
          {recent.length === 0 ? <p className="empty-state">No reports yet.</p> : (
            <table className="table">
              <thead><tr><th>Area</th><th>Level</th><th>Reporter</th><th>Time</th></tr></thead>
              <tbody>
                {recent.map(r => (
                  <tr key={r.id}>
                    <td>{r.area?.name ?? "—"}</td>
                    <td><CrowdBadge level={r.crowdLevel} /></td>
                    <td>{r.steward ?? "—"}</td>
                    <td>{formatDate(r.reportedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="panel">
          <h2 className="panel-title">Active Alerts</h2>
          {activeAlerts.length === 0 ? (
            <p className="empty-state">No active alerts — all areas under control.</p>
          ) : activeAlerts.slice(0, 4).map(a => (
            <AlertCard key={a.id} alert={a} onResolve={handleResolve} />
          ))}
        </section>
      </div>
    </div>
  )
}
