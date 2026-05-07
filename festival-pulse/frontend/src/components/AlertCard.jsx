import { formatDate } from "../utils.js"

export default function AlertCard({ alert, onResolve }) {
  return (
    <div className="alert-card">
      <div className="alert-card__header">
        <span className="alert-card__area">{alert.area?.name ?? "—"}</span>
        <span className="badge badge--active">ACTIVE</span>
      </div>
      <p className="alert-card__message">{alert.message}</p>
      <div className="alert-card__footer">
        <span className="alert-card__time">{formatDate(alert.createdAt)}</span>
        {onResolve && (
          <button className="btn btn--resolve" onClick={() => onResolve(alert.id)}>
            Resolve
          </button>
        )}
      </div>
    </div>
  )
}
