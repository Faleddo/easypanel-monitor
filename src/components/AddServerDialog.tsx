"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus } from "lucide-react"

interface AddServerDialogProps {
  onServerAdded: () => void
}

export function AddServerDialog({ onServerAdded }: AddServerDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    hostname: "",
    username: "",
    password: ""
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      // Use our API route to avoid CORS issues
      const response = await fetch('/api/easypanel/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          hostname: formData.hostname,
          email: formData.username,
          password: formData.password
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.details || data.error || 'Authentication failed')
      }

      const token = data.result.data.json.token

      // Generate random key for token storage
      const randomKey = Math.random().toString(36).substring(2, 15)
      const tokenKey = `easypanel_token_${randomKey}`

      // Store server data in localStorage
      localStorage.setItem(tokenKey, JSON.stringify({
        hostname: formData.hostname,
        token: token,
        username: formData.username
      }))

      // Reset form and close dialog
      setFormData({ hostname: "", username: "", password: "" })
      setError("")
      setOpen(false)
      onServerAdded()
    } catch (error) {
      console.error('Authentication error:', error)
      setError(error instanceof Error ? error.message : 'Failed to add server. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Server
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add EasyPanel Server</DialogTitle>
          <DialogDescription>
            Enter your EasyPanel server details to start monitoring.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {error && (
              <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md">
                {error}
              </div>
            )}
            <div className="grid gap-2">
              <label htmlFor="hostname" className="text-sm font-medium">
                Hostname
              </label>
              <Input
                id="hostname"
                placeholder="https://panel.example.com"
                value={formData.hostname}
                onChange={(e) => setFormData({ ...formData, hostname: e.target.value })}
                required
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="username" className="text-sm font-medium">
                Username/Email
              </label>
              <Input
                id="username"
                type="email"
                placeholder="admin@example.com"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Adding..." : "Add Server"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 