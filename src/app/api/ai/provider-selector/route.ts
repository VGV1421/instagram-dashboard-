import { NextResponse } from 'next/server';
import OpenAI from 'openai';

/**
 * POST /api/ai/provider-selector
 *
 * Asistente AI que elige el mejor proveedor de video según parámetros
 *
 * Input:
 * {
 *   duration: 5 | 10 | 15,
 *   video_type: 'talking_head' | 'cinematic' | 'simple',
 *   objective: 'natural_gestures' | 'fast_generation' | 'high_quality',
 *   budget_priority: 'low' | 'medium' | 'high'
 * }
 *
 * Output:
 * {
 *   provider: 'kling/v1-avatar-standard',
 *   reason: 'Explicación en español',
 *   estimated_cost: 0.28,
 *   estimated_time: 180,
 *   quality_score: 9,
 *   alternatives: []
 * }
 */

// Proveedores disponibles en Kie.ai con características
// Basado en https://kie.ai/market y https://docs.kie.ai
const AVAILABLE_PROVIDERS = [
  // ═══════════════════════════════════════════════════════
  // AVATAR / TALKING HEAD MODELS (Prioridad para tu caso)
  // ═══════════════════════════════════════════════════════
  {
    id: 'kling/v1-avatar-standard',
    name: 'Kling AI Avatar V1 Standard',
    cost_per_10s: 0.28, // ~55 créditos Kie.ai
    quality: 9,
    speed: 7,
    best_for: ['natural_gestures', 'talking_head', 'professional'],
    avg_generation_time: 180,
    supports_durations: [5, 10, 15],
    video_type: 'avatar',
    pros: ['Gestos muy naturales', 'Movimiento de manos excelente', 'Lip-sync perfecto', 'Mejor relación calidad/precio para avatares'],
    cons: ['Requiere créditos Kie.ai', 'Limitado a 15s máximo']
  },
  {
    id: 'kling/v1-avatar-pro',
    name: 'Kling AI Avatar V1 Pro',
    cost_per_10s: 0.42, // ~85 créditos estimados
    quality: 10,
    speed: 6,
    best_for: ['natural_gestures', 'professional', 'high_quality'],
    avg_generation_time: 210,
    supports_durations: [5, 10, 15],
    video_type: 'avatar',
    pros: ['Máxima calidad de avatar', 'Gestos ultra-naturales', 'Mejor lip-sync del mercado', 'Expresiones faciales avanzadas'],
    cons: ['Más caro que Standard', 'Más lento']
  },
  {
    id: 'infinitalk',
    name: 'Infinitalk (Audio-driven Avatar)',
    cost_per_10s: 0.35, // Estimado
    quality: 8,
    speed: 7,
    best_for: ['talking_head', 'audio_driven', 'natural'],
    avg_generation_time: 150,
    supports_durations: [5, 10, 15, 30],
    video_type: 'avatar',
    pros: ['Basado en audio (perfecto para ElevenLabs)', 'Natural', 'Soporta videos largos'],
    cons: ['Menos conocido', 'Documentación limitada']
  },

  // ═══════════════════════════════════════════════════════
  // VIDEO GENERATIVO (No avatar, pero alta calidad)
  // ═══════════════════════════════════════════════════════
  {
    id: 'kling/v2-1-pro',
    name: 'Kling V2.1 Pro',
    cost_per_10s: 0.50, // $0.25 per 5s
    quality: 9,
    speed: 7,
    best_for: ['high_quality', 'text_to_video', 'image_to_video'],
    avg_generation_time: 180,
    supports_durations: [5, 10, 15, 20],
    video_type: 'generative',
    pros: ['Alta calidad', 'Versatil (texto e imagen)', 'Kling 2.1 mejorado'],
    cons: ['NO es avatar hablando', 'Más caro que Avatar Standard']
  },
  {
    id: 'kling/v2-6',
    name: 'Kling 2.6 (Latest)',
    cost_per_10s: 0.45,
    quality: 9,
    speed: 8,
    best_for: ['fast_generation', 'high_quality', 'text_to_video'],
    avg_generation_time: 150,
    supports_durations: [5, 10, 15],
    video_type: 'generative',
    pros: ['Versión más reciente', 'Rápido', 'Buena calidad'],
    cons: ['NO es avatar hablando', 'Generativo desde texto/imagen']
  },
  {
    id: 'veo3-1-fast',
    name: 'Google Veo 3.1 Fast',
    cost_per_10s: 0.30, // $0.30-0.40 por video completo
    quality: 8,
    speed: 9,
    best_for: ['fast_generation', 'budget', 'cinematic'],
    avg_generation_time: 120,
    supports_durations: [5, 10, 15],
    video_type: 'generative',
    pros: ['MUY económico ($0.30/video)', 'Muy rápido', 'Google AI', 'Mejor precio de Kie.ai'],
    cons: ['NO es avatar hablando', 'Calidad inferior a Quality mode']
  },
  {
    id: 'veo3-1-quality',
    name: 'Google Veo 3.1 Quality',
    cost_per_10s: 1.25, // $1.25 por video
    quality: 10,
    speed: 4,
    best_for: ['high_quality', 'cinematic', 'professional'],
    avg_generation_time: 300,
    supports_durations: [5, 10, 15, 20],
    video_type: 'generative',
    pros: ['Máxima calidad Google AI', 'Cinematográfico'],
    cons: ['Caro', 'Lento', 'NO es avatar hablando']
  },
  {
    id: 'hailuo-standard',
    name: 'Hailuo (MiniMax) Standard',
    cost_per_10s: 0.45, // $0.045/second
    quality: 8,
    speed: 7,
    best_for: ['budget', 'good_quality', 'text_to_video'],
    avg_generation_time: 180,
    supports_durations: [5, 10, 15],
    video_type: 'generative',
    pros: ['Buen balance calidad/precio', 'Estable', 'Versátil'],
    cons: ['NO es avatar hablando', 'Calidad media']
  },
  {
    id: 'runway/gen3-turbo',
    name: 'Runway Gen-3 Turbo',
    cost_per_10s: 0.53, // $0.053/second
    quality: 9,
    speed: 6,
    best_for: ['high_quality', 'cinematic', 'creative'],
    avg_generation_time: 240,
    supports_durations: [5, 10, 15, 20],
    video_type: 'generative',
    pros: ['Alta calidad', 'Runway prestigioso', 'Creativo'],
    cons: ['Caro', 'NO es avatar hablando', 'Más lento']
  },
  {
    id: 'sora2',
    name: 'Sora 2 (OpenAI)',
    cost_per_10s: 1.00, // ~$1-5 per 10s (usando estimación baja)
    quality: 10,
    speed: 3,
    best_for: ['high_quality', 'cinematic', 'cutting_edge'],
    avg_generation_time: 360,
    supports_durations: [5, 10, 15, 20, 30],
    video_type: 'generative',
    pros: ['Máxima calidad OpenAI', 'Estado del arte', 'Cutting edge'],
    cons: ['MUY caro', 'Muy lento', 'NO es avatar hablando', 'Overkill para talking heads']
  }
];

interface ProviderSelectorRequest {
  duration: 5 | 10 | 15;
  video_type?:
    | 'talking_head'      // Avatar hablando con lip-sync
    | 'dance'             // Baile, coreografía, movimiento corporal
    | 'showcase'          // Mostrar producto, novedad, demo
    | 'motion'            // Solo movimiento, sin hablar
    | 'creative'          // Efectos especiales, transiciones, artístico
    | 'cinematic'         // Alta calidad cinematográfica
    | 'simple';           // Simple, básico
  objective?:
    | 'natural_gestures'  // Gestos naturales (para talking head)
    | 'body_movement'     // Movimiento corporal (para bailes)
    | 'visual_effects'    // Efectos visuales
    | 'fast_generation'   // Generación rápida
    | 'high_quality'      // Máxima calidad
    | 'budget'            // Económico
    | 'creative';         // Creatividad, originalidad
  budget_priority?: 'low' | 'medium' | 'high';
  caption?: string; // Para contexto adicional
  has_audio?: boolean; // Si tiene audio hablado o solo música/efectos
}

export async function POST(request: Request) {
  try {
    const body: ProviderSelectorRequest = await request.json();
    const {
      duration,
      video_type = 'talking_head',
      objective = 'natural_gestures',
      budget_priority = 'medium',
      caption = ''
    } = body;

    // Validar parámetros
    if (!duration || ![5, 10, 15].includes(duration)) {
      return NextResponse.json({
        success: false,
        error: 'Duración inválida. Debe ser 5, 10 o 15 segundos'
      }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: 'OPENAI_API_KEY no configurado'
      }, { status: 500 });
    }

    console.log('🤖 Asistente Selector de Proveedor iniciado...');
    console.log(`📊 Parámetros: ${duration}s, ${video_type}, objetivo: ${objective}, presupuesto: ${budget_priority}`);

    const openai = new OpenAI({ apiKey });

    // Filtrar proveedores que soporten esta duración
    const compatibleProviders = AVAILABLE_PROVIDERS.filter(p =>
      p.supports_durations.includes(duration)
    );

    // Prompt para el asistente
    const systemPrompt = `Eres un asistente experto en selección de proveedores de video AI disponibles en Kie.ai.

Tu trabajo es analizar los parámetros del video y elegir el MEJOR proveedor considerando:
1. Objetivo principal del usuario
2. Relación calidad/precio
3. Tiempo de generación
4. Tipo de video (avatar vs generativo)

PROVEEDORES DISPONIBLES en Kie.ai:
${JSON.stringify(compatibleProviders, null, 2)}

TIPOS DE MODELOS:
- **AVATAR** (video_type='avatar'): Persona hablando con lip-sync, gestos naturales, audio-driven
  → Usa Kling Avatar Standard, Kling Avatar Pro, o Infinitalk
- **GENERATIVO** (video_type='generative'): Video creado desde texto/imagen, NO es avatar
  → Usa Veo 3.1, Kling 2.6, Runway, Sora 2, Hailuo

CASOS DE USO Y REGLAS:

1. **TALKING HEAD** (Avatar hablando con lip-sync):
   - video_type = 'talking_head'
   - SOLO modelos avatar
   - Primera opción: Kling Avatar Standard ($0.28)
   - Segunda opción: Kling Avatar Pro ($0.42) si high_quality
   - Tercera opción: Infinitalk ($0.35) si tiene audio complejo

2. **BAILE / DANZA** (Movimiento corporal, coreografía):
   - video_type = 'dance'
   - SOLO modelos generativos (NO avatar, necesita control de movimiento completo)
   - Primera opción: Kling 2.6 ($0.45) - Mejor para movimiento
   - Segunda opción: Runway Gen-3 ($0.53) - Alta calidad cinematográfica
   - Tercera opción: Veo 3.1 Quality ($1.25) si budget_priority='high'
   - NUNCA uses modelos avatar para bailes

3. **SHOWCASE** (Mostrar producto, novedad, demo):
   - video_type = 'showcase'
   - Puede ser avatar (si explicas hablando) o generativo (si solo muestras)
   - Si has_audio=true → Kling Avatar Standard (explica el producto)
   - Si has_audio=false → Veo 3.1 Fast/Quality (muestra visual)

4. **MOTION** (Solo movimiento, sin hablar):
   - video_type = 'motion'
   - SOLO modelos generativos
   - Música de fondo o efectos de sonido
   - Primera opción: Veo 3.1 Fast ($0.30) - Económico
   - Segunda opción: Kling 2.6 ($0.45) - Balance
   - NUNCA uses avatar si no hay habla

5. **CREATIVE** (Efectos especiales, transiciones, artístico):
   - video_type = 'creative'
   - SOLO modelos generativos de alta calidad
   - Primera opción: Runway Gen-3 Turbo ($0.53) - Mejor para creatividad
   - Segunda opción: Sora 2 ($1.00) - Cutting edge
   - Tercera opción: Veo 3.1 Quality ($1.25) - Google AI

6. **CINEMATIC** (Alta calidad cinematográfica):
   - video_type = 'cinematic'
   - Modelos generativos de máxima calidad
   - Primera opción: Veo 3.1 Quality ($1.25)
   - Segunda opción: Sora 2 ($1.00)
   - Tercera opción: Runway Gen-3 Turbo ($0.53)

7. **SIMPLE** (Básico, rápido):
   - video_type = 'simple'
   - Primera opción: Veo 3.1 Fast ($0.30) - Más económico
   - Segunda opción: Hailuo ($0.45) - Balance

CRITERIOS POR OBJETIVO:
- Si objective = 'natural_gestures' → SOLO modelos avatar (Kling Avatar Standard/Pro)
- Si objective = 'body_movement' → SOLO modelos generativos (Kling 2.6, Runway, nunca avatar)
- Si objective = 'visual_effects' → Modelos creativos (Runway Gen-3, Sora 2, Veo 3.1 Quality)
- Si objective = 'fast_generation' → Veo 3.1 Fast o Kling 2.6
- Si objective = 'high_quality' → Kling Avatar Pro (avatar) o Veo 3.1 Quality (generativo)
- Si objective = 'budget' → Veo 3.1 Fast (más económico $0.30)
- Si objective = 'creative' → Runway Gen-3 (mejor para creatividad) o Sora 2

CRITERIOS POR PRESUPUESTO:
- budget_priority = 'low' → Costo < $0.35/10s
- budget_priority = 'medium' → Balance calidad/costo ($0.28-$0.50/10s)
- budget_priority = 'high' → Máxima calidad sin importar costo

FORMATO DE RESPUESTA (JSON):
{
  "provider": "USAR ID EXACTO DEL CAMPO 'id' (ej: kling/v2-6, NO kling/2.6)",
  "reason": "Explicación clara en español (2-3 frases) de POR QUÉ elegiste este proveedor. Menciona si es avatar o generativo y por qué es apropiado para este caso.",
  "estimated_cost": 0.00,
  "estimated_time": 180,
  "quality_score": 9,
  "alternatives": [
    {
      "provider": "USAR ID EXACTO del campo 'id' de otro proveedor",
      "reason": "Por qué también es buena opción"
    }
  ]
}

CRÍTICO - IDs EXACTOS DE PROVEEDORES:
- Kling Avatar Standard: "kling/v1-avatar-standard" (NO "kling/avatar-standard")
- Kling Avatar Pro: "kling/v1-avatar-pro" (NO "kling/avatar-pro")
- Kling 2.6: "kling/v2-6" (NO "kling/2.6" o "kling/v2.6")
- Kling 2.1 Pro: "kling/v2-1-pro" (NO "kling/2.1" o "kling/v2.1")
- Veo 3.1 Fast: "veo3-1-fast" (NO "veo3.1-fast")
- Veo 3.1 Quality: "veo3-1-quality" (NO "veo3.1-quality")
- Runway: "runway/gen3-turbo" (NO "runway/gen3" o "runway/gen-3")
- Sora 2: "sora2" (NO "sora-2")
- Hailuo: "hailuo-standard"
- Infinitalk: "infinitalk"

IMPORTANTE:
- NUNCA elijas modelo generativo si piden talking_head o natural_gestures
- NUNCA elijas modelo avatar si piden dance, motion, creative o visual_effects
- Para bailes/danza: SIEMPRE usa modelos generativos (Kling 2.6 o Runway)
- Para efectos especiales: SIEMPRE usa Runway o Sora 2
- Menciona CLARAMENTE si el modelo es avatar o generativo
- Justifica la elección basándote en video_type del proveedor
- Si hay trade-offs, menciónalo (ej: "más caro pero mejor calidad")
- Responde SOLO con el JSON, sin texto adicional

EJEMPLOS DE USO:
1. "Video de baile con música" → dance + body_movement → Kling 2.6 (generativo)
2. "Avatar explicando producto" → talking_head + natural_gestures → Kling Avatar Standard
3. "Efectos visuales creativos" → creative + visual_effects → Runway Gen-3 Turbo
4. "Mostrar novedad con voz" → showcase + has_audio=true → Kling Avatar Standard
5. "Mostrar novedad sin voz" → showcase + has_audio=false → Veo 3.1 Fast
6. "Movimiento sin hablar" → motion + body_movement → Kling 2.6 o Veo 3.1 Fast`;

    const userPrompt = `Necesito generar un video con estas características:

**Parámetros:**
- Duración: ${duration} segundos
- Tipo de video: ${video_type}
- Objetivo principal: ${objective}
- Prioridad de presupuesto: ${budget_priority}
${caption ? `- Caption del video: "${caption}"` : ''}
${body.has_audio !== undefined ? `- ¿Tiene audio hablado?: ${body.has_audio ? 'Sí (voz)' : 'No (solo música/efectos)'}` : ''}

**Pregunta:** ¿Qué proveedor de video recomiendas y por qué?`;

    console.log('💬 Consultando a GPT-4o-mini...');

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: userPrompt
        }
      ],
      temperature: 0.3, // Baja temperatura para decisiones más consistentes
      response_format: { type: 'json_object' }
    });

    const aiResponse = response.choices[0]?.message?.content;
    if (!aiResponse) {
      throw new Error('No se recibió respuesta del asistente');
    }

    const selection = JSON.parse(aiResponse);

    // ═══════════════════════════════════════════════════════
    // AUTO-CORRECCIÓN DE HALLUCINATIONS COMUNES
    // ═══════════════════════════════════════════════════════

    // Mapeo de hallucinations conocidas → IDs correctos
    const HALLUCINATION_FIXES: Record<string, string> = {
      'kling/2.6': 'kling/v2-6',
      'kling/2.1': 'kling/v2-1-pro',
      'kling/v2.6': 'kling/v2-6',
      'kling/v2.1': 'kling/v2-1-pro',
      'kling/avatar-standard': 'kling/v1-avatar-standard',
      'kling/avatar-pro': 'kling/v1-avatar-pro',
      'veo3.1-fast': 'veo3-1-fast',
      'veo3.1-quality': 'veo3-1-quality',
      'runway/gen3': 'runway/gen3-turbo',
      'runway/gen-3': 'runway/gen3-turbo',
      'sora-2': 'sora2'
    };

    // Intentar corregir el ID si es conocido
    let correctedProviderId = selection.provider;
    if (HALLUCINATION_FIXES[selection.provider]) {
      console.log(`⚠️  Auto-corrección: "${selection.provider}" → "${HALLUCINATION_FIXES[selection.provider]}"`);
      correctedProviderId = HALLUCINATION_FIXES[selection.provider];
    }

    // Buscar proveedor con ID corregido
    let selectedProvider = compatibleProviders.find(p => p.id === correctedProviderId);

    // Si aún no se encuentra, intentar fuzzy matching
    if (!selectedProvider) {
      console.log(`⚠️  Proveedor "${correctedProviderId}" no encontrado. Intentando fuzzy matching...`);

      // Buscar por similitud (case-insensitive, partial match)
      const fuzzyMatches = compatibleProviders.filter(p => {
        const normalizedId = p.id.toLowerCase().replace(/[^a-z0-9]/g, '');
        const normalizedSelection = correctedProviderId.toLowerCase().replace(/[^a-z0-9]/g, '');
        return normalizedId.includes(normalizedSelection) || normalizedSelection.includes(normalizedId);
      });

      if (fuzzyMatches.length > 0) {
        selectedProvider = fuzzyMatches[0];
        console.log(`✅ Fuzzy match encontrado: "${correctedProviderId}" → "${selectedProvider.id}"`);
      }
    }

    // Si sigue sin encontrarse, lanzar error con sugerencias
    if (!selectedProvider) {
      const availableIds = compatibleProviders.map(p => p.id).join(', ');
      throw new Error(
        `Proveedor seleccionado no válido: "${selection.provider}"\n` +
        `ID corregido: "${correctedProviderId}"\n` +
        `Proveedores disponibles: ${availableIds}\n\n` +
        `Esto es un error de hallucination de GPT-4o-mini. El proveedor debe ser uno de los IDs exactos listados arriba.`
      );
    }

    // Calcular costo ajustado por duración
    const costMultiplier = duration / 10;
    const adjustedCost = selectedProvider.cost_per_10s * costMultiplier;

    console.log(`✅ Proveedor seleccionado: ${selectedProvider.name}`);
    console.log(`💰 Costo estimado: $${adjustedCost.toFixed(3)}`);
    console.log(`⏱️  Tiempo estimado: ${selectedProvider.avg_generation_time}s`);

    return NextResponse.json({
      success: true,
      selection: {
        provider_id: selectedProvider.id,
        provider_name: selectedProvider.name,
        provider_type: selectedProvider.video_type || 'unknown', // ← NUEVO: avatar o generative
        reason: selection.reason,
        estimated_cost: parseFloat(adjustedCost.toFixed(3)),
        estimated_time: selectedProvider.avg_generation_time,
        quality_score: selectedProvider.quality,
        speed_score: selectedProvider.speed,
        pros: selectedProvider.pros,
        cons: selectedProvider.cons,
        best_for: selectedProvider.best_for,
        alternatives: selection.alternatives || []
      },
      metadata: {
        duration,
        video_type,
        objective,
        budget_priority,
        providers_evaluated: compatibleProviders.length,
        avatar_models_count: compatibleProviders.filter(p => p.video_type === 'avatar').length,
        generative_models_count: compatibleProviders.filter(p => p.video_type === 'generative').length,
        ai_cost: 0.002 // Costo aproximado de la consulta
      }
    });

  } catch (error: any) {
    console.error('❌ Error en Asistente Selector:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      details: error.toString()
    }, { status: 500 });
  }
}

// GET: Listar proveedores disponibles
export async function GET() {
  const avatarModels = AVAILABLE_PROVIDERS.filter(p => p.video_type === 'avatar');
  const generativeModels = AVAILABLE_PROVIDERS.filter(p => p.video_type === 'generative');

  return NextResponse.json({
    success: true,
    providers: AVAILABLE_PROVIDERS.map(p => ({
      id: p.id,
      name: p.name,
      video_type: p.video_type,
      cost_per_10s: p.cost_per_10s,
      quality: p.quality,
      speed: p.speed,
      best_for: p.best_for,
      supports_durations: p.supports_durations
    })),
    summary: {
      total: AVAILABLE_PROVIDERS.length,
      avatar_models: avatarModels.length,
      generative_models: generativeModels.length,
      cheapest: AVAILABLE_PROVIDERS.reduce((min, p) =>
        p.cost_per_10s < min.cost_per_10s ? p : min
      ),
      highest_quality: AVAILABLE_PROVIDERS.reduce((max, p) =>
        p.quality > max.quality ? p : max
      )
    },
    categories: {
      avatar: avatarModels.map(p => ({ id: p.id, name: p.name, cost: p.cost_per_10s })),
      generative: generativeModels.map(p => ({ id: p.id, name: p.name, cost: p.cost_per_10s }))
    }
  });
}
