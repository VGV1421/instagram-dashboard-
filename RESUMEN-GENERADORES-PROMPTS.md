# 🎨 Sistema Completo de Generadores de Prompts

## ✅ Generadores Integrados

### 1. **GPT-CINCO Optimizer** (Optimización Avanzada)
- **ID:** `gpt-cinco-optimizer`
- **Uso:** Optimización profesional de cualquier tipo de prompt
- **Salida:** Estructura XML con validación, checklist, restricciones
- **Cuándo usar:** Prompts complejos que necesitan estructura profesional

**Ejemplo:**
```javascript
const prompt = await generatePrompt(
  "Crea un video sobre IA",
  'gpt-cinco-optimizer'
);
```

---

### 2. **Generador de Prompts para Video AI** (RECOMENDADO para Kling) ⭐
- **ID:** `video-prompt-ai-generator`
- **Uso:** Prompts optimizados para Kling AI, Google Veo 3, Runway
- **Salida:** Prompt estructurado con estilo, escena, cámara, iluminación
- **Cuándo usar:** **SIEMPRE** para generar videos con Kling AI

**Características:**
- ✅ Optimizado específicamente para Kling AI Avatar
- ✅ Incluye gestos de manos (CRÍTICO)
- ✅ Movimientos de cámara específicos
- ✅ Iluminación profesional
- ✅ Formato vertical/horizontal

**Ejemplo de salida:**
```
[ESTILO VISUAL]: Video profesional cinematográfico
[ESCENA]: Oficina moderna con luz natural
[ACCIÓN]: Presentador gesticula con manos, expresión entusiasta
[CÁMARA]: Plano medio, paneo suave
[ILUMINACIÓN]: Golden hour, luz natural
[DETALLES]: Gestos naturales de manos, expresión confiada
[FORMATO]: Vertical (9:16)
```

---

### 3. **Diseñador de Prompts para Fotos** (Para Avatares) 📸
- **ID:** `photo-prompt-designer`
- **Uso:** Generar fotos ultra-realistas de avatares
- **Salida:** Prompt en INGLÉS optimizado para Flux, Mystic, Midjourney
- **Cuándo usar:** Para crear las fotos de avatares que luego usas en Kling AI

**Características:**
- ✅ Prompts en INGLÉS (requerido por IAs de imagen)
- ✅ Textura de piel ultra-realista
- ✅ Datos técnicos de cámara (85mm f/1.4, ISO 200)
- ✅ Sin blur ni bokeh (más natural)
- ✅ Poros visibles, microimperfecciones

**Ejemplo de salida:**
```
"soft studio light, modern office setting, female professional in her 30s,
wearing navy blue blouse, natural makeup, gesturing with hands, looking
directly at camera, 85mm f/1.4 lens, ISO 200, natural skin texture with
visible pores, matte finish, ultra realistic, 35mm photography"
```

---

### 4. **Video Prompt Enhancer** (Simple)
- **ID:** `video-prompt-enhancer`
- **Uso:** Mejorador rápido y simple de prompts de video
- **Salida:** Prompt mejorado en español, conciso
- **Cuándo usar:** Mejoras rápidas sin tanta complejidad

---

## 🔄 Flujo de Trabajo Completo

### **Opción A: Flujo para Videos con Avatar Existente**

```
1. Texto simple del usuario
   ↓
2. Generador de Prompts para Video AI
   ↓
3. Prompt optimizado para Kling AI
   ↓
4. Kling AI Avatar 2.0 (con foto de Drive)
   ↓
5. Video con gestos naturales
```

**Código:**
```javascript
// Paso 1: Optimizar el prompt del video
const videoPrompt = await generatePrompt(
  "Hola, hoy hablaré sobre marketing digital",
  'video-prompt-ai-generator'
);

// Paso 2: Generar video con Kling AI
const video = await createKlingVideo(
  photoUrl,      // Foto del Drive
  audioUrl,      // Audio del Drive
  videoPrompt    // Prompt optimizado
);
```

---

### **Opción B: Flujo Completo con Generación de Avatar**

```
1. Descripción del avatar deseado
   ↓
2. Diseñador de Prompts para Fotos
   ↓
3. Prompt en inglés para Flux/Midjourney
   ↓
4. Generar foto con IA de imágenes
   ↓
5. Subir foto a Google Drive
   ↓
6. Texto del video
   ↓
7. Generador de Prompts para Video AI
   ↓
8. Kling AI Avatar 2.0
   ↓
9. Video con avatar personalizado
```

**Código completo:**
```javascript
// PASO 1: Generar prompt para la foto del avatar
const photoPrompt = await generatePrompt(
  "Mujer profesional de 30 años, estilo corporativo",
  'photo-prompt-designer'
);

console.log('Usa este prompt en Flux/Midjourney:');
console.log(photoPrompt);

// PASO 2: Usuario genera foto con Flux/Midjourney
// PASO 3: Usuario sube foto a Google Drive y obtiene URL

// PASO 4: Generar prompt para el video
const videoPrompt = await generatePrompt(
  "Hola, hoy hablaré sobre estrategias de marketing",
  'video-prompt-ai-generator'
);

// PASO 5: Generar video con Kling AI
const video = await createKlingVideo(
  photoUrlFromDrive,  // Foto generada y subida
  audioUrl,
  videoPrompt         // Prompt optimizado
);
```

---

## 📊 Comparación de Generadores

| Generador | Salida | Idioma | Mejor Para |
|-----------|--------|--------|------------|
| **GPT-CINCO** | XML estructurado | Español | Prompts complejos profesionales |
| **Video AI** ⭐ | Prompt multi-campo | Español | **Videos con Kling AI** |
| **Photo Designer** | Prompt técnico | **Inglés** | Fotos de avatares ultra-realistas |
| **Video Enhancer** | Prompt simple | Español | Mejoras rápidas |

---

## 🚀 Uso Rápido

### Lista todos los generadores disponibles:
```javascript
import { listPromptGenerators } from './src/utils/promptGenerators';

console.log(listPromptGenerators());
// ['gpt-cinco-optimizer', 'video-prompt-ai-generator', 'photo-prompt-designer', 'video-prompt-enhancer']
```

### Usa un generador específico:
```javascript
import { generatePrompt } from './src/utils/promptGenerators';

const prompt = await generatePrompt(
  "Tu texto aquí",
  'video-prompt-ai-generator'  // o cualquier otro generador
);
```

---

## 🎯 Recomendaciones

### Para Videos de Instagram/TikTok:
```javascript
const prompt = await generatePrompt(
  textoDelVideo,
  'video-prompt-ai-generator'  // ⭐ MEJOR opción
);
```

### Para Fotos de Avatares:
```javascript
const prompt = await generatePrompt(
  descripcionDelAvatar,
  'photo-prompt-designer'  // Genera en inglés
);
```

### Para Optimización Avanzada:
```javascript
const prompt = await generatePrompt(
  promptComplejo,
  'gpt-cinco-optimizer'  // Estructura XML profesional
);
```

---

## 📝 Scripts de Prueba Disponibles

- `node test-gpt-cinco.js` - Prueba el GPT-CINCO Optimizer
- `node test-video-prompt-generator.js` - Prueba el generador de video
- `node test-photo-prompt-generator.js` - Prueba el generador de fotos
- `node test-prompt-generator.js` - Prueba todos los generadores

---

## 🔧 Agregar Más Generadores

Si tienes más GPTs de ChatGPT que quieras agregar:

1. Pídele al GPT que genere un JSON con su configuración
2. Guárdalo en `gpt-configs/nombre-gpt.json`
3. Pégame el JSON y lo integro al sistema

---

## 💡 Próximos Pasos

### 1. Integrar en el Flujo Automático
Conectar los generadores al proceso de aprobación de posts:
```javascript
// En process-approved.ts
const optimizedPrompt = await generatePrompt(
  post.caption,
  'video-prompt-ai-generator'
);

const video = await createKlingVideo(photo, audio, optimizedPrompt);
```

### 2. Dashboard para Pruebas
Crear interfaz para probar diferentes generadores visualmente

### 3. A/B Testing
Comparar resultados entre diferentes generadores para el mismo texto

---

**Estado:** ✅ Sistema completo y funcionando
**Total de generadores:** 4
**Listo para producción:** SÍ
