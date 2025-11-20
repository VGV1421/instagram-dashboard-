"use client"

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Sparkles, Copy, RefreshCw, Check, Wand2,
  TrendingUp, Hash, MessageCircle, BarChart3
} from 'lucide-react';
import { toast } from 'sonner';

interface GeneratedCaption {
  id: number;
  text: string;
  analysis: {
    characters: number;
    keywords: number;
    hashtags: number;
    emojis: number;
    keywordsList: string[];
    estimatedEngagement: string;
  };
}

export default function GeneratorPage() {
  const [topic, setTopic] = useState('');
  const [tone, setTone] = useState('profesional');
  const [length, setLength] = useState('medio');
  const [includeHashtags, setIncludeHashtags] = useState(true);
  const [includeEmojis, setIncludeEmojis] = useState(true);
  const [loading, setLoading] = useState(false);
  const [captions, setCaptions] = useState<GeneratedCaption[]>([]);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast.error('Ingresa un tema para el caption');
      return;
    }

    setLoading(true);
    toast.loading('Generando captions con IA...');

    try {
      const response = await fetch('/api/ai/generate-caption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          tone,
          length,
          includeHashtags,
          includeEmojis
        })
      });

      const result = await response.json();

      if (result.success) {
        setCaptions(result.data.captions);
        toast.success(`${result.data.captions.length} captions generados!`);
      } else {
        toast.error(result.error || 'Error al generar captions');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (caption: GeneratedCaption) => {
    try {
      await navigator.clipboard.writeText(caption.text);
      setCopiedId(caption.id);
      toast.success('Caption copiado al portapapeles');
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      toast.error('Error al copiar');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 rounded-2xl p-8 text-white">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-14 w-14 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
            <Sparkles className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Generador de Captions IA + SEO</h1>
            <p className="text-purple-100">Optimizado para Instagram 2025 con Keywords</p>
          </div>
        </div>

        {/* SEO 2025 Alert */}
        <div className="bg-yellow-400/20 backdrop-blur border border-yellow-300/30 rounded-lg p-3 mb-4">
          <div className="flex items-start gap-2">
            <TrendingUp className="h-5 w-5 text-yellow-200 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-yellow-100">Instagram 2025: Keywords > Hashtags</p>
              <p className="text-xs text-yellow-200 mt-1">
                El algoritmo ahora lee tu caption completo. Las <strong>palabras clave SEO</strong> son más importantes que los hashtags para aparecer en búsquedas.
              </p>
            </div>
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <div className="bg-white/10 backdrop-blur rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm font-medium">Keywords SEO automáticas</span>
            </div>
            <p className="text-xs text-purple-100">Basadas en tus posts exitosos</p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Wand2 className="h-4 w-4" />
              <span className="text-sm font-medium">3 variaciones optimizadas</span>
            </div>
            <p className="text-xs text-purple-100">Cada una con SEO score</p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Hash className="h-4 w-4" />
              <span className="text-sm font-medium">Hashtags como apoyo</span>
            </div>
            <p className="text-xs text-purple-100">Complementan las keywords</p>
          </div>
        </div>
      </div>

      {/* Configuration Form */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Configuración del Caption</h2>

        <div className="space-y-4">
          {/* Topic */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tema del Post *
            </label>
            <Input
              type="text"
              placeholder="Ej: Estrategias de marketing digital para emprendedores"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="text-base"
            />
            <p className="text-xs text-gray-500 mt-1">Describe brevemente de qué tratará tu post</p>
          </div>

          {/* Tone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tono
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {['profesional', 'casual', 'motivacional', 'educativo', 'entretenido'].map((t) => (
                <Button
                  key={t}
                  onClick={() => setTone(t)}
                  variant={tone === t ? 'default' : 'outline'}
                  className={`capitalize ${tone === t ? 'bg-purple-600 hover:bg-purple-700' : ''}`}
                  size="sm"
                >
                  {t}
                </Button>
              ))}
            </div>
          </div>

          {/* Length */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Longitud
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'corto', label: 'Corto', desc: '100-150 caracteres' },
                { value: 'medio', label: 'Medio', desc: '150-250 caracteres' },
                { value: 'largo', label: 'Largo', desc: '250-400 caracteres' }
              ].map((l) => (
                <Button
                  key={l.value}
                  onClick={() => setLength(l.value)}
                  variant={length === l.value ? 'default' : 'outline'}
                  className={`flex flex-col h-auto py-3 ${length === l.value ? 'bg-purple-600 hover:bg-purple-700' : ''}`}
                  size="sm"
                >
                  <span className="font-medium">{l.label}</span>
                  <span className="text-xs opacity-75 mt-1">{l.desc}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Options */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900">Incluir Hashtags</p>
                <p className="text-xs text-gray-500">Basados en tus posts exitosos</p>
              </div>
              <button
                onClick={() => setIncludeHashtags(!includeHashtags)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  includeHashtags ? 'bg-purple-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    includeHashtags ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900">Incluir Emojis</p>
                <p className="text-xs text-gray-500">Para mayor engagement</p>
              </div>
              <button
                onClick={() => setIncludeEmojis(!includeEmojis)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  includeEmojis ? 'bg-purple-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    includeEmojis ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={loading || !topic.trim()}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 h-12 text-base"
          >
            {loading ? (
              <>
                <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                Generando...
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5 mr-2" />
                Generar Captions
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Generated Captions */}
      {captions.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Captions Generados</h2>
            <Badge className="bg-green-100 text-green-800">
              {captions.length} opciones
            </Badge>
          </div>

          {captions.map((caption, idx) => (
            <Card key={caption.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                    {caption.id}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Opción {caption.id}</p>
                    <p className="text-xs text-gray-500">{caption.analysis.characters} caracteres</p>
                  </div>
                </div>
                <Button
                  onClick={() => copyToClipboard(caption)}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  {copiedId === caption.id ? (
                    <>
                      <Check className="h-4 w-4 text-green-600" />
                      Copiado
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copiar
                    </>
                  )}
                </Button>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-900 whitespace-pre-wrap leading-relaxed">
                  {caption.text}
                </p>
              </div>

              {/* SEO Keywords Badge */}
              {caption.analysis.keywords > 0 && (
                <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span className="text-xs font-semibold text-green-700">SEO OPTIMIZADO - {caption.analysis.keywords} Keywords</span>
                  </div>
                  {caption.analysis.keywordsList && caption.analysis.keywordsList.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {caption.analysis.keywordsList.map((kw, i) => (
                        <span key={i} className="px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full font-medium">
                          {kw}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-4 gap-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="font-semibold">{caption.analysis.keywords} keywords</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Hash className="h-4 w-4 text-purple-600" />
                  <span>{caption.analysis.hashtags} hashtags</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MessageCircle className="h-4 w-4 text-blue-600" />
                  <span>{caption.analysis.emojis} emojis</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <BarChart3 className="h-4 w-4 text-orange-600" />
                  <span>{caption.analysis.estimatedEngagement}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {captions.length === 0 && !loading && (
        <Card className="p-12 text-center border-2 border-dashed border-gray-300">
          <Wand2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Genera tu primer caption con IA
          </h3>
          <p className="text-sm text-gray-600 max-w-md mx-auto">
            Ingresa un tema arriba y configura las opciones para generar captions
            personalizados basados en tus posts más exitosos
          </p>
        </Card>
      )}
    </div>
  );
}
