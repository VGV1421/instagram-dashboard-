/**
 * Instagram Graph API Client
 *
 * Documentación: https://developers.facebook.com/docs/instagram-api
 */

const INSTAGRAM_GRAPH_API = 'https://graph.facebook.com';

export interface InstagramProfile {
  id: string;
  username: string;
  name: string;
  followers_count: number;
  follows_count: number;
  media_count: number;
  profile_picture_url?: string;
}

export interface InstagramMediaInsight {
  name: string;
  values: Array<{ value: number }>;
}

export interface InstagramMedia {
  id: string;
  caption?: string;
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM' | 'REELS';
  media_url?: string;
  thumbnail_url?: string;
  permalink: string;
  timestamp: string;
  like_count?: number;
  comments_count?: number;
  insights?: {
    impressions: number;
    reach: number;
    engagement: number;
    saved: number;
    shares?: number;
  };
}

export class InstagramClient {
  private accessToken: string;
  private userId: string;

  constructor(accessToken: string, userId: string) {
    this.accessToken = accessToken;
    this.userId = userId;
  }

  /**
   * Obtener información del perfil
   */
  async getProfile(): Promise<InstagramProfile> {
    const fields = [
      'id',
      'username',
      'name',
      'followers_count',
      'follows_count',
      'media_count',
      'profile_picture_url'
    ].join(',');

    const url = `${INSTAGRAM_GRAPH_API}/${this.userId}?fields=${fields}&access_token=${this.accessToken}`;

    const response = await fetch(url);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Instagram API Error: ${error.error?.message || 'Unknown error'}`);
    }

    return response.json();
  }

  /**
   * Obtener media (posts) del usuario
   */
  async getMedia(limit: number = 25): Promise<InstagramMedia[]> {
    const fields = [
      'id',
      'caption',
      'media_type',
      'media_url',
      'thumbnail_url',
      'permalink',
      'timestamp',
      'like_count',
      'comments_count'
    ].join(',');

    const url = `${INSTAGRAM_GRAPH_API}/${this.userId}/media?fields=${fields}&limit=${limit}&access_token=${this.accessToken}`;

    const response = await fetch(url);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Instagram API Error: ${error.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    return data.data || [];
  }

  /**
   * Obtener insights de un post específico
   */
  async getMediaInsights(mediaId: string): Promise<InstagramMedia['insights']> {
    // Métricas que funcionan para todos los tipos de contenido
    const metrics = [
      'reach',
      'total_interactions'
    ].join(',');

    const url = `${INSTAGRAM_GRAPH_API}/${mediaId}/insights?metric=${metrics}&access_token=${this.accessToken}`;

    try {
      const response = await fetch(url);

      if (!response.ok) {
        // Si no hay insights disponibles, devolver valores por defecto
        return {
          impressions: 0,
          reach: 0,
          engagement: 0,
          saved: 0
        };
      }

      const data = await response.json();
      const insights = data.data || [];

      const reach = insights.find((i: InstagramMediaInsight) => i.name === 'reach')?.values[0]?.value || 0;
      const totalInteractions = insights.find((i: InstagramMediaInsight) => i.name === 'total_interactions')?.values[0]?.value || 0;

      return {
        impressions: Math.round(reach * 1.2), // Estimado basado en reach
        reach: reach,
        engagement: totalInteractions,
        saved: 0 // No disponible en esta métrica
      };
    } catch (error) {
      // Si falla, devolver valores por defecto
      console.warn(`No se pudieron obtener insights para media ${mediaId}:`, error);
      return {
        impressions: 0,
        reach: 0,
        engagement: 0,
        saved: 0
      };
    }
  }

  /**
   * Obtener media con insights completos
   */
  async getMediaWithInsights(limit: number = 25): Promise<InstagramMedia[]> {
    const media = await this.getMedia(limit);

    // Obtener insights para cada post
    const mediaWithInsights = await Promise.all(
      media.map(async (item) => {
        const insights = await this.getMediaInsights(item.id);
        return {
          ...item,
          insights
        };
      })
    );

    return mediaWithInsights;
  }
}

/**
 * Factory para crear cliente de Instagram desde variables de entorno
 */
export function createInstagramClient(): InstagramClient {
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
  const userId = process.env.INSTAGRAM_USER_ID;

  if (!accessToken || !userId) {
    throw new Error('Instagram credentials not configured');
  }

  return new InstagramClient(accessToken, userId);
}
