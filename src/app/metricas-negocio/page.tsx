'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DollarSign,
  Users,
  TrendingUp,
  TrendingDown,
  Target,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  Heart,
  BarChart3,
  PieChart,
  Activity,
  AlertTriangle
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPie,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
  FunnelChart,
  Funnel,
  LabelList
} from 'recharts';

const COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

export default function MetricasNegocioPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [ltvData, setLtvData] = useState<any>(null);
  const [cacData, setCacData] = useState<any>(null);
  const [leadScoringData, setLeadScoringData] = useState<any>(null);
  const [retentionData, setRetentionData] = useState<any>(null);
  const [funnelData, setFunnelData] = useState<any>(null);
  const [revenueData, setRevenueData] = useState<any>(null);

  const fetchAllMetrics = async () => {
    setRefreshing(true);
    try {
      const [ltv, cac, leads, retention, funnel, revenue] = await Promise.all([
        fetch('/api/metrics/ltv').then(r => r.json()),
        fetch('/api/metrics/cac').then(r => r.json()),
        fetch('/api/metrics/lead-scoring').then(r => r.json()),
        fetch('/api/metrics/retention').then(r => r.json()),
        fetch('/api/metrics/funnel-velocity').then(r => r.json()),
        fetch('/api/metrics/revenue-by-source').then(r => r.json())
      ]);

      if (ltv.success) setLtvData(ltv.data);
      if (cac.success) setCacData(cac.data);
      if (leads.success) setLeadScoringData(leads.data);
      if (retention.success) setRetentionData(retention.data);
      if (funnel.success) setFunnelData(funnel.data);
      if (revenue.success) setRevenueData(revenue.data);
    } catch (error) {
      console.error('Error fetching metrics:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAllMetrics();
  }, []);

  const getHealthColor = (color: string) => {
    switch (color) {
      case 'green': return 'bg-green-500';
      case 'yellow': return 'bg-yellow-500';
      case 'orange': return 'bg-orange-500';
      case 'red': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Preparar datos para gráficos
  const leadDistributionData = leadScoringData?.leads_by_classification
    ? Object.entries(leadScoringData.leads_by_classification).map(([name, value]) => ({
        name: name === 'cold' ? 'Frío' : name === 'warm' ? 'Tibio' : name,
        value
      }))
    : [];

  const revenueSourceData = revenueData?.top_sources || [];

  const funnelStageData = funnelData?.stage_metrics?.map((stage: any) => ({
    name: stage.stage_name,
    value: stage.count,
    fill: COLORS[funnelData.stage_metrics.indexOf(stage) % COLORS.length]
  })) || [];

  const cohortData = retentionData?.cohorts?.slice(-6) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Métricas de Negocio</h1>
          <p className="text-muted-foreground">
            Análisis completo de LTV, CAC, Lead Scoring, Retención y Revenue
          </p>
        </div>
        <Button onClick={fetchAllMetrics} disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>

      {/* KPIs Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* LTV */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">LTV Promedio</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${ltvData?.ltv_promedio || 0}</div>
            <p className="text-xs text-muted-foreground">
              Valor de vida del cliente
            </p>
          </CardContent>
        </Card>

        {/* CAC */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">CAC General</CardTitle>
            <Target className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${cacData?.cac_general || 0}</div>
            <p className="text-xs text-muted-foreground">
              Coste de adquisición
            </p>
          </CardContent>
        </Card>

        {/* Ratio LTV/CAC */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Ratio LTV/CAC</CardTitle>
            <div className={`h-3 w-3 rounded-full ${getHealthColor(cacData?.color_salud)}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cacData?.ratio_ltv_cac || 0}x</div>
            <Badge variant={cacData?.salud_ratio === 'excelente' ? 'default' : 'secondary'}>
              {cacData?.salud_ratio || 'N/A'}
            </Badge>
          </CardContent>
        </Card>

        {/* Retención */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tasa Retención</CardTitle>
            <Heart className="h-4 w-4 text-pink-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{retentionData?.retention_rate || 0}%</div>
            <Badge className={getHealthColor(retentionData?.health_color)}>
              {retentionData?.health_status || 'N/A'}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Tabs con métricas detalladas */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="leads">Lead Scoring</TabsTrigger>
          <TabsTrigger value="funnel">Embudo</TabsTrigger>
          <TabsTrigger value="retention">Retención</TabsTrigger>
          <TabsTrigger value="revenue">Ingresos</TabsTrigger>
        </TabsList>

        {/* Tab Resumen */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Métricas de Leads */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Clasificación de Leads
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {leadScoringData?.mql_count || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">MQL</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {leadScoringData?.sql_count || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">SQL</div>
                  </div>
                </div>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPie>
                      <Pie
                        data={leadDistributionData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {leadDistributionData.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </RechartsPie>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Velocidad del Embudo */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Velocidad del Embudo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Ciclo Promedio</span>
                    <Badge variant="outline">
                      {funnelData?.average_cycle_days || 0} días
                    </Badge>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm">Velocidad</span>
                      <span className="text-sm font-medium">
                        {funnelData?.velocity_score || 0}/100
                      </span>
                    </div>
                    <Progress value={funnelData?.velocity_score || 0} />
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <Badge className={getHealthColor(funnelData?.funnel_health?.color)}>
                      {funnelData?.velocity_status || 'N/A'}
                    </Badge>
                  </div>
                  {funnelData?.bottlenecks?.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium flex items-center gap-1">
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        Cuellos de Botella
                      </h4>
                      {funnelData.bottlenecks.map((bn: any, i: number) => (
                        <div key={i} className="text-xs p-2 bg-yellow-50 rounded">
                          <strong>{bn.stage}</strong>: {bn.recommendation}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Revenue Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Revenue por Fuente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueSourceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="source_display" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="revenue" fill="#8b5cf6" name="Revenue" />
                    <Bar dataKey="investment" fill="#06b6d4" name="Inversión" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Lead Scoring */}
        <TabsContent value="leads" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Total Leads</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{leadScoringData?.total_leads || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Conversión a MQL</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{leadScoringData?.conversion_rate_mql || 0}%</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Conversión a SQL</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{leadScoringData?.conversion_rate_sql || 0}%</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Distribución por Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={leadScoringData?.distribution
                      ? Object.entries(leadScoringData.distribution).map(([range, count]) => ({
                          range,
                          count
                        }))
                      : []
                    }
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="range" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8b5cf6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top 10 Leads</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {leadScoringData?.top_leads?.map((lead: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-2 bg-muted rounded">
                    <span className="font-medium">{lead.username}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{lead.score} pts</Badge>
                      <Badge className={
                        lead.classification === 'SQL' ? 'bg-green-500' :
                        lead.classification === 'MQL' ? 'bg-blue-500' :
                        lead.classification === 'warm' ? 'bg-yellow-500' : 'bg-gray-500'
                      }>
                        {lead.classification}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Embudo */}
        <TabsContent value="funnel" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Etapas del Embudo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {funnelData?.stage_metrics?.map((stage: any, i: number) => (
                    <div key={i} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>{stage.stage_name}</span>
                        <span className="font-medium">{stage.count} ({stage.percentage}%)</span>
                      </div>
                      <Progress value={stage.percentage} className="h-2" />
                      <div className="text-xs text-muted-foreground">
                        Promedio: {stage.avg_days} días en esta etapa
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Conversión por Etapa</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={funnelStageData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={100} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#8b5cf6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recomendaciones</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {funnelData?.recommendations?.map((rec: string, i: number) => (
                  <div key={i} className="flex items-start gap-2 p-3 bg-muted rounded">
                    <Activity className="h-4 w-4 mt-0.5 text-primary" />
                    <span>{rec}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Retención */}
        <TabsContent value="retention" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Retención</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {retentionData?.retention_rate || 0}%
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Churn Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">
                  {retentionData?.churn_rate || 0}%
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Recurrencia</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">
                  {retentionData?.recurrence_rate || 0}%
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Clientes Activos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {retentionData?.active_customers || 0}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Análisis de Cohortes</CardTitle>
              <CardDescription>Retención por mes de adquisición</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={cohortData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="total" stroke="#8b5cf6" name="Total" />
                    <Line type="monotone" dataKey="retained" stroke="#10b981" name="Retenidos" />
                    <Line type="monotone" dataKey="churned" stroke="#ef4444" name="Perdidos" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Revenue */}
        <TabsContent value="revenue" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Revenue Total</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  ${revenueData?.total_revenue || 0}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Inversión Total</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">
                  ${revenueData?.total_investment || 0}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">ROI General</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold ${
                  (revenueData?.overall_roi || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {revenueData?.overall_roi || 0}%
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Valor Promedio Cliente</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  ${revenueData?.avg_client_value || 0}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>ROI por Fuente</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {revenueData?.source_comparison?.map((source: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-muted rounded">
                      <span>{source.source_display}</span>
                      <div className="flex items-center gap-2">
                        <span className={source.roi >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {source.roi >= 0 ? <ArrowUpRight className="h-4 w-4 inline" /> : <ArrowDownRight className="h-4 w-4 inline" />}
                          {source.roi}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Orgánico vs Pagado</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPie>
                      <Pie
                        data={[
                          { name: 'Orgánico', value: revenueData?.insights?.organic_vs_paid?.organic_revenue || 0 },
                          { name: 'Pagado', value: revenueData?.insights?.organic_vs_paid?.paid_revenue || 0 }
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        <Cell fill="#10b981" />
                        <Cell fill="#8b5cf6" />
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </RechartsPie>
                  </ResponsiveContainer>
                </div>
                <div className="text-center mt-2">
                  <Badge variant="outline">
                    {revenueData?.insights?.organic_vs_paid?.organic_percentage || 0}% Orgánico
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Insights */}
          <Card>
            <CardHeader>
              <CardTitle>Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {revenueData?.insights?.best_source && (
                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2 text-green-700 font-medium mb-2">
                      <TrendingUp className="h-5 w-5" />
                      Mejor Fuente
                    </div>
                    <p className="text-sm">{revenueData.insights.best_source.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {revenueData.insights.best_source.recommendation}
                    </p>
                  </div>
                )}
                {revenueData?.insights?.worst_source && (
                  <div className="p-4 bg-red-50 rounded-lg">
                    <div className="flex items-center gap-2 text-red-700 font-medium mb-2">
                      <TrendingDown className="h-5 w-5" />
                      Necesita Mejora
                    </div>
                    <p className="text-sm">{revenueData.insights.worst_source.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {revenueData.insights.worst_source.recommendation}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
