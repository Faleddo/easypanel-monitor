"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Save } from "lucide-react"
import { AppSettings, REFRESH_OPTIONS, COLOR_MODE_OPTIONS, RefreshInterval, ColorMode, DEFAULT_SETTINGS } from "@/types"
import { getSettings, saveSettings } from "@/lib/settings"

export default function SettingsPage() {
  const router = useRouter()
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const loadedSettings = getSettings()
    setSettings(loadedSettings)
    setLoading(false)
  }, [])

  const handleSave = () => {
    saveSettings(settings)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000) // Hide save confirmation after 2 seconds
  }

  const handleGoBack = () => {
    router.push('/')
  }

  const updateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }))
  }

  if (loading) {
    return <div className="text-center py-8">Loading settings...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={handleGoBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Configure your EasyPanel Monitor preferences</p>
        </div>
      </div>

      <div className="max-w-md space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium">
            Color Mode
          </label>
          <Select
            value={settings.colorMode}
            onValueChange={(value: ColorMode) => updateSetting('colorMode', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select color mode" />
            </SelectTrigger>
            <SelectContent>
              {COLOR_MODE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Choose your preferred color theme for the application
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">
            Home Page Refresh Time
          </label>
          <Select
            value={settings.homePageRefreshTime.toString()}
            onValueChange={(value) => updateSetting('homePageRefreshTime', value === 'off' ? 'off' : parseInt(value) as RefreshInterval)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select refresh interval" />
            </SelectTrigger>
            <SelectContent>
              {REFRESH_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value.toString()}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            How often to refresh the server list on the home page
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">
            Service Refresh Time
          </label>
          <Select
            value={settings.serviceRefreshTime.toString()}
            onValueChange={(value) => updateSetting('serviceRefreshTime', value === 'off' ? 'off' : parseInt(value) as RefreshInterval)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select refresh interval" />
            </SelectTrigger>
            <SelectContent>
              {REFRESH_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value.toString()}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            How often to refresh the monitoring data on service detail pages
          </p>
        </div>

        <div className="flex gap-3">
          <Button onClick={handleSave} className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            {saved ? 'Saved!' : 'Save Settings'}
          </Button>
          
          {saved && (
            <div className="flex items-center text-sm text-green-600 dark:text-green-400">
              ✓ Settings saved successfully
            </div>
          )}
        </div>

        <div className="border-t pt-6">
          <h3 className="text-sm font-medium mb-2">About Settings</h3>
          <div className="text-xs text-muted-foreground space-y-1">
            <p>• Color Mode: System follows your device preference, or choose Light/Dark</p>
            <p>• Home Page: Automatically refreshes server overview data</p>
            <p>• Service Page: Automatically refreshes detailed container monitoring</p>
            <p>• Choose "Off" to disable automatic refreshing</p>
            <p>• You can always manually refresh using the refresh button</p>
          </div>
        </div>
      </div>
    </div>
  )
} 