/**
 * SISTEMA DE AGENTES PARA GENERACIÓN DE CONTENIDO
 *
 * Implementa patrón CrewAI con 4 agentes especializados:
 * 1. Research Agent - Analiza tendencias y competencia
 * 2. Strategy Agent - Define ángulos de contenido
 * 3. Script Writer Agent - Genera scripts optimizados
 * 4. Optimizer Agent - Optimiza para engagement
 */

import { ChatOpenAI } from '@langchain/openai';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { StructuredOutputParser } from 'langchain/output_parsers';
import { z } from 'zod';
import type {
  CompetitorPost,
  ResearchData,
  ContentStrategy,
  ScriptVariant,
  OptimizedScript,
  ContentGenerationResult,
  AgentConfig
} from './types';

// ============ CONFIGURACIÓN DE AGENTES ============

const DEFAULT_CONFIG: AgentConfig = {
  model: 'gpt-4o-mini',  // Optimizado: 15x más barato que gpt-4o
  temperature: 0.7,
  max_tokens: 2000,
  verbose: true
};

// ============ RESEARCH AGENT ============

class ResearchAgent {
  private llm: ChatOpenAI;
  private name = 'Research Agent';

  constructor(config: AgentConfig = DEFAULT_CONFIG) {
    this.llm = new ChatOpenAI({
      modelName: config.model,
      temperature: 0.4, // Más conservador para análisis
      maxTokens: config.max_tokens
    });
  }

  async analyze(competitorPosts: CompetitorPost[]): Promise<ResearchData> {
    console.log(`🔍 ${this.name}: Analizando ${competitorPosts.length} posts de competencia...`);

    const prompt = ChatPromptTemplate.fromMessages([
      ['system', `Eres un experto analista de redes sociales especializado en Instagram Reels.
Tu trabajo es identificar patrones de engagement, hooks exitosos y tendencias virales.

METODOLOGÍA:
1. Analiza engagement rate de cada post
2. Identifica hooks que capturan atención (primeras 3 palabras)
3. Detecta CTAs comunes y efectivos
4. Extrae hashtags de alto rendimiento
5. Identifica temas trending basados en performance`],
      ['user', `Analiza estos posts de competidores y genera insights accionables:

Posts:
{posts}

RESPONDE EN FORMATO JSON:
{{
  "trending_topics": [
    {{
      "topic": "nombre del tema",
      "trend_score": 0.0-1.0,
      "audience_size": "estimación",
      "top_posts": [{{ "url": "...", "engagement_rate": 0.0 }}]
    }}
  ],
  "competitor_analysis": {{
    "avg_engagement_rate": 0.0,
    "best_performing_hooks": ["hook 1", "hook 2", "hook 3"],
    "common_ctas": ["cta 1", "cta 2"],
    "top_hashtags": ["#tag1", "#tag2"]
  }},
  "recommendations": ["recomendación 1", "recomendación 2"]
}}`]
    ]);

    const chain = prompt.pipe(this.llm);
    const response = await chain.invoke({
      posts: JSON.stringify(competitorPosts, null, 2)
    });

    try {
      const parsed = JSON.parse(response.content as string);
      console.log(`✅ ${this.name}: Identificados ${parsed.trending_topics?.length || 0} temas trending`);
      return parsed as ResearchData;
    } catch (error) {
      console.error(`❌ ${this.name}: Error parsing response`, error);
      // Fallback con datos básicos
      return {
        trending_topics: [{
          topic: 'Contenido general',
          trend_score: 0.5,
          audience_size: 'Medium',
          top_posts: competitorPosts.slice(0, 3)
        }],
        competitor_analysis: {
          avg_engagement_rate: competitorPosts.reduce((sum, p) => sum + p.engagement_rate, 0) / competitorPosts.length,
          best_performing_hooks: ['¿Sabías que...?', 'El error #1...', 'Nadie te cuenta...'],
          common_ctas: ['Guarda este post', 'Sígueme para más'],
          top_hashtags: ['#ia', '#emprendimiento', '#marketing']
        },
        recommendations: ['Enfócate en contenido educativo', 'Usa hooks con preguntas']
      };
    }
  }
}

// ============ STRATEGY AGENT ============

class StrategyAgent {
  private llm: ChatOpenAI;
  private name = 'Strategy Agent';

  constructor(config: AgentConfig = DEFAULT_CONFIG) {
    this.llm = new ChatOpenAI({
      modelName: config.model,
      temperature: 0.6,
      maxTokens: config.max_tokens
    });
  }

  async createStrategies(research: ResearchData, count: number = 3): Promise<ContentStrategy[]> {
    console.log(`🎯 ${this.name}: Generando ${count} estrategias de contenido...`);

    const prompt = ChatPromptTemplate.fromMessages([
      ['system', `Eres un estratega de contenido especializado en Instagram Reels.
Tu trabajo es convertir research insights en estrategias de contenido accionables.

PRINCIPIOS:
- Cada estrategia debe tener un ángulo único y diferenciado
- El tono debe alinearse con la audiencia objetivo
- El mensaje clave debe ser claro y memorable
- La emoción debe resonar con el contenido`],
      ['user', `Basándote en este research, crea ${count} estrategias de contenido distintas:

RESEARCH:
{research}

GENERA ${count} ESTRATEGIAS EN FORMATO JSON:
[
  {{
    "angle": "ángulo único del contenido",
    "target_audience": "descripción específica de audiencia",
    "tone": "profesional|cercano|divertido|inspirador",
    "key_message": "mensaje principal en 1 frase",
    "emotional_tone": "happy|neutral|serious|energetic|thoughtful"
  }}
]`]
    ]);

    const chain = prompt.pipe(this.llm);
    const response = await chain.invoke({
      research: JSON.stringify(research, null, 2)
    });

    try {
      const content = response.content as string;
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      const parsed = JSON.parse(jsonMatch?.[0] || '[]');
      console.log(`✅ ${this.name}: Creadas ${parsed.length} estrategias`);
      return parsed as ContentStrategy[];
    } catch (error) {
      console.error(`❌ ${this.name}: Error parsing response`, error);
      // Fallback con estrategias básicas
      return [{
        angle: 'Educativo y práctico',
        target_audience: 'Emprendedores 25-35 años',
        tone: 'profesional pero cercano',
        key_message: 'Herramientas de IA que transforman tu negocio',
        emotional_tone: 'energetic'
      }];
    }
  }
}

// ============ SCRIPT WRITER AGENT ============

class ScriptWriterAgent {
  private llm: ChatOpenAI;
  private name = 'Script Writer Agent';

  constructor(config: AgentConfig = DEFAULT_CONFIG) {
    this.llm = new ChatOpenAI({
      modelName: config.model,
      temperature: 0.7, // Balance creatividad/coherencia
      maxTokens: config.max_tokens
    });
  }

  async writeScript(strategy: ContentStrategy, research: ResearchData): Promise<ScriptVariant> {
    console.log(`✍️ ${this.name}: Escribiendo script para "${strategy.key_message}"...`);

    const hookFormulas = {
      happy: '¿Sabías que [estadística sorprendente]?',
      energetic: '¡Atención! Esto va a cambiar [algo importante]',
      serious: 'El error #1 que [audiencia] comete es...',
      thoughtful: 'Después de [tiempo/experiencia], descubrí que...',
      neutral: 'Hoy te muestro [beneficio específico]'
    };

    const selectedHookFormula = hookFormulas[strategy.emotional_tone] || hookFormulas.neutral;

    const prompt = ChatPromptTemplate.fromMessages([
      ['system', `Eres un copywriter profesional especializado en scripts de Instagram Reels de 60 segundos.

ESTRUCTURA OBLIGATORIA:
[HOOK - 0-3 segundos]
- Fórmula base: ${selectedHookFormula}
- Primeras 3 palabras deben capturar atención
- Crear curiosidad o urgencia inmediata

[VALOR - 3-45 segundos]
- Problema/dolor que resuelves
- 2-3 insights accionables
- Lenguaje conversacional y directo
- Evitar jerga técnica o explicarla

[CTA - 45-60 segundos]
- Acción específica y clara
- Crear urgencia o incentivo
- Máximo 10 palabras

REGLAS DE ESCRITURA:
- Escribir para HABLAR (conversacional, pausas naturales)
- Velocidad: 2.5 palabras/segundo = ~150 palabras totales
- Frases cortas: 10-15 palabras máximo
- Dirigirse al espectador directamente (tú)
- Usar expresiones latinoamericanas
- Incluir marcadores de énfasis: *pausa*, [énfasis]`],
      ['user', `Crea un script de 60 segundos para Instagram Reel:

ESTRATEGIA:
- Ángulo: {angle}
- Audiencia: {audience}
- Tono: {tone}
- Mensaje: {message}
- Emoción: {emotion}

BEST PERFORMING HOOKS (inspiración):
{hooks}

RESPONDE EN FORMATO JSON:
{{
  "hook": "texto del hook (0-3s)",
  "body": "texto del cuerpo (3-45s)",
  "cta": "texto del CTA (45-60s)",
  "visual_cues": ["indicación visual 1", "indicación visual 2"],
  "estimated_duration": 60,
  "word_count": 150
}}`]
    ]);

    const chain = prompt.pipe(this.llm);
    const response = await chain.invoke({
      angle: strategy.angle,
      audience: strategy.target_audience,
      tone: strategy.tone,
      message: strategy.key_message,
      emotion: strategy.emotional_tone,
      hooks: research.competitor_analysis.best_performing_hooks.join(', ')
    });

    try {
      const content = response.content as string;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      const parsed = JSON.parse(jsonMatch?.[0] || '{}');

      console.log(`✅ ${this.name}: Script generado (${parsed.word_count || 0} palabras)`);
      return parsed as ScriptVariant;
    } catch (error) {
      console.error(`❌ ${this.name}: Error parsing response`, error);
      // Fallback con script básico
      return {
        hook: '¿Sabías que la IA puede automatizar tu negocio?',
        body: 'La mayoría de emprendedores pierden horas en tareas repetitivas. *pausa* Con las herramientas correctas de IA, puedes automatizar hasta el 70% de tu trabajo. Te muestro las 3 mejores.',
        cta: 'Guarda este post y sígueme para más tips de IA',
        visual_cues: ['Mostrar logo de herramientas', 'Transition rápida'],
        estimated_duration: 60,
        word_count: 50
      };
    }
  }
}

// ============ OPTIMIZER AGENT ============

class OptimizerAgent {
  private llm: ChatOpenAI;
  private name = 'Optimizer Agent';

  constructor(config: AgentConfig = DEFAULT_CONFIG) {
    this.llm = new ChatOpenAI({
      modelName: config.model,
      temperature: 0.4, // Más conservador para optimización
      maxTokens: 1500
    });
  }

  async optimize(script: ScriptVariant, strategy: ContentStrategy, research: ResearchData): Promise<OptimizedScript> {
    console.log(`🚀 ${this.name}: Optimizando script para máximo engagement...`);

    const prompt = ChatPromptTemplate.fromMessages([
      ['system', `Eres un especialista en optimización de engagement para Instagram Reels.

TU TRABAJO:
1. Evaluar fortaleza del hook (score 0-100)
2. Agregar 10-15 hashtags (trending + nicho)
3. Sugerir música/sonido trending
4. Predecir engagement (high/medium/low)
5. Calcular score de engagement (0-100)

CRITERIOS DE ENGAGEMENT:
- Hook strength: ¿Detiene el scroll?
- Value clarity: ¿El mensaje es claro?
- CTA effectiveness: ¿La acción es específica?
- Algorithmic factors: ¿Optimizado para algoritmo?`],
      ['user', `Optimiza este script para máximo engagement:

SCRIPT:
{script}

ESTRATEGIA:
{strategy}

TOP HASHTAGS DE COMPETENCIA:
{hashtags}

RESPONDE EN FORMATO JSON:
{{
  "optimized_hook": "hook mejorado si es necesario, o mismo hook",
  "hashtags": ["#tag1", "#tag2", ...10-15 tags],
  "sound_suggestion": "nombre de sonido trending o tipo de música",
  "engagement_prediction": "high|medium|low",
  "engagement_score": 0-100,
  "hook_strength": 0-100,
  "improvements_made": ["mejora 1", "mejora 2"],
  "predicted_metrics": {{
    "completion_rate": "percentage",
    "save_likelihood": "high|medium|low"
  }}
}}`]
    ]);

    const chain = prompt.pipe(this.llm);
    const response = await chain.invoke({
      script: JSON.stringify(script, null, 2),
      strategy: JSON.stringify(strategy, null, 2),
      hashtags: research.competitor_analysis.top_hashtags.join(', ')
    });

    try {
      const content = response.content as string;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      const parsed = JSON.parse(jsonMatch?.[0] || '{}');

      // Usar hook optimizado si existe
      const finalScript = {
        ...script,
        hook: parsed.optimized_hook || script.hook
      };

      const optimized: OptimizedScript = {
        script: finalScript,
        hashtags: parsed.hashtags || research.competitor_analysis.top_hashtags,
        sound_suggestion: parsed.sound_suggestion || 'Audio original trending',
        engagement_prediction: parsed.engagement_prediction || 'medium',
        engagement_score: parsed.engagement_score || 65,
        metadata: {
          topic: strategy.key_message,
          tone: strategy.tone,
          target_audience: strategy.target_audience
        }
      };

      console.log(`✅ ${this.name}: Optimizado con score ${optimized.engagement_score}/100`);
      return optimized;
    } catch (error) {
      console.error(`❌ ${this.name}: Error parsing response`, error);
      // Fallback con optimización básica
      return {
        script,
        hashtags: research.competitor_analysis.top_hashtags.slice(0, 10),
        sound_suggestion: 'Audio trending de IA',
        engagement_prediction: 'medium',
        engagement_score: 60,
        metadata: {
          topic: strategy.key_message,
          tone: strategy.tone,
          target_audience: strategy.target_audience
        }
      };
    }
  }
}

// ============ CONTENT CREW (ORQUESTADOR) ============

export class ContentCrew {
  private researchAgent: ResearchAgent;
  private strategyAgent: StrategyAgent;
  private scriptWriterAgent: ScriptWriterAgent;
  private optimizerAgent: OptimizerAgent;
  private config: AgentConfig;

  constructor(config: Partial<AgentConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };

    console.log('🤖 Inicializando Content Crew...');
    this.researchAgent = new ResearchAgent(this.config);
    this.strategyAgent = new StrategyAgent(this.config);
    this.scriptWriterAgent = new ScriptWriterAgent(this.config);
    this.optimizerAgent = new OptimizerAgent(this.config);
    console.log('✅ Content Crew listo');
  }

  async generateContent(
    competitorPosts: CompetitorPost[],
    count: number = 3
  ): Promise<ContentGenerationResult> {
    const startTime = Date.now();
    const logs: string[] = [];

    try {
      logs.push('🚀 Iniciando generación de contenido con sistema multi-agente');

      // PASO 1: Research
      logs.push('📊 PASO 1/4: Research Agent analizando competencia...');
      const research = await this.researchAgent.analyze(competitorPosts);
      logs.push(`✅ Research completado: ${research.trending_topics.length} temas identificados`);

      // PASO 2: Strategy
      logs.push(`🎯 PASO 2/4: Strategy Agent creando ${count} estrategias...`);
      const strategies = await this.strategyAgent.createStrategies(research, count);
      logs.push(`✅ Estrategias creadas: ${strategies.length}`);

      // PASO 3 & 4: Script Writing + Optimization (paralelo para cada estrategia)
      logs.push(`✍️ PASO 3/4: Script Writer Agent generando scripts...`);
      logs.push(`🚀 PASO 4/4: Optimizer Agent optimizando...`);

      const proposals = await Promise.all(
        strategies.map(async (strategy) => {
          // Write script
          const script = await this.scriptWriterAgent.writeScript(strategy, research);

          // Optimize script
          const optimized = await this.optimizerAgent.optimize(script, strategy, research);

          return optimized;
        })
      );

      logs.push(`✅ Generación completada: ${proposals.length} propuestas listas`);

      const executionTime = Date.now() - startTime;

      return {
        proposals,
        execution_time: executionTime,
        agent_logs: logs
      };

    } catch (error: any) {
      logs.push(`❌ Error en Content Crew: ${error.message}`);
      console.error('Error en Content Crew:', error);
      throw error;
    }
  }
}
