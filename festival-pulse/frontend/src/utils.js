export function formatDate(value) {
  if (!value) return "—"
  return new Date(value).toLocaleString("en-GB", {
    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
  })
}

export function sortedDesc(arr, key) {
  return [...arr].sort((a, b) => new Date(b[key]) - new Date(a[key]))
}

// Derive current crowd level for an area from its most recent report
export function currentLevel(areaId, reports) {
  const sorted = [...reports]
    .filter(r => r.area?.id === areaId)
    .sort((a, b) => new Date(b.reportedAt) - new Date(a.reportedAt))
  return sorted[0]?.crowdLevel ?? null
}

const SHAPES = [
  { x: 56,  y: 62,  w: 300, h: 170 },
  { x: 540, y: 54,  w: 300, h: 150 },
  { x: 88,  y: 324, w: 248, h: 170 },
  { x: 396, y: 348, w: 222, h: 130 },
  { x: 666, y: 386, w: 190, h: 104 },
]
export const shapeFor = (i) => SHAPES[i] ?? { x: 50 + i * 80, y: 50, w: 160, h: 100 }

export const LEVEL_COLOR = { LOW: "#16a34a", MEDIUM: "#f59e0b", FULL: "#dc2626" }
export const LEVEL_BG    = { LOW: "#dcfce7", MEDIUM: "#fef3c7", FULL: "#fee2e2" }
