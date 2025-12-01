'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  BarChart3,
  TrendingUp,
  MessageSquare,
  Heart,
  Users,
  Zap,
  Award,
  Calendar
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const COLORS = ['#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'];

export default function AnalyticsPage() {
  const [period, setPeriod] = useState('30');
  const [loading, setLoading] = useState(true);
  const [engagement, setEngagement] = useState<any>(null);
  const [keywords, setKeywords] = useState<any>(null);
  const [performance, setPerformance] = useState<any>(null);

  useEffect(() => {
    loadAnalytics();
  }, [period]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const [engagementRes, keywordsRes, performanceRes] = await Promise.all([
        fetch(`/api/analytics/engagement?days=${period}`),
        fetch(`/api/analytics/keywords?days=${period}`),
        fetch(`/api/analytics/performance?days=${period}`)
      ]);

      setEngagement(await engagementRes.json());
      setKeywords(await keywordsRes.json());
      setPerformance(await performanceRes.json());
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Cargando analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Analytics</h1>
          <p className="text-muted-foreground">
            Análisis detallado de rendimiento y engagement
          </p>
        </div>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="px-4 py-2 border rounded-lg"
        >
          <option value="7">Últimos 7 días</option>
          <option value="30">Últimos 30 días</option>
          <option value="90">Últimos 90 días</option>
        </select>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{engagement?.totalPosts || 0}</div>
            <p className="text-xs text-muted-foreground">
              En los últimos {period} días
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Likes</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{engagement?.totalLikes?.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">
              Promedio: {engagement?.avgEngagement || 0} por post
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Comentarios</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{engagement?.totalComments || 0}</div>
            <p className="text-xs text-muted-foreground">
              Engagement rate: {engagement?.engagementRate || 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Keywords Usados</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{keywords?.summary?.totalInteractions || 0}</div>
            <p className="text-xs text-muted-foreground">
              Por {keywords?.summary?.totalUniqueUsers || 0} usuarios únicos
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="engagement" className="w-full">
        <TabsList>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="keywords">Keywords</TabsTrigger>
          <TabsTrigger value="performance">Rendimiento IA</TabsTrigger>
          <TabsTrigger value="top">Top Posts</TabsTrigger>
        </TabsList>

        {/* Engagement Tab */}
        <TabsContent value="engagement" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Engagement por Día</CardTitle>
              <CardDescription>
                Evolución de likes y comentarios en el tiempo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={engagement?.engagementByDay || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="likes"
                    stackId="1"
                    stroke="#8b5cf6"
                    fill="#8b5cf6"
                    name="Likes"
                  />
                  <Area
                    type="monotone"
                    dataKey="comments"
                    stackId="1"
                    stroke="#ec4899"
                    fill="#ec4899"
                    name="Comentarios"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Keywords Tab */}
        <TabsContent value="keywords" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Keywords Más Usados</CardTitle>
                <CardDescription>
                  Frecuencia de uso de palabras clave
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={keywords?.keywords?.slice(0, 10) || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="keyword" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8b5cf6" name="Usos" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Distribución de Keywords</CardTitle>
                <CardDescription>
                  Proporción de uso de cada keyword
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={keywords?.keywords?.slice(0, 5) || []}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => entry.keyword}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {keywords?.keywords?.slice(0, 5).map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Detalles de Keywords</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {keywords?.keywords?.map((kw: any, i: number) => (
                  <div key={i} className="flex items-center justify-between border-b pb-3">
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary" className="text-lg px-3 py-1">
                        {kw.keyword}
                      </Badge>
                      <div className="text-sm text-muted-foreground">
                        <Users className="h-4 w-4 inline mr-1" />
                        {kw.uniqueUsers} usuarios
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">{kw.count}</div>
                      <div className="text-xs text-muted-foreground">
                        {kw.avgPerUser.toFixed(1)} promedio/usuario
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance IA Tab */}
        <TabsContent value="performance" className="space-y-4">
          {performance?.ai && performance?.manual && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5 text-purple-500" />
                      Posts con IA
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Total de posts</div>
                      <div className="text-3xl font-bold">{performance.ai.count}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-muted-foreground">Avg Likes</div>
                        <div className="text-xl font-bold">{performance.ai.avgLikes}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Avg Comments</div>
                        <div className="text-xl font-bold">{performance.ai.avgComments}</div>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Engagement Promedio</div>
                      <div className="text-2xl font-bold text-purple-600">
                        {performance.ai.avgEngagement}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-blue-500" />
                      Posts Manuales
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Total de posts</div>
                      <div className="text-3xl font-bold">{performance.manual.count}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-muted-foreground">Avg Likes</div>
                        <div className="text-xl font-bold">{performance.manual.avgLikes}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Avg Comments</div>
                        <div className="text-xl font-bold">{performance.manual.avgComments}</div>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Engagement Promedio</div>
                      <div className="text-2xl font-bold text-blue-600">
                        {performance.manual.avgEngagement}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {performance?.comparison && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="h-5 w-5 text-yellow-500" />
                      Comparación
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-6">
                      <div className="text-sm text-muted-foreground mb-2">Ganador</div>
                      <div className="text-4xl font-bold mb-4">
                        {performance.comparison.winner === 'AI' ? '🤖 IA' : '👤 Manual'}
                      </div>
                      <div className="text-muted-foreground">
                        Diferencia de engagement:{' '}
                        <span className={`font-bold ${
                          performance.comparison.engagementDiffPercent > 0
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}>
                          {performance.comparison.engagementDiffPercent > 0 ? '+' : ''}
                          {performance.comparison.engagementDiffPercent}%
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>Tendencia (Últimos 7 días)</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={performance?.trend || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="ai"
                        stroke="#8b5cf6"
                        strokeWidth={2}
                        name="IA"
                      />
                      <Line
                        type="monotone"
                        dataKey="manual"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        name="Manual"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Top Posts Tab */}
        <TabsContent value="top" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top 10 Posts por Engagement</CardTitle>
              <CardDescription>
                Los posts con mejor rendimiento del período
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {engagement?.topPosts?.map((post: any, i: number) => (
                  <div key={i} className="flex items-start gap-4 border-b pb-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm line-clamp-2 mb-2">{post.caption}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Heart className="h-3 w-3" />
                          {post.likes}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          {post.comments}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(post.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-purple-600">
                        {post.engagement}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        engagement
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
