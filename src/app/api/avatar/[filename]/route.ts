import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const AVATAR_PATH = 'C:\\Users\\Usuario\\CURSOR\\instagram-dashboard\\FOTOS AVATAR SIN USAR';

/**
 * GET /api/avatar/[filename]
 * Sirve las imagenes de avatar de forma publica para que D-ID pueda accederlas
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;
    const decodedFilename = decodeURIComponent(filename);
    const filePath = path.join(AVATAR_PATH, decodedFilename);

    // Verificar que el archivo existe
    const stat = await fs.stat(filePath).catch(() => null);
    if (!stat) {
      return NextResponse.json({ error: 'Avatar not found' }, { status: 404 });
    }

    // Leer el archivo
    const imageBuffer = await fs.readFile(filePath);

    // Determinar el tipo MIME
    const ext = path.extname(filename).toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.webp': 'image/webp',
      '.gif': 'image/gif'
    };
    const contentType = mimeTypes[ext] || 'image/png';

    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
