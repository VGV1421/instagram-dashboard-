"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Users, Download, RefreshCw, Check, AlertCircle,
  TrendingUp, ExternalLink, Database, FileText,
  ToggleLeft, ToggleRight, Upload, FileSpreadsheet
} from 'lucide-react';
import { toast } from 'sonner';
import { AnalyticsDashboard } from '@/components/competitors/analytics-dashboard';

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
  const router = useRouter();
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [loading, setLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [selectedCompetitors, setSelectedCompetitors] = useState<Set<string>>(new Set());
  const [csvSyncing, setCsvSyncing] = useState(false);

  useEffect(() => {
    fetchCompetitors();
  }, []);

  const fetchCompetitors = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/competitors');
      const result = await response.json();

      if (result.success) {
        setCompetitors(result.data);
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

  // Toggle activar/desactivar un competidor
  const toggleActiveStatus = async (competitor: Competitor) => {
    try {
      const response = await fetch('/api/competitors', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ids: [competitor.id],
          is_active: !competitor.is_active
        })
      });

      const result = await response.json();
      if (result.success) {
        toast.success(`@${competitor.instagram_username} ${!competitor.is_active ? 'activado' : 'desactivado'}`);
        fetchCompetitors();
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error('Error al cambiar estado');
    }
  };

  // Activar/desactivar seleccionados
  const toggleSelectedActive = async (activate: boolean) => {
    if (selectedCompetitors.size === 0) {
      toast.error('Selecciona al menos un competidor');
      return;
    }

    try {
      const response = await fetch('/api/competitors', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ids: Array.from(selectedCompetitors),
          is_active: activate
        })
      });

      const result = await response.json();
      if (result.success) {
        toast.success(result.message);
        setSelectedCompetitors(new Set());
        fetchCompetitors();
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error('Error al cambiar estado');
    }
  };

  // Exportar a Excel
  const exportToExcel = async () => {
    setCsvSyncing(true);
    try {
      const response = await fetch('/api/competitors/sync-csv');
      const result = await response.json();
      if (result.success) {
        toast.success(`Excel exportado: ${result.files.xlsx}`);
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error('Error al exportar');
    } finally {
      setCsvSyncing(false);
    }
  };

  // Importar desde Excel
  const importFromExcel = async () => {
    setCsvSyncing(true);
    const toastId = toast.loading('Sincronizando desde Excel/CSV...');
    try {
      const response = await fetch('/api/competitors/sync-csv', { method: 'POST' });
      const result = await response.json();
      toast.dismiss(toastId);
      if (result.success) {
        toast.success(`Sincronizado: ${result.stats.activados} activados, ${result.stats.desactivados} desactivados`);
        fetchCompetitors();
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.dismiss(toastId);
      toast.error('Error al importar');
    } finally {
      setCsvSyncing(false);
    }
  };

  const handleImportFromNotion = async () => {
    setImportLoading(true);
    const toastId = toast.loading('Importando desde Notion...');

    try {
      const response = await fetch('/api/competitors/import-notion', {
        method: 'POST'
      });

      const result = await response.json();

      if (result.success) {
        toast.dismiss(toastId);
        toast.success(`${result.data.imported} competidores importados!`);
        if (result.data.errors.length > 0) {
          toast.warning(`${result.data.failed} registros con errores`);
        }
        await fetchCompetitors();
      } else {
        toast.dismiss(toastId);
        toast.error(result.error || 'Error al importar desde Notion');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.dismiss(toastId);
      toast.error('Error de conexión');
    } finally {
      setImportLoading(false);
    }
  };

  const toggleCompetitor = (id: string) => {
    const newSelected = new Set(selectedCompetitors);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedCompetitors(newSelected);
  };

  const selectAll = () => {
    setSelectedCompetitors(new Set(competitors.map(c => c.id)));
  };

  const deselectAll = () => {
    setSelectedCompetitors(new Set());
  };

  const handleSyncSelected = async () => {
    if (selectedCompetitors.size === 0) {
      toast.error('Selecciona al menos un competidor');
      return;
    }

    setSyncLoading(true);
    const toastId = toast.loading(`Sincronizando ${selectedCompetitors.size} competidor(es)...`);

    try {
      // Sincronizar cada competidor seleccionado uno por uno
      let synced = 0;
      let failed = 0;

      for (const competitorId of Array.from(selectedCompetitors)) {
        try {
          const response = await fetch('/api/competitors/sync-apify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ competitorId })
          });

          const result = await response.json();

          if (result.success) {
            synced++;
          } else {
            failed++;
            console.error(`Error syncing competitor ${competitorId}:`, result.error);
          }

          // Esperar 3 segundos entre requests
          await new Promise(resolve => setTimeout(resolve, 3000));
        } catch (error) {
          failed++;
          console.error(`Error syncing competitor ${competitorId}:`, error);
        }
      }

      toast.dismiss(toastId);
      if (synced > 0) {
        toast.success(`${synced} competidor(es) sincronizados!${failed > 0 ? ` (${failed} fallidos)` : ''}`);
      } else {
        toast.error('No se pudo sincronizar ningún competidor');
      }

      await fetchCompetitors();
      setSelectedCompetitors(new Set()); // Deseleccionar todos
    } catch (error) {
      console.error('Error:', error);
      toast.dismiss(toastId);
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

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Button
            onClick={exportToExcel}
            disabled={csvSyncing}
            className="bg-emerald-600 hover:bg-emerald-700 h-auto py-4 flex-col gap-2"
          >
            {csvSyncing ? (
              <RefreshCw className="h-5 w-5 animate-spin" />
            ) : (
              <FileSpreadsheet className="h-5 w-5" />
            )}
            <span className="font-semibold">Exportar a Excel</span>
            <span className="text-xs opacity-90">Genera COMPETIDORES.xlsx</span>
          </Button>

          <Button
            onClick={importFromExcel}
            disabled={csvSyncing}
            className="bg-orange-600 hover:bg-orange-700 h-auto py-4 flex-col gap-2"
          >
            {csvSyncing ? (
              <RefreshCw className="h-5 w-5 animate-spin" />
            ) : (
              <Upload className="h-5 w-5" />
            )}
            <span className="font-semibold">Importar desde Excel</span>
            <span className="text-xs opacity-90">Lee COMPETIDORES.xlsx</span>
          </Button>

          <Button
            onClick={() => toggleSelectedActive(true)}
            disabled={selectedCompetitors.size === 0}
            className="bg-green-600 hover:bg-green-700 h-auto py-4 flex-col gap-2"
          >
            <ToggleRight className="h-5 w-5" />
            <span className="font-semibold">Activar Seleccionados</span>
            <span className="text-xs opacity-90">{selectedCompetitors.size} seleccionado(s)</span>
          </Button>

          <Button
            onClick={() => toggleSelectedActive(false)}
            disabled={selectedCompetitors.size === 0}
            variant="outline"
            className="h-auto py-4 flex-col gap-2 hover:bg-red-50 hover:border-red-300"
          >
            <ToggleLeft className="h-5 w-5" />
            <span className="font-semibold">Desactivar Seleccionados</span>
            <span className="text-xs opacity-90">{selectedCompetitors.size} seleccionado(s)</span>
          </Button>
        </div>

        <div className="grid sm:grid-cols-3 gap-4 mt-4">
          <Button
            onClick={handleImportFromNotion}
            disabled={importLoading}
            variant="outline"
            className="h-auto py-3 flex-col gap-1"
          >
            {importLoading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Database className="h-4 w-4" />
            )}
            <span className="text-sm">Importar desde Notion</span>
          </Button>

          <Button
            onClick={handleSyncSelected}
            disabled={syncLoading || selectedCompetitors.size === 0}
            variant="outline"
            className="h-auto py-3 flex-col gap-1"
          >
            {syncLoading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            <span className="text-sm">Sincronizar Posts ({selectedCompetitors.size})</span>
          </Button>

          <Button
            onClick={() => router.push('/competidores/posts')}
            disabled={competitors.length === 0}
            variant="outline"
            className="h-auto py-3 flex-col gap-1"
          >
            <FileText className="h-4 w-4" />
            <span className="text-sm">Ver Posts</span>
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
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Competidores ({competitors.length})
              </h2>
              <p className="text-xs text-gray-600 mt-1">
                {selectedCompetitors.size} seleccionado(s)
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={selectAll}
                variant="outline"
                size="sm"
                disabled={loading}
              >
                Seleccionar todos
              </Button>
              <Button
                onClick={deselectAll}
                variant="outline"
                size="sm"
                disabled={loading}
              >
                Deseleccionar
              </Button>
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
          </div>

          <div className="space-y-3">
            {competitors.map((competitor) => (
              <div
                key={competitor.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={selectedCompetitors.has(competitor.id)}
                    onChange={() => toggleCompetitor(competitor.id)}
                    className="h-5 w-5 rounded border-gray-300 text-green-600 focus:ring-green-500 cursor-pointer"
                  />
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg">
                    {competitor.instagram_username.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900">
                        @{competitor.instagram_username}
                      </p>
                      {competitor.is_active && (
                        <Badge className="bg-green-100 text-green-800 text-xs">
                          Activo
                        </Badge>
                      )}
                      {competitor.followers_count === 0 && (
                        <Badge variant="outline" className="text-xs text-orange-600 border-orange-300">
                          Demo
                        </Badge>
                      )}
                      {competitor.is_verified && (
                        <Badge className="bg-blue-100 text-blue-800 text-xs">
                          Verificado
                        </Badge>
                      )}
                    </div>
                    {competitor.display_name && (
                      <p className="text-sm text-gray-600">{competitor.display_name}</p>
                    )}
                    {competitor.bio && competitor.bio.trim() && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{competitor.bio}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      {competitor.category && (
                        <Badge variant="outline" className="text-xs">
                          {competitor.category}
                        </Badge>
                      )}
                      {competitor.followers_count && (
                        <span className="text-xs text-gray-500">
                          👥 {competitor.followers_count.toLocaleString()}
                        </span>
                      )}
                      {competitor.posts_count && (
                        <span className="text-xs text-gray-500">
                          📸 {competitor.posts_count} posts
                        </span>
                      )}
                      {competitor.last_synced_at && (
                        <span className="text-xs text-green-600 flex items-center gap-1">
                          <Check className="h-3 w-3" />
                          Sincronizado {new Date(competitor.last_synced_at).toLocaleDateString('es-ES', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      )}
                      {!competitor.last_synced_at && (
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          No sincronizado
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Toggle activar/desactivar */}
                  <button
                    onClick={() => toggleActiveStatus(competitor)}
                    className={`p-2 rounded-lg transition-colors ${
                      competitor.is_active
                        ? 'bg-green-100 text-green-600 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                    }`}
                    title={competitor.is_active ? 'Desactivar' : 'Activar'}
                  >
                    {competitor.is_active ? (
                      <ToggleRight className="h-5 w-5" />
                    ) : (
                      <ToggleLeft className="h-5 w-5" />
                    )}
                  </button>

                  <a
                    href={`https://instagram.com/${competitor.instagram_username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 p-2"
                  >
                    <ExternalLink className="h-5 w-5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Dashboard de Análisis de Competencia */}
      {competitors.length > 0 && (
        <AnalyticsDashboard />
      )}
    </div>
  );
}
