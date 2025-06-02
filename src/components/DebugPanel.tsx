"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Bug } from "lucide-react"

export function DebugPanel() {
  const [hostname, setHostname] = useState("https://paas.dicloud.net")
  const [results, setResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const runDebug = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/easypanel/debug', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ hostname })
      })

      const data = await response.json()
      setResults(data)
    } catch (error) {
      setResults({ error: error instanceof Error ? error.message : 'Unknown error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="border border-orange-200 bg-orange-50 p-4 rounded-lg">
      <div className="flex items-center gap-2 mb-4">
        <Bug className="h-5 w-5 text-orange-600" />
        <h3 className="text-lg font-semibold text-orange-800">API Debug Panel</h3>
      </div>
      
      <p className="text-sm text-orange-700 mb-4">
        This debug panel will test various API endpoints to help identify the correct EasyPanel API structure.
      </p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-orange-800 mb-2">
            EasyPanel Hostname
          </label>
          <Input
            value={hostname}
            onChange={(e) => setHostname(e.target.value)}
            placeholder="https://paas.dicloud.net"
          />
        </div>

        <Button 
          onClick={runDebug} 
          disabled={loading}
          className="bg-orange-600 hover:bg-orange-700"
        >
          {loading ? "Testing Endpoints..." : "Test API Endpoints"}
        </Button>

        {results && (
          <div className="mt-4 p-4 bg-gray-50 rounded border max-h-96 overflow-y-auto">
            <h4 className="font-semibold mb-2">Debug Results:</h4>
            <pre className="text-xs whitespace-pre-wrap">
              {JSON.stringify(results, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
} 