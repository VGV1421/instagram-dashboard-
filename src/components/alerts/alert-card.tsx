"use client"

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  X
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface Alert {
  id: string;
  alert_type: string;
  severity: 'info' | 'warning' | 'error';
  message: string;
  metadata: any;
  is_read: boolean;
  created_at: string;
}

interface AlertCardProps {
  alert: Alert;
  onMarkAsRead: (id: string, isRead: boolean) => void;
}

const ALERT_CONFIG = {
  low_engagement: {
    icon: TrendingDown,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    label: 'Engagement Bajo',
  },
  viral_content: {
    icon: TrendingUp,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    label: 'Contenido Viral',
  },
  low_reach: {
    icon: AlertTriangle,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    label: 'Alcance Bajo',
  },
  sync_errors: {
    icon: AlertCircle,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    label: 'Error de Sincronización',
  },
};

const SEVERITY_CONFIG = {
  info: { badge: 'bg-blue-100 text-blue-800', label: 'Info' },
  warning: { badge: 'bg-yellow-100 text-yellow-800', label: 'Advertencia' },
  error: { badge: 'bg-red-100 text-red-800', label: 'Error' },
};

export function AlertCard({ alert, onMarkAsRead }: AlertCardProps) {
  const config = ALERT_CONFIG[alert.alert_type as keyof typeof ALERT_CONFIG];
  const severityConfig = SEVERITY_CONFIG[alert.severity];
  const Icon = config?.icon || AlertCircle;

  return (
    <Card
      className={`p-4 transition-all ${
        alert.is_read ? 'opacity-60' : 'border-l-4'
      } ${config?.borderColor || 'border-gray-200'}`}
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className={`p-3 rounded-full ${config?.bgColor || 'bg-gray-50'}`}>
          <Icon className={`h-5 w-5 ${config?.color || 'text-gray-600'}`} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-gray-900">
                {config?.label || 'Alerta'}
              </h3>
              <Badge className={severityConfig.badge}>
                {severityConfig.label}
              </Badge>
              {!alert.is_read && (
                <Badge className="bg-blue-100 text-blue-800">Nueva</Badge>
              )}
            </div>

            {/* Actions */}
            <button
              onClick={() => onMarkAsRead(alert.id, !alert.is_read)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              title={alert.is_read ? 'Marcar como no leída' : 'Marcar como leída'}
            >
              {alert.is_read ? <X className="h-5 w-5" /> : <CheckCircle className="h-5 w-5" />}
            </button>
          </div>

          <p className="text-gray-700 mb-3">{alert.message}</p>

          {/* Metadata */}
          {alert.metadata && Object.keys(alert.metadata).length > 0 && (
            <div className="bg-gray-50 rounded-lg p-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(alert.metadata).map(([key, value]) => (
                  <div key={key}>
                    <span className="text-gray-600 capitalize">
                      {key.replace(/_/g, ' ')}:
                    </span>{' '}
                    <span className="font-medium text-gray-900">
                      {typeof value === 'number' ? value.toLocaleString() : String(value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Timestamp */}
          <p className="text-xs text-gray-500 mt-3">
            {formatDistanceToNow(new Date(alert.created_at), {
              addSuffix: true,
              locale: es,
            })}
          </p>
        </div>
      </div>
    </Card>
  );
}
