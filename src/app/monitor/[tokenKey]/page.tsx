"use client"

import { useState, useEffect, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, RefreshCw, ChevronUp, ChevronDown, Search } from "lucide-react"
import { MonitorData } from "@/types"
import { getSettings } from "@/lib/settings"
import { useAutoRefresh } from "@/hooks/useAutoRefresh"

type SortField = 'projectName' | 'serviceName' | 'cpuPercent' | 'memoryPercent' | 'memoryUsage' | 'networkIn' | 'networkOut'
type SortDirection = 'asc' | 'desc'

export default function MonitorPage() {
  const params = useParams()
  const router = useRouter()
  const tokenKey = `easypanel_token_${params.tokenKey}`
  const [serverInfo, setServerInfo] = useState<any>(null)
  const [monitorData, setMonitorData] = useState<MonitorData[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState("")
  const [settings, setSettings] = useState(getSettings())
  const [searchTerm, setSearchTerm] = useState('')
  const [sortField, setSortField] = useState<SortField>('projectName')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')

  // Update settings when localStorage changes
  useEffect(() => {
    const handleStorageChange = () => {
      setSettings(getSettings())
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('focus', handleStorageChange)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('focus', handleStorageChange)
    }
  }, [])

  const loadServerInfo = () => {
    const data = localStorage.getItem(tokenKey)
    if (data) {
      setServerInfo(JSON.parse(data))
    } else {
      // Redirect to home if server not found
      router.push('/')
    }
  }

  const handleGoBack = () => {
    router.push('/')
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ChevronUp className="h-4 w-4 opacity-30" />
    }
    return sortDirection === 'asc' 
      ? <ChevronUp className="h-4 w-4" />
      : <ChevronDown className="h-4 w-4" />
  }

  const filteredAndSortedData = useMemo(() => {
    let filtered = monitorData.filter(item =>
      item.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.serviceName.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const sorted = [...filtered].sort((a, b) => {
      let aValue: any
      let bValue: any

      switch (sortField) {
        case 'projectName':
          aValue = a.projectName.toLowerCase()
          bValue = b.projectName.toLowerCase()
          break
        case 'serviceName':
          aValue = a.serviceName.toLowerCase()
          bValue = b.serviceName.toLowerCase()
          break
        case 'cpuPercent':
          aValue = a.stats.cpu.percent
          bValue = b.stats.cpu.percent
          break
        case 'memoryPercent':
          aValue = a.stats.memory.percent
          bValue = b.stats.memory.percent
          break
        case 'memoryUsage':
          aValue = a.stats.memory.usage
          bValue = b.stats.memory.usage
          break
        case 'networkIn':
          aValue = a.stats.network.in
          bValue = b.stats.network.in
          break
        case 'networkOut':
          aValue = a.stats.network.out
          bValue = b.stats.network.out
          break
        default:
          return 0
      }

      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })

    return sorted
  }, [monitorData, searchTerm, sortField, sortDirection])

  const fetchMonitorData = async () => {
    if (!serverInfo) return
    
    setRefreshing(true)
    setError("")
    
    try {
      // Use our API route to avoid CORS issues
      const response = await fetch('/api/easypanel/monitor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          hostname: serverInfo.hostname,
          token: serverInfo.token
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.details || data.error || 'Failed to fetch monitoring data')
      }

      setMonitorData(data.result.data.json)
    } catch (error) {
      console.error('Failed to fetch monitor data:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch monitoring data')
      
      // Use mock data for demonstration when there's an error
      setMonitorData([
        {
          id: "mock1",
          stats: {
            cpu: { percent: 15.2 },
            memory: { usage: 167772160, percent: 8.9 },
            network: { in: 1210485, out: 1472156 }
          },
          projectName: "dicloud",
          serviceName: "formbricks-app",
          containerName: "dicloud_formbricks-app.1.73y16bqe598jccnveqx1hsufd"
        },
        {
          id: "mock2",
          stats: {
            cpu: { percent: 32.7 },
            memory: { usage: 335544320, percent: 17.8 },
            network: { in: 2420970, out: 2944312 }
          },
          projectName: "webapp",
          serviceName: "nginx-proxy",
          containerName: "webapp_nginx-proxy.1.abcd1234567890"
        }
      ])
    } finally {
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadServerInfo()
  }, [tokenKey])

  useEffect(() => {
    if (serverInfo) {
      fetchMonitorData()
      setLoading(false)
    }
  }, [serverInfo])

  // Auto-refresh based on settings
  useAutoRefresh(fetchMonitorData, settings.serviceRefreshTime, [settings.serviceRefreshTime, serverInfo])

  const formatBytes = (bytes: number) => {
    const kb = bytes / 1024
    const mb = bytes / (1024 * 1024)
    const gb = bytes / (1024 * 1024 * 1024)

    if (gb >= 1) {
      return `${gb.toFixed(1)} GB`
    } else if (mb >= 1) {
      return `${mb.toFixed(1)} MB`
    } else {
      return `${kb.toFixed(1)} KB`
    }
  }

  const formatNetworkBytes = (bytes: number) => {
    const kb = bytes / 1024
    const mb = bytes / (1024 * 1024)
    const gb = bytes / (1024 * 1024 * 1024)

    if (gb >= 1) {
      return `${gb.toFixed(1)} GB`
    } else if (mb >= 1) {
      return `${mb.toFixed(1)} MB`
    } else {
      return `${kb.toFixed(1)} KB`
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading monitor data...</div>
  }

  if (!serverInfo) {
    return <div className="text-center py-8">Server not found</div>
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Mobile-responsive header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={handleGoBack} className="shrink-0">
            <ArrowLeft className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Back to Dashboard</span>
            <span className="sm:hidden">Back</span>
          </Button>
          <Button onClick={fetchMonitorData} disabled={refreshing} className="shrink-0">
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''} sm:mr-2`} />
            <span className="hidden sm:inline">{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </Button>
        </div>
        
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-bold break-words">
            Monitor: {serverInfo.hostname}
          </h1>
          <p className="text-muted-foreground text-sm">Real-time container monitoring</p>
        </div>
      </div>

      {error && (
        <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md">
          {error} (Showing mock data for demonstration)
        </div>
      )}

      {/* Search and controls */}
      {monitorData.length > 0 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h2 className="text-lg font-semibold">Container Services</h2>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search services..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      )}

      {/* Desktop table view */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <button
                  onClick={() => handleSort('projectName')}
                  className="flex items-center gap-1 hover:text-foreground"
                >
                  Project Name
                  {getSortIcon('projectName')}
                </button>
              </TableHead>
              <TableHead>
                <button
                  onClick={() => handleSort('serviceName')}
                  className="flex items-center gap-1 hover:text-foreground"
                >
                  Service Name
                  {getSortIcon('serviceName')}
                </button>
              </TableHead>
              <TableHead>
                <button
                  onClick={() => handleSort('cpuPercent')}
                  className="flex items-center gap-1 hover:text-foreground"
                >
                  CPU Usage
                  {getSortIcon('cpuPercent')}
                </button>
              </TableHead>
              <TableHead>
                <button
                  onClick={() => handleSort('memoryPercent')}
                  className="flex items-center gap-1 hover:text-foreground"
                >
                  Memory Usage
                  {getSortIcon('memoryPercent')}
                </button>
              </TableHead>
              <TableHead>
                <button
                  onClick={() => handleSort('networkIn')}
                  className="flex items-center gap-1 hover:text-foreground"
                >
                  Network In
                  {getSortIcon('networkIn')}
                </button>
              </TableHead>
              <TableHead>
                <button
                  onClick={() => handleSort('networkOut')}
                  className="flex items-center gap-1 hover:text-foreground"
                >
                  Network Out
                  {getSortIcon('networkOut')}
                </button>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedData.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.projectName}</TableCell>
                <TableCell>{item.serviceName}</TableCell>
                <TableCell>{item.stats.cpu.percent.toFixed(1)}%</TableCell>
                <TableCell>
                  {formatBytes(item.stats.memory.usage)} ({item.stats.memory.percent.toFixed(1)}%)
                </TableCell>
                <TableCell>{formatNetworkBytes(item.stats.network.in)}</TableCell>
                <TableCell>{formatNetworkBytes(item.stats.network.out)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile card view */}
      <div className="md:hidden space-y-4">
        {filteredAndSortedData.map((item) => (
          <div key={item.id} className="border rounded-lg p-4 space-y-3">
            <div className="border-b pb-2">
              <h3 className="font-semibold text-lg">{item.projectName}</h3>
              <p className="text-sm text-muted-foreground break-words">{item.serviceName}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground">CPU Usage</p>
                <p className="font-medium">{item.stats.cpu.percent.toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-muted-foreground">Memory</p>
                <p className="font-medium">
                  {formatBytes(item.stats.memory.usage)}
                </p>
                <p className="text-xs text-muted-foreground">
                  ({item.stats.memory.percent.toFixed(1)}%)
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Network In</p>
                <p className="font-medium">{formatNetworkBytes(item.stats.network.in)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Network Out</p>
                <p className="font-medium">{formatNetworkBytes(item.stats.network.out)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* No results message */}
      {filteredAndSortedData.length === 0 && searchTerm && monitorData.length > 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No services found matching "{searchTerm}"
        </div>
      )}

      {monitorData.length === 0 && !error && (
        <div className="text-center py-8 text-muted-foreground">
          No monitoring data available
        </div>
      )}
    </div>
  )
} 