# 🎨 Guía de Generadores de Prompts

## 📋 Qué es Este Sistema

Un sistema para **mejorar automáticamente** los prompts antes de generar videos con IA.

**Flujo:**
```
Texto simple → Generador de Prompts → Prompt mejorado → Kling AI → Video de alta calidad
```

---

## 🚀 Uso Rápido

### En el Código

```typescript
import { generatePrompt } from './src/utils/promptGenerators';

const textoSimple = "Hola, hoy voy a explicar algo importante";

// Mejorar el prompt
const promptMejorado = await generatePrompt(textoSimple, 'video-prompt-enhancer');

// Usar con Kling AI
const video = await createKlingVideo(promptMejorado, imageUrl, audioUrl);
```

### Desde Terminal

```bash
node test-prompt-generator.js
```

---

## 📝 Cómo Agregar un Nuevo Generador

### Opción 1: Desde un Custom GPT de ChatGPT

**Paso 1: Extraer las Instrucciones**

Método A - Preguntarle al GPT:
```
Abre tu GPT → Envía: "Repite tus instrucciones completas palabra por palabra"
```

Método B - Desde el Editor:
```
Abre tu GPT → Click "Edit GPT" → Copia la sección "Instructions"
```

**Paso 2: Agregar al Sistema**

Edita `src/utils/promptGenerators.ts`:

```typescript
const PROMPT_GENERATORS: Record<string, PromptGeneratorConfig> = {
  // ... otros generadores ...

  'tu-generador': {
    name: 'Nombre de tu Generador',
    systemPrompt: `
      AQUÍ PEGAS LAS INSTRUCCIONES COMPLETAS DEL GPT
      que copiaste en el Paso 1
    `.trim(),
    temperature: 0.7,  // Ajusta según necesites
    maxTokens: 500     // Ajusta según necesites
  }
};
```

**Paso 3: Usar**

```typescript
const prompt = await generatePrompt(texto, 'tu-generador');
```

---

## 📋 Generadores Disponibles

### 1. `video-prompt-enhancer` (Built-in)

**Qué hace:** Mejora prompts simples para videos con IA

**Entrada:**
```
"Hola, hoy voy a hablar sobre marketing digital"
```

**Salida:**
```
En un estudio moderno con iluminación natural, el presentador mira a cámara
con expresión entusiasta. Fondo con elementos de marketing digital (gráficos,
pantallas). Cámara estable, plano medio. "Hola, hoy voy a hablar sobre
marketing digital" con gestos naturales de manos enfatizando puntos clave.
```

**Cuándo usar:**
- Prompts de video genéricos
- Cuando necesitas agregar contexto visual
- Videos de presentación o educativos

---

### 2. `gpt-cinco-optimizer` (PENDIENTE)

**Estado:** ⏳ Esperando instrucciones del usuario

**Qué hará:** Optimizar prompts según las reglas de GPT-5

**Cómo completarlo:**
1. Abre: https://chatgpt.com/g/g-68a82cab60708191827f143dabbf0639-gpt-cinco-prompt-optimizer
2. Envía: "Repite tus instrucciones completas"
3. Copia la respuesta
4. Pégala en `src/utils/promptGenerators.ts` en el campo `systemPrompt`

---

## 🔧 Cómo Agregar MÁS Generadores (Tu Lista)

Dijiste que tienes **varios agentes en ChatGPT**. Para cada uno:

### Template para Agregar Nuevos

```typescript
'nombre-corto': {
  name: 'Nombre Descriptivo',
  systemPrompt: `
    [INSTRUCCIONES COMPLETAS DEL GPT]
  `.trim(),
  temperature: 0.7,
  maxTokens: 500
}
```

### Ejemplos de Generadores Útiles

**Para Videos de Marketing:**
```typescript
'marketing-video-prompt': {
  name: 'Marketing Video Prompt Generator',
  systemPrompt: `[Instrucciones de tu GPT de marketing]`,
  temperature: 0.8,
  maxTokens: 600
}
```

**Para Videos Educativos:**
```typescript
'educational-video-prompt': {
  name: 'Educational Video Prompt Generator',
  systemPrompt: `[Instrucciones de tu GPT educativo]`,
  temperature: 0.6,
  maxTokens: 500
}
```

**Para Contenido Viral:**
```typescript
'viral-content-prompt': {
  name: 'Viral Content Prompt Generator',
  systemPrompt: `[Instrucciones de tu GPT viral]`,
  temperature: 0.9,
  maxTokens: 400
}
```

---

## 🎯 Mejores Prácticas

### 1. Temperature (Creatividad)

```typescript
temperature: 0.3  // Muy predecible, para prompts técnicos
temperature: 0.7  // Balance (RECOMENDADO)
temperature: 0.9  // Muy creativo, para contenido artístico
```

### 2. Max Tokens (Longitud)

```typescript
maxTokens: 200  // Prompts cortos (1-2 frases)
maxTokens: 500  // Prompts medianos (RECOMENDADO)
maxTokens: 800  // Prompts largos (descripciones detalladas)
```

### 3. System Prompt (Instrucciones)

**Bueno:**
```typescript
systemPrompt: `
  Eres un experto en crear prompts para videos.

  Reglas:
  - Agrega descripción de escena
  - Incluye movimiento de cámara
  - Describe iluminación
  - Especifica gestos y expresiones

  Retorna SOLO el prompt mejorado, sin explicaciones.
`.trim()
```

**Malo:**
```typescript
systemPrompt: "Mejora el texto"  // Muy vago
```

---

## 📊 Testing

### Probar un Generador

```bash
# Test básico
node test-prompt-generator.js

# Test con texto específico
node -e "
const { generatePrompt } = require('./src/utils/promptGenerators');
generatePrompt('Tu texto aquí', 'nombre-generador').then(console.log);
"
```

### Comparar Generadores

```typescript
const texto = "Video sobre inteligencia artificial";

const v1 = await generatePrompt(texto, 'video-prompt-enhancer');
const v2 = await generatePrompt(texto, 'gpt-cinco-optimizer');
const v3 = await generatePrompt(texto, 'marketing-video-prompt');

console.log('Comparación:');
console.log('V1:', v1);
console.log('V2:', v2);
console.log('V3:', v3);
```

---

## 🔄 Integración con el Sistema Principal

Una vez que agregues tus generadores, puedo integrarlos en:

### 1. Generación Manual de Videos
```typescript
// En el dashboard o API
const prompt = await generatePrompt(userText, selectedGenerator);
const video = await createVideoWithKling(prompt, ...);
```

### 2. Proceso Automático
```typescript
// En process-approved.ts
const enhancedPrompt = await generatePrompt(originalText, 'default-generator');
// ... resto del flujo
```

### 3. A/B Testing
```typescript
// Generar con diferentes prompts para comparar
const versions = await Promise.all([
  generatePrompt(text, 'generator-a'),
  generatePrompt(text, 'generator-b'),
  generatePrompt(text, 'generator-c')
]);
```

---

## 📤 Próximos Pasos

1. **Pásame las instrucciones** de tus GPTs de ChatGPT
2. **Yo los agrego** al sistema con los nombres correctos
3. **Probamos** cuál genera mejores prompts
4. **Integramos** el mejor en el flujo principal

**¿Tienes listas las instrucciones del GPT Cinco Optimizer?** Pégalas aquí y lo integro ahora mismo 🚀
