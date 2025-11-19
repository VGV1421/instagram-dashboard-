"use client"

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import {
  Eye,
  ThumbsUp,
  MessageCircle,
  Share2,
  Target,
  AlertTriangle,
  Award,
  TrendingUp,
  Clock,
  BarChart3,
  Zap
} from 'lucide-react';

// Datos de ejemplo de buyer personas
const PERSONAS_DATA = [
  {
    id: 'daniella',
    name: 'Daniella',
    description: 'Mujer joven que quiere aprender marketing digital desde cero para generar ingresos online reales, sin perder años en pruebas inútiles. Busca estrategias probadas y resultados tangibles.',
    image: null,
    age: 28,
    posts: 31,
    engagement: 4.8,
    stats: {
      reach: '2K',
      likes: 170,
      comments: 38,
      shares: 48,
    },
    platforms: [
      { name: 'Instagram', percentage: 85 },
      { name: 'TikTok', percentage: 72 },
      { name: 'Online', percentage: 90 },
    ],
    needs: [
      'Aprender marketing digital desde cero sin perder tiempo',
      'Generar ingresos online reales y verificables',
      'Evitar años de pruebas sin resultados',
      'Trabajos remotos flexibles, especialmente nocturnos',
      'Estrategias probadas y casos de éxito reales',
    ],
    painPoints: [
      'Información contradictoria y cursos que no funcionan',
      'Miedo a perder años probando estrategias sin resultados',
      'Falta de casos reales y transparencia en resultados',
      'Necesita trabajar de noche por horarios familiares',
    ],
    favoriteBrands: ['Instagram', 'TikTok', 'Canva', 'Netflix', 'Spotify', 'Amazon'],
    insights: [
      'Activa en Instagram y TikTok buscando contenido de marketing',
      'Busca trabajos remotos y flexibles',
      'Consume contenido tipo "¿Sabías que?" y datos curiosos',
    ],
    progress: 4.8,
    avgTime: '8:35',
    weekActivity: { L: 20, M: 40, X: 15, J: 60, V: 80, S: 30, D: 10 },
  },
  {
    id: 'marta',
    name: 'Marta',
    description: 'Emprendedora establecida que busca escalar su negocio digital mediante estrategias avanzadas de marketing. Tiene experiencia pero necesita optimización.',
    image: null,
    age: 35,
    posts: 45,
    engagement: 6.2,
    stats: {
      reach: '5K',
      likes: 320,
      comments: 58,
      shares: 72,
    },
    platforms: [
      { name: 'Instagram', percentage: 92 },
      { name: 'LinkedIn', percentage: 88 },
      { name: 'Online', percentage: 95 },
    ],
    needs: [
      'Escalar su negocio actual',
      'Automatizar procesos de marketing',
      'Aumentar conversión de leads',
      'Mejorar ROI de publicidad',
    ],
    painPoints: [
      'Falta de tiempo para gestionar todo',
      'Dificultad para medir ROI exacto',
      'Procesos manuales que consumen tiempo',
    ],
    favoriteBrands: ['LinkedIn', 'Notion', 'Slack', 'HubSpot', 'Shopify'],
    insights: [
      'Busca herramientas de automatización',
      'Invierte en publicidad pero quiere optimizar',
      'Le interesa el growth hacking',
    ],
    progress: 6.2,
    avgTime: '12:20',
    weekActivity: { L: 40, M: 60, X: 55, J: 70, V: 45, S: 20, D: 15 },
  },
  {
    id: 'sofia',
    name: 'Sofía',
    description: 'Creadora de contenido que quiere monetizar su audiencia de manera efectiva. Tiene seguidores pero necesita estrategia comercial.',
    image: null,
    age: 24,
    posts: 68,
    engagement: 8.5,
    stats: {
      reach: '8K',
      likes: 680,
      comments: 125,
      shares: 95,
    },
    platforms: [
      { name: 'Instagram', percentage: 95 },
      { name: 'TikTok', percentage: 90 },
      { name: 'YouTube', percentage: 75 },
    ],
    needs: [
      'Monetizar audiencia existente',
      'Conseguir colaboraciones rentables',
      'Crear productos digitales',
      'Aumentar engagement sin perder autenticidad',
    ],
    painPoints: [
      'Saturación del mercado de influencers',
      'Algoritmo cambiante dificulta alcance',
      'Engagement bajo comparado con seguidores',
    ],
    favoriteBrands: ['Instagram', 'TikTok', 'YouTube', 'Patreon', 'Gumroad'],
    insights: [
      'Busca formas alternativas de monetización',
      'Experimenta con diferentes formatos de contenido',
      'Le interesa crear comunidad premium',
    ],
    progress: 8.5,
    avgTime: '15:45',
    weekActivity: { L: 70, M: 85, X: 90, J: 95, V: 80, S: 60, D: 50 },
  },
];

export default function PersonasPage() {
  const [selectedPersona, setSelectedPersona] = useState(PERSONAS_DATA[0]);

  return (
    <div className="space-y-6">
      {/* Header with person selector */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Buyer Personas</h1>
            <p className="text-gray-600">Análisis detallado de audiencias segmentadas</p>
          </div>
          <div className="flex gap-2">
            {PERSONAS_DATA.map((persona) => (
              <Button
                key={persona.id}
                onClick={() => setSelectedPersona(persona)}
                variant={selectedPersona.id === persona.id ? "default" : "outline"}
                className={selectedPersona.id === persona.id ? "bg-purple-600 hover:bg-purple-700" : ""}
              >
                {persona.name}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Image and Basic Stats */}
        <div className="space-y-6">
          {/* Person Image Card */}
          <Card className="p-0 overflow-hidden">
            <div className="relative bg-gradient-to-br from-purple-500 to-pink-500 h-96 flex items-center justify-center">
              {selectedPersona.image ? (
                <img src={selectedPersona.image} alt={selectedPersona.name} className="w-full h-full object-cover" />
              ) : (
                <Avatar className="h-48 w-48 border-4 border-white">
                  <AvatarFallback className="text-6xl bg-white text-purple-600">
                    {selectedPersona.name[0]}
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
            <div className="p-6">
              <p className="text-gray-700 text-sm mb-4">{selectedPersona.description}</p>
              <div className="flex justify-around border-t pt-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{selectedPersona.posts}</p>
                  <p className="text-sm text-gray-600">Posts</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{selectedPersona.engagement}%</p>
                  <p className="text-sm text-gray-600">Engagement</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Platforms */}
          <Card className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Plataformas Activas</h3>
            <div className="space-y-3">
              {selectedPersona.platforms.map((platform, index) => (
                <div key={index}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700">{platform.name}</span>
                    <span className="font-medium text-gray-900">{platform.percentage}%</span>
                  </div>
                  <Progress value={platform.percentage} className="h-2" />
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Middle Column - Metrics */}
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-full bg-blue-50">
                  <Eye className="h-4 w-4 text-blue-600" />
                </div>
                <TrendingUp className="h-4 w-4 text-green-600 ml-auto" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{selectedPersona.stats.reach}</p>
              <p className="text-sm text-gray-600">Alcance</p>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-full bg-pink-50">
                  <ThumbsUp className="h-4 w-4 text-pink-600" />
                </div>
                <TrendingUp className="h-4 w-4 text-green-600 ml-auto" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{selectedPersona.stats.likes}</p>
              <p className="text-sm text-gray-600">Likes</p>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-full bg-yellow-50">
                  <MessageCircle className="h-4 w-4 text-yellow-600" />
                </div>
                <TrendingUp className="h-4 w-4 text-green-600 ml-auto" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{selectedPersona.stats.comments}</p>
              <p className="text-sm text-gray-600">Comments</p>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-full bg-green-50">
                  <Share2 className="h-4 w-4 text-green-600" />
                </div>
                <TrendingUp className="h-4 w-4 text-green-600 ml-auto" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{selectedPersona.stats.shares}</p>
              <p className="text-sm text-gray-600">Shares</p>
            </Card>
          </div>

          {/* Week Activity */}
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-900">Actividad Semanal</h3>
              <span className="text-sm text-gray-600">Esta semana</span>
            </div>
            <div className="flex justify-between gap-2">
              {Object.entries(selectedPersona.weekActivity).map(([day, value]) => (
                <div key={day} className="flex flex-col items-center gap-2">
                  <div className="w-full bg-gray-100 rounded-full h-24 flex items-end overflow-hidden">
                    <div
                      className="w-full bg-purple-500 rounded-t-full transition-all"
                      style={{ height: `${value}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-600">{day}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Needs & Objectives */}
          <Card className="p-6 border-l-4 border-green-500">
            <div className="flex items-center gap-2 mb-4">
              <Target className="h-5 w-5 text-green-600" />
              <h3 className="font-semibold text-gray-900">Necesidades & Objetivos</h3>
            </div>
            <ul className="space-y-2">
              {selectedPersona.needs.map((need, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-green-600 mt-0.5">●</span>
                  <span>{need}</span>
                </li>
              ))}
            </ul>
          </Card>

          {/* Pain Points */}
          <Card className="p-6 border-l-4 border-red-500">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <h3 className="font-semibold text-gray-900">Puntos de Dolor</h3>
            </div>
            <ul className="space-y-2">
              {selectedPersona.painPoints.map((pain, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-red-600 mt-0.5">●</span>
                  <span>{pain}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        {/* Right Column - Insights */}
        <div className="space-y-6">
          {/* Progress */}
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-900">Progress</h3>
              <p className="text-2xl font-bold text-gray-900">{selectedPersona.progress}%</p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Engagement Rate</span>
                <span>{selectedPersona.progress}%</span>
              </div>
              <Progress value={selectedPersona.progress * 10} className="h-2" />
              <div className="flex justify-between text-xs text-gray-500">
                <span>0%</span>
                <span>20%</span>
              </div>
            </div>
          </Card>

          {/* Time Tracker */}
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-900">Time Tracker</h3>
              <BarChart3 className="h-5 w-5 text-gray-400" />
            </div>
            <div className="flex items-center justify-center">
              <div className="relative">
                <div className="w-32 h-32 rounded-full border-8 border-gray-100 flex items-center justify-center">
                  <div className="text-center">
                    <Clock className="h-6 w-6 text-yellow-500 mx-auto mb-1" />
                    <p className="text-xl font-bold text-gray-900">{selectedPersona.avgTime}</p>
                    <p className="text-xs text-gray-600">Avg Time</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Behavioral Insights */}
          <Card className="p-6 bg-gray-900 text-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">Behavioral Insights</h3>
              <span className="text-yellow-400 text-sm">3/8</span>
            </div>
            <ul className="space-y-3">
              {selectedPersona.insights.map((insight, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="text-yellow-400 mt-1">●</span>
                  <span className="text-sm">{insight}</span>
                  <span className="text-yellow-400 ml-auto">○</span>
                </li>
              ))}
            </ul>
          </Card>

          {/* Favorite Brands */}
          <Card className="p-6 border-l-4 border-yellow-500">
            <div className="flex items-center gap-2 mb-4">
              <Award className="h-5 w-5 text-yellow-600" />
              <h3 className="font-semibold text-gray-900">Marcas Favoritas</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedPersona.favoriteBrands.map((brand, index) => (
                <Badge key={index} variant="secondary" className="bg-gray-100">
                  {brand}
                </Badge>
              ))}
            </div>
          </Card>

          {/* Sales Strategy */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold text-gray-900">Estrategia de Venta</h3>
            </div>
            <p className="text-sm text-gray-600">Estrategia personalizada para esta buyer persona</p>
          </Card>

          {/* Quick Match Offer */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="h-5 w-5 text-yellow-500" />
              <h3 className="font-semibold text-gray-900">Oferta Match Rápido</h3>
            </div>
            <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
              Oferta personalizada para esta audiencia
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
