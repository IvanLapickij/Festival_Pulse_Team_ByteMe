export default function CrowdBadge({ level }) {
  if (!level) return <span className="badge badge--none">—</span>
  const cls = { LOW: "badge badge--low", MEDIUM: "badge badge--medium", FULL: "badge badge--full" }
  return <span className={cls[level] ?? "badge"}>{level}</span>
}
