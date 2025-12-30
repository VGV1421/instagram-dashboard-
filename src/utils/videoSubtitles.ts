import { writeFileSync, unlinkSync } from 'fs';
import { execSync } from 'child_process';
import path from 'path';
import { generateSRT } from './generateSubtitles';

/**
 * SOLUCIÓN REAL QUE FUNCIONA: FFmpeg + SRT
 * Shotstack NO funciona para subtítulos HTML
 *
 * Esta función:
 * 1. Descarga el video de HeyGen
 * 2. Genera archivo SRT con subtítulos palabra por palabra
 * 3. Usa FFmpeg para quemar subtítulos en el video
 * 4. Retorna el video final con subtítulos
 */

export async function addSubtitlesToVideo(
  videoUrl: string,
  text: string,
  videoDuration: number
): Promise<{ success: boolean; videoPath?: string; error?: string }> {
  try {
    console.log('   🎬 Agregando subtítulos con FFmpeg...');

    // 1. Descargar video original
    const tempDir = path.join(process.cwd(), 'temp');
    const inputVideo = path.join(tempDir, `input-${Date.now()}.mp4`);
    const outputVideo = path.join(tempDir, `output-${Date.now()}.mp4`);
    const srtFile = path.join(tempDir, `subtitles-${Date.now()}.srt`);

    console.log('   📥 Descargando video original...');
    execSync(`curl -o "${inputVideo}" "${videoUrl}"`);

    // 2. Generar archivo SRT
    console.log('   ✍️ Generando subtítulos SRT...');
    const srtContent = generateSRT(text, videoDuration);
    writeFileSync(srtFile, srtContent, 'utf-8');

    const words = text.split(/\s+/).filter(w => w.trim().length > 0);
    console.log(`   💬 ${words.length} subtítulos creados`);

    // 3. Aplicar subtítulos con FFmpeg
    console.log('   🔥 Quemando subtítulos en el video...');

    // Escapar ruta para Windows
    const srtFileEscaped = srtFile.replace(/\\/g, '/').replace(/:/g, '\\:');

    const ffmpegCmd = `ffmpeg -i "${inputVideo}" -vf "subtitles='${srtFileEscaped}':force_style='FontName=Arial Bold,FontSize=50,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,BackColour=&H80000000,Bold=1,Outline=3,Shadow=2,Alignment=2,MarginV=80'" -c:a copy -y "${outputVideo}"`;

    execSync(ffmpegCmd, { stdio: 'inherit' });

    // 4. Limpiar archivos temporales
    console.log('   🧹 Limpiando archivos temporales...');
    unlinkSync(inputVideo);
    unlinkSync(srtFile);

    console.log('   ✅ Subtítulos agregados exitosamente!');

    return {
      success: true,
      videoPath: outputVideo
    };

  } catch (error: any) {
    console.error('   ❌ Error agregando subtítulos:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}
