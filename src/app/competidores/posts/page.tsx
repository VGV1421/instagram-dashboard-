"use client"

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Heart, MessageCircle, TrendingUp, Calendar, ExternalLink,
  RefreshCw, Filter, ArrowUpDown, Image as ImageIcon, Video
} from 'lucide-react';
import { toast } from 'sonner';

interface CompetitorPost {
  id: string;
  competitor_id: string;
  competitor_username: string;
  competitor_display_name: string;
  instagram_post_id: string;
  caption: string | null;
  media_type: string;
  media_url: string | null;
  permalink: string;
  timestamp: string;
  likes: number;
  comments: number;
  engagement_rate: number;
}

interface Competitor {
  id: string;
  instagram_username: string;
  display_name: string | null;
}

export default function CompetitorPostsPage() {
  const [posts, setPosts] = useState<CompetitorPost[]>([]);
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [selectedCompetitor, setSelectedCompetitor] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'engagement' | 'likes'>('date');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCompetitors();
    fetchPosts();
  }, []);

  const fetchCompetitors = async () => {
    try {
      const response = await fetch('/api/competitors/import');
      const result = await response.json();
      if (result.success) {
        setCompetitors(result.data.competitors);
      }
    } catch (error) {
      console.error('Error fetching competitors:', error);
    }
  };

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/competitors/posts');
      const result = await response.json();

      if (result.success) {
        setPosts(result.data.posts);
      } else {
        toast.error('Error al cargar posts');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  // Filtrar y ordenar posts
  const filteredPosts = posts
    .filter(post => selectedCompetitor === 'all' || post.competitor_id === selectedCompetitor)
    .sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      } else if (sortBy === 'engagement') {
        return b.engagement_rate - a.engagement_rate;
      } else if (sortBy === 'likes') {
        return b.likes - a.likes;
      }
      return 0;
    });

  // Extraer tema/keywords del caption
  const extractTopic = (caption: string | null): string[] => {
    if (!caption) return [];

    const hashtags = caption.match(/#[\w\u00C0-\u017F]+/g) || [];
    if (hashtags.length > 0) {
      return hashtags.slice(0, 3).map(h => h.substring(1));
    }

    // Si no hay hashtags, extraer palabras clave del caption
    const words = caption
      .toLowerCase()
      .replace(/[^\w\sáéíóúñü]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 6);

    return words.slice(0, 3);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semanas`;

    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-500 to-pink-500 rounded-2xl p-8 text-white">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-14 w-14 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
            <TrendingUp className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Posts de Competidores</h1>
            <p className="text-blue-100">Análisis de publicaciones y contenido exitoso</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-4 mt-4">
          <div className="bg-white/10 backdrop-blur rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="h-4 w-4" />
              <span className="text-sm font-medium">Últimas publicaciones</span>
            </div>
            <p className="text-xs text-blue-100">{filteredPosts.length} posts analizados</p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Heart className="h-4 w-4" />
              <span className="text-sm font-medium">Engagement real</span>
            </div>
            <p className="text-xs text-blue-100">Likes y comentarios verificados</p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Filter className="h-4 w-4" />
              <span className="text-sm font-medium">Análisis de temas</span>
            </div>
            <p className="text-xs text-blue-100">Keywords y hashtags extraídos</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex items-center gap-3">
            <Filter className="h-5 w-5 text-gray-600" />
            <select
              value={selectedCompetitor}
              onChange={(e) => setSelectedCompetitor(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm"
            >
              <option value="all">Todos los competidores</option>
              {competitors.map(comp => (
                <option key={comp.id} value={comp.id}>
                  @{comp.instagram_username}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3">
            <ArrowUpDown className="h-5 w-5 text-gray-600" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="border rounded-lg px-3 py-2 text-sm"
            >
              <option value="date">Más recientes</option>
              <option value="engagement">Mayor engagement</option>
              <option value="likes">Más likes</option>
            </select>
          </div>

          <Button
            onClick={fetchPosts}
            variant="outline"
            size="sm"
            disabled={loading}
          >
            {loading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
      </Card>

      {/* Posts Grid */}
      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Card key={i} className="p-4 animate-pulse">
              <div className="bg-gray-200 h-48 rounded-lg mb-4"></div>
              <div className="bg-gray-200 h-4 rounded mb-2"></div>
              <div className="bg-gray-200 h-4 rounded w-2/3"></div>
            </Card>
          ))}
        </div>
      ) : filteredPosts.length === 0 ? (
        <Card className="p-12 text-center border-2 border-dashed border-gray-300">
          <ImageIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No hay posts disponibles
          </h3>
          <p className="text-sm text-gray-600 max-w-md mx-auto">
            Sincroniza los datos de competidores para ver sus publicaciones más recientes
          </p>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPosts.map((post) => {
            const topics = extractTopic(post.caption);

            return (
              <Card key={post.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                {/* Media */}
                {post.media_url && (
                  <div className="relative h-64 bg-gray-100">
                    <img
                      src={post.media_url}
                      alt="Post"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = 'https://via.placeholder.com/400?text=Post+Image';
                      }}
                    />
                    <div className="absolute top-2 right-2">
                      <Badge className="bg-black/50 text-white border-0">
                        {post.media_type === 'VIDEO' ? (
                          <Video className="h-3 w-3 mr-1" />
                        ) : (
                          <ImageIcon className="h-3 w-3 mr-1" />
                        )}
                        {post.media_type}
                      </Badge>
                    </div>
                  </div>
                )}

                <div className="p-4">
                  {/* Competitor Info */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold">
                      {post.competitor_username.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        @{post.competitor_username}
                      </p>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Calendar className="h-3 w-3" />
                        {formatDate(post.timestamp)}
                      </div>
                    </div>
                    <a
                      href={post.permalink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>

                  {/* Caption */}
                  {post.caption && (
                    <p className="text-sm text-gray-700 line-clamp-3 mb-3">
                      {post.caption}
                    </p>
                  )}

                  {/* Topics/Hashtags */}
                  {topics.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {topics.map((topic, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs text-purple-600">
                          {topic}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Metrics */}
                  <div className="grid grid-cols-3 gap-2 pt-3 border-t mb-3">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Heart className="h-4 w-4 text-red-500" />
                      </div>
                      <p className="text-xs font-bold text-gray-900">
                        {post.likes.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500">likes</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <MessageCircle className="h-4 w-4 text-blue-500" />
                      </div>
                      <p className="text-xs font-bold text-gray-900">
                        {post.comments.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500">comments</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      </div>
                      <p className="text-xs font-bold text-gray-900">
                        {post.engagement_rate.toFixed(2)}%
                      </p>
                      <p className="text-xs text-gray-500">engagement</p>
                    </div>
                  </div>

                  {/* Link to Instagram */}
                  <a
                    href={post.permalink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full"
                  >
                    <Button
                      variant="outline"
                      className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Ver en Instagram
                    </Button>
                  </a>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
