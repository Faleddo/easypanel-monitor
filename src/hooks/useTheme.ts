import { useEffect, useState } from 'react'
import { ColorMode } from '@/types'
import { getSettings } from '@/lib/settings'

export function useTheme() {
  const [colorMode, setColorMode] = useState<ColorMode>('system')
  const [systemTheme, setSystemTheme] = useState<'dark' | 'light'>('light')
  const [isLoaded, setIsLoaded] = useState(false)

  // Get the effective theme (resolving 'system' to actual theme)
  const getEffectiveTheme = (mode: ColorMode): 'dark' | 'light' => {
    if (mode === 'system') {
      return systemTheme
    }
    return mode
  }

  // Apply theme to document
  const applyTheme = (theme: 'dark' | 'light') => {
    if (typeof window === 'undefined') return
    
    const root = document.documentElement
    console.log('Applying theme:', theme) // Debug log
    
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }

  // Initialize system theme detection
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light')
    }

    // Set initial system theme
    setSystemTheme(mediaQuery.matches ? 'dark' : 'light')
    
    // Listen for changes
    mediaQuery.addEventListener('change', handleChange)
    
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  // Load color mode from settings on mount
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const settings = getSettings()
    console.log('Loaded settings:', settings) // Debug log
    setColorMode(settings.colorMode)
    setIsLoaded(true)
  }, [])

  // Listen for settings changes (cross-tab sync)
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const handleStorageChange = () => {
      const settings = getSettings()
      console.log('Settings changed:', settings) // Debug log
      setColorMode(settings.colorMode)
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('focus', handleStorageChange)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('focus', handleStorageChange)
    }
  }, [])

  // Apply theme when color mode or system theme changes
  useEffect(() => {
    if (!isLoaded) return // Wait for initial load
    
    const effectiveTheme = getEffectiveTheme(colorMode)
    console.log('Color mode:', colorMode, 'Effective theme:', effectiveTheme) // Debug log
    applyTheme(effectiveTheme)
  }, [colorMode, systemTheme, isLoaded])

  return {
    colorMode,
    effectiveTheme: getEffectiveTheme(colorMode),
    systemTheme,
    isLoaded
  }
} 