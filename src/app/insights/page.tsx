"use client"

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Clock, TrendingUp, Hash, Key, Users, BarChart3,
  Lightbulb, Target, Lock, ArrowRight, Calendar,
  Sparkles
} from 'lucide-react';

interface BestTimeData {
  bestTime: {
    day: string;
    hour: string;
    avgEngagement: number;
    postCount: number;
  } | null;
  byDay: Array<{
    dayName: string;
    avgEngagement: number;
    postCount: number;
  }>;
  byHour: Array<{
    hour: number;
    hourLabel: string;
    avgEngagement: number;
    postCount: number;
  }>;
  topSlots: Array<{
    day: string;
    hour: string;
    avgEngagement: number;
    postCount: number;
  }>;
  totalPosts: number;
}

interface KeywordData {
  topByEngagement: Array<{
    keyword: string;
    frequency: number;
    avgEngagement: number;
    avgLikes: number;
    avgComments: number;
  }>;
  topByFrequency: Array<{
    keyword: string;
    frequency: number;
    avgEngagement: number;
  }>;
  totalKeywords: number;
  totalPosts: number;
}

interface HashtagData {
  topByEngagement: Array<{
    hashtag: string;
    frequency: number;
    avgEngagement: number;
    avgLikes: number;
    avgComments: number;
    avgReach: number;
  }>;
  topByFrequency: Array<{
    hashtag: string;
    frequency: number;
    avgEngagement: number;
  }>;
  topCombinations: Array<{
    hashtags: string[];
    frequency: number;
    avgEngagement: number;
  }>;
  totalHashtags: number;
  totalPosts: number;
}

export default function InsightsPage() {
  const [source, setSource] = useState<'own' | 'competitors'>('own');
  const [bestTime, setBestTime] = useState<BestTimeData | null>(null);
  const [keywords, setKeywords] = useState<KeywordData | null>(null);
  const [hashtags, setHashtags] = useState<HashtagData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllInsights();
  }, [source]);

  const fetchAllInsights = async () => {
    setLoading(true);
    try {
      const [bestTimeRes, keywordsRes, hashtagsRes] = await Promise.all([
        fetch(`/api/insights/best-time?source=${source}`),
        fetch(`/api/insights/keywords?source=${source}`),
        fetch(`/api/insights/hashtags?source=${source}`)
      ]);

      const [bestTimeData, keywordsData, hashtagsData] = await Promise.all([
        bestTimeRes.json(),
        keywordsRes.json(),
        hashtagsRes.json()
      ]);

      if (bestTimeData.success) setBestTime(bestTimeData.data);
      if (keywordsData.success) setKeywords(keywordsData.data);
      if (hashtagsData.success) setHashtags(hashtagsData.data);
    } catch (error) {
      console.error('Error fetching insights:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Analizando tus datos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-6 w-6 text-purple-600" />
          <h1 className="text-2xl font-bold text-gray-900">Insights Inteligentes</h1>
        </div>
        <p className="text-gray-600">Descubre qué funciona mejor para tu audiencia</p>
      </div>

      {/* Source Toggle */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900 mb-1">Fuente de análisis</p>
            <p className="text-xs text-gray-600">Analiza tus propios datos o compáralos con competidores</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setSource('own')}
              variant={source === 'own' ? 'default' : 'outline'}
              className={source === 'own' ? 'bg-purple-600 hover:bg-purple-700' : ''}
              size="sm"
            >
              <Users className="h-4 w-4 mr-2" />
              Mis Posts ({bestTime?.totalPosts || 0})
            </Button>
            <Button
              onClick={() => setSource('competitors')}
              variant="outline"
              size="sm"
              disabled
              className="opacity-50 cursor-not-allowed"
            >
              <Target className="h-4 w-4 mr-2" />
              Competidores (0)
              <Lock className="h-3 w-3 ml-2" />
            </Button>
          </div>
        </div>
        {source === 'competitors' && (
          <div className="mt-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
            <p className="text-sm text-purple-800">
              <Lock className="h-4 w-4 inline mr-2" />
              El análisis de competidores estará disponible próximamente
            </p>
          </div>
        )}
      </Card>

      {/* Best Time to Post */}
      {bestTime?.bestTime && (
        <Card className="p-6 border-l-4 border-blue-500">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Mejor Momento para Publicar</h3>
                <p className="text-sm text-gray-600">Basado en {bestTime.totalPosts} posts analizados</p>
              </div>
            </div>
            <Badge className="bg-blue-100 text-blue-800">
              {bestTime.bestTime.avgEngagement}% engagement
            </Badge>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Recommended Time */}
            <div className="p-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl text-white">
              <p className="text-sm font-medium mb-2 opacity-90">Momento óptimo</p>
              <p className="text-3xl font-bold mb-1">{bestTime.bestTime.day}</p>
              <p className="text-2xl font-semibold mb-3">{bestTime.bestTime.hour}</p>
              <div className="flex items-center gap-2 text-sm opacity-90">
                <TrendingUp className="h-4 w-4" />
                <span>{bestTime.bestTime.postCount} posts publicados en este horario</span>
              </div>
            </div>

            {/* Top 5 Slots */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-3">Top 5 horarios</p>
              <div className="space-y-2">
                {bestTime.topSlots.slice(0, 5).map((slot, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-600">
                        {idx + 1}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{slot.day} - {slot.hour}</p>
                        <p className="text-xs text-gray-600">{slot.postCount} posts</p>
                      </div>
                    </div>
                    <Badge className="bg-blue-100 text-blue-800 text-xs">
                      {slot.avgEngagement}%
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Keywords Analysis */}
      {keywords && (
        <Card className="p-6 border-l-4 border-green-500">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <Key className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Keywords más Efectivas</h3>
                <p className="text-sm text-gray-600">{keywords.totalKeywords} palabras clave encontradas</p>
              </div>
            </div>
            <Lightbulb className="h-6 w-6 text-yellow-500" />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Top by Engagement */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                Top por Engagement
              </p>
              <div className="space-y-2">
                {keywords.topByEngagement.slice(0, 10).map((kw, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">💡</span>
                      <div>
                        <p className="text-sm font-medium text-gray-900">"{kw.keyword}"</p>
                        <p className="text-xs text-gray-600">{kw.frequency} veces usado</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className="bg-green-100 text-green-800 text-xs mb-1">
                        {kw.avgEngagement}%
                      </Badge>
                      <p className="text-xs text-gray-600">{kw.avgLikes} likes</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top by Frequency */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-green-600" />
                Más Usadas
              </p>
              <div className="space-y-2">
                {keywords.topByFrequency.slice(0, 10).map((kw, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-bold text-gray-700">
                        {idx + 1}
                      </span>
                      <p className="text-sm font-medium text-gray-900">"{kw.keyword}"</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="text-xs">
                        {kw.frequency}x
                      </Badge>
                      <Badge className="bg-green-100 text-green-800 text-xs">
                        {kw.avgEngagement}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Hashtags Analysis */}
      {hashtags && (
        <Card className="p-6 border-l-4 border-purple-500">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                <Hash className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Hashtags que Funcionan</h3>
                <p className="text-sm text-gray-600">{hashtags.totalHashtags} hashtags analizados</p>
              </div>
            </div>
          </div>

          <div className="grid gap-6">
            {/* Top Hashtags */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-purple-600" />
                Top Hashtags por Engagement
              </p>
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
                {hashtags.topByEngagement.slice(0, 12).map((ht, idx) => (
                  <div key={idx} className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                    <div className="flex items-start justify-between mb-2">
                      <p className="text-sm font-medium text-purple-900">{ht.hashtag}</p>
                      <Badge className="bg-purple-600 text-white text-xs">
                        {ht.avgEngagement}%
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs text-gray-600">
                      <div>
                        <p className="font-medium text-gray-900">{ht.frequency}</p>
                        <p>usos</p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{ht.avgLikes}</p>
                        <p>likes</p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{ht.avgReach}</p>
                        <p>alcance</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Hashtag Combinations */}
            {hashtags.topCombinations.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-purple-600" />
                  Combinaciones Efectivas
                </p>
                <div className="grid sm:grid-cols-2 gap-3">
                  {hashtags.topCombinations.slice(0, 6).map((combo, idx) => (
                    <div key={idx} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <Badge className="bg-purple-100 text-purple-800 text-xs">
                          {combo.avgEngagement}% engagement
                        </Badge>
                        <span className="text-xs text-gray-600">{combo.frequency} veces</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {combo.hashtags.map((tag, i) => (
                          <span key={i} className="text-xs px-2 py-1 bg-purple-100 text-purple-800 rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Action Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-6 border-2 border-dashed border-gray-300 bg-gray-50">
          <div className="flex items-center gap-3 mb-4">
            <Lock className="h-10 w-10 text-gray-400" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Análisis de Competidores</h3>
              <Badge className="mt-1 bg-purple-100 text-purple-800">Próximamente</Badge>
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Compara tus métricas con competidores y descubre qué estrategias funcionan en tu nicho.
          </p>
          <Button disabled className="w-full opacity-50 cursor-not-allowed">
            <Users className="h-4 w-4 mr-2" />
            Agregar Competidor
          </Button>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-purple-600 to-pink-600 text-white">
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="h-10 w-10" />
            <div>
              <h3 className="text-lg font-semibold">Generador de Captions IA</h3>
              <Badge className="mt-1 bg-white text-purple-600">Próximamente</Badge>
            </div>
          </div>
          <p className="text-sm mb-4 opacity-90">
            Genera captions automáticamente basadas en tus posts más exitosos usando IA.
          </p>
          <Button className="w-full bg-white text-purple-600 hover:bg-gray-100">
            <ArrowRight className="h-4 w-4 mr-2" />
            Generar Caption
          </Button>
        </Card>
      </div>
    </div>
  );
}
