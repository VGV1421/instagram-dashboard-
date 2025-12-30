/**
 * Sistema de Duraciones de Video
 * Define límites de palabras y configuración para videos de 5, 10 y 15 segundos
 */

export type VideoDuration = 5 | 10 | 15;

export interface DurationConfig {
  seconds: VideoDuration;
  minWords: number;
  maxWords: number;
  targetWords: number;
  gestureIntensity: 'low' | 'medium' | 'high';
  actionDescription: string;
}

/**
 * Configuración por duración
 * Basado en 2.5 palabras/segundo en español
 */
export const DURATION_CONFIGS: Record<VideoDuration, DurationConfig> = {
  5: {
    seconds: 5,
    minWords: 10,
    maxWords: 13,
    targetWords: 12,
    gestureIntensity: 'low',
    actionDescription: 'saludo breve con mano, 1-2 gestos simples, expresión amigable'
  },
  10: {
    seconds: 10,
    minWords: 22,
    maxWords: 25,
    targetWords: 24,
    gestureIntensity: 'medium',
    actionDescription: 'saludo inicial, gesticula 3-4 veces durante explicación, gestos variados con ambas manos'
  },
  15: {
    seconds: 15,
    minWords: 35,
    maxWords: 38,
    targetWords: 37,
    gestureIntensity: 'high',
    actionDescription: 'saludo expresivo, gesticula activamente 5-6 veces, combina gestos abiertos y cerrados, señala puntos clave, finaliza con gesto de conclusión'
  }
};

/**
 * Calcula la duración apropiada basada en un texto
 */
export function calculateDuration(text: string): VideoDuration {
  const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;

  if (wordCount <= DURATION_CONFIGS[5].maxWords) {
    return 5;
  } else if (wordCount <= DURATION_CONFIGS[10].maxWords) {
    return 10;
  } else {
    return 15;
  }
}

/**
 * Valida si un texto cumple con los límites de una duración
 */
export function validateTextForDuration(text: string, duration: VideoDuration): {
  valid: boolean;
  wordCount: number;
  expectedRange: string;
  suggestion?: string;
} {
  const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;
  const config = DURATION_CONFIGS[duration];

  const valid = wordCount >= config.minWords && wordCount <= config.maxWords;

  let suggestion: string | undefined;
  if (!valid) {
    if (wordCount < config.minWords) {
      suggestion = `Agregar ${config.minWords - wordCount} palabras más`;
    } else {
      suggestion = `Reducir ${wordCount - config.maxWords} palabras`;
    }
  }

  return {
    valid,
    wordCount,
    expectedRange: `${config.minWords}-${config.maxWords} palabras`,
    suggestion
  };
}

/**
 * Genera instrucciones de prompt según la duración
 */
export function getPromptInstructionsForDuration(duration: VideoDuration, topic: string): string {
  const config = DURATION_CONFIGS[duration];

  return `VIDEO DE ${duration} SEGUNDOS.
Presentador profesional hablando sobre ${topic}.
ACCIONES: ${config.actionDescription}.
RITMO: ${duration <= 5 ? 'Rápido y conciso' : duration <= 10 ? 'Moderado, explicativo' : 'Detallado, pausado'}.
INTENSIDAD DE GESTOS: ${config.gestureIntensity.toUpperCase()}.`;
}

/**
 * Obtiene la configuración para una duración específica
 */
export function getDurationConfig(duration: VideoDuration): DurationConfig {
  return DURATION_CONFIGS[duration];
}

/**
 * Selecciona la mejor duración basada en el contenido
 */
export function suggestDuration(content: string, preferShort: boolean = false): VideoDuration {
  const wordCount = content.split(/\s+/).filter(w => w.length > 0).length;

  // Si prefiere corto y cabe en 5s
  if (preferShort && wordCount <= DURATION_CONFIGS[5].maxWords) {
    return 5;
  }

  // Ajustar a la duración más cercana
  if (wordCount <= DURATION_CONFIGS[5].maxWords) {
    return 5;
  } else if (wordCount <= DURATION_CONFIGS[10].maxWords) {
    return 10;
  } else if (wordCount <= DURATION_CONFIGS[15].maxWords) {
    return 15;
  } else {
    // Si excede 15s, sugerir 15s de todos modos (el usuario tendrá que reducir)
    return 15;
  }
}

/**
 * Formatea un texto para que se ajuste a una duración objetivo
 * (Solo estimación, no modifica el texto real)
 */
export function getWordBudget(duration: VideoDuration): {
  min: number;
  max: number;
  target: number;
  example: string;
} {
  const config = DURATION_CONFIGS[duration];

  const examples = {
    5: 'Hola, descubre cómo el marketing digital transforma tu negocio hoy',
    10: 'Hola, hoy te enseño las 3 claves esenciales del marketing digital que cambiarán tu estrategia de redes sociales',
    15: 'Hola, bienvenido. Hoy exploramos las estrategias más efectivas de marketing digital que revolucionan Instagram y cómo aplicarlas en tu negocio desde hoy'
  };

  return {
    min: config.minWords,
    max: config.maxWords,
    target: config.targetWords,
    example: examples[duration]
  };
}
