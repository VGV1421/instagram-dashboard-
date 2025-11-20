"use client"

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Copy, Download, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export default function ScriptsPage() {
  const [prompt, setPrompt] = useState('');
  const [generatedScript, setGeneratedScript] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedTone, setSelectedTone] = useState('professional');
  const [selectedFormat, setSelectedFormat] = useState('reel');

  const tones = [
    { id: 'professional', label: 'Profesional', emoji: '💼' },
    { id: 'casual', label: 'Casual', emoji: '😊' },
    { id: 'motivational', label: 'Motivacional', emoji: '🔥' },
    { id: 'educational', label: 'Educativo', emoji: '📚' },
  ];

  const formats = [
    { id: 'reel', label: 'Reel (30s)' },
    { id: 'video', label: 'Video (60s)' },
    { id: 'carousel', label: 'Carrusel' },
    { id: 'post', label: 'Post simple' },
  ];

  const generateScript = async () => {
    if (!prompt.trim()) {
      toast.error('Por favor escribe un tema para generar el script');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/ai/generate-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          tone: selectedTone,
          format: selectedFormat,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setGeneratedScript(data.script);
        toast.success('Script generado correctamente');
      } else {
        toast.error(data.error || 'Error al generar script');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al conectar con la IA');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedScript);
    toast.success('Script copiado al portapapeles');
  };

  const downloadScript = () => {
    const blob = new Blob([generatedScript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `script-${Date.now()}.txt`;
    a.click();
    toast.success('Script descargado');
  };

  const templates = [
    {
      title: 'Hook + Problema + Solución',
      prompt: 'Crea un guión sobre [TEMA] que empiece con un hook impactante, presente el problema y ofrezca la solución',
    },
    {
      title: 'Historia Personal',
      prompt: 'Crea una historia personal sobre [TEMA] que conecte emocionalmente con la audiencia',
    },
    {
      title: 'Tutorial Paso a Paso',
      prompt: 'Crea un tutorial de 5 pasos sobre [TEMA] que sea fácil de seguir',
    },
    {
      title: 'Mitos vs Realidad',
      prompt: 'Crea contenido desmintiendo 3 mitos comunes sobre [TEMA]',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Scripts de IA</h1>
        <p className="text-gray-600 mt-1">
          Genera contenido para Instagram con inteligencia artificial
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Input */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ¿Sobre qué quieres crear contenido?
                </label>
                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Ej: Cómo usar inteligencia artificial para crear contenido en redes sociales..."
                  rows={4}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tono de voz
                </label>
                <div className="flex gap-2 flex-wrap">
                  {tones.map((tone) => (
                    <Button
                      key={tone.id}
                      variant={selectedTone === tone.id ? 'default' : 'outline'}
                      onClick={() => setSelectedTone(tone.id)}
                      className="gap-2"
                    >
                      <span>{tone.emoji}</span>
                      {tone.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Formato
                </label>
                <div className="flex gap-2 flex-wrap">
                  {formats.map((format) => (
                    <Button
                      key={format.id}
                      variant={selectedFormat === format.id ? 'default' : 'outline'}
                      onClick={() => setSelectedFormat(format.id)}
                    >
                      {format.label}
                    </Button>
                  ))}
                </div>
              </div>

              <Button
                onClick={generateScript}
                disabled={loading}
                className="w-full gap-2"
                size="lg"
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Generando...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Generar Script
                  </>
                )}
              </Button>
            </div>
          </Card>

          {/* Generated Script */}
          {generatedScript && (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Script Generado</h3>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyToClipboard}
                    className="gap-2"
                  >
                    <Copy className="h-4 w-4" />
                    Copiar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadScript}
                    className="gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Descargar
                  </Button>
                </div>
              </div>
              <div className="prose prose-sm max-w-none">
                <div className="bg-gray-50 rounded-lg p-4 whitespace-pre-wrap font-mono text-sm">
                  {generatedScript}
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Right Column - Templates */}
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              Plantillas Rápidas
            </h3>
            <div className="space-y-3">
              {templates.map((template, index) => (
                <button
                  key={index}
                  onClick={() => setPrompt(template.prompt)}
                  className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-colors"
                >
                  <p className="font-medium text-sm text-gray-900 mb-1">
                    {template.title}
                  </p>
                  <p className="text-xs text-gray-600 line-clamp-2">
                    {template.prompt}
                  </p>
                </button>
              ))}
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-purple-50 to-blue-50">
            <h3 className="text-lg font-semibold mb-2">💡 Consejo</h3>
            <p className="text-sm text-gray-700">
              Cuanto más específico seas en tu prompt, mejores resultados
              obtendrás. Incluye detalles sobre tu audiencia y el objetivo del
              contenido.
            </p>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Estadísticas</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Scripts generados hoy</span>
                <Badge>0</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total este mes</span>
                <Badge>0</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Formato más usado</span>
                <Badge variant="secondary">Reel</Badge>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
