"use client"

import { useState, useEffect, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, RefreshCw, ChevronUp, ChevronDown, Search, Construction } from "lucide-react"
import { MonitorData } from "@/types"
import { getSettings } from "@/lib/settings"
import { useAutoRefresh } from "@/hooks/useAutoRefresh"

type SortField = 'projectName' | 'serviceName' | 'cpuPercent' | 'memoryPercent' | 'memoryUsage' | 'networkIn' | 'networkOut'
type SortDirection = 'asc' | 'desc'
type TabType = 'server' | 'services'

interface SystemStatData {
  cpu: Array<{ value: number | null; time: string }>
  memory: Array<{ value: number | null; time: string }>
  disk: Array<{ value: number | null; time: string }>
  network: Array<{ in: number | null; out: number | null; time: string }>
}

// Simple SVG Area Chart Component
interface AreaChartProps {
  data: Array<{ time: string; value: number }>
  color: string
  height?: number
  yMax?: number
}

// Network Chart Component for handling both in and out data
interface NetworkChartProps {
  data: Array<{ time: string; in: number; out: number }>
  height?: number
}

const NetworkChart = ({ data, height = 192 }: NetworkChartProps) => {
  if (data.length === 0) return <div className="flex items-center justify-center h-48 text-muted-foreground">No data</div>

  const allValues = data.flatMap(d => [d.in, d.out])
  const maxValue = Math.max(...allValues)
  const minValue = Math.min(...allValues)
  const range = maxValue - minValue || 1

  const inPoints = data.map((d, i) => {
    const x = (i / (data.length - 1)) * 100
    const y = 100 - ((d.in - minValue) / range) * 100
    return { x, y }
  })

  const outPoints = data.map((d, i) => {
    const x = (i / (data.length - 1)) * 100
    const y = 100 - ((d.out - minValue) / range) * 100
    return { x, y }
  })

  // Create smooth curve path using cubic Bézier curves
  const createSmoothPath = (points: Array<{ x: number; y: number }>) => {
    if (points.length < 2) return ''
    
    let path = `M ${points[0].x},${points[0].y}`
    
    for (let i = 1; i < points.length; i++) {
      const current = points[i]
      const previous = points[i - 1]
      
      const tension = 0.3
      const cp1x = previous.x + (current.x - previous.x) * tension
      const cp1y = previous.y
      const cp2x = current.x - (current.x - previous.x) * tension
      const cp2y = current.y
      
      path += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${current.x},${current.y}`
    }
    
    return path
  }

  const inLine = createSmoothPath(inPoints)
  const outLine = createSmoothPath(outPoints)
  const inAreaPath = `${inLine} L 100,100 L 0,100 Z`
  const outAreaPath = `${outLine} L 100,100 L 0,100 Z`

  return (
    <div className="relative w-full" style={{ height }}>
      <svg 
        width="100%" 
        height="100%" 
        viewBox="0 0 100 100" 
        preserveAspectRatio="none"
        className="absolute inset-0"
      >
        {/* In traffic area */}
        <path
          d={inAreaPath}
          fill="#3b82f6"
          fillOpacity="0.2"
          stroke="none"
        />
        {/* Out traffic area */}
        <path
          d={outAreaPath}
          fill="#ef4444"
          fillOpacity="0.2"
          stroke="none"
        />
        {/* In traffic line */}
        <path
          d={inLine}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="0.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
        {/* Out traffic line */}
        <path
          d={outLine}
          fill="none"
          stroke="#ef4444"
          strokeWidth="0.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      {/* Legend */}
      <div className="absolute top-2 right-2 flex gap-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          <span className="text-muted-foreground">In</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
          <span className="text-muted-foreground">Out</span>
        </div>
      </div>
      {/* Time labels */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-muted-foreground px-2">
        <span>{data[0]?.time}</span>
        <span>{data[Math.floor(data.length / 2)]?.time}</span>
        <span>{data[data.length - 1]?.time}</span>
      </div>
    </div>
  )
}

const SimpleAreaChart = ({ data, color, height = 192, yMax }: AreaChartProps) => {
  if (data.length === 0) return <div className="flex items-center justify-center h-48 text-muted-foreground">No data</div>

  const maxValue = yMax || Math.max(...data.map(d => d.value))
  const minValue = Math.min(...data.map(d => d.value))
  const range = maxValue - minValue || 1

  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * 100
    const y = 100 - ((d.value - minValue) / range) * 100
    return { x, y }
  })

  // Create smooth curve path using cubic Bézier curves
  const createSmoothPath = (points: Array<{ x: number; y: number }>) => {
    if (points.length < 2) return ''
    
    let path = `M ${points[0].x},${points[0].y}`
    
    for (let i = 1; i < points.length; i++) {
      const current = points[i]
      const previous = points[i - 1]
      
      // Calculate control points for smooth curve
      const tension = 0.3 // Adjust this value to control curve smoothness (0-1)
      const cp1x = previous.x + (current.x - previous.x) * tension
      const cp1y = previous.y
      const cp2x = current.x - (current.x - previous.x) * tension
      const cp2y = current.y
      
      path += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${current.x},${current.y}`
    }
    
    return path
  }

  const smoothLine = createSmoothPath(points)
  const areaPath = `${smoothLine} L 100,100 L 0,100 Z`

  return (
    <div className="relative w-full" style={{ height }}>
      <svg 
        width="100%" 
        height="100%" 
        viewBox="0 0 100 100" 
        preserveAspectRatio="none"
        className="absolute inset-0"
      >
        <path
          d={areaPath}
          fill={color}
          fillOpacity="0.3"
          stroke="none"
        />
        <path
          d={smoothLine}
          fill="none"
          stroke={color}
          strokeWidth="0.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      {/* Time labels */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-muted-foreground px-2">
        <span>{data[0]?.time}</span>
        <span>{data[Math.floor(data.length / 2)]?.time}</span>
        <span>{data[data.length - 1]?.time}</span>
      </div>
    </div>
  )
}

export default function MonitorPage() {
  const params = useParams()
  const router = useRouter()
  const tokenKey = `easypanel_token_${params.tokenKey}`
  const [serverInfo, setServerInfo] = useState<any>(null)
  const [monitorData, setMonitorData] = useState<MonitorData[]>([])
  const [systemStats, setSystemStats] = useState<SystemStatData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState("")
  const [settings, setSettings] = useState(getSettings())
  const [searchTerm, setSearchTerm] = useState('')
  const [sortField, setSortField] = useState<SortField>('projectName')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [activeTab, setActiveTab] = useState<TabType>('server')

  // Load mock system stats data
  useEffect(() => {
    const loadSystemStats = async () => {
      try {
        const response = await fetch('/systemstat.json')
        const data = await response.json()
        setSystemStats(data.result.data.json)
      } catch (error) {
        console.error('Failed to load system stats:', error)
        // Mock data fallback
        setSystemStats({
          cpu: Array.from({ length: 20 }, (_, i) => ({
            value: Math.random() * 100,
            time: new Date(Date.now() - (19 - i) * 5 * 60 * 1000).toISOString()
          })),
          memory: Array.from({ length: 20 }, (_, i) => ({
            value: 60 + Math.random() * 30,
            time: new Date(Date.now() - (19 - i) * 5 * 60 * 1000).toISOString()
          })),
          disk: Array.from({ length: 20 }, (_, i) => ({
            value: 45 + Math.random() * 10,
            time: new Date(Date.now() - (19 - i) * 5 * 60 * 1000).toISOString()
          })),
          network: Array.from({ length: 20 }, (_, i) => ({
            in: Math.random() * 1000,
            out: Math.random() * 800,
            time: new Date(Date.now() - (19 - i) * 5 * 60 * 1000).toISOString()
          }))
        })
      }
    }
    loadSystemStats()
  }, [])

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

  const formatTime = (timeString: string) => {
    const date = new Date(timeString)
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    })
  }

  // Prepare chart data
  const prepareChartData = (data: Array<{ value: number | null; time: string }>) => {
    return data
      .filter(item => item.value !== null)
      .slice(-24) // Show last 24 data points
      .map(item => ({
        time: formatTime(item.time),
        value: item.value as number
      }))
  }

  const prepareNetworkChartData = (data: Array<{ in: number | null; out: number | null; time: string }>) => {
    return data
      .filter(item => item.in !== null && item.out !== null)
      .slice(-24) // Show last 24 data points  
      .map(item => ({
        time: formatTime(item.time),
        in: item.in as number,
        out: item.out as number
      }))
  }

  if (loading) {
    return <div className="text-center py-8">Loading monitor data...</div>
  }

  if (!serverInfo) {
    return <div className="text-center py-8">Server not found</div>
  }

  const renderServicesMonitoring = () => (
    <div className="space-y-4 md:space-y-6">
      {error && (
        <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md">
          {error} (Showing mock data for demonstration)
        </div>
      )}

      {/* Search and controls */}
      {monitorData.length > 0 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h3 className="text-lg font-semibold">Container Services</h3>
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
              <h4 className="font-semibold text-lg">{item.projectName}</h4>
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

  const renderServerMonitoring = () => {
    if (!systemStats) {
      return (
        <div className="flex flex-col items-center justify-center py-16 space-y-4">
          <Construction className="h-16 w-16 text-muted-foreground" />
          <h3 className="text-xl font-semibold text-muted-foreground">Loading System Stats...</h3>
        </div>
      )
    }

    const cpuData = prepareChartData(systemStats.cpu)
    const memoryData = prepareChartData(systemStats.memory)
    const diskData = prepareChartData(systemStats.disk)
    const networkData = prepareNetworkChartData(systemStats.network)

    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold">System Monitoring</h3>
        
        {/* Charts Grid - 2 columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* CPU Usage Chart */}
          <div className="border rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">CPU Usage</h4>
              <span className="text-sm text-muted-foreground">
                {cpuData.length > 0 ? `${cpuData[cpuData.length - 1].value.toFixed(1)}%` : 'N/A'}
              </span>
            </div>
            <div className="h-48">
              <SimpleAreaChart data={cpuData} color="#3b82f6" />
            </div>
          </div>

          {/* Memory Usage Chart */}
          <div className="border rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Memory Usage</h4>
              <span className="text-sm text-muted-foreground">
                {memoryData.length > 0 ? `${memoryData[memoryData.length - 1].value.toFixed(1)}%` : 'N/A'}
              </span>
            </div>
            <div className="h-48">
              <SimpleAreaChart data={memoryData} color="#10b981" />
            </div>
          </div>

          {/* Disk Usage Chart */}
          <div className="border rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Disk Usage</h4>
              <span className="text-sm text-muted-foreground">
                {diskData.length > 0 ? `${diskData[diskData.length - 1].value.toFixed(1)}%` : 'N/A'}
              </span>
            </div>
            <div className="h-48">
              <SimpleAreaChart data={diskData} color="#f59e0b" />
            </div>
          </div>

          {/* Network Usage Chart */}
          <div className="border rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Network Usage</h4>
              <div className="flex gap-4 text-sm text-muted-foreground">
                <span>
                  In: {networkData.length > 0 ? `${formatNetworkBytes(networkData[networkData.length - 1].in)}` : 'N/A'}
                </span>
                <span>
                  Out: {networkData.length > 0 ? `${formatNetworkBytes(networkData[networkData.length - 1].out)}` : 'N/A'}
                </span>
              </div>
            </div>
            <div className="h-48">
              <NetworkChart data={networkData} />
            </div>
          </div>
        </div>
      </div>
    )
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
          <p className="text-muted-foreground text-sm">Real-time monitoring dashboard</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="space-y-6">
        {/* Tab buttons */}
        <div className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('server')}
            className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 flex-1 sm:flex-none ${
              activeTab === 'server'
                ? 'bg-background text-foreground shadow-sm'
                : 'hover:bg-background/50'
            }`}
          >
            Server Monitoring
          </button>
          <button
            onClick={() => setActiveTab('services')}
            className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 flex-1 sm:flex-none ${
              activeTab === 'services'
                ? 'bg-background text-foreground shadow-sm'
                : 'hover:bg-background/50'
            }`}
          >
            Services Monitoring
          </button>
        </div>

        {/* Tab content */}
        <div className="mt-6">
          {activeTab === 'server' && renderServerMonitoring()}
          {activeTab === 'services' && renderServicesMonitoring()}
        </div>
      </div>
    </div>
  )
} 