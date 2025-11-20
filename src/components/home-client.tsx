"use client"

import { useState, useEffect, useMemo } from 'react'
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { TrendingUp, TrendingDown, Users, Eye, Heart, MessageCircle, BarChart3, Calendar, X } from "lucide-react"

interface Post {
  id: string
  caption: string
  media_type: string
  likes: number
  comments: number
  reach: number
  impressions: number
  engagement_rate: number
  timestamp: string
  permalink: string
}

export function HomeClient() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    fetchPosts()
  }, [])

  const fetchPosts = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/posts')
      const data = await response.json()
      if (data.success) {
        setPosts(data.posts || [])
      }
    } catch (error) {
      console.error('Error fetching posts:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filtrar posts por rango de fechas
  const filteredPosts = useMemo(() => {
    if (!startDate && !endDate) return posts

    return posts.filter(post => {
      const postDate = new Date(post.timestamp)
      const start = startDate ? new Date(startDate) : null
      const end = endDate ? new Date(endDate + 'T23:59:59') : null

      if (start && postDate < start) return false
      if (end && postDate > end) return false
      return true
    })
  }, [posts, startDate, endDate])

  // Calcular métricas desde los posts filtrados
  const metrics = useMemo(() => {
    const totalPosts = filteredPosts.length
    const totalReach = filteredPosts.reduce((sum, post) => sum + (post.reach || 0), 0)
    const avgReach = totalPosts > 0 ? Math.round(totalReach / totalPosts) : 0

    const totalEngagement = filteredPosts.reduce((sum, post) => sum + post.likes + post.comments, 0)
    const engagementRate = totalReach > 0 ? ((totalEngagement / totalReach) * 100).toFixed(2) : '0'

    const totalLikes = filteredPosts.reduce((sum, post) => sum + post.likes, 0)
    const avgLikes = totalPosts > 0 ? Math.round(totalLikes / totalPosts) : 0

    const totalComments = filteredPosts.reduce((sum, post) => sum + post.comments, 0)
    const avgComments = totalPosts > 0 ? Math.round(totalComments / totalPosts) : 0

    const totalImpressions = filteredPosts.reduce((sum, post) => sum + (post.impressions || 0), 0)

    // Calcular tendencia
    const recentPosts = filteredPosts.slice(0, Math.min(5, filteredPosts.length))
    const olderPosts = filteredPosts.slice(5, Math.min(10, filteredPosts.length))

    const recentAvg = recentPosts.length > 0
      ? recentPosts.reduce((sum, p) => {
          const reach = p.reach || 0
          const eng = p.likes + p.comments
          return sum + (reach > 0 ? (eng / reach) * 100 : 0)
        }, 0) / recentPosts.length
      : 0

    const olderAvg = olderPosts.length > 0
      ? olderPosts.reduce((sum, p) => {
          const reach = p.reach || 0
          const eng = p.likes + p.comments
          return sum + (reach > 0 ? (eng / reach) * 100 : 0)
        }, 0) / olderPosts.length
      : 0

    const trend = olderAvg > 0 ? ((recentAvg - olderAvg) / olderAvg * 100).toFixed(1) : '0'
    const trendPositive = parseFloat(trend) >= 0

    return {
      totalPosts,
      avgReach,
      totalReach,
      totalImpressions,
      engagementRate,
      totalEngagement,
      avgLikes,
      totalLikes,
      avgComments,
      totalComments,
      trend,
      trendPositive
    }
  }, [filteredPosts])

  const clearFilters = () => {
    setStartDate('')
    setEndDate('')
  }

  const hasActiveFilters = startDate || endDate

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header con filtros */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Analytics</h1>
          <p className="text-gray-600 mt-1">
            {hasActiveFilters ? `${filteredPosts.length} posts filtrados` : `${posts.length} posts totales`}
          </p>
        </div>
        <Button
          onClick={() => setShowFilters(!showFilters)}
          variant="outline"
          className="gap-2"
        >
          <Calendar className="h-4 w-4" />
          {showFilters ? 'Ocultar Filtros' : 'Filtrar por Fecha'}
        </Button>
      </div>

      {/* Filtros de fecha */}
      {showFilters && (
        <Card className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha Inicio
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha Fin
              </label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={clearFilters}
                variant="outline"
                className="gap-2 flex-1"
                disabled={!hasActiveFilters}
              >
                <X className="h-4 w-4" />
                Limpiar
              </Button>
            </div>
          </div>
          {hasActiveFilters && (
            <div className="mt-3 text-sm text-gray-600">
              Mostrando posts desde {startDate || 'el inicio'} hasta {endDate || 'hoy'}
            </div>
          )}
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Seguidores Card */}
        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full -mr-16 -mt-16 opacity-10"></div>
          <div className="p-6 relative">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg">
                <Users className="h-6 w-6 text-white" />
              </div>
              <Badge className="bg-blue-100 text-blue-800 border-0">Posts</Badge>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-600 mb-1">Total Posts</div>
              <div className="text-4xl font-bold text-gray-900 mb-2">
                {metrics.totalPosts}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  <span>en período seleccionado</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Alcance Card */}
        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full -mr-16 -mt-16 opacity-10"></div>
          <div className="p-6 relative">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center shadow-lg">
                <Eye className="h-6 w-6 text-white" />
              </div>
              <Badge className="bg-purple-100 text-purple-800 border-0">Visibilidad</Badge>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-600 mb-1">Alcance Promedio</div>
              <div className="text-4xl font-bold text-gray-900 mb-2">
                {metrics.avgReach.toLocaleString()}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <BarChart3 className="h-4 w-4" />
                <span>{metrics.totalImpressions.toLocaleString()} impresiones totales</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Engagement Card */}
        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-pink-400 to-pink-600 rounded-full -mr-16 -mt-16 opacity-10"></div>
          <div className="p-6 relative">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-pink-400 to-pink-600 flex items-center justify-center shadow-lg">
                <Heart className="h-6 w-6 text-white" />
              </div>
              <Badge className={`border-0 ${metrics.trendPositive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                <span className="flex items-center gap-1">
                  {metrics.trendPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {metrics.trend}%
                </span>
              </Badge>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-600 mb-1">Engagement Rate</div>
              <div className="text-4xl font-bold text-gray-900 mb-2">{metrics.engagementRate}%</div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <MessageCircle className="h-4 w-4" />
                <span>{metrics.totalEngagement.toLocaleString()} interacciones</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Likes Card */}
        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-red-400 to-red-600 rounded-full -mr-16 -mt-16 opacity-10"></div>
          <div className="p-6 relative">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center shadow-lg">
                <Heart className="h-6 w-6 text-white" />
              </div>
              <Badge className="bg-red-100 text-red-800 border-0">Likes</Badge>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-600 mb-1">Likes Promedio</div>
              <div className="text-4xl font-bold text-gray-900 mb-2">
                {metrics.avgLikes.toLocaleString()}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Heart className="h-4 w-4" />
                <span>{metrics.totalLikes.toLocaleString()} likes totales</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Comments Card */}
        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-400 to-green-600 rounded-full -mr-16 -mt-16 opacity-10"></div>
          <div className="p-6 relative">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-lg">
                <MessageCircle className="h-6 w-6 text-white" />
              </div>
              <Badge className="bg-green-100 text-green-800 border-0">Comentarios</Badge>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-600 mb-1">Comentarios Promedio</div>
              <div className="text-4xl font-bold text-gray-900 mb-2">
                {metrics.avgComments.toLocaleString()}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <MessageCircle className="h-4 w-4" />
                <span>{metrics.totalComments.toLocaleString()} comentarios totales</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Top Posts */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Top Posts del Período</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPosts.slice(0, 6).map((post) => (
            <Card key={post.id} className="p-4 hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-3 mb-3">
                <Badge className="bg-purple-100 text-purple-800">
                  {post.media_type}
                </Badge>
                <Badge className={`${
                  post.engagement_rate >= 15 ? 'bg-green-100 text-green-800' :
                  post.engagement_rate >= 8 ? 'bg-blue-100 text-blue-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {post.engagement_rate.toFixed(1)}%
                </Badge>
              </div>
              <p className="text-sm text-gray-900 line-clamp-2 mb-2">
                {post.caption || 'Sin caption'}
              </p>
              <div className="flex items-center gap-4 text-xs text-gray-500 mb-2">
                <span className="flex items-center gap-1">
                  <Heart className="h-3 w-3" />
                  {post.likes}
                </span>
                <span className="flex items-center gap-1">
                  <MessageCircle className="h-3 w-3" />
                  {post.comments}
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  {post.reach}
                </span>
              </div>
              <p className="text-xs text-gray-400">
                {new Date(post.timestamp).toLocaleDateString('es-ES')}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
