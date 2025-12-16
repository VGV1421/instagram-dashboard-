import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/simple-client';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, is_read } = body;

    // Convertir is_read a status si viene en ese formato (retrocompatibilidad)
    let updateStatus = status;
    if (is_read !== undefined && !status) {
      updateStatus = is_read ? 'read' : 'unread';
    }

    const updateData: any = {};
    if (updateStatus) {
      updateData.status = updateStatus;
      if (updateStatus === 'read' && !body.read_at) {
        updateData.read_at = new Date().toISOString();
      }
      if (updateStatus === 'dismissed' && !body.dismissed_at) {
        updateData.dismissed_at = new Date().toISOString();
      }
    }

    const { data, error } = await supabaseAdmin
      .from('alerts')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating alert:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error('Error in alert update API:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
