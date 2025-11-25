/**
 * Configuración de documentos a enviar según keyword detectado
 *
 * Aquí defines qué documento enviar cuando alguien comenta con una palabra clave
 */

export interface DocumentConfig {
  keyword: string;
  message: string;
  documentUrl?: string;
  documentType: 'guide' | 'course' | 'info' | 'tool';
}

/**
 * IMPORTANTE: Reemplaza las URLs con tus documentos reales
 * Puedes usar:
 * - Google Drive (archivo público)
 * - Dropbox (link público)
 * - Tu propio servidor
 * - GitHub Pages
 */
export const DOCUMENT_MAPPINGS: DocumentConfig[] = [
  {
    keyword: 'INFO',
    message: `¡Hola! 👋

Gracias por tu interés. Aquí tienes la información que solicitaste sobre nuestra academia.

Aprenderás a:
✅ Usar herramientas de IA para automatizar tu negocio
✅ Crear contenido que vende
✅ Generar ingresos con marketing digital

¿Tienes alguna pregunta? ¡Escríbeme!`,
    documentUrl: 'https://vgv1421.github.io/instagram-dashboard-/INFO.pdf',
    documentType: 'info'
  },
  {
    keyword: 'IA',
    message: `🤖 ¡Guía de Herramientas IA!

Aquí tienes acceso a las mejores herramientas de IA gratuitas que uso en mi negocio.

Incluye:
• ChatGPT y prompts avanzados
• Generadores de imágenes IA
• Automatizaciones con IA
• Herramientas de video con IA

¡Disfruta! 🚀`,
    documentUrl: 'https://vgv1421.github.io/instagram-dashboard-/HERRAMIENTAS-IA.pdf',
    documentType: 'guide'
  },
  {
    keyword: 'MARKETING',
    message: `📈 Guía de Marketing Digital

¡Perfecto! Te envío mi guía completa de marketing digital.

Aprenderás:
✅ Cómo crear contenido viral
✅ Estrategias de engagement
✅ Automatización de ventas
✅ Embudos de conversión

¡Nos vemos dentro! 💪`,
    documentUrl: 'https://vgv1421.github.io/instagram-dashboard-/MARKETING-DIGITAL.pdf',
    documentType: 'guide'
  },
  {
    keyword: 'GUIA',
    message: `📚 Tu Guía está lista

¡Hola! Aquí tienes la guía completa para empezar tu negocio digital desde cero.

Incluye:
• Plan de acción paso a paso
• Herramientas gratuitas
• Plantillas listas para usar
• Casos de éxito reales

¡A por ello! 🎯`,
    documentUrl: 'https://vgv1421.github.io/instagram-dashboard-/GUIA-COMPLETA.pdf',
    documentType: 'guide'
  },
  {
    keyword: 'CURSO',
    message: `🎓 Información del Curso

¡Gracias por tu interés en el curso!

Aquí encontrarás:
✅ Temario completo
✅ Duración y formato
✅ Inversión y bonos
✅ Testimonios de alumnos

¿Listo para transformar tu negocio? 🚀

Sígueme en Instagram para más contenido gratuito: @digitalmindmillonaria`,
    documentUrl: 'https://vgv1421.github.io/instagram-dashboard-/INFO-CURSO.pdf',
    documentType: 'course'
  }
];

/**
 * Busca la configuración del documento para un keyword específico
 */
export function getDocumentConfig(text: string): DocumentConfig | null {
  const upperText = text.toUpperCase();

  // Buscar coincidencia exacta primero
  let config = DOCUMENT_MAPPINGS.find(config =>
    upperText.includes(config.keyword)
  );

  // Si no hay coincidencia, devolver null
  return config || null;
}

/**
 * Obtiene todos los keywords configurados
 */
export function getAllKeywords(): string[] {
  return DOCUMENT_MAPPINGS.map(config => config.keyword);
}
