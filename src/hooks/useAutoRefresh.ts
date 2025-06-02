import { useEffect, useRef } from 'react'
import { RefreshInterval } from '@/types'
import { getRefreshIntervalMs } from '@/lib/settings'

export function useAutoRefresh(
  refreshFunction: () => void,
  interval: RefreshInterval,
  dependencies: any[] = []
) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Clear existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    // Get interval in milliseconds
    const intervalMs = getRefreshIntervalMs(interval)

    // Set up new interval if not off
    if (intervalMs) {
      intervalRef.current = setInterval(refreshFunction, intervalMs)
    }

    // Cleanup on unmount or dependency change
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [interval, ...dependencies])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])
} 