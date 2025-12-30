# 🎬 Sistema de Duraciones de Video - 5, 10 o 15 Segundos

## 📊 Configuración de Duraciones

| Duración | Palabras | Gestos | Uso Recomendado |
|----------|----------|--------|-----------------|
| **5s** | 10-13 palabras | 1-2 gestos simples | Frases impactantes, hooks, calls-to-action |
| **10s** | 22-25 palabras | 3-4 gestos variados | Consejos rápidos, tips, estadísticas |
| **15s** | 35-38 palabras | 5-6 gestos activos | Explicaciones breves, mini-tutoriales |

---

## 🔄 Flujo Completo del Sistema

### 1️⃣ **Generación de Contenido** (API: `/api/automation/generate-proposals-v2`)

```javascript
// Al generar contenido, primero se decide la duración
{
  "caption": "Texto de 12 palabras...",  // Generado según duración
  "video_duration": 5,  // ← CAMPO NUEVO
  "type": "reel",
  "topic": "marketing digital"
}
```

**Lógica:**
- El sistema cuenta palabras del caption
- Asigna automáticamente: 5, 10 o 15 segundos
- O se puede especificar manualmente la duración deseada

---

### 2️⃣ **Generación de Audio** (ElevenLabs)

```javascript
// El audio se genera con el caption
// Duración real ≈ palabras / 2.5

Ejemplo:
- 12 palabras → ~5 segundos de audio
- 24 palabras → ~10 segundos de audio
- 37 palabras → ~15 segundos de audio
```

**El sistema valida:**
```javascript
if (wordCount > maxWordsForDuration) {
  throw new Error('Caption demasiado largo para duración objetivo');
}
```

---

### 3️⃣ **Generación de Prompt** (OpenAI)

El prompt se genera **específicamente para la duración**:

#### Ejemplo 5 segundos:
```
VIDEO DE 5 SEGUNDOS.
Presentador profesional hablando sobre marketing digital.
ACCIONES: saludo breve con mano, 1-2 gestos simples, expresión amigable.
RITMO: Rápido y conciso.
INTENSIDAD DE GESTOS: LOW.
```

#### Ejemplo 10 segundos:
```
VIDEO DE 10 SEGUNDOS.
Presentador profesional hablando sobre marketing digital.
ACCIONES: saludo inicial, gesticula 3-4 veces durante explicación,
gestos variados con ambas manos.
RITMO: Moderado, explicativo.
INTENSIDAD DE GESTOS: MEDIUM.
```

#### Ejemplo 15 segundos:
```
VIDEO DE 15 SEGUNDOS.
Presentador profesional hablando sobre marketing digital.
ACCIONES: saludo expresivo, gesticula activamente 5-6 veces,
combina gestos abiertos y cerrados, señala puntos clave,
finaliza con gesto de conclusión.
RITMO: Detallado, pausado.
INTENSIDAD DE GESTOS: HIGH.
```

---

### 4️⃣ **Generación de Video** (Kling Avatar)

Kling recibe:
- **Foto** (del Drive)
- **Audio** (duración real del MP3)
- **Prompt** (optimizado para esa duración)

El video resultante:
- ✅ Duración = duración del audio
- ✅ Gestos apropiados para esa duración
- ✅ Sincronización labial perfecta

---

## 💰 Costos por Duración

| Duración | Créditos Kie.ai | Costo USD |
|----------|-----------------|-----------|
| **5s** | ~18 créditos | ~$0.09 |
| **10s** | ~37 créditos | ~$0.19 |
| **15s** | **55 créditos** | **$0.28** |

**Nota:** Los costos son aproximados según Kie.ai

---

## 🔧 Modificaciones en el Código

### 1. Nueva tabla en Supabase:

```sql
ALTER TABLE posts
ADD COLUMN video_duration INTEGER
CHECK (video_duration IN (5, 10, 15))
DEFAULT 10;
```

### 2. Generador de contenido actualizado:

```typescript
// Al generar propuestas
const wordCount = generateCaption(); // Genera según duración
const duration = calculateDuration(wordCount); // 5, 10 o 15

await supabase.from('posts').insert({
  caption: wordCount,
  video_duration: duration, // ← NUEVO
  // ... otros campos
});
```

### 3. Generador de prompts actualizado:

```typescript
const promptOptimizado = await generatePrompt(
  caption,
  'video-prompt-ai-generator',
  videoDuration // ← NUEVO parámetro
);
```

---

## 📝 Ejemplos Reales

### Video de 5 segundos:
**Caption:**
"Descubre el secreto del marketing digital que multiplica ventas rápidamente"
**(12 palabras → 5s)**

**Audio:** 5 segundos
**Gestos:** Saludo + gesto de "secreto" + expresión entusiasta
**Prompt generado:** "...1-2 gestos simples, ritmo rápido..."

---

### Video de 10 segundos:
**Caption:**
"Hoy comparto las 3 claves fundamentales del marketing en redes sociales que revolucionarán tu estrategia de contenido"
**(18 palabras → 10s ajustado)**

**Audio:** 10 segundos
**Gestos:** Saludo + cuenta con dedos (3 claves) + gestos enfáticos
**Prompt generado:** "...gesticula 3-4 veces, gestos variados..."

---

### Video de 15 segundos:
**Caption:**
"Hola, bienvenido. En este video exploramos las técnicas más efectivas de engagement en Instagram que los expertos utilizan para aumentar alcance orgánico y construir comunidad leal"
**(28 palabras → 15s ajustado)**

**Audio:** 15 segundos
**Gestos:** Saludo expresivo + gestos explicativos variados + señala + conclusión
**Prompt generado:** "...gesticula activamente 5-6 veces, gestos abiertos y cerrados..."

---

## 🎯 Estrategia de Contenido

### Cuándo usar cada duración:

**5 segundos:**
- Hooks iniciales
- Frases impactantes
- Calls-to-action finales
- Estadísticas sorprendentes
- Preguntas potentes

**10 segundos:**
- Tips rápidos
- Consejos concisos
- Mini-explicaciones
- Comparaciones
- Beneficios clave

**15 segundos:**
- Mini-tutoriales
- Explicaciones detalladas
- Storytelling breve
- Casos de uso
- Demostraciones

---

## ✅ Validación Automática

El sistema valida:

```typescript
// Ejemplo de validación
const validation = validateTextForDuration(caption, 10);

if (!validation.valid) {
  console.warn(`⚠️ Caption tiene ${validation.wordCount} palabras`);
  console.warn(`   Esperado: ${validation.expectedRange}`);
  console.warn(`   Sugerencia: ${validation.suggestion}`);
}

// Output:
// ⚠️ Caption tiene 30 palabras
//    Esperado: 22-25 palabras
//    Sugerencia: Reducir 5 palabras
```

---

## 🔄 Flujo en n8n

```
1. Generar Propuestas
   └─> Define duración (5, 10 o 15s)
   └─> Genera caption con palabras exactas
   └─> Guarda en Supabase con video_duration

2. Get Posts Aprobados
   └─> Lee video_duration de cada post

3. Generar Audio (ElevenLabs)
   └─> Usa caption completo
   └─> Duración automática según palabras

4. Generar Prompt (OpenAI)
   └─> Recibe video_duration
   └─> Genera instrucciones específicas

5. Generar Video (Kling)
   └─> Sincroniza todo
   └─> Video final con duración correcta
```

---

## 📊 Métricas y Analytics

Podrás analizar:
- Engagement por duración (5s vs 10s vs 15s)
- Qué duración funciona mejor para tu audiencia
- Costos por duración
- Retención por duración

---

## 🚀 Implementación

### Paso 1: Ejecutar migración de Supabase
```sql
-- Ejecutar: supabase/migrations/20250129_add_video_duration.sql
```

### Paso 2: El sistema ya está listo
Todo el código está preparado para usar duraciones.

### Paso 3: Generar contenido
Al crear posts, el sistema automáticamente:
- ✅ Asigna duración apropiada
- ✅ Genera caption con palabras correctas
- ✅ Crea prompts específicos
- ✅ Produce videos optimizados

---

## 💡 Ventajas del Sistema

✅ **Control total** sobre duración
✅ **Costos predecibles** (sabes cuánto cuesta cada video)
✅ **Gestos apropiados** (no too much ni too poco)
✅ **Contenido optimizado** (caption ajustado a duración)
✅ **A/B testing** fácil (comparar 5s vs 10s vs 15s)
✅ **Escalable** (generar lotes con duraciones mixtas)

---

**Estado:** ✅ Sistema completo implementado
**Archivos creados:**
- `src/utils/videoDuration.ts`
- `supabase/migrations/20250129_add_video_duration.sql`
- `src/utils/promptGenerators.ts` (actualizado)

**Próximo paso:** Modificar workflow de n8n para usar duraciones
