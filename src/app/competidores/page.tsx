"use client"

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Users, Download, RefreshCw, Check, AlertCircle,
  TrendingUp, ExternalLink, Database
} from 'lucide-react';
import { toast } from 'sonner';

interface Competitor {
  id: string;
  instagram_username: string;
  display_name: string | null;
  followers_count: number | null;
  category: string | null;
  last_synced_at: string | null;
  is_active: boolean;
}

export default function CompetitorsPage() {
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [loading, setLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);

  useEffect(() => {
    fetchCompetitors();
  }, []);

  const fetchCompetitors = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/competitors/import');
      const result = await response.json();

      if (result.success) {
        setCompetitors(result.data.competitors);
      } else {
        toast.error('Error al cargar competidores');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const handleImportFromNotion = async () => {
    setImportLoading(true);
    toast.loading('Importando desde Notion...');

    try {
      const response = await fetch('/api/competitors/import-notion', {
        method: 'POST'
      });

      const result = await response.json();

      if (result.success) {
        toast.success(`${result.data.imported} competidores importados!`);
        if (result.data.errors.length > 0) {
          toast.warning(`${result.data.failed} registros con errores`);
        }
        await fetchCompetitors();
      } else {
        toast.error(result.error || 'Error al importar desde Notion');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error de conexión');
    } finally {
      setImportLoading(false);
    }
  };

  const handleSyncAll = async () => {
    setSyncLoading(true);
    toast.loading('Sincronizando datos de Instagram...');

    try {
      const response = await fetch('/api/competitors/sync', {
        method: 'POST'
      });

      const result = await response.json();

      if (result.success) {
        toast.success(`${result.data.synced} competidores sincronizados!`);
        await fetchCompetitors();
      } else {
        toast.error(result.error || 'Error al sincronizar');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error de conexión');
    } finally {
      setSyncLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-600 via-red-500 to-pink-500 rounded-2xl p-8 text-white">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-14 w-14 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
            <Users className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Gestión de Competidores</h1>
            <p className="text-orange-100">Importa y analiza perfiles de referencia</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 mt-4">
          <div className="bg-white/10 backdrop-blur rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Database className="h-4 w-4" />
              <span className="text-sm font-medium">Sincronización desde Notion</span>
            </div>
            <p className="text-xs text-orange-100">Importa referentes de tu base de datos</p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm font-medium">Análisis de contenido</span>
            </div>
            <p className="text-xs text-orange-100">Extrae keywords y hashtags exitosos</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Acciones Rápidas</h2>

        <div className="grid sm:grid-cols-2 gap-4">
          <Button
            onClick={handleImportFromNotion}
            disabled={importLoading}
            className="bg-blue-600 hover:bg-blue-700 h-auto py-4 flex-col gap-2"
          >
            {importLoading ? (
              <RefreshCw className="h-5 w-5 animate-spin" />
            ) : (
              <Download className="h-5 w-5" />
            )}
            <span className="font-semibold">Importar desde Notion</span>
            <span className="text-xs opacity-90">Sincroniza la página de Referentes</span>
          </Button>

          <Button
            onClick={handleSyncAll}
            disabled={syncLoading || competitors.length === 0}
            className="bg-green-600 hover:bg-green-700 h-auto py-4 flex-col gap-2"
          >
            {syncLoading ? (
              <RefreshCw className="h-5 w-5 animate-spin" />
            ) : (
              <RefreshCw className="h-5 w-5" />
            )}
            <span className="font-semibold">Sincronizar Datos de Instagram</span>
            <span className="text-xs opacity-90">Obtiene posts y métricas públicas</span>
          </Button>
        </div>

        {competitors.length === 0 && !loading && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-900">No hay competidores importados</p>
                <p className="text-xs text-yellow-700 mt-1">
                  Haz clic en &quot;Importar desde Notion&quot; para comenzar
                </p>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Competitors List */}
      {competitors.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Competidores ({competitors.length})
            </h2>
            <Button
              onClick={fetchCompetitors}
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

          <div className="space-y-3">
            {competitors.map((competitor) => (
              <div
                key={competitor.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg">
                    {competitor.instagram_username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900">
                        @{competitor.instagram_username}
                      </p>
                      {competitor.is_active && (
                        <Badge className="bg-green-100 text-green-800 text-xs">
                          Activo
                        </Badge>
                      )}
                    </div>
                    {competitor.display_name && (
                      <p className="text-sm text-gray-600">{competitor.display_name}</p>
                    )}
                    <div className="flex items-center gap-3 mt-1">
                      {competitor.category && (
                        <Badge variant="outline" className="text-xs">
                          {competitor.category}
                        </Badge>
                      )}
                      {competitor.followers_count && (
                        <span className="text-xs text-gray-500">
                          {competitor.followers_count.toLocaleString()} seguidores
                        </span>
                      )}
                      {competitor.last_synced_at && (
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Check className="h-3 w-3" />
                          Sincronizado
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <a
                  href={`https://instagram.com/${competitor.instagram_username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800"
                >
                  <ExternalLink className="h-5 w-5" />
                </a>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
