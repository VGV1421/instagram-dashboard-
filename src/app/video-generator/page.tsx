'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Video,
  Play,
  Download,
  RefreshCw,
  Sparkles,
  AlertCircle,
  CheckCircle,
  Image,
  Mic,
  Wand2,
  Settings
} from 'lucide-react';
import { toast } from 'sonner';

interface AvatarStatus {
  avatarsDisponibles: number;
  avatarsUsados: number;
  listaDisponibles: string[];
  apiConfigured: {
    heygen: boolean;
    did: boolean;
    elevenlabs: boolean;
    ready: boolean;
  };
  provider: string;
  instructions?: {
    message: string;
    keys: string[];
  };
}

interface ScheduledContent {
  id: string;
  content_type: string;
  topic: string;
  caption: string;
  script?: string;
  media_url?: string;
  status: string;
  engagement_prediction: string;
}

export default function VideoGeneratorPage() {
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);
  const [avatarStatus, setAvatarStatus] = useState<AvatarStatus | null>(null);
  const [reels, setReels] = useState<ScheduledContent[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Estado de avatares y APIs
      const avatarRes = await fetch('/api/video/talking-avatar');
      const avatarData = await avatarRes.json();
      if (avatarData.success) {
        setAvatarStatus(avatarData.data);
      }

      // Contenido tipo reel
      const contentRes = await fetch('/api/content/generate-auto?status=all&limit=50');
      const contentData = await contentRes.json();
      if (contentData.success) {
        const reelContent = contentData.data.filter((c: ScheduledContent) =>
          c.content_type === 'reel' || c.script
        );
        setReels(reelContent);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateVideo = async (reel: ScheduledContent) => {
    const scriptText = reel.script || reel.caption;

    if (!scriptText) {
      toast.error('Este contenido no tiene script ni caption');
      return;
    }

    setGenerating(reel.id);
    toast.info('Generando video con avatar... Esto puede tardar 1-2 minutos');

    try {
      const response = await fetch('/api/video/talking-avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentId: reel.id,
          script: scriptText
        })
      });

      const result = await response.json();

      if (result.success) {
        if (result.data.videoUrl) {
          toast.success('¡Video generado exitosamente!');
        } else {
          toast.info('Video en proceso, revisa en unos minutos');
        }
        fetchData();
      } else {
        toast.error(result.error || 'Error generando video');

        if (result.instructions) {
          console.log('Instrucciones:', result.instructions);
        }
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setGenerating(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const isReady = avatarStatus?.apiConfigured.ready;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Video className="h-8 w-8 text-pink-500" />
            Video Generator - Avatar Hablando
          </h1>
          <p className="text-muted-foreground">
            Genera Reels automáticos con tu avatar Daniella hablando
          </p>
        </div>
        <Button onClick={fetchData} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualizar
        </Button>
      </div>

      {/* Status Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Image className="h-4 w-4 text-purple-500" />
              Avatares Disponibles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              {avatarStatus?.avatarsDisponibles || 0}
            </div>
            <p className="text-xs text-muted-foreground">fotos sin usar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Avatares Usados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {avatarStatus?.avatarsUsados || 0}
            </div>
            <p className="text-xs text-muted-foreground">videos generados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Mic className="h-4 w-4 text-blue-500" />
              ElevenLabs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge className={avatarStatus?.apiConfigured.elevenlabs
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700'
            }>
              {avatarStatus?.apiConfigured.elevenlabs ? '✓ Configurado' : '✗ Falta API Key'}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Video className="h-4 w-4 text-pink-500" />
              {avatarStatus?.provider === 'heygen' ? 'HeyGen' : 'D-ID'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge className={avatarStatus?.apiConfigured.heygen || avatarStatus?.apiConfigured.did
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700'
            }>
              {avatarStatus?.apiConfigured.heygen || avatarStatus?.apiConfigured.did
                ? '✓ Configurado'
                : '✗ Falta API Key'}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Config Warning */}
      {!isReady && (
        <Card className="border-yellow-500 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-700">
              <AlertCircle className="h-5 w-5" />
              Configuración Requerida
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-yellow-800">
              Para generar videos con avatar hablando, añade estas líneas a tu archivo <code className="bg-yellow-100 px-1">.env.local</code>:
            </p>
            <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm">
              <p># Video con avatar (elige uno):</p>
              <p>HEYGEN_API_KEY=tu_key_de_heygen</p>
              <p># o</p>
              <p>DID_API_KEY=tu_key_de_did</p>
              <p></p>
              <p># Voz:</p>
              <p>ELEVENLABS_API_KEY=tu_key_de_elevenlabs</p>
            </div>
            <div className="flex gap-4">
              <a href="https://www.heygen.com" target="_blank" className="text-blue-600 underline text-sm">
                Obtener HeyGen API →
              </a>
              <a href="https://elevenlabs.io" target="_blank" className="text-blue-600 underline text-sm">
                Obtener ElevenLabs API →
              </a>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reels List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">
          Contenido para Videos ({reels.length})
        </h2>

        {reels.length === 0 ? (
          <Card className="p-8 text-center">
            <Video className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium mb-2">No hay contenido</h3>
            <p className="text-muted-foreground mb-4">
              Primero genera contenido en "Auto-Contenido"
            </p>
            <Button onClick={() => window.location.href = '/contenido-programado'}>
              Ir a Auto-Contenido
            </Button>
          </Card>
        ) : (
          <div className="grid gap-4">
            {reels.map((reel) => (
              <Card key={reel.id} className={reel.media_url ? 'border-green-300 bg-green-50' : ''}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="bg-pink-100 text-pink-700">
                          {reel.content_type}
                        </Badge>
                        <Badge className={
                          reel.engagement_prediction === 'high'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }>
                          {reel.engagement_prediction}
                        </Badge>
                        {reel.media_url && (
                          <Badge className="bg-green-500 text-white">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Video Listo
                          </Badge>
                        )}
                      </div>

                      <h3 className="font-medium mb-2">{reel.topic}</h3>

                      {reel.script && (
                        <div className="bg-gray-100 rounded-lg p-3 mb-2 max-h-24 overflow-y-auto">
                          <p className="text-xs text-gray-500 mb-1">Script:</p>
                          <p className="text-sm">{reel.script.slice(0, 200)}...</p>
                        </div>
                      )}

                      <p className="text-sm text-gray-600 line-clamp-2">
                        {reel.caption.slice(0, 150)}...
                      </p>
                    </div>

                    <div className="flex flex-col gap-2 min-w-[140px]">
                      {reel.media_url ? (
                        <>
                          <Button size="sm" className="bg-green-500 hover:bg-green-600" asChild>
                            <a href={reel.media_url} target="_blank">
                              <Play className="h-4 w-4 mr-1" />
                              Ver Video
                            </a>
                          </Button>
                          <Button size="sm" variant="outline" asChild>
                            <a href={reel.media_url} download>
                              <Download className="h-4 w-4 mr-1" />
                              Descargar
                            </a>
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => generateVideo(reel)}
                          disabled={generating === reel.id || !isReady}
                          className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
                        >
                          {generating === reel.id ? (
                            <>
                              <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                              Generando...
                            </>
                          ) : (
                            <>
                              <Wand2 className="h-4 w-4 mr-1" />
                              Generar Video
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Info */}
      <Card className="bg-gradient-to-r from-pink-50 to-purple-50 border-pink-200">
        <CardContent className="p-4">
          <h3 className="font-medium mb-2 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-pink-500" />
            Cómo funciona
          </h3>
          <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
            <li>Se coge una foto de tu avatar de "FOTOS AVATAR SIN USAR"</li>
            <li>ElevenLabs genera el audio con voz profesional</li>
            <li>HeyGen/D-ID crea el video con el avatar hablando (lip sync)</li>
            <li>La foto se mueve a "FOTOS AVAR USADAS"</li>
            <li>El video queda listo para descargar y subir a Instagram</li>
          </ol>
          <p className="text-xs text-pink-600 mt-2">
            💡 Tienes {avatarStatus?.avatarsDisponibles || 0} fotos disponibles para {avatarStatus?.avatarsDisponibles || 0} videos
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
