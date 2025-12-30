/**
 * Genera archivo SRT (subtítulos) desde texto
 * Distribuye palabras uniformemente a lo largo de la duración del video
 */

export function generateSRT(text: string, videoDuration: number): string {
  const words = text.split(/\s+/).filter(w => w.trim().length > 0);
  const wordDuration = videoDuration / words.length;

  let srt = '';

  words.forEach((word, index) => {
    const startTime = index * wordDuration;
    const endTime = (index + 1) * wordDuration;

    // Formato SRT:
    // 1
    // 00:00:00,000 --> 00:00:01,000
    // TEXTO

    srt += `${index + 1}\n`;
    srt += `${formatSRTTime(startTime)} --> ${formatSRTTime(endTime)}\n`;
    srt += `${word.toUpperCase()}\n\n`;
  });

  return srt;
}

function formatSRTTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const millis = Math.floor((seconds % 1) * 1000);

  return `${pad(hours)}:${pad(minutes)}:${pad(secs)},${pad(millis, 3)}`;
}

function pad(num: number, length: number = 2): string {
  return num.toString().padStart(length, '0');
}

/**
 * Genera comando FFmpeg para quemar subtítulos
 */
export function getFFmpegSubtitlesCommand(
  inputVideo: string,
  outputVideo: string,
  srtFile: string
): string {
  // Estilo de subtítulos profesional
  const subtitleStyle = [
    "FontName=Arial",
    "FontSize=50",
    "PrimaryColour=&H00FFFFFF", // Blanco
    "SecondaryColour=&H00000000", // Negro
    "OutlineColour=&H00000000", // Borde negro
    "BackColour=&H80000000", // Fondo semi-transparente
    "Bold=1",
    "Outline=3",
    "Shadow=2",
    "Alignment=2", // Bottom center
    "MarginV=50"
  ].join(',');

  // Comando FFmpeg
  return `ffmpeg -i "${inputVideo}" -vf "subtitles=${srtFile}:force_style='${subtitleStyle}'" -c:a copy "${outputVideo}"`;
}
