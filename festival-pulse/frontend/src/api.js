const BASE = "/api"

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, options)
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    throw new Error(text || `HTTP ${res.status}`)
  }
  if (res.status === 204 || res.headers.get("content-length") === "0") return null
  return res.json()
}

function qs(params) {
  return "?" + new URLSearchParams(Object.entries(params).filter(([, v]) => v != null)).toString()
}

export const api = {
  getAreas:   ()  => request("/areas"),
  getAlerts:  ()  => request("/alerts"),
  getReports: ()  => request("/reports"),
  submitReport: ({ areaId, crowdLevel, steward }) =>
    request("/reports" + qs({ areaId, crowdLevel, steward }), { method: "POST" }),
  resolveAlert: (id) => request(`/alerts/${id}/resolve`, { method: "PATCH" }),
}
