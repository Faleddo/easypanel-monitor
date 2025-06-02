import { AppSettings, DEFAULT_SETTINGS } from "@/types"

const SETTINGS_KEY = 'easypanel_monitor_settings'

export function getSettings(): AppSettings {
  if (typeof window === 'undefined') {
    return DEFAULT_SETTINGS
  }

  try {
    const stored = localStorage.getItem(SETTINGS_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      // Merge with defaults to ensure all fields exist
      return { ...DEFAULT_SETTINGS, ...parsed }
    }
  } catch (error) {
    console.error('Failed to load settings:', error)
  }

  return DEFAULT_SETTINGS
}

export function saveSettings(settings: AppSettings): void {
  if (typeof window === 'undefined') {
    return
  }

  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
  } catch (error) {
    console.error('Failed to save settings:', error)
  }
}

export function getRefreshIntervalMs(interval: AppSettings['homePageRefreshTime']): number | null {
  if (interval === 'off') {
    return null
  }
  return interval * 60 * 1000 // Convert minutes to milliseconds
} 