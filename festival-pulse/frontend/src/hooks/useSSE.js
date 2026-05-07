import { useEffect } from "react"

export function useSSE(onAlert) {
  useEffect(() => {
    const es = new EventSource("/api/alerts/stream")
    es.addEventListener("alert", () => onAlert())
    es.onerror = () => es.close()
    return () => es.close()
  }, [onAlert])
}
