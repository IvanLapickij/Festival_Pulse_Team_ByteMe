import { useState, useCallback, useEffect } from "react"
import { api } from "../api.js"

export function useData() {
  const [areas, setAreas]               = useState([])
  const [reports, setReports]           = useState([])
  const [activeAlerts, setActiveAlerts] = useState([])
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState(null)

  const load = useCallback(async () => {
    try {
      const [areas, alerts, reports] = await Promise.all([
        api.getAreas(),
        api.getAlerts(),
        api.getReports(),
      ])
      setAreas(areas ?? [])
      setActiveAlerts(alerts ?? [])
      setReports(reports ?? [])
      setError(null)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    const id = setInterval(load, 30_000)
    return () => clearInterval(id)
  }, [load])

  return { areas, reports, activeAlerts, loading, error, refresh: load }
}
