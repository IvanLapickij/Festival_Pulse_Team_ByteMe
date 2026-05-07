import { useState } from "react"
import CrowdBadge from "../components/CrowdBadge.jsx"
import { shapeFor, LEVEL_COLOR, LEVEL_BG, currentLevel } from "../utils.js"
import { api } from "../api.js"

const LEVELS = ["LOW", "MEDIUM", "FULL"]

export default function Areas({ areas, reports, loading, error, refresh }) {
  const [selectedAreaId, setSelectedAreaId] = useState("")
  const [crowdLevel, setCrowdLevel]         = useState("LOW")
  const [steward, setSteward]               = useState("")
  const [submitting, setSubmitting]         = useState(false)
  const [submitError, setSubmitError]       = useState(null)

  if (loading) return <div className="page-loading">Loading…</div>
  if (error)   return <div className="page-error">Could not load areas: {error}</div>

  async function handleSubmit(e) {
    e.preventDefault()
    if (!selectedAreaId) { setSubmitError("Please select an area."); return }
    setSubmitting(true); setSubmitError(null)
    try {
      await api.submitReport({ areaId: Number(selectedAreaId), crowdLevel, steward: steward || undefined })
      setSteward("")
      refresh()
    } catch (err) {
      setSubmitError(err.message)
    } finally { setSubmitting(false) }
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Festival Areas</h1>
      </div>

      <div className="map-layout">
        <div className="panel map-panel">
          <h2 className="panel-title">Live Map</h2>
          <div className="map-frame">
            <svg viewBox="0 0 1000 580" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", display: "block" }}>
              <path d="M356 147 L540 147" stroke="#94a3b8" strokeWidth="6" strokeDasharray="10,6" fill="none"/>
              <path d="M356 250 Q430 310 396 348" stroke="#94a3b8" strokeWidth="6" strokeDasharray="10,6" fill="none"/>
              <path d="M618 348 L666 438" stroke="#94a3b8" strokeWidth="6" strokeDasharray="10,6" fill="none"/>
              <path d="M840 204 L840 386" stroke="#94a3b8" strokeWidth="6" strokeDasharray="10,6" fill="none"/>
              {areas.map((area, i) => {
                const s   = shapeFor(i)
                const lvl = currentLevel(area.id, reports)
                const bg     = lvl ? LEVEL_BG[lvl]    : "#eef2f6"
                const stroke = String(area.id) === selectedAreaId ? "#6366f1"
                             : (lvl ? LEVEL_COLOR[lvl] : "#d9e0e8")
                return (
                  <g key={area.id} style={{ cursor: "pointer" }}
                     onClick={() => setSelectedAreaId(String(area.id))}>
                    <rect x={s.x} y={s.y} width={s.w} height={s.h} rx="10"
                      fill={bg} stroke={stroke}
                      strokeWidth={String(area.id) === selectedAreaId ? 3 : 2} />
                    <text x={s.x + s.w / 2} y={s.y + s.h / 2 - 8}
                      textAnchor="middle" fontSize="14" fontWeight="600" fill="#182230">
                      {area.name}
                    </text>
                    {lvl && (
                      <text x={s.x + s.w / 2} y={s.y + s.h / 2 + 14}
                        textAnchor="middle" fontSize="12" fill={LEVEL_COLOR[lvl]}>
                        {lvl}
                      </text>
                    )}
                  </g>
                )
              })}
            </svg>
          </div>
        </div>

        <div className="panel form-panel">
          <h2 className="panel-title">Submit Report</h2>
          <form onSubmit={handleSubmit} className="report-form">
            <label className="form-label">
              Area
              <select className="form-control" value={selectedAreaId}
                onChange={e => setSelectedAreaId(e.target.value)}>
                <option value="">Select area…</option>
                {areas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </label>
            <label className="form-label">
              Crowd Level
              <div className="level-buttons">
                {LEVELS.map(l => (
                  <button key={l} type="button"
                    className={"level-btn level-btn--" + l.toLowerCase() + (crowdLevel === l ? " level-btn--selected" : "")}
                    onClick={() => setCrowdLevel(l)}>{l}</button>
                ))}
              </div>
            </label>
            <label className="form-label">
              Steward <span className="form-optional">(optional)</span>
              <input className="form-control" value={steward}
                onChange={e => setSteward(e.target.value)} placeholder="Your name" />
            </label>
            {submitError && <p className="form-error">{submitError}</p>}
            <button className="btn btn--primary" type="submit" disabled={submitting}>
              {submitting ? "Submitting…" : "Submit Report"}
            </button>
          </form>

          <div className="area-list">
            <h3 className="panel-subtitle">Current Status</h3>
            {areas.map(a => (
              <div key={a.id} className="area-row">
                <span>{a.name}</span>
                <CrowdBadge level={currentLevel(a.id, reports)} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
