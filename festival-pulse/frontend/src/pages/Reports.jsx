import CrowdBadge from "../components/CrowdBadge.jsx"
import { formatDate, sortedDesc } from "../utils.js"

export default function Reports({ reports, loading, error }) {
  if (loading) return <div className="page-loading">Loading…</div>
  if (error)   return <div className="page-error">Could not load reports: {error}</div>

  const sorted = sortedDesc(reports, "reportedAt")

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Reports</h1>
      </div>
      <div className="panel">
        {sorted.length === 0 ? <p className="empty-state">No reports submitted yet.</p> : (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Time</th><th>Area</th><th>Level</th><th>Reporter</th></tr></thead>
              <tbody>
                {sorted.map(r => (
                  <tr key={r.id}>
                    <td>{formatDate(r.reportedAt)}</td>
                    <td>{r.area?.name ?? "—"}</td>
                    <td><CrowdBadge level={r.crowdLevel} /></td>
                    <td>{r.steward ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
