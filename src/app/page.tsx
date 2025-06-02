"use client"

import { useState, useEffect } from "react"
import { AddServerDialog } from "@/components/AddServerDialog"
import { ServerTable } from "@/components/ServerTable"
import { EasyPanelServer, ServerOverview, SystemStatsResponse } from "@/types"
import { getSettings } from "@/lib/settings"
import { useAutoRefresh } from "@/hooks/useAutoRefresh"

export default function Home() {
  const [servers, setServers] = useState<EasyPanelServer[]>([])
  const [serverOverviews, setServerOverviews] = useState<ServerOverview[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [settings, setSettings] = useState(getSettings())

  // Update settings when localStorage changes (e.g., from settings page)
  useEffect(() => {
    const handleStorageChange = () => {
      setSettings(getSettings())
    }

    window.addEventListener('storage', handleStorageChange)
    
    // Also check for changes on focus (in case user changed settings in another tab)
    window.addEventListener('focus', handleStorageChange)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('focus', handleStorageChange)
    }
  }, [])

  const loadServers = () => {
    const serverList: EasyPanelServer[] = []
    
    // Get all localStorage keys that start with 'easypanel_token_'
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith('easypanel_token_')) {
        try {
          const serverData = JSON.parse(localStorage.getItem(key) || '{}')
          if (serverData.hostname && serverData.token) {
            serverList.push({
              id: key.replace('easypanel_token_', ''),
              hostname: serverData.hostname,
              token: serverData.token
            })
          }
        } catch (error) {
          console.error('Failed to parse server data:', error)
        }
      }
    }

    setServers(serverList)
    return serverList
  }

  const fetchServerSystemStats = async (server: EasyPanelServer): Promise<ServerOverview> => {
    try {
      // Use our API route to avoid CORS issues
      const response = await fetch('/api/easypanel/systemstats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          hostname: server.hostname,
          token: server.token
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.details || errorData.error || 'Failed to fetch system stats')
      }

      const data: SystemStatsResponse = await response.json()
      const stats = data.result.data.json

      // Convert uptime from seconds to days
      const uptimeDays = stats.uptime / (24 * 60 * 60)

      return {
        hostname: server.hostname,
        uptime: Math.round(uptimeDays * 10) / 10, // Round to 1 decimal place
        ramPercentage: stats.memInfo.usedMemPercentage,
        ramUsed: stats.memInfo.usedMemMb,
        ramTotal: stats.memInfo.totalMemMb,
        diskPercentage: parseFloat(stats.diskInfo.usedPercentage),
        diskUsed: stats.diskInfo.usedGb,
        diskTotal: stats.diskInfo.totalGb,
        cpuPercentage: stats.cpuInfo.usedPercentage,
        tokenKey: server.id,
        status: 'online'
      }
    } catch (error) {
      console.error(`Failed to fetch stats for ${server.hostname}:`, error)
      
      // Return server with error status and basic info
      return {
        hostname: server.hostname,
        tokenKey: server.id,
        status: 'error'
      }
    }
  }

  const fetchServerOverviews = async (serverList?: EasyPanelServer[]) => {
    const serversToProcess = serverList || servers
    if (serversToProcess.length === 0) return

    setRefreshing(true)
    
    try {
      // Fetch stats for all servers in parallel
      const overviewPromises = serversToProcess.map(server => fetchServerSystemStats(server))
      const overviews = await Promise.all(overviewPromises)
      
      setServerOverviews(overviews)
    } catch (error) {
      console.error('Failed to fetch server overviews:', error)
    } finally {
      setRefreshing(false)
    }
  }

  const handleRefresh = async () => {
    const serverList = loadServers()
    await fetchServerOverviews(serverList)
  }

  useEffect(() => {
    const serverList = loadServers()
    fetchServerOverviews(serverList).finally(() => setLoading(false))
  }, [])

  // Auto-refresh based on settings
  useAutoRefresh(handleRefresh, settings.homePageRefreshTime, [settings.homePageRefreshTime])

  const handleServerAdded = () => {
    handleRefresh()
  }

  const handleServerDeleted = (tokenKey: string) => {
    setServers(prev => prev.filter(s => s.id !== tokenKey))
    setServerOverviews(prev => prev.filter(s => s.tokenKey !== tokenKey))
  }

  if (loading) {
    return <div className="text-center py-8">Loading servers...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Monitor your EasyPanel servers
          </p>
        </div>
        <AddServerDialog onServerAdded={handleServerAdded} />
      </div>
      
      <ServerTable 
        servers={serverOverviews} 
        onRefresh={handleRefresh}
        onServerDeleted={handleServerDeleted}
        refreshing={refreshing}
      />
    </div>
  )
} 