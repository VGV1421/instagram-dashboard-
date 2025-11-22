'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  RefreshCw,
  Calendar,
  Clock,
  Play,
  Pause,
  Trash2,
  Copy,
  CheckCircle,
  AlertCircle,
  Sparkles,
  FileText,
  Video,
  Image,
  LayoutGrid,
  Zap,
  TrendingUp
} from 'lucide-react';
import { toast } from 'sonner';

interface ScheduledContent {
  id: string;
  content_type: string;
  topic: string;
  caption: string;
  script?: string;
  hashtags: string[];
  suggested_media: string;
  scheduled_for: string;
  status: string;
  engagement_prediction: string;
  created_at: string;
}

interface AutomationLog {
  id: string;
  workflow_name: string;
  status: string;
  execution_data: any;
  created_at: string;
  competitors_synced: number;
  content_generated: number;
}

export default function ContenidoProgramadoPage() {
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [content, setContent] = useState<ScheduledContent[]>([]);
  const [logs, setLogs] = useState<AutomationLog[]>([]);
  const [stats, setStats] = useState({ scheduled: 0, published: 0 });

  const fetchData = async () => {
    setLoading(true);
    try {
      // Obtener contenido programado
      const contentRes = await fetch('/api/content/generate-auto?status=all&limit=50');
      const contentData = await contentRes.json();
      if (contentData.success) {
        setContent(contentData.data || []);
      }

      // Obtener estado de automatización
      const autoRes = await fetch('/api/automation/run-full-cycle');
      const autoData = await autoRes.json();
      if (autoData.success) {
        setLogs(autoData.data.recent_executions || []);
        setStats(autoData.data.stats || { scheduled: 0, published: 0 });
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const runAutomation = async () => {
    setRunning(true);
    toast.info('Ejecutando ciclo de automatización...');

    try {
      const response = await fetch('/api/automation/run-full-cycle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          syncCompetitors: true,
          analyzeContent: true,
          generateContent: true,
          competitorsToSync: 3,
          contentToGenerate: 3
        })
      });

      const result = await response.json();

      if (result.success) {
        toast.success(`Ciclo completado: ${result.data.content_generated} contenidos generados`);
        fetchData();
      } else {
        toast.error(`Error: ${result.error}`);
      }
    } catch (error: any) {
      toast.error(`Error: ${error.message}`);
    } finally {
      setRunning(false);
    }
  };

  const copyCaption = (caption: string) => {
    navigator.clipboard.writeText(caption);
    toast.success('Caption copiado al portapapeles');
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'reel': return <Video className="h-4 w-4" />;
      case 'carousel': return <LayoutGrid className="h-4 w-4" />;
      case 'story': return <Clock className="h-4 w-4" />;
      default: return <Image className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Badge className="bg-blue-500">Programado</Badge>;
      case 'published':
        return <Badge className="bg-green-500">Publicado</Badge>;
      case 'draft':
        return <Badge variant="outline">Borrador</Badge>;
      case 'failed':
        return <Badge variant="destructive">Fallido</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getEngagementBadge = (prediction: string) => {
    switch (prediction) {
      case 'high':
        return <Badge className="bg-green-100 text-green-800">Alto</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-800">Medio</Badge>;
      case 'low':
        return <Badge className="bg-red-100 text-red-800">Bajo</Badge>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-purple-500" />
            Contenido Programado
          </h1>
          <p className="text-muted-foreground">
            Contenido generado automáticamente basado en análisis de competidores
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchData} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
          <Button onClick={runAutomation} disabled={running} className="bg-gradient-to-r from-purple-500 to-pink-500">
            {running ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Zap className="h-4 w-4 mr-2" />
            )}
            {running ? 'Ejecutando...' : 'Ejecutar Ciclo Completo'}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-500" />
              Programados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{stats.scheduled}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Publicados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats.published}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="h-4 w-4 text-purple-500" />
              Total Contenido
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">{content.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-orange-500" />
              Ejecuciones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{logs.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="content" className="space-y-4">
        <TabsList>
          <TabsTrigger value="content">Contenido Generado</TabsTrigger>
          <TabsTrigger value="logs">Historial de Ejecuciones</TabsTrigger>
        </TabsList>

        {/* Content Tab */}
        <TabsContent value="content" className="space-y-4">
          {content.length === 0 ? (
            <Card className="p-8 text-center">
              <Sparkles className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium mb-2">No hay contenido generado</h3>
              <p className="text-muted-foreground mb-4">
                Ejecuta el ciclo de automatización para generar contenido basado en tus competidores
              </p>
              <Button onClick={runAutomation} disabled={running}>
                <Zap className="h-4 w-4 mr-2" />
                Generar Contenido Ahora
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {content.map((item) => (
                <Card key={item.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(item.content_type)}
                        <span className="font-medium capitalize">{item.content_type}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {getEngagementBadge(item.engagement_prediction)}
                        {getStatusBadge(item.status)}
                      </div>
                    </div>
                    <CardTitle className="text-base mt-2">{item.topic}</CardTitle>
                    {item.scheduled_for && (
                      <CardDescription className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(item.scheduled_for).toLocaleString('es-ES')}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="bg-gray-50 rounded-lg p-3 max-h-40 overflow-y-auto">
                      <p className="text-sm whitespace-pre-wrap">{item.caption}</p>
                    </div>

                    {item.script && (
                      <div className="bg-purple-50 rounded-lg p-3 max-h-32 overflow-y-auto">
                        <p className="text-xs font-medium text-purple-700 mb-1">Script:</p>
                        <p className="text-sm whitespace-pre-wrap">{item.script}</p>
                      </div>
                    )}

                    {item.hashtags && item.hashtags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {item.hashtags.map((tag, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {item.suggested_media && (
                      <p className="text-xs text-muted-foreground">
                        📸 {item.suggested_media}
                      </p>
                    )}

                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyCaption(item.caption)}
                        className="flex-1"
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Copiar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Logs Tab */}
        <TabsContent value="logs" className="space-y-4">
          {logs.length === 0 ? (
            <Card className="p-8 text-center">
              <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium">No hay ejecuciones registradas</h3>
              <p className="text-muted-foreground">
                Las ejecuciones del ciclo de automatización aparecerán aquí
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <Card key={log.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {log.status === 'success' ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-yellow-500" />
                        )}
                        <div>
                          <p className="font-medium">{log.workflow_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(log.created_at).toLocaleString('es-ES')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-blue-600">
                          {log.competitors_synced} competidores
                        </span>
                        <span className="text-purple-600">
                          {log.content_generated} contenidos
                        </span>
                        <Badge variant={log.status === 'success' ? 'default' : 'secondary'}>
                          {log.status}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Info Card */}
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
        <CardContent className="p-4">
          <h3 className="font-medium mb-2 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-purple-500" />
            Cómo funciona la automatización
          </h3>
          <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
            <li>Se sincronizan los competidores más activos (Apify)</li>
            <li>Se analizan los posts exitosos con IA (OpenAI)</li>
            <li>Se identifican patrones: hooks, temas, CTAs, hashtags</li>
            <li>Se genera contenido similar optimizado para tu audiencia</li>
            <li>El contenido se guarda programado para publicación</li>
          </ol>
          <p className="text-xs text-purple-600 mt-2">
            💡 Configura n8n para ejecutar esto automáticamente cada 12-24 horas
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
