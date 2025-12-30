import { supabaseAdmin } from '@/lib/supabase/simple-client';

export interface AudioGenerationResult {
  success: boolean;
  audioUrl?: string;
  error?: string;
}

/**
 * Genera audio con OpenAI TTS
 */
export async function generateAudioWithOpenAI(
  text: string,
  apiKey: string
): Promise<AudioGenerationResult> {
  try {
    const cleanText = text
      .replace(/\d+-\d+s?:\s*/gi, '')
      .replace(/["'"]/g, '')
      .replace(/\*\*/g, '')
      .replace(/#{1,}/g, '')
      .replace(/[\u{1F300}-\u{1F9FF}]/gu, '')
      .replace(/\n+/g, '. ')
      .trim()
      .slice(0, 4096);

    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'tts-1',
        voice: 'nova',
        input: cleanText,
        speed: 1.0
      })
    });

    if (!response.ok) {
      const error = await response.text();
      return { success: false, error };
    }

    const audioBuffer = await response.arrayBuffer();
    const audioFilename = `audio/audio-openai-${Date.now()}.mp3`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from('avatars')
      .upload(audioFilename, Buffer.from(audioBuffer), {
        contentType: 'audio/mpeg',
        upsert: true
      });

    if (uploadError) {
      return { success: false, error: uploadError.message };
    }

    const { data: publicUrl } = supabaseAdmin.storage
      .from('avatars')
      .getPublicUrl(audioFilename);

    return { success: true, audioUrl: publicUrl.publicUrl };

  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Genera audio con ElevenLabs
 */
export async function generateAudioWithElevenLabs(
  text: string,
  apiKey: string
): Promise<AudioGenerationResult> {
  try {
    const cleanText = text
      .replace(/\d+-\d+s?:\s*/gi, '')
      .replace(/["'"]/g, '')
      .replace(/\*\*/g, '')
      .replace(/#{1,}/g, '')
      .replace(/[\u{1F300}-\u{1F9FF}]/gu, '')
      .replace(/\n+/g, '. ')
      .trim()
      .slice(0, 1500);

    const voiceId = process.env.ELEVENLABS_VOICE_ID || 'XB0fDUnXU5powFXDhCwa';

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'xi-api-key': apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: cleanText,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.55,
            similarity_boost: 0.75,
            style: 0.6,
            use_speaker_boost: true
          }
        })
      }
    );

    if (!response.ok) {
      const error = await response.text();
      return { success: false, error };
    }

    const audioBuffer = await response.arrayBuffer();
    const audioFilename = `audio/audio-${Date.now()}.mp3`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from('avatars')
      .upload(audioFilename, Buffer.from(audioBuffer), {
        contentType: 'audio/mpeg',
        upsert: true
      });

    if (uploadError) {
      return { success: false, error: uploadError.message };
    }

    const { data: publicUrl } = supabaseAdmin.storage
      .from('avatars')
      .getPublicUrl(audioFilename);

    return { success: true, audioUrl: publicUrl.publicUrl };

  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
