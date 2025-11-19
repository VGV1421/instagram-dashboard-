"use client"

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { AlertCard } from '@/components/alerts/alert-card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Bell,
  Filter,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';

interface Alert {
  id: string;
  alert_type: string;
  severity: 'info' | 'warning' | 'error';
  message: string;
  metadata: any;
  is_read: boolean;
  created_at: string;
}

interface AlertStats {
  total: number;
  unread: number;
  byType: {
    low_engagement: number;
    viral_content: number;
    low_reach: number;
    sync_errors: number;
  };
  bySeverity: {
    info: number;
    warning: number;
    error: number;
  };
}

export default function AlertasPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [stats, setStats] = useState<AlertStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros
  const [typeFilter, setTypeFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [isReadFilter, setIsReadFilter] = useState('all');

  useEffect(() => {
    fetchAlerts();
  }, [typeFilter, severityFilter, isReadFilter]);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (typeFilter !== 'all') params.set('type', typeFilter);
      if (severityFilter !== 'all') params.set('severity', severityFilter);
      if (isReadFilter !== 'all') params.set('isRead', isReadFilter);

      const response = await fetch(`/api/alerts?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Error al obtener alertas');
      }

      const result = await response.json();

      if (result.success) {
        setAlerts(result.data);
        setStats(result.stats);
      } else {
        throw new Error(result.error || 'Error desconocido');
      }
    } catch (err: any) {
      console.error('Error fetching alerts:', err);
      setError(err.message);
      toast.error('Error al cargar alertas');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string, isRead: boolean) => {
    try {
      const response = await fetch(`/api/alerts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_read: isRead }),
      });

      if (!response.ok) {
        throw new Error('Error al actualizar alerta');
      }

      // Actualizar localmente
      setAlerts((prev) =>
        prev.map((alert) => (alert.id === id ? { ...alert, is_read: isRead } : alert))
      );

      toast.success(isRead ? 'Marcada como leída' : 'Marcada como no leída');
    } catch (err: any) {
      console.error('Error updating alert:', err);
      toast.error('Error al actualizar alerta');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const unreadAlerts = alerts.filter((a) => !a.is_read);

      await Promise.all(
        unreadAlerts.map((alert) =>
          fetch(`/api/alerts/${alert.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ is_read: true }),
          })
        )
      );

      setAlerts((prev) => prev.map((alert) => ({ ...alert, is_read: true })));
      toast.success('Todas las alertas marcadas como leídas');
    } catch (err: any) {
      console.error('Error marking all as read:', err);
      toast.error('Error al marcar todas como leídas');
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando alertas...</p>
        </div>
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">Error: {error}</p>
          <Button onClick={fetchAlerts}>Reintentar</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Bell className="h-7 w-7" />
            Alertas
          </h1>
          <p className="text-gray-600 mt-1">
            Gestiona las notificaciones y alertas de tu cuenta
          </p>
        </div>

        {stats && stats.unread > 0 && (
          <Button onClick={handleMarkAllAsRead} variant="outline">
            <CheckCircle className="h-4 w-4 mr-2" />
            Marcar todas como leídas
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                <Bell className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">No Leídas</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.unread}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Warnings</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.bySeverity.warning}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Errors</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.bySeverity.error}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filtros:</span>
          </div>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los tipos</SelectItem>
              <SelectItem value="low_engagement">Engagement Bajo</SelectItem>
              <SelectItem value="viral_content">Contenido Viral</SelectItem>
              <SelectItem value="low_reach">Alcance Bajo</SelectItem>
              <SelectItem value="sync_errors">Errores de Sync</SelectItem>
            </SelectContent>
          </Select>

          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Severidad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las severidades</SelectItem>
              <SelectItem value="info">Info</SelectItem>
              <SelectItem value="warning">Advertencia</SelectItem>
              <SelectItem value="error">Error</SelectItem>
            </SelectContent>
          </Select>

          <Select value={isReadFilter} onValueChange={setIsReadFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="false">No leídas</SelectItem>
              <SelectItem value="true">Leídas</SelectItem>
            </SelectContent>
          </Select>

          {(typeFilter !== 'all' || severityFilter !== 'all' || isReadFilter !== 'all') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setTypeFilter('all');
                setSeverityFilter('all');
                setIsReadFilter('all');
              }}
            >
              Limpiar filtros
            </Button>
          )}
        </div>
      </Card>

      {/* Alerts List */}
      <div className="space-y-4">
        {alerts.length === 0 ? (
          <Card className="p-12 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No hay alertas
            </h3>
            <p className="text-gray-600">
              {typeFilter !== 'all' || severityFilter !== 'all' || isReadFilter !== 'all'
                ? 'No se encontraron alertas con los filtros aplicados'
                : 'Todo está funcionando correctamente'}
            </p>
          </Card>
        ) : (
          alerts.map((alert) => (
            <AlertCard
              key={alert.id}
              alert={alert}
              onMarkAsRead={handleMarkAsRead}
            />
          ))
        )}
      </div>
    </div>
  );
}
