"use client"

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Users,
  Eye,
  MousePointerClick,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Target,
  Zap,
  AlertCircle,
} from 'lucide-react';

export default function EmbudoPage() {
  // Datos de demostración del embudo
  const funnelData = {
    awareness: {
      label: 'Conciencia',
      count: 10000,
      percentage: 100,
      icon: Eye,
      color: 'bg-blue-500',
      description: 'Personas que ven tu contenido',
    },
    interest: {
      label: 'Interés',
      count: 4500,
      percentage: 45,
      icon: MousePointerClick,
      color: 'bg-purple-500',
      description: 'Engagements y clicks',
    },
    consideration: {
      label: 'Consideración',
      count: 1200,
      percentage: 12,
      icon: Target,
      color: 'bg-pink-500',
      description: 'Visitan perfil o link en bio',
    },
    leads: {
      label: 'Leads',
      count: 320,
      percentage: 3.2,
      icon: Users,
      color: 'bg-yellow-500',
      description: 'Se registran o contactan',
    },
    customers: {
      label: 'Clientes',
      count: 48,
      percentage: 0.48,
      icon: DollarSign,
      color: 'bg-green-500',
      description: 'Realizan una compra',
    },
  };

  const conversionRates = {
    awarenessToInterest: ((funnelData.interest.count / funnelData.awareness.count) * 100).toFixed(1),
    interestToConsideration: ((funnelData.consideration.count / funnelData.interest.count) * 100).toFixed(1),
    considerationToLeads: ((funnelData.leads.count / funnelData.consideration.count) * 100).toFixed(1),
    leadsToCustomers: ((funnelData.customers.count / funnelData.leads.count) * 100).toFixed(1),
  };

  const metrics = [
    {
      label: 'Tasa de Conversión Global',
      value: `${((funnelData.customers.count / funnelData.awareness.count) * 100).toFixed(2)}%`,
      change: '+0.12%',
      trend: 'up',
    },
    {
      label: 'Costo por Lead',
      value: '$12.50',
      change: '-$2.30',
      trend: 'up',
    },
    {
      label: 'ROI',
      value: '340%',
      change: '+45%',
      trend: 'up',
    },
    {
      label: 'Tiempo Promedio de Conversión',
      value: '7 días',
      change: '-2 días',
      trend: 'up',
    },
  ];

  const stages = Object.entries(funnelData);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Embudo de Conversión</h1>
        <p className="text-gray-600 mt-1">
          Visualiza el recorrido de tu audiencia desde el descubrimiento hasta la compra
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, index) => (
          <Card key={index} className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">{metric.label}</p>
                <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
                <div className={`flex items-center gap-1 mt-2 text-sm ${
                  metric.trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {metric.trend === 'up' ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : (
                    <TrendingDown className="h-4 w-4" />
                  )}
                  <span>{metric.change}</span>
                </div>
              </div>
              <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
                metric.trend === 'up' ? 'bg-green-100' : 'bg-red-100'
              }`}>
                <Zap className={`h-6 w-6 ${
                  metric.trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Funnel Visualization */}
      <Card className="p-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Visualización del Embudo</h2>
        <div className="space-y-4">
          {stages.map(([key, stage], index) => {
            const isLast = index === stages.length - 1;
            const nextStage = !isLast ? stages[index + 1][1] : null;
            const conversionRate = nextStage
              ? ((nextStage.count / stage.count) * 100).toFixed(1)
              : null;

            return (
              <div key={key}>
                <div className="relative">
                  {/* Stage Card */}
                  <div className="flex items-center gap-6">
                    {/* Icon */}
                    <div className={`h-16 w-16 rounded-full ${stage.color} flex items-center justify-center flex-shrink-0`}>
                      <stage.icon className="h-8 w-8 text-white" />
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {stage.label}
                          </h3>
                          <p className="text-sm text-gray-600">{stage.description}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-gray-900">
                            {stage.count.toLocaleString()}
                          </p>
                          <Badge variant="secondary" className="mt-1">
                            {stage.percentage}%
                          </Badge>
                        </div>
                      </div>
                      <Progress
                        value={stage.percentage}
                        className="h-2"
                        indicatorClassName={stage.color}
                      />
                    </div>
                  </div>

                  {/* Conversion Arrow */}
                  {!isLast && (
                    <div className="flex items-center justify-center my-2 ml-8">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <ArrowRight className="h-4 w-4" />
                        <span className="font-medium">
                          Conversión: {conversionRate}%
                        </span>
                        <ArrowRight className="h-4 w-4" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Conversion Rates */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Tasas de Conversión por Etapa
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-700">
                  Conciencia → Interés
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  De visualizaciones a interacciones
                </p>
              </div>
              <p className="text-2xl font-bold text-blue-600">
                {conversionRates.awarenessToInterest}%
              </p>
            </div>

            <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-700">
                  Interés → Consideración
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  De interacciones a visitas
                </p>
              </div>
              <p className="text-2xl font-bold text-purple-600">
                {conversionRates.interestToConsideration}%
              </p>
            </div>

            <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-700">
                  Consideración → Leads
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  De visitas a registros
                </p>
              </div>
              <p className="text-2xl font-bold text-yellow-600">
                {conversionRates.considerationToLeads}%
              </p>
            </div>

            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-700">
                  Leads → Clientes
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  De registros a compras
                </p>
              </div>
              <p className="text-2xl font-bold text-green-600">
                {conversionRates.leadsToCustomers}%
              </p>
            </div>
          </div>
        </Card>

        {/* Right: Optimization Tips */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-600" />
            Oportunidades de Optimización
          </h3>
          <div className="space-y-4">
            <div className="p-4 border border-orange-200 bg-orange-50 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <TrendingUp className="h-4 w-4 text-orange-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 mb-1">
                    Mejorar tasa Interés → Consideración
                  </p>
                  <p className="text-sm text-gray-700">
                    Actualmente en {conversionRates.interestToConsideration}%. Optimiza tu link en bio y CTAs para aumentar visitas al perfil.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 border border-blue-200 bg-blue-50 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Target className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 mb-1">
                    Aumentar generación de leads
                  </p>
                  <p className="text-sm text-gray-700">
                    Crea lead magnets (PDFs gratuitos, webinars) para capturar más registros.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 border border-green-200 bg-green-50 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <DollarSign className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 mb-1">
                    Optimizar conversión a clientes
                  </p>
                  <p className="text-sm text-gray-700">
                    Implementa email nurturing y ofertas especiales para convertir más leads en clientes.
                  </p>
                </div>
              </div>
            </div>

            <Button className="w-full mt-4 bg-purple-600 hover:bg-purple-700">
              <Zap className="h-4 w-4 mr-2" />
              Generar Plan de Optimización con IA
            </Button>
          </div>
        </Card>
      </div>

      {/* Bottom Alert */}
      <Card className="p-6 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
            <AlertCircle className="h-6 w-6 text-purple-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 mb-2">
              Nota: Datos de demostración (ManyChat pendiente)
            </h3>
            <p className="text-sm text-gray-700">
              Los datos del embudo se actualizarán automáticamente cuando conectes ManyChat y otras
              fuentes de datos. Las métricas actuales son simuladas para mostrar el potencial del sistema.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
