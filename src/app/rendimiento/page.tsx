"use client"

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { TrendingUp, TrendingDown, Image, Video, Film, Heart, MessageCircle, Eye, Share2 } from 'lucide-react';

interface Post {
  id: string;
  caption: string;
  media_type: string;
  likes: number;
  comments: number;
  reach: number;
  impressions: number;
  saved: number;
  shares: number;
  engagement_rate: number;
  timestamp: string;
  permalink: string;
}

export default function RendimientoPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [dateFilter, setDateFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/posts');
      const data = await response.json();

      if (data.success) {
        setPosts(data.posts || []);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMediaIcon = (type: string) => {
    const icons = {
      IMAGE: Image,
      VIDEO: Video,
      CAROUSEL_ALBUM: Film,
      REELS: Video,
    };
    const Icon = icons[type as keyof typeof icons] || Image;
    return <Icon className="h-4 w-4" />;
  };

  const getMediaColor = (type: string) => {
    const colors = {
      IMAGE: 'bg-blue-100 text-blue-800',
      VIDEO: 'bg-purple-100 text-purple-800',
      CAROUSEL_ALBUM: 'bg-green-100 text-green-800',
      REELS: 'bg-pink-100 text-pink-800',
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getEngagementBadge = (rate: number) => {
    if (rate >= 15) return { label: 'Excelente', color: 'bg-green-100 text-green-800' };
    if (rate >= 8) return { label: 'Bueno', color: 'bg-blue-100 text-blue-800' };
    if (rate >= 5) return { label: 'Regular', color: 'bg-yellow-100 text-yellow-800' };
    return { label: 'Bajo', color: 'bg-red-100 text-red-800' };
  };

  // Función para filtrar por fecha
  const getDateFilterRange = () => {
    const now = new Date();
    switch (dateFilter) {
      case '7days':
        const sevenDaysAgo = new Date(now);
        sevenDaysAgo.setDate(now.getDate() - 7);
        return { start: sevenDaysAgo, end: null };
      case '30days':
        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(now.getDate() - 30);
        return { start: thirtyDaysAgo, end: null };
      case '90days':
        const ninetyDaysAgo = new Date(now);
        ninetyDaysAgo.setDate(now.getDate() - 90);
        return { start: ninetyDaysAgo, end: null };
      case 'custom':
        return {
          start: startDate ? new Date(startDate) : null,
          end: endDate ? new Date(endDate + 'T23:59:59') : null
        };
      default:
        return { start: null, end: null };
    }
  };

  // Filtrar y ordenar posts
  let filteredPosts = posts.filter(post => {
    const matchesSearch = post.caption?.toLowerCase().includes(searchQuery.toLowerCase()) || false;
    const matchesType = filterType === 'all' || post.media_type === filterType;

    // Filtro de fecha
    const dateRange = getDateFilterRange();
    const postDate = new Date(post.timestamp);
    let matchesDate = true;

    if (dateRange.start && postDate < dateRange.start) matchesDate = false;
    if (dateRange.end && postDate > dateRange.end) matchesDate = false;

    return matchesSearch && matchesType && matchesDate;
  });

  if (sortBy === 'engagement') {
    filteredPosts = [...filteredPosts].sort((a, b) => b.engagement_rate - a.engagement_rate);
  } else if (sortBy === 'reach') {
    filteredPosts = [...filteredPosts].sort((a, b) => b.reach - a.reach);
  } else if (sortBy === 'likes') {
    filteredPosts = [...filteredPosts].sort((a, b) => b.likes - a.likes);
  } else {
    filteredPosts = [...filteredPosts].sort((a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  // Calcular estadísticas
  const stats = {
    total: posts.length,
    avgEngagement: posts.reduce((sum, p) => sum + p.engagement_rate, 0) / (posts.length || 1),
    avgReach: Math.round(posts.reduce((sum, p) => sum + p.reach, 0) / (posts.length || 1)),
    avgLikes: Math.round(posts.reduce((sum, p) => sum + p.likes, 0) / (posts.length || 1)),
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando rendimiento...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Rendimiento</h1>
        <p className="text-gray-600 mt-1">Análisis detallado de cada publicación</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-gray-600">Total Posts</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Engagement Promedio</p>
          <p className="text-2xl font-bold text-purple-600 mt-1">
            {stats.avgEngagement.toFixed(1)}%
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Alcance Promedio</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">
            {stats.avgReach.toLocaleString()}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Likes Promedio</p>
          <p className="text-2xl font-bold text-pink-600 mt-1">
            {stats.avgLikes.toLocaleString()}
          </p>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Buscar
            </label>
            <Input
              type="text"
              placeholder="Buscar por texto..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Período
            </label>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="all">Todos los tiempos</option>
              <option value="7days">Últimos 7 días</option>
              <option value="30days">Últimos 30 días</option>
              <option value="90days">Últimos 90 días</option>
              <option value="custom">Personalizado</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de contenido
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="all">Todos</option>
              <option value="IMAGE">Imágenes</option>
              <option value="VIDEO">Videos</option>
              <option value="CAROUSEL_ALBUM">Carruseles</option>
              <option value="REELS">Reels</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ordenar por
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="date">Fecha</option>
              <option value="engagement">Engagement</option>
              <option value="reach">Alcance</option>
              <option value="likes">Likes</option>
            </select>
          </div>
        </div>

        {/* Custom Date Range */}
        {dateFilter === 'custom' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t">
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
          </div>
        )}
      </Card>

      {/* Posts List */}
      <div className="space-y-4">
        {filteredPosts.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-gray-500">No se encontraron publicaciones</p>
          </Card>
        ) : (
          filteredPosts.map((post) => {
            const engagementBadge = getEngagementBadge(post.engagement_rate);
            return (
              <Card key={post.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Left: Caption & Type */}
                  <div className="flex-1">
                    <div className="flex items-start gap-3 mb-3">
                      <Badge className={getMediaColor(post.media_type)}>
                        <span className="flex items-center gap-1">
                          {getMediaIcon(post.media_type)}
                          {post.media_type}
                        </span>
                      </Badge>
                      <Badge className={engagementBadge.color}>
                        {engagementBadge.label}
                      </Badge>
                    </div>
                    <p className="text-gray-900 line-clamp-3 mb-2">
                      {post.caption || 'Sin caption'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(post.timestamp).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>

                  {/* Right: Metrics */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 min-w-[300px]">
                    <div className="flex items-center gap-2">
                      <div className="h-10 w-10 rounded-full bg-pink-100 flex items-center justify-center">
                        <Heart className="h-5 w-5 text-pink-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Likes</p>
                        <p className="text-sm font-bold">{post.likes.toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <MessageCircle className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Comentarios</p>
                        <p className="text-sm font-bold">{post.comments.toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                        <Eye className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Alcance</p>
                        <p className="text-sm font-bold">{post.reach.toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                        {post.engagement_rate >= stats.avgEngagement ? (
                          <TrendingUp className="h-5 w-5 text-green-600" />
                        ) : (
                          <TrendingDown className="h-5 w-5 text-red-600" />
                        )}
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Engagement</p>
                        <p className="text-sm font-bold text-purple-600">
                          {post.engagement_rate.toFixed(2)}%
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
                        <Share2 className="h-5 w-5 text-yellow-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Guardados</p>
                        <p className="text-sm font-bold">{post.saved || 0}</p>
                      </div>
                    </div>

                    <div className="flex items-center">
                      <a
                        href={post.permalink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-purple-600 hover:text-purple-700 hover:underline"
                      >
                        Ver en Instagram →
                      </a>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
