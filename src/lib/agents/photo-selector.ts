/**
 * SISTEMA DE SELECCIÓN INTELIGENTE DE FOTOS
 *
 * Implementa state machine (conceptos LangGraph) con análisis multi-modal:
 * 1. Análisis semántico del script (GPT-4)
 * 2. Análisis visual de avatares (GPT-4 Vision)
 * 3. Matching contextual avanzado
 * 4. Scoring ponderado multi-factor
 */

import { ChatOpenAI } from '@langchain/openai';
import { ChatPromptTemplate, HumanMessagePromptTemplate } from '@langchain/core/prompts';
import { HumanMessage } from '@langchain/core/messages';
import fs from 'fs/promises';
import path from 'path';
import type {
  AvatarCandidate,
  FaceAnalysis,
  AvatarScore,
  PhotoSelectionState,
  PhotoSelectionResult,
  AgentConfig
} from './types';

// ============ CONFIGURACIÓN ============

const AVATAR_POOL_PATH = 'C:\\Users\\Usuario\\CURSOR\\instagram-dashboard\\FOTOS AVATAR SIN USAR';

const DEFAULT_CONFIG: AgentConfig = {
  model: 'gpt-4o-mini',  // Optimizado: 15x más barato que gpt-4o
  temperature: 0.3,
  max_tokens: 1500,
  verbose: true
};

// ============ EMOTION MAPPING ============

const EMOTION_KEYWORDS = {
  happy: ['feliz', 'alegre', 'sonriente', 'positivo', 'entusiasta', 'contento'],
  energetic: ['enérgico', 'dinámico', 'activo', 'motivado', 'apasionado'],
  serious: ['serio', 'profesional', 'formal', 'concentrado', 'enfocado'],
  thoughtful: ['pensativo', 'reflexivo', 'contemplativo', 'sabio'],
  neutral: ['neutral', 'calmado', 'tranquilo', 'equilibrado']
};

// ============ PHOTO SELECTOR (State Machine) ============

export class PhotoSelector {
  private llm: ChatOpenAI;
  private visionLlm: ChatOpenAI;
  private config: AgentConfig;

  constructor(config: Partial<AgentConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };

    this.llm = new ChatOpenAI({
      modelName: this.config.model,
      temperature: this.config.temperature,
      maxTokens: this.config.max_tokens
    });

    this.visionLlm = new ChatOpenAI({
      modelName: this.config.model,
      temperature: 0.2, // Más conservador para análisis visual
      maxTokens: 500
    });

    console.log('📸 Photo Selector inicializado');
  }

  // ============ STATE MACHINE NODES ============

  /**
   * NODE 1: Analyze Script
   * Extrae emoción, tono y keywords del script
   */
  private async analyzeScript(script: string): Promise<{
    emotion: string;
    tone: string;
    keywords: string[];
  }> {
    console.log('🔍 NODE 1: Analizando script...');

    const prompt = ChatPromptTemplate.fromMessages([
      ['system', `Eres un experto en análisis emocional de contenido.
Analiza el siguiente script y extrae:
1. Emoción dominante (happy, energetic, serious, thoughtful, neutral)
2. Tono general (profesional, cercano, divertido, inspirador)
3. Keywords relevantes para matching visual (máx 5)`],
      ['user', `Script:\n{script}\n\nRESPONDE EN FORMATO JSON:\n{{"emotion": "...", "tone": "...", "keywords": ["...", "..."]}}`]
    ]);

    const chain = prompt.pipe(this.llm);
    const response = await chain.invoke({ script });

    try {
      const content = response.content as string;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      const parsed = JSON.parse(jsonMatch?.[0] || '{}');

      console.log(`✅ Script analizado: ${parsed.emotion} / ${parsed.tone}`);
      return parsed;
    } catch (error) {
      console.error('Error parsing script analysis:', error);
      return {
        emotion: 'neutral',
        tone: 'profesional',
        keywords: ['profesional', 'confiable']
      };
    }
  }

  /**
   * NODE 2: Analyze Avatar Pool
   * Lee todas las fotos disponibles
   */
  private async getAvatarPool(): Promise<AvatarCandidate[]> {
    console.log('📁 NODE 2: Cargando pool de avatares...');

    try {
      const files = await fs.readdir(AVATAR_POOL_PATH);
      const imageFiles = files.filter(f => /\.(png|jpg|jpeg|webp)$/i.test(f));

      // Limitar a 3 fotos para análisis económico (optimización de costos)
      const selectedFiles = imageFiles.slice(0, 3);

      const avatars: AvatarCandidate[] = selectedFiles.map((filename, index) => ({
        id: `avatar-${index}`,
        filename,
        path: path.join(AVATAR_POOL_PATH, filename)
      }));

      console.log(`✅ Pool cargado: ${avatars.length} avatares`);
      return avatars;
    } catch (error) {
      console.error('Error reading avatar pool:', error);
      return [];
    }
  }

  /**
   * NODE 3: Visual Analysis with GPT-4 Vision
   * Analiza cada foto con Vision API
   */
  private async analyzeAvatar(
    avatar: AvatarCandidate,
    scriptContext: { emotion: string; tone: string; keywords: string[] }
  ): Promise<{ avatar_id: string; analysis: string; match_score: number }> {
    try {
      // Leer imagen y convertir a base64
      const imageBuffer = await fs.readFile(avatar.path);
      const base64Image = imageBuffer.toString('base64');
      const ext = avatar.filename.split('.').pop()?.toLowerCase();
      const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';
      const dataUrl = `data:${mimeType};base64,${base64Image}`;

      const prompt = `Analiza esta foto de avatar para uso en Instagram Reels.

CONTEXTO DEL VIDEO:
- Emoción requerida: ${scriptContext.emotion}
- Tono: ${scriptContext.tone}
- Keywords: ${scriptContext.keywords.join(', ')}

EVALÚA:
1. Expresión facial: ¿Coincide con la emoción requerida?
2. Calidad de imagen: iluminación, nitidez, profesionalismo
3. Fondo: ¿Es neutro y no distractor?
4. Match contextual: ¿Esta persona encaja con el tono del mensaje?

RESPONDE EN FORMATO JSON:
{
  "expression": "descripción de expresión facial",
  "quality": "high|medium|low",
  "background": "descripción del fondo",
  "emotion_detected": "happy|energetic|serious|thoughtful|neutral",
  "match_score": 0-100,
  "reason": "explicación breve del score"
}`;

      const message = new HumanMessage({
        content: [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: dataUrl } }
        ]
      });

      const response = await this.visionLlm.invoke([message]);
      const content = response.content as string;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      const parsed = JSON.parse(jsonMatch?.[0] || '{}');

      return {
        avatar_id: avatar.id,
        analysis: parsed.reason || 'Sin análisis',
        match_score: parsed.match_score || 50
      };
    } catch (error) {
      console.error(`Error analizando ${avatar.filename}:`, error);
      return {
        avatar_id: avatar.id,
        analysis: 'Error en análisis',
        match_score: 30
      };
    }
  }

  /**
   * NODE 4: Score and Rank
   * Calcula scores finales y rankea
   */
  private async scoreAndRank(
    avatars: AvatarCandidate[],
    analyses: Array<{ avatar_id: string; analysis: string; match_score: number }>,
    scriptContext: { emotion: string; tone: string }
  ): Promise<AvatarScore[]> {
    console.log('🎯 NODE 4: Scoring y ranking...');

    const scores: AvatarScore[] = avatars.map(avatar => {
      const analysis = analyses.find(a => a.avatar_id === avatar.id);

      if (!analysis) {
        return {
          avatar,
          score: 0,
          breakdown: {
            semantic_match: 0,
            emotion_match: 0,
            quality_score: 0,
            context_match: 0
          },
          reason: 'No analizado'
        };
      }

      // Scores individuales
      const semanticMatch = analysis.match_score / 100;
      const emotionMatch = semanticMatch; // Simplificado
      const qualityScore = 0.8; // Placeholder (usar SER-FIQ en producción)
      const contextMatch = semanticMatch * 0.9;

      // Score ponderado
      const totalScore =
        semanticMatch * 0.4 +      // 40% - Matching semántico
        emotionMatch * 0.3 +       // 30% - Matching emocional
        qualityScore * 0.2 +       // 20% - Calidad técnica
        contextMatch * 0.1;        // 10% - Contexto

      return {
        avatar,
        score: Math.round(totalScore * 100),
        breakdown: {
          semantic_match: Math.round(semanticMatch * 100),
          emotion_match: Math.round(emotionMatch * 100),
          quality_score: Math.round(qualityScore * 100),
          context_match: Math.round(contextMatch * 100)
        },
        reason: analysis.analysis
      };
    });

    // Rankear por score
    scores.sort((a, b) => b.score - a.score);

    console.log(`✅ Ranking completado. Top score: ${scores[0]?.score || 0}/100`);
    return scores;
  }

  // ============ EXECUTE STATE MACHINE ============

  async selectBestAvatars(
    script: string,
    topN: number = 3
  ): Promise<PhotoSelectionResult> {
    const startTime = Date.now();

    try {
      console.log('🚀 Iniciando Photo Selector State Machine...');

      // STATE: Initial
      const state: PhotoSelectionState = {
        script,
        script_emotion: '',
        script_tone: '',
        avatar_pool: [],
        semantic_scores: [],
        face_analyses: [],
        final_scores: [],
        selected_avatars: []
      };

      // NODE 1: Analyze Script
      const scriptAnalysis = await this.analyzeScript(script);
      state.script_emotion = scriptAnalysis.emotion;
      state.script_tone = scriptAnalysis.tone;

      // NODE 2: Get Avatar Pool
      state.avatar_pool = await this.getAvatarPool();

      if (state.avatar_pool.length === 0) {
        throw new Error('No hay avatares disponibles en el pool');
      }

      // NODE 3: Analyze Each Avatar (paralelo)
      console.log(`🔍 NODE 3: Analizando ${state.avatar_pool.length} avatares con GPT-4 Vision...`);

      const analyses = await Promise.all(
        state.avatar_pool.map(avatar =>
          this.analyzeAvatar(avatar, {
            emotion: state.script_emotion,
            tone: state.script_tone,
            keywords: scriptAnalysis.keywords
          })
        )
      );

      // NODE 4: Score and Rank
      const rankedScores = await this.scoreAndRank(
        state.avatar_pool,
        analyses,
        {
          emotion: state.script_emotion,
          tone: state.script_tone
        }
      );

      state.final_scores = rankedScores;
      state.selected_avatars = rankedScores.slice(0, topN);

      const executionTime = Date.now() - startTime;

      console.log(`✅ Photo Selector completado en ${executionTime}ms`);
      console.log(`📊 Top 3 avatares:`);
      state.selected_avatars.forEach((avatar, i) => {
        console.log(`   ${i + 1}. ${avatar.avatar.filename} - Score: ${avatar.score}/100`);
        console.log(`      Razón: ${avatar.reason}`);
      });

      return {
        selected_avatars: state.selected_avatars,
        execution_time: executionTime,
        total_analyzed: state.avatar_pool.length
      };

    } catch (error: any) {
      console.error('❌ Error en Photo Selector:', error.message);
      throw error;
    }
  }

  /**
   * Versión simplificada: selecciona 1 avatar (el mejor)
   */
  async selectBestAvatar(script: string): Promise<AvatarScore> {
    const result = await this.selectBestAvatars(script, 1);
    return result.selected_avatars[0];
  }
}
