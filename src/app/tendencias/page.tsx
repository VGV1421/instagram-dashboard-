"use client"

import { useEffect, useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EngagementChart } from '@/components/charts/engagement-chart';
import { ReachChart } from '@/components/charts/reach-chart';
import { MediaTypeChart } from '@/components/charts/media-type-chart';
import { TrendingUp, TrendingDown, BarChart3, Users, Calendar, X } from 'lucide-react';

interface Post {
  timestamp: string;
  engagement_rate: number;
  reach: number;
  likes: number;
  comments: number;
  media_type: string;
}

interface TrendsData {
  summary: {
    totalPosts: number;
    totalLikes: number;
    totalComments: number;
    avgEngagement: number;
  };
  timeline: Array<{
    date: string;
    engagement: number;
    reach: number;
    likes: number;
    comments: number;
    timestamp?: string;
  }>;
  byMediaType: Array<{
    type: string;
    count: number;
    avgEngagement: number;
    avgReach: number;
    avgLikes: number;
  }>;
  posts?: Post[];
}

export default function TendenciasPage() {
  const [data, setData] = useState<TrendsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchTrends();
  }, []);

  const fetchTrends = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/analytics/trends');

      if (!response.ok) {
        throw new Error('Error al obtener tendencias');
      }

      const result = await response.json();

      if (result.success) {
        // También obtener posts directamente para filtrado
        const postsResponse = await fetch('/api/posts');
        const postsResult = await postsResponse.json();

        setData({
          ...result.data,
          posts: postsResult.success ? postsResult.posts : []
        });
      } else {
        throw new Error(result.error || 'Error desconocido');
      }
    } catch (err: any) {
      console.error('Error fetching trends:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar posts por rango de fechas
  const filteredPosts = useMemo(() => {
    if (!data?.posts || (!startDate && !endDate)) return data?.posts || [];

    return data.posts.filter(post => {
      const postDate = new Date(post.timestamp);
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate + 'T23:59:59') : null;

      if (start && postDate < start) return false;
      if (end && postDate > end) return false;
      return true;
    });
  }, [data?.posts, startDate, endDate]);

  // Recalcular métricas basadas en posts filtrados
  const filteredData = useMemo(() => {
    if (!data) return null;
    if (!startDate && !endDate) return data;

    const posts = filteredPosts;

    // Recalcular summary
    const totalPosts = posts.length;
    const totalLikes = posts.reduce((sum, post) => sum + (post.likes || 0), 0);
    const totalComments = posts.reduce((sum, post) => sum + (post.comments || 0), 0);
    const avgEngagement = posts.length > 0
      ? posts.reduce((sum, post) => sum + (post.engagement_rate || 0), 0) / posts.length
      : 0;

    // Recalcular byMediaType
    const byMediaTypeMap = posts.reduce((acc: any, post) => {
      const type = post.media_type || 'UNKNOWN';
      if (!acc[type]) {
        acc[type] = {
          count: 0,
          totalEngagement: 0,
          totalReach: 0,
          totalLikes: 0,
        };
      }
      acc[type].count++;
      acc[type].totalEngagement += post.engagement_rate || 0;
      acc[type].totalReach += post.reach || 0;
      acc[type].totalLikes += post.likes || 0;
      return acc;
    }, {});

    const byMediaType = Object.entries(byMediaTypeMap).map(([type, data]: [string, any]) => ({
      type,
      count: data.count,
      avgEngagement: data.totalEngagement / data.count,
      avgReach: Math.round(data.totalReach / data.count),
      avgLikes: Math.round(data.totalLikes / data.count),
    }));

    // Recalcular timeline
    const timeline = posts.map(post => ({
      date: new Date(post.timestamp).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }),
      engagement: parseFloat(String(post.engagement_rate)) || 0,
      reach: post.reach || 0,
      likes: post.likes || 0,
      comments: post.comments || 0,
      timestamp: post.timestamp
    }));

    return {
      summary: {
        totalPosts,
        totalLikes,
        totalComments,
        avgEngagement: parseFloat(avgEngagement.toFixed(2)),
      },
      timeline,
      byMediaType,
      posts
    };
  }, [data, filteredPosts, startDate, endDate]);

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
  };

  const hasActiveFilters = startDate || endDate;

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando tendencias...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error: {error || 'No se pudieron cargar los datos'}</p>
          <button
            onClick={fetchTrends}
            className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  const displayData = filteredData || data;
  const { summary, timeline, byMediaType } = displayData;

  return (
    <div className="space-y-6">
      {/* Header con filtros */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tendencias</h1>
          <p className="text-gray-600 mt-1">
            {hasActiveFilters
              ? `Análisis de ${summary.totalPosts} posts filtrados`
              : 'Análisis y evolución de tus métricas de Instagram'
            }
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total de Posts</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{summary.totalPosts}</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
              <BarChart3 className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Engagement Promedio</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{summary.avgEngagement}%</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-2 flex items-center text-sm text-green-600">
            <TrendingUp className="h-4 w-4 mr-1" />
            <span>Buen rendimiento</span>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Likes</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{summary.totalLikes.toLocaleString()}</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-pink-100 flex items-center justify-center">
              <Users className="h-6 w-6 text-pink-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Comentarios</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{summary.totalComments.toLocaleString()}</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
              <Users className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <EngagementChart data={timeline} />
        <ReachChart data={timeline} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MediaTypeChart data={byMediaType} />

        {/* Best Performing Posts */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Mejores Posts</h3>
          <div className="space-y-4">
            {timeline
              .sort((a, b) => b.engagement - a.engagement)
              .slice(0, 5)
              .map((post, index) => (
                <div key={index} className="flex items-center justify-between border-b pb-3 last:border-b-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{post.date}</p>
                    <p className="text-xs text-gray-500">{post.likes} likes · {post.comments} comentarios</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-purple-600">{post.engagement.toFixed(2)}%</p>
                    <p className="text-xs text-gray-500">engagement</p>
                  </div>
                </div>
              ))}
          </div>
        </Card>
      </div>

      {/* Media Type Performance Table */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Rendimiento por Tipo de Contenido</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Tipo</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-900">Posts</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-900">Engagement Promedio</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-900">Alcance Promedio</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-900">Likes Promedio</th>
              </tr>
            </thead>
            <tbody>
              {byMediaType
                .sort((a, b) => b.avgEngagement - a.avgEngagement)
                .map((item, index) => (
                  <tr key={index} className="border-b last:border-b-0">
                    <td className="py-3 px-4 text-sm text-gray-900">{item.type}</td>
                    <td className="py-3 px-4 text-sm text-gray-900 text-right">{item.count}</td>
                    <td className="py-3 px-4 text-sm font-medium text-purple-600 text-right">
                      {item.avgEngagement.toFixed(2)}%
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900 text-right">
                      {item.avgReach.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900 text-right">
                      {item.avgLikes.toLocaleString()}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
