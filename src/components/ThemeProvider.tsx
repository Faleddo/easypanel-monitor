"use client"

import { useTheme } from '@/hooks/useTheme'

interface ThemeProviderProps {
  children: React.ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  // Apply theme to the app
  useTheme()

  return <>{children}</>
} 