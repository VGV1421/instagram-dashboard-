/**
 * TIPOS COMPARTIDOS PARA SISTEMA DE AGENTES
 *
 * Sistema multi-agente profesional para generación de contenido
 * y selección inteligente de avatares
 */

export interface CompetitorPost {
  url: string;
  caption: string;
  engagement_rate: number;
  likes: number;
  comments: number;
}

export interface ResearchData {
  trending_topics: Array<{
    topic: string;
    trend_score: number;
    audience_size: string;
    top_posts: CompetitorPost[];
  }>;
  competitor_analysis: {
    avg_engagement_rate: number;
    best_performing_hooks: string[];
    common_ctas: string[];
    top_hashtags: string[];
  };
  recommendations: string[];
}

export interface ContentStrategy {
  angle: string;
  target_audience: string;
  tone: string;
  key_message: string;
  emotional_tone: 'happy' | 'neutral' | 'serious' | 'energetic' | 'thoughtful';
}

export interface ScriptVariant {
  hook: string;           // 0-3 seconds
  body: string;           // 3-45 seconds
  cta: string;            // 45-60 seconds
  visual_cues: string[];
  estimated_duration: number;
  word_count: number;
}

export interface OptimizedScript {
  script: ScriptVariant;
  hashtags: string[];
  sound_suggestion: string;
  engagement_prediction: 'high' | 'medium' | 'low';
  engagement_score: number; // 0-100
  metadata: {
    topic: string;
    tone: string;
    target_audience: string;
  };
}

export interface AvatarCandidate {
  id: string;
  filename: string;
  path: string;
  url?: string;
}

export interface FaceAnalysis {
  avatar_id: string;
  age?: number;
  emotion?: string;
  emotion_confidence?: number;
  gender?: string;
  quality_score?: number;
}

export interface AvatarScore {
  avatar: AvatarCandidate;
  score: number;
  breakdown: {
    semantic_match: number;    // 40% weight
    emotion_match: number;      // 30% weight
    quality_score: number;      // 20% weight
    context_match: number;      // 10% weight
  };
  reason: string;
}

export interface PhotoSelectionState {
  script: string;
  script_emotion: string;
  script_tone: string;
  avatar_pool: AvatarCandidate[];
  semantic_scores: Array<{ avatar_id: string; score: number }>;
  face_analyses: FaceAnalysis[];
  final_scores: AvatarScore[];
  selected_avatars: AvatarScore[];
}

export interface AgentConfig {
  model: string;
  temperature: number;
  max_tokens: number;
  verbose?: boolean;
}

export interface ContentGenerationResult {
  proposals: OptimizedScript[];
  execution_time: number;
  agent_logs: string[];
}

export interface PhotoSelectionResult {
  selected_avatars: AvatarScore[];
  execution_time: number;
  total_analyzed: number;
}
