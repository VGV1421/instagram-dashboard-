"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { RefreshCw, Database } from "lucide-react"
import { toast } from "sonner"

export function Header() {
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastSync, setLastSync] = useState<Date | null>(null)

  const handleRefresh = () => {
    window.location.reload()
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
    <header className="flex h-16 items-center justify-between border-b bg-white px-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500">
          {lastSync ? (
            <>Última sincronización: {lastSync.toLocaleString("es-ES", {
              day: "2-digit",
              month: "short",
              hour: "2-digit",
              minute: "2-digit"
            })}</>
          ) : (
            <>Última actualización: {new Date().toLocaleString("es-ES", {
              day: "2-digit",
              month: "short",
              hour: "2-digit",
              minute: "2-digit"
            })}</>
          )}
        </p>
      </div>

      <div className="flex gap-2">
        <Button
          onClick={handleSync}
          disabled={isSyncing}
          className="gap-2 bg-blue-600 hover:bg-blue-700"
        >
          <Database className={`h-4 w-4 ${isSyncing ? "animate-pulse" : ""}`} />
          {isSyncing ? "Sincronizando..." : "Guardar en Supabase"}
        </Button>

        <Button
          onClick={handleRefresh}
          variant="outline"
          className="gap-2"
          disabled={isSyncing}
        >
          <RefreshCw className="h-4 w-4" />
          Actualizar
        </Button>
      </div>
    </header>
  )
}
