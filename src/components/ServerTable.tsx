"use client"

import { useState, useMemo } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Trash2, RefreshCw, AlertCircle, CheckCircle, XCircle, ChevronUp, ChevronDown, Search } from "lucide-react"
import { useRouter } from "next/navigation"
import { ServerOverview } from "@/types"

interface ServerTableProps {
  servers: ServerOverview[]
  onRefresh: () => void
  onServerDeleted: (tokenKey: string) => void
  refreshing: boolean
}

type SortField = 'hostname' | 'status' | 'uptime' | 'ramPercentage' | 'diskPercentage' | 'cpuPercentage'
type SortDirection = 'asc' | 'desc'

export function ServerTable({ servers, onRefresh, onServerDeleted, refreshing }: ServerTableProps) {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [sortField, setSortField] = useState<SortField>('hostname')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')

  const handleRemoveServer = (tokenKey: string, hostname: string) => {
    if (confirm(`Are you sure you want to remove server "${hostname}"?`)) {
      localStorage.removeItem(`easypanel_token_${tokenKey}`)
      onServerDeleted(tokenKey)
    }
  }

  const handleOpenMonitor = (tokenKey: string) => {
    router.push(`/monitor/${tokenKey}`)
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

  const filteredAndSortedServers = useMemo(() => {
    let filtered = servers.filter(server =>
      server.hostname.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const sorted = [...filtered].sort((a, b) => {
      let aValue: any
      let bValue: any

      switch (sortField) {
        case 'hostname':
          aValue = a.hostname.toLowerCase()
          bValue = b.hostname.toLowerCase()
          break
        case 'status':
          // Order: online > error > unknown
          const statusOrder = { online: 3, error: 2, offline: 1 }
          aValue = statusOrder[a.status as keyof typeof statusOrder] || 0
          bValue = statusOrder[b.status as keyof typeof statusOrder] || 0
          break
        case 'uptime':
          aValue = a.uptime || 0
          bValue = b.uptime || 0
          break
        case 'ramPercentage':
          aValue = a.ramPercentage || 0
          bValue = b.ramPercentage || 0
          break
        case 'diskPercentage':
          aValue = a.diskPercentage || 0
          bValue = b.diskPercentage || 0
          break
        case 'cpuPercentage':
          aValue = a.cpuPercentage || 0
          bValue = b.cpuPercentage || 0
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
  }, [servers, searchTerm, sortField, sortDirection])

  const formatBytes = (mb: number) => {
    if (mb >= 1024) {
      return `${(mb / 1024).toFixed(1)} GB`
    }
    return `${mb.toFixed(0)} MB`
  }

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'online':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
    }
  }

  const getStatusText = (status?: string) => {
    switch (status) {
      case 'online':
        return 'Online'
      case 'error':
        return 'Error'
      default:
        return 'Unknown'
    }
  }

  if (servers.length === 0) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl sm:text-2xl font-semibold mb-4">Welcome to EasyPanel Monitor</h2>
        <p className="text-muted-foreground mb-6 text-sm sm:text-base">
          Get started by adding your first EasyPanel server to monitor.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-lg sm:text-xl font-semibold">Your Servers</h2>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search servers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-full sm:w-64"
            />
          </div>
          <Button onClick={onRefresh} disabled={refreshing} variant="outline" size="sm" className="shrink-0">
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''} sm:mr-2`} />
            <span className="hidden sm:inline">{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </Button>
        </div>
      </div>
      
      {/* Desktop table view */}
      <div className="hidden lg:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <button
                  onClick={() => handleSort('hostname')}
                  className="flex items-center gap-1 hover:text-foreground"
                >
                  Server
                  {getSortIcon('hostname')}
                </button>
              </TableHead>
              <TableHead>
                <button
                  onClick={() => handleSort('status')}
                  className="flex items-center gap-1 hover:text-foreground"
                >
                  Status
                  {getSortIcon('status')}
                </button>
              </TableHead>
              <TableHead>
                <button
                  onClick={() => handleSort('uptime')}
                  className="flex items-center gap-1 hover:text-foreground"
                >
                  Uptime
                  {getSortIcon('uptime')}
                </button>
              </TableHead>
              <TableHead>
                <button
                  onClick={() => handleSort('ramPercentage')}
                  className="flex items-center gap-1 hover:text-foreground"
                >
                  RAM Usage
                  {getSortIcon('ramPercentage')}
                </button>
              </TableHead>
              <TableHead>
                <button
                  onClick={() => handleSort('diskPercentage')}
                  className="flex items-center gap-1 hover:text-foreground"
                >
                  Disk Usage
                  {getSortIcon('diskPercentage')}
                </button>
              </TableHead>
              <TableHead>
                <button
                  onClick={() => handleSort('cpuPercentage')}
                  className="flex items-center gap-1 hover:text-foreground"
                >
                  CPU Usage
                  {getSortIcon('cpuPercentage')}
                </button>
              </TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedServers.map((server) => (
              <TableRow key={server.tokenKey}>
                <TableCell>
                  <button
                    onClick={() => handleOpenMonitor(server.tokenKey)}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                    disabled={server.status === 'error'}
                  >
                    {server.hostname}
                  </button>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(server.status)}
                    <span className={server.status === 'error' ? 'text-red-600' : ''}>
                      {getStatusText(server.status)}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  {server.status === 'online' && server.uptime !== undefined 
                    ? `${server.uptime} days`
                    : '—'
                  }
                </TableCell>
                <TableCell>
                  {server.status === 'online' && server.ramPercentage !== undefined
                    ? (
                      <div>
                        <div className="font-medium">{server.ramPercentage.toFixed(1)}%</div>
                        {server.ramUsed && server.ramTotal && (
                          <div className="text-xs text-muted-foreground">
                            {formatBytes(server.ramUsed)} / {formatBytes(server.ramTotal)}
                          </div>
                        )}
                      </div>
                    )
                    : '—'
                  }
                </TableCell>
                <TableCell>
                  {server.status === 'online' && server.diskPercentage !== undefined
                    ? (
                      <div>
                        <div className="font-medium">{server.diskPercentage.toFixed(1)}%</div>
                        {server.diskUsed && server.diskTotal && (
                          <div className="text-xs text-muted-foreground">
                            {server.diskUsed} GB / {server.diskTotal} GB
                          </div>
                        )}
                      </div>
                    )
                    : '—'
                  }
                </TableCell>
                <TableCell>
                  {server.status === 'online' && server.cpuPercentage !== undefined
                    ? `${server.cpuPercentage.toFixed(1)}%`
                    : '—'
                  }
                </TableCell>
                <TableCell>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleRemoveServer(server.tokenKey, server.hostname)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile/Tablet card view */}
      <div className="lg:hidden space-y-4">
        {filteredAndSortedServers.map((server) => (
          <div key={server.tokenKey} className="border rounded-lg p-4 space-y-4">
            {/* Server header */}
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <button
                  onClick={() => handleOpenMonitor(server.tokenKey)}
                  className="text-blue-600 hover:text-blue-800 font-medium break-words"
                  disabled={server.status === 'error'}
                >
                  <span className="break-all">{server.hostname}</span>
                </button>
                <div className="flex items-center gap-2 mt-1">
                  {getStatusIcon(server.status)}
                  <span className={`text-sm ${server.status === 'error' ? 'text-red-600' : 'text-muted-foreground'}`}>
                    {getStatusText(server.status)}
                  </span>
                </div>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleRemoveServer(server.tokenKey, server.hostname)}
                className="shrink-0"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            {/* Server stats */}
            {server.status === 'online' && (
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground mb-1">Uptime</p>
                  <p className="font-medium">
                    {server.uptime !== undefined ? `${server.uptime} days` : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">CPU Usage</p>
                  <p className="font-medium">
                    {server.cpuPercentage !== undefined ? `${server.cpuPercentage.toFixed(1)}%` : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">RAM Usage</p>
                  {server.ramPercentage !== undefined ? (
                    <div>
                      <p className="font-medium">{server.ramPercentage.toFixed(1)}%</p>
                      {server.ramUsed && server.ramTotal && (
                        <p className="text-xs text-muted-foreground">
                          {formatBytes(server.ramUsed)} / {formatBytes(server.ramTotal)}
                        </p>
                      )}
                    </div>
                  ) : <p className="font-medium">—</p>}
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Disk Usage</p>
                  {server.diskPercentage !== undefined ? (
                    <div>
                      <p className="font-medium">{server.diskPercentage.toFixed(1)}%</p>
                      {server.diskUsed && server.diskTotal && (
                        <p className="text-xs text-muted-foreground">
                          {server.diskUsed} GB / {server.diskTotal} GB
                        </p>
                      )}
                    </div>
                  ) : <p className="font-medium">—</p>}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* No results message */}
      {filteredAndSortedServers.length === 0 && searchTerm && (
        <div className="text-center py-8 text-muted-foreground">
          No servers found matching "{searchTerm}"
        </div>
      )}
    </div>
  )
} 