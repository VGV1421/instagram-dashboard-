"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import {
  Home,
  TrendingUp,
  FileText,
  BarChart3,
  Users,
  Target,
  Bell,
  Sparkles,
  Lightbulb,
  UserCheck,
  DollarSign,
  Calendar,
  Zap,
  Video
} from "lucide-react"

const navigation = [
  {
    name: "Home",
    href: "/",
    icon: Home,
    badge: null,
    gradient: "from-purple-500 to-pink-500"
  },
  {
    name: "Tendencias",
    href: "/tendencias",
    icon: TrendingUp,
    badge: "Hot",
    gradient: "from-blue-500 to-cyan-500"
  },
  {
    name: "Insights",
    href: "/insights",
    icon: Lightbulb,
    badge: "Nuevo",
    gradient: "from-yellow-500 to-orange-500"
  },
  {
    name: "Scripts",
    href: "/scripts",
    icon: Sparkles,
    badge: "IA",
    gradient: "from-pink-500 to-rose-500"
  },
  {
    name: "Generator",
    href: "/generator",
    icon: FileText,
    badge: "IA",
    gradient: "from-violet-500 to-purple-500"
  },
  {
    name: "Auto-Contenido",
    href: "/contenido-programado",
    icon: Zap,
    badge: "Auto",
    gradient: "from-emerald-500 to-cyan-500"
  },
  {
    name: "Video Reels",
    href: "/video-generator",
    icon: Video,
    badge: "Nuevo",
    gradient: "from-pink-500 to-purple-500"
  },
  {
    name: "Competidores",
    href: "/competidores",
    icon: UserCheck,
    badge: null,
    gradient: "from-orange-500 to-red-500"
  },
  {
    name: "Rendimiento",
    href: "/rendimiento",
    icon: BarChart3,
    badge: null,
    gradient: "from-green-500 to-emerald-500"
  },
  {
    name: "Personas",
    href: "/personas",
    icon: Users,
    badge: "3",
    gradient: "from-orange-500 to-amber-500"
  },
  {
    name: "Embudo",
    href: "/embudo",
    icon: Target,
    badge: null,
    gradient: "from-indigo-500 to-purple-500"
  },
  {
    name: "Métricas Negocio",
    href: "/metricas-negocio",
    icon: DollarSign,
    badge: "Nuevo",
    gradient: "from-emerald-500 to-teal-500"
  },
  {
    name: "Alertas",
    href: "/alertas",
    icon: Bell,
    badge: "0",
    gradient: "from-red-500 to-pink-500"
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const [quickStats, setQuickStats] = useState({
    engagement: '0.0',
    postsToday: 0,
    loading: true
  })
  const [unreadAlerts, setUnreadAlerts] = useState<number>(0)

  useEffect(() => {
    fetchQuickStats()
    fetchUnreadAlerts()
  }, [])

  const fetchQuickStats = async () => {
    try {
      const response = await fetch('/api/analytics/quick-stats')
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setQuickStats({
            engagement: data.data.engagement,
            postsToday: data.data.postsToday,
            loading: false
          })
        }
      }
    } catch (error) {
      console.error('Error fetching quick stats:', error)
      // Mantener valores por defecto si falla
      setQuickStats(prev => ({ ...prev, loading: false }))
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

  return (
    <div className="flex h-full w-64 flex-col bg-gradient-to-b from-gray-50 to-white border-r shadow-lg">
      {/* Logo mejorado */}
      <div className="flex h-16 items-center border-b px-6 bg-white">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 shadow-lg">
            <span className="text-base font-bold text-white">IG</span>
          </div>
          <div>
            <span className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Dashboard
            </span>
            <p className="text-xs text-gray-500">Analytics Pro</p>
          </div>
        </div>
      </div>

      {/* Navigation mejorada */}
      <nav className="flex-1 space-y-2 p-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/50"
                  : "text-gray-700 hover:bg-white hover:shadow-md"
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-lg transition-all",
                  isActive
                    ? "bg-white/20"
                    : `bg-gradient-to-br ${item.gradient} bg-opacity-10 group-hover:shadow-md`
                )}>
                  <Icon className={cn(
                    "h-4 w-4 transition-all",
                    isActive
                      ? "text-white"
                      : "text-gray-600 group-hover:scale-110"
                  )} />
                </div>
                <span className={cn(
                  isActive ? "text-white" : "text-gray-700"
                )}>{item.name}</span>
              </div>
              {item.badge && (
                <Badge
                  className={cn(
                    "text-xs",
                    isActive
                      ? "bg-white/20 text-white border-white/30"
                      : "bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 border-0"
                  )}
                >
                  {item.name === "Alertas" ? unreadAlerts : item.badge}
                </Badge>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Quick Stats */}
      <div className="px-4 py-3 border-t bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="text-xs font-semibold text-gray-600 mb-2">Quick Stats</div>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-600">Engagement</span>
            {quickStats.loading ? (
              <div className="h-3 w-12 bg-purple-200 animate-pulse rounded"></div>
            ) : (
              <span className="font-bold text-purple-600">{quickStats.engagement}%</span>
            )}
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-600">Posts hoy</span>
            {quickStats.loading ? (
              <div className="h-3 w-8 bg-pink-200 animate-pulse rounded"></div>
            ) : (
              <span className="font-bold text-pink-600">{quickStats.postsToday}</span>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t p-4">
        <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
          <img
            src="https://scontent.cdninstagram.com/v/t51.2885-19/467841869_18519577398014823_5936863844704527336_n.jpg?stp=dst-jpg_s150x150_tt6&_nc_ht=scontent.cdninstagram.com&_nc_cat=107&_nc_ohc=SvmjDKz6SQEQ7kNvgGJ8Qjh&_nc_gid=bfc5e71dbb7c4cb6870a25854d1ddb8a&edm=AOQ1c0wBAAAA&ccb=7-5&oh=00_AYA1vBL8t7vT5FHtGwJrwKIIl3usjxYzWXDcSdDd-YfgOg&oe=6764ED1D&_nc_sid=8b3546"
            alt="Profile"
            className="h-10 w-10 rounded-full object-cover border-2 border-purple-500"
            onError={(e) => {
              // Fallback to gradient if image fails to load
              e.currentTarget.style.display = 'none';
              const fallback = e.currentTarget.nextElementSibling as HTMLElement;
              if (fallback) fallback.style.display = 'block';
            }}
          />
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500" style={{display: 'none'}} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              @digitalmindmillonaria
            </p>
            <p className="text-xs text-gray-500">
              <span className="inline-block h-2 w-2 rounded-full bg-green-500 mr-1" />
              Activo
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
