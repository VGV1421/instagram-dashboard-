"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, Database, Download, Bell, Settings, Sparkles, Trash2 } from "lucide-react"
import { toast } from "sonner"

export function Header() {
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastSync, setLastSync] = useState<Date | null>(null)
  const [unreadAlerts, setUnreadAlerts] = useState<number>(0)

  useEffect(() => {
    fetchUnreadAlerts()
    // Actualizar cada 30 segundos
    const interval = setInterval(fetchUnreadAlerts, 30000)
    return () => clearInterval(interval)
  }, [])

  const handleRefresh = () => {
    window.location.reload()
  }

  const handleCleanupDemo = async () => {
    if (!confirm('¿Eliminar posts de demostración? Esto mostrará solo tus posts reales de Instagram.')) {
      return
    }

    toast.loading("Eliminando posts demo...")

    try {
      const response = await fetch("/api/posts/cleanup-demo", {
        method: "DELETE"
      })

      const result = await response.json()

      if (result.success) {
        toast.success(`✅ ${result.message}`)

        // Recargar la página después de 1 segundo
        setTimeout(() => {
          window.location.reload()
        }, 1000)
      } else {
        toast.error("Error al eliminar posts demo", {
          description: result.error || "Ocurrió un error desconocido"
        })
      }
    } catch (error) {
      console.error("Error cleanup:", error)
      toast.error("Error de conexión", {
        description: "No se pudo conectar con el servidor"
      })
    }
  }

  const fetchUnreadAlerts = async () => {
    try {
      const response = await fetch('/api/alerts?isRead=false')
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.stats) {
          setUnreadAlerts(data.stats.unread)
        }
      }
    } catch (error) {
      console.error('Error fetching unread alerts:', error)
    }
  }

  const handleSync = async () => {
    setIsSyncing(true)
    toast.loading("Sincronizando datos con Supabase...")

    try {
      const response = await fetch("/api/instagram/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        }
      })

      const result = await response.json()

      if (result.success) {
        setLastSync(new Date())
        toast.success(
          `✅ ${result.message}`,
          {
            description: `${result.summary.sync.posts_inserted} nuevos, ${result.summary.sync.posts_updated} actualizados`
          }
        )

        // Recargar la página después de 2 segundos
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      } else {
        toast.error("Error al sincronizar", {
          description: result.error || "Ocurrió un error desconocido"
        })
      }
    } catch (error) {
      console.error("Error syncing:", error)
      toast.error("Error de conexión", {
        description: "No se pudo conectar con el servidor"
      })
    } finally {
      setIsSyncing(false)
    }
  }

  return (
    <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b bg-white/80 backdrop-blur-lg px-6 shadow-sm">
      <div className="flex items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
            <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 text-xs">
              Pro
            </Badge>
          </div>
          <p className="text-xs text-gray-500 flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
            {lastSync ? (
              <>Sincronizado: {lastSync.toLocaleTimeString("es-ES", {
                hour: "2-digit",
                minute: "2-digit"
              })}</>
            ) : (
              <>Actualizado: {new Date().toLocaleTimeString("es-ES", {
                hour: "2-digit",
                minute: "2-digit"
              })}</>
            )}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          onClick={handleSync}
          disabled={isSyncing}
          className="gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 shadow-lg shadow-blue-500/30 transition-all duration-200"
          size="sm"
        >
          <Database className={`h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
          {isSyncing ? "Sincronizando..." : "Sincronizar"}
        </Button>

        <Button
          onClick={handleRefresh}
          variant="outline"
          className="gap-2 hover:bg-gray-50"
          disabled={isSyncing}
          size="sm"
        >
          <RefreshCw className="h-4 w-4" />
          Actualizar
        </Button>

        <Button
          onClick={handleCleanupDemo}
          variant="outline"
          className="gap-2 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
          size="sm"
          title="Eliminar posts de demostración"
        >
          <Trash2 className="h-4 w-4" />
          Limpiar Demo
        </Button>

        <Button
          variant="outline"
          className="gap-2 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-300"
          size="sm"
        >
          <Sparkles className="h-4 w-4" />
          IA
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="relative"
        >
          <Bell className="h-4 w-4" />
          {unreadAlerts > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">
              {unreadAlerts > 9 ? '9+' : unreadAlerts}
            </span>
          )}
        </Button>

        <Button
          variant="ghost"
          size="sm"
        >
          <Settings className="h-4 w-4" />
        </Button>
      </div>
    </header>
  )
}
