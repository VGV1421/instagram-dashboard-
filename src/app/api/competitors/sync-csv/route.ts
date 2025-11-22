import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/simple-client';
import * as XLSX from 'xlsx';
import fs from 'fs/promises';
import path from 'path';

const CSV_PATH = path.join(process.cwd(), 'SELECCION_COMPETIDORES.csv');

/**
 * GET /api/competitors/sync-csv
 * Exporta los competidores actuales a CSV
 */
export async function GET() {
  try {
    // Obtener competidores de la BD
    const { data: competitors, error } = await supabaseAdmin
      .from('competitors')
      .select('instagram_username, display_name, is_active, last_synced_at')
      .order('instagram_username', { ascending: true });

    if (error) throw error;

    // Crear datos para CSV
    const csvData = [
      ['SELECCIONAR', 'USERNAME', 'NOMBRE', 'ACTIVO', 'ULTIMO_SYNC']
    ];

    competitors?.forEach(c => {
      csvData.push([
        c.is_active ? 'SI' : '',
        c.instagram_username,
        c.display_name || '',
        c.is_active ? 'SI' : 'NO',
        c.last_synced_at ? new Date(c.last_synced_at).toLocaleDateString('es-ES') : 'Nunca'
      ]);
    });

    // Crear workbook y guardar
    const ws = XLSX.utils.aoa_to_sheet(csvData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Competidores');

    // Guardar como CSV
    const csvContent = XLSX.utils.sheet_to_csv(ws);
    await fs.writeFile(CSV_PATH, csvContent, 'utf-8');

    // También guardar como Excel usando buffer
    const xlsxPath = path.join(process.cwd(), 'COMPETIDORES.xlsx');
    const xlsxBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    await fs.writeFile(xlsxPath, xlsxBuffer);

    return NextResponse.json({
      success: true,
      message: 'CSV y Excel exportados correctamente',
      files: {
        csv: 'SELECCION_COMPETIDORES.csv',
        xlsx: 'COMPETIDORES.xlsx'
      },
      stats: {
        total: competitors?.length || 0,
        activos: competitors?.filter(c => c.is_active).length || 0
      }
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/competitors/sync-csv
 * Importa/sincroniza competidores desde CSV o Excel
 * Lee la columna SELECCIONAR: SI = activar, vacío/NO = desactivar
 */
export async function POST() {
  try {
    // Intentar leer Excel primero, luego CSV
    let workbook;
    let filePath = path.join(process.cwd(), 'COMPETIDORES.xlsx');

    try {
      workbook = XLSX.readFile(filePath);
    } catch {
      // Si no hay Excel, intentar CSV
      filePath = CSV_PATH;
      const csvContent = await fs.readFile(filePath, 'utf-8');
      workbook = XLSX.read(csvContent, { type: 'string' });
    }

    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json<any>(sheet, { header: 1 });

    // Buscar índices de columnas
    const headers = data[0] as string[];
    const seleccionarIdx = headers.findIndex(h =>
      h?.toString().toUpperCase().includes('SELECCIONAR') ||
      h?.toString().toUpperCase().includes('ACTIVO')
    );
    const usernameIdx = headers.findIndex(h =>
      h?.toString().toUpperCase().includes('USERNAME') ||
      h?.toString().toUpperCase().includes('USER')
    );

    if (usernameIdx === -1) {
      return NextResponse.json({
        success: false,
        error: 'No se encontró columna USERNAME en el archivo'
      }, { status: 400 });
    }

    // Procesar filas
    const updates: { username: string; activate: boolean }[] = [];

    for (let i = 1; i < data.length; i++) {
      const row = data[i] as any[];
      if (!row || !row[usernameIdx]) continue;

      let username = row[usernameIdx]?.toString().trim();
      if (!username) continue;

      // Limpiar username
      username = username.replace('@', '').toLowerCase();

      // Determinar si activar
      const seleccionar = seleccionarIdx >= 0 ? row[seleccionarIdx]?.toString().toUpperCase() : '';
      const activate = seleccionar === 'SI' || seleccionar === 'YES' || seleccionar === '1' || seleccionar === 'TRUE';

      updates.push({ username, activate });
    }

    // Aplicar actualizaciones a la BD
    let activated = 0;
    let deactivated = 0;
    let notFound = 0;

    for (const update of updates) {
      const { data: existing, error: findError } = await supabaseAdmin
        .from('competitors')
        .select('id, is_active')
        .eq('instagram_username', update.username)
        .single();

      if (findError || !existing) {
        notFound++;
        continue;
      }

      // Solo actualizar si el estado cambió
      if (existing.is_active !== update.activate) {
        await supabaseAdmin
          .from('competitors')
          .update({ is_active: update.activate })
          .eq('id', existing.id);

        if (update.activate) {
          activated++;
        } else {
          deactivated++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Sincronización completada',
      stats: {
        procesados: updates.length,
        activados: activated,
        desactivados: deactivated,
        no_encontrados: notFound
      }
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
