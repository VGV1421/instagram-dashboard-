"use client"

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp, Clock, BarChart3, Hash, Heart, MessageCircle,
  FileText, Calendar, Activity
} from 'lucide-react';

interface CompetitorMetrics {
  competitor_id: string;
  competitor_username: string;
  growth_rate: number;
  posting_frequency: number;
  avg_engagement_rate: number;
  best_time_to_post: string;
  content_mix: {
    reels: number;
    posts: number;
    carousels: number;
    videos: number;
  };
  top_hashtags: Array<{ hashtag: string; count: number }>;
  avg_likes: number;
  avg_comments: number;
  content_themes: string[];
  total_posts: number;
}

export function AnalyticsDashboard() {
  const [metrics, setMetrics] = useState<CompetitorMetrics[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      const response = await fetch('/api/competitors/analytics');
      const result = await response.json();

      if (result.success) {
        setMetrics(result.data.metrics);
      }
    } catch (error) {
      console.error('Error fetching metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Calculando métricas...</p>
          </div>
        </div>
      </Card>
    );
  }

  if (metrics.length === 0) {
    return null;
  }

  const metric = metrics[0]; // Solo mostramos el primer competidor activo

  const totalContent = metric.content_mix.reels + metric.content_mix.posts +
                       metric.content_mix.carousels + metric.content_mix.videos;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 rounded-2xl p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">📊 Dashboard de Competencia</h2>
        <p className="text-white/90">Análisis de @{metric.competitor_username}</p>
      </div>

      {/* Métricas Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Growth Rate */}
        <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-green-700 font-medium mb-1">Growth Rate</p>
              <p className="text-3xl font-bold text-green-900">{metric.growth_rate}</p>
              <p className="text-xs text-green-600 mt-1">posts/semana</p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-600" />
          </div>
        </Card>

        {/* Posting Frequency */}
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-blue-700 font-medium mb-1">Posting Frequency</p>
              <p className="text-3xl font-bold text-blue-900">{metric.posting_frequency}</p>
              <p className="text-xs text-blue-600 mt-1">posts/semana</p>
            </div>
            <Calendar className="h-8 w-8 text-blue-600" />
          </div>
        </Card>

        {/* Engagement Rate */}
        <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-purple-700 font-medium mb-1">Engagement Rate</p>
              <p className="text-3xl font-bold text-purple-900">{metric.avg_engagement_rate}%</p>
              <p className="text-xs text-purple-600 mt-1">promedio</p>
            </div>
            <Activity className="h-8 w-8 text-purple-600" />
          </div>
        </Card>

        {/* Best Time to Post */}
        <Card className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-orange-700 font-medium mb-1">Best Time to Post</p>
              <p className="text-2xl font-bold text-orange-900">{metric.best_time_to_post}</p>
              <p className="text-xs text-orange-600 mt-1">hora óptima</p>
            </div>
            <Clock className="h-8 w-8 text-orange-600" />
          </div>
        </Card>
      </div>

      {/* Likes y Comments */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Heart className="h-6 w-6 text-red-500" />
            <h3 className="text-lg font-semibold">Average Likes</h3>
          </div>
          <p className="text-4xl font-bold text-gray-900">{metric.avg_likes.toLocaleString()}</p>
          <p className="text-sm text-gray-600 mt-2">likes por post</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <MessageCircle className="h-6 w-6 text-blue-500" />
            <h3 className="text-lg font-semibold">Average Comments</h3>
          </div>
          <p className="text-4xl font-bold text-gray-900">{metric.avg_comments.toLocaleString()}</p>
          <p className="text-sm text-gray-600 mt-2">comments por post</p>
        </Card>
      </div>

      {/* Content Mix */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <BarChart3 className="h-6 w-6 text-purple-600" />
          <h3 className="text-lg font-semibold">Content Mix</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <p className="text-3xl font-bold text-purple-900">{metric.content_mix.reels}</p>
            <p className="text-sm text-purple-600 mt-1">Reels</p>
            <p className="text-xs text-gray-500">
              {totalContent > 0 ? ((metric.content_mix.reels / totalContent) * 100).toFixed(1) : 0}%
            </p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-3xl font-bold text-blue-900">{metric.content_mix.posts}</p>
            <p className="text-sm text-blue-600 mt-1">Posts</p>
            <p className="text-xs text-gray-500">
              {totalContent > 0 ? ((metric.content_mix.posts / totalContent) * 100).toFixed(1) : 0}%
            </p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-3xl font-bold text-green-900">{metric.content_mix.carousels}</p>
            <p className="text-sm text-green-600 mt-1">Carruseles</p>
            <p className="text-xs text-gray-500">
              {totalContent > 0 ? ((metric.content_mix.carousels / totalContent) * 100).toFixed(1) : 0}%
            </p>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <p className="text-3xl font-bold text-orange-900">{metric.content_mix.videos}</p>
            <p className="text-sm text-orange-600 mt-1">Videos</p>
            <p className="text-xs text-gray-500">
              {totalContent > 0 ? ((metric.content_mix.videos / totalContent) * 100).toFixed(1) : 0}%
            </p>
          </div>
        </div>
      </Card>

      {/* Top Hashtags */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Hash className="h-6 w-6 text-blue-600" />
          <h3 className="text-lg font-semibold">Top Hashtags</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {metric.top_hashtags.slice(0, 10).map((tag, index) => (
            <Badge
              key={index}
              variant="outline"
              className="px-3 py-1 text-sm bg-blue-50 border-blue-200 text-blue-700"
            >
              {tag.hashtag} <span className="ml-1 text-xs text-blue-500">({tag.count})</span>
            </Badge>
          ))}
        </div>
      </Card>

      {/* Content Themes */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <FileText className="h-6 w-6 text-green-600" />
          <h3 className="text-lg font-semibold">Content Themes</h3>
        </div>
        <div className="flex flex-wrap gap-3">
          {metric.content_themes.map((theme, index) => (
            <Badge
              key={index}
              className="px-4 py-2 text-base bg-gradient-to-r from-green-500 to-emerald-600 text-white"
            >
              {theme}
            </Badge>
          ))}
        </div>
        <p className="text-sm text-gray-600 mt-3">
          Total de posts analizados: <span className="font-semibold">{metric.total_posts}</span>
        </p>
      </Card>
    </div>
  );
}
