/**
 * API Route: Get Instagram Profile
 *
 * GET /api/instagram/profile
 *
 * Obtiene los datos del perfil de Instagram
 */

import { NextResponse } from 'next/server';
import { createInstagramClient } from '@/lib/instagram/client';

// Datos de demostración mientras se configura el token real
const MOCK_PROFILE = {
  id: '17841475742645634',
  username: 'digitalmindmillonaria',
  name: 'Digital Mind Millonaria',
  followers_count: 15420,
  follows_count: 487,
  media_count: 234,
  profile_picture_url: 'https://via.placeholder.com/150'
};

export async function GET() {
  try {
    // Intentar obtener datos reales
    try {
      const instagram = createInstagramClient();
      const profile = await instagram.getProfile();

      return NextResponse.json({
        success: true,
        data: profile,
        source: 'instagram_api'
      });
    } catch (apiError) {
      // Si falla la API (token expirado, etc.), usar datos de demostración
      console.warn('Instagram API no disponible, usando datos de demostración:', apiError);

      return NextResponse.json({
        success: true,
        data: MOCK_PROFILE,
        source: 'mock_data',
        warning: 'Usando datos de demostración. Configura un token válido para datos reales.'
      });
    }
  } catch (error) {
    console.error('Error fetching Instagram profile:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
