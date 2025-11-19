/**
 * API Route: Get Instagram Media (Posts)
 *
 * GET /api/instagram/media?limit=25&withInsights=true
 *
 * Obtiene los posts de Instagram con métricas
 */

import { NextRequest, NextResponse } from 'next/server';
import { createInstagramClient } from '@/lib/instagram/client';

// Datos de demostración
const MOCK_MEDIA = [
  {
    id: '1',
    caption: '🚀 Nuevo contenido sobre emprendimiento digital',
    media_type: 'IMAGE' as const,
    permalink: '#',
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    like_count: 324,
    comments_count: 45,
    insights: {
      impressions: 4521,
      reach: 3892,
      engagement: 412,
      saved: 67
    }
  },
  {
    id: '2',
    caption: '💡 Tips para aumentar tu productividad',
    media_type: 'CAROUSEL_ALBUM' as const,
    permalink: '#',
    timestamp: new Date(Date.now() - 172800000).toISOString(),
    like_count: 567,
    comments_count: 89,
    insights: {
      impressions: 6734,
      reach: 5421,
      engagement: 734,
      saved: 123
    }
  },
  {
    id: '3',
    caption: '🎯 Estrategias de marketing digital',
    media_type: 'VIDEO' as const,
    permalink: '#',
    timestamp: new Date(Date.now() - 259200000).toISOString(),
    like_count: 892,
    comments_count: 134,
    insights: {
      impressions: 8923,
      reach: 7234,
      engagement: 1156,
      saved: 234
    }
  }
];

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '25');
    const withInsights = searchParams.get('withInsights') === 'true';

    // Intentar obtener datos reales
    try {
      const instagram = createInstagramClient();

      let media;
      if (withInsights) {
        media = await instagram.getMediaWithInsights(limit);
      } else {
        media = await instagram.getMedia(limit);
      }

      return NextResponse.json({
        success: true,
        data: media,
        count: media.length,
        source: 'instagram_api'
      });
    } catch (apiError) {
      // Si falla la API, usar datos de demostración
      console.warn('Instagram API no disponible, usando datos de demostración:', apiError);

      return NextResponse.json({
        success: true,
        data: MOCK_MEDIA.slice(0, limit),
        count: MOCK_MEDIA.length,
        source: 'mock_data',
        warning: 'Usando datos de demostración. Configura un token válido para datos reales.'
      });
    }
  } catch (error) {
    console.error('Error fetching Instagram media:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
