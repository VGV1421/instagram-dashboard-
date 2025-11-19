"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  Home,
  TrendingUp,
  FileText,
  BarChart3,
  Users,
  Target,
  Bell
} from "lucide-react"

const navigation = [
  {
    name: "Home",
    href: "/",
    icon: Home,
  },
  {
    name: "Tendencias",
    href: "/tendencias",
    icon: TrendingUp,
  },
  {
    name: "Scripts",
    href: "/scripts",
    icon: FileText,
  },
  {
    name: "Rendimiento",
    href: "/rendimiento",
    icon: BarChart3,
  },
  {
    name: "Personas",
    href: "/personas",
    icon: Users,
  },
  {
    name: "Embudo",
    href: "/embudo",
    icon: Target,
  },
  {
    name: "Alertas",
    href: "/alertas",
    icon: Bell,
  },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-full w-64 flex-col border-r bg-white">
      {/* Logo */}
      <div className="flex h-16 items-center border-b px-6">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
            <span className="text-sm font-bold text-white">IG</span>
          </div>
          <span className="text-lg font-semibold">Dashboard</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-purple-50 text-purple-700"
                  : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <Icon className={cn("h-5 w-5", isActive ? "text-purple-700" : "text-gray-500")} />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="border-t p-4">
        <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500" />
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
