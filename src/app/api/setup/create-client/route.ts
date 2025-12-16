import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/simple-client';

export async function POST() {
  try {
    // Datos del cliente
    const clientData = {
      instagram_username: 'digitalmindmillonaria',
      instagram_user_id: process.env.INSTAGRAM_USER_ID || 'digitalmindmillonaria',
      access_token: process.env.INSTAGRAM_ACCESS_TOKEN,
      token_expires_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days
      is_active: true,
      settings: {
        sync_enabled: true,
        auto_post: false,
        notifications_enabled: true
      }
    };

    // Verificar si ya existe
    const { data: existing, error: checkError } = await supabaseAdmin
      .from('clients')
      .select('*')
      .eq('instagram_username', 'digitalmindmillonaria')
      .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing client:', checkError);
      throw checkError;
    }

    if (existing) {
      return NextResponse.json({
        success: true,
        message: 'Cliente ya existe',
        client: existing
      });
    }

    // Insertar nuevo cliente
    const { data, error } = await supabaseAdmin
      .from('clients')
      .insert([clientData])
      .select()
      .single();

    if (error) {
      console.error('Error creating client:', error);
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: 'Cliente creado exitosamente',
      client: data
    });
  } catch (error: any) {
    console.error('Setup error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Error al crear cliente',
        details: error
      },
      { status: 500 }
    );
  }
}
