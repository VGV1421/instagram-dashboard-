# 📊 ANÁLISIS PROFESIONAL: Sistema de Automatización Instagram con Avatar AI

**Fecha:** 29 Diciembre 2025
**Objetivo:** Analizar competidores → Replicar posts con avatar propio → Publicar contenido adaptado

---

## 🔍 1. ANÁLISIS DEL FLUJO ACTUAL

### Flujo Existente: "Instagram - Generación Diaria de Contenido"

```
⏰ Diario 9 AM (Schedule Trigger)
    ↓
📝 Generar Propuestas (POST /api/automation/generate-proposals)
    ├─ count: 3 posts
    ├─ syncFirst: true (analiza competidores primero)
    └─ competitorsToSync: 2
    ↓
✅ ¿Éxito? (IF node)
    ↓
📊 Procesar Resultados (Code node)
    ├─ batchId
    ├─ proposalsCount
    ├─ proposals[]
    └─ emailSent
    ↓
💾 Registrar Éxito (POST /api/n8n/log)
```

### Lo que hace actualmente:
- ✅ Analiza 2 competidores automáticamente
- ✅ Genera 3 propuestas de contenido
- ✅ Guarda en Supabase (tabla `posts`)
- ✅ Envía email con propuestas
- ✅ Log de ejecución
- ❌ **NO genera videos** (solo texto e ideas)
- ❌ **NO replica estilo visual** de competidores

---

## 🌐 2. WORKFLOWS PÚBLICOS SIMILARES ANALIZADOS

### 🏆 Workflow #1: Instagram Reels Automation (HeyGen + Submagic + Blotato)
**URL:** [n8n.io/workflows/8918](https://n8n.io/workflows/8918-create-and-auto-post-instagram-reels-with-ai-clones-script-to-post-heygen-submagic-blotato/)

**Flujo:**
```
Script → HeyGen (Avatar Video) → Submagic (Captions) → Blotato (Auto-post Instagram)
```

**Características:**
- ✅ Automatización completa script-to-post
- ✅ Avatar videos con HeyGen
- ✅ Subtítulos dinámicos con Submagic
- ✅ Auto-posting a Instagram
- ⚠️ **NO analiza competidores** (script manual)

**Tecnologías:**
- HeyGen API (avatar videos)
- Submagic (subtítulos)
- Blotato (publicación Instagram)
- OpenAI GPT-4 (generación de scripts)

---

### 🏆 Workflow #2: Short-Form Video Generator (Kling + Flux + ElevenLabs)
**URL:** [n8n.io/workflows/3121](https://n8n.io/workflows/3121-ai-powered-short-form-video-generator-with-openai-flux-kling-and-elevenlabs/)

**Flujo:**
```
Idea → OpenAI (Script) → Flux (Imágenes) → ElevenLabs (Voz) → Kling (Video)
```

**Características:**
- ✅ Generación de imágenes con Flux AI
- ✅ Voz con ElevenLabs
- ✅ Video con Kling AI
- ⚠️ **NO usa avatares** (solo imágenes + voz)

**Tecnologías:**
- OpenAI GPT-4o (script)
- Flux Pro (generación de imágenes)
- ElevenLabs (TTS)
- Kling AI (video generation)

---

### 🏆 Workflow #3: Instagram Content Discovery & Repurposing (Apify + GPT-4 + Perplexity)
**URL:** [n8n.io/workflows/4658](https://n8n.io/workflows/4658-automate-instagram-content-discovery-and-repurposing-w-apify-gpt-4o-and-perplexity/)

**Flujo:**
```
Apify (Scrape Competitors) → Filter Videos → GPT-4o (Analyze) → Perplexity (Research) → New Script
```

**Características:**
- ✅ **Scraping automático de competidores** con Apify
- ✅ Filtrado inteligente de videos relevantes
- ✅ Análisis profundo con GPT-4O
- ✅ Investigación adicional con Perplexity
- ✅ Prevención de duplicados (base de datos)
- 📈 **Resultado:** 0 → 10,000 followers en 15 días

**Tecnologías:**
- Apify Instagram Scraper (scraping posts competidores)
- GPT-4O (análisis de contenido)
- Perplexity AI (investigación web)
- Database (tracking de contenido procesado)

---

### 🏆 Workflow #4: Multi-Platform Publishing (Veo3 + Blotato)
**URL:** [n8n.io/workflows/5035](https://n8n.io/workflows/5035-generate-and-auto-post-ai-videos-to-social-media-with-veo3-and-blotato/)

**Flujo:**
```
Idea → Veo3 (Video) → Blotato → Multi-platform (TikTok, Instagram, YouTube, LinkedIn, Facebook)
```

**Características:**
- ✅ Publicación simultánea en 5 plataformas
- ✅ Video con Google Veo3
- ✅ Captions optimizadas para SEO
- ✅ Hashtags automáticos

**Tecnologías:**
- Google Veo3 (video generation)
- Blotato (multi-platform posting)

---

### 🏆 Workflow #5: Competitor Analysis Reports (Apify + GPT-4 + Google Docs)
**URL:** [n8n.io/workflows/6580](https://n8n.io/workflows/6580-generate-ai-powered-competitor-analysis-reports-with-gpt-4-apify-and-google-docs/)

**Flujo:**
```
Competitors List → Apify (Scrape) → GPT-4 (SWOT Analysis) → Google Docs (Report)
```

**Características:**
- ✅ Análisis SWOT automático
- ✅ Identifica audiencia de competidores
- ✅ Monitoreo multi-plataforma (LinkedIn, G2, Trustpilot, Crunchbase)
- ✅ Reportes automáticos

**Tecnologías:**
- Apify (scraping multi-plataforma)
- GPT-4 (análisis competitivo)
- Google Docs API (reportes)

---

## 🛠️ 3. TODAS LAS OPCIONES TÉCNICAS DISPONIBLES

### 🔍 ETAPA 1: ANÁLISIS DE COMPETIDORES

#### Opción A: Apify Instagram Scraper (⭐ RECOMENDADO para análisis profundo)
- **Qué hace:** Scraping completo de posts de Instagram (texto, imágenes, videos, engagement)
- **Ventajas:**
  - Extrae TODA la información (caption, hashtags, likes, comments, shares)
  - Puede descargar videos directamente
  - Filtra por fecha, tipo de post, engagement
  - No requiere API oficial de Instagram
- **Desventajas:**
  - Costo: ~$50/mes plan básico
  - Puede ser bloqueado si abusas (límites de scraping)
- **Uso en n8n:** Node de Apify integrado

#### Opción B: Instagram Basic Display API (⚠️ Limitado)
- **Qué hace:** API oficial de Instagram para obtener posts propios y públicos
- **Ventajas:**
  - Oficial (no viola TOS)
  - Gratis (hasta cierto límite)
- **Desventajas:**
  - Solo funciona con cuentas conectadas (no scraping libre)
  - Requiere autenticación OAuth
  - Limitado a 200 requests/hora
- **Uso en n8n:** Node HTTP Request con OAuth2

#### Opción C: Manual Upload (Google Sheets) (✅ Simple pero manual)
- **Qué hace:** Tú subes manualmente links de posts de competidores a Google Sheets
- **Ventajas:**
  - 100% seguro (no scraping)
  - Control total sobre qué replicas
  - Gratis
- **Desventajas:**
  - Requiere trabajo manual diario
- **Uso en n8n:** Google Sheets trigger

#### Opción D: Tu API actual (/api/automation/generate-proposals) (✅ Ya lo tienes)
- **Qué hace:** Tu endpoint ya analiza competidores y genera propuestas
- **Ventajas:**
  - Ya está implementado
  - Integrado con Supabase
- **Desventajas:**
  - No extrae videos de competidores (solo texto)

---

### 🎨 ETAPA 2: GENERACIÓN DE IMÁGENES/FOTOS DE AVATAR

#### Opción A: Fotos existentes de Google Drive (✅ Ya tienes esto)
- **Qué hace:** Usa fotos que ya tienes en "FOTOS AVATAR SIN USAR"
- **Ventajas:**
  - Gratis
  - Control total sobre estilo
  - Ya implementado en tu código
- **Desventajas:**
  - Limitado a fotos que ya tienes
  - Necesitas fotografías profesionales

#### Opción B: Generar fotos con AI (Flux, Midjourney, Stable Diffusion)
- **Qué hace:** Genera nuevas fotos de tu avatar con diferentes poses/fondos
- **Ventajas:**
  - Infinitas variaciones
  - Consistencia visual (mismo avatar, diferentes contextos)
  - Puedes replicar estilo visual de competidores
- **Desventajas:**
  - Costo adicional
  - Requiere prompts optimizados
- **Herramientas:**
  - **Flux Pro** (~$0.055/imagen) - Alta calidad, realista
  - **Midjourney** ($10/mes) - Artístico, estilizado
  - **Stable Diffusion** (Gratis self-hosted) - Open source
- **Uso en n8n:** HTTP Request a APIs de estas herramientas

#### Opción C: Clonar foto de competidor y cambiar cara (Face Swap)
- **Qué hace:** Toma la foto del competidor y cambia la cara por la tuya
- **Ventajas:**
  - Replica EXACTAMENTE el estilo visual del competidor
  - Mismo fondo, iluminación, pose
- **Desventajas:**
  - Puede ser detectado como fake
  - Problemas éticos/legales si es muy obvio
- **Herramientas:**
  - **Akool Face Swap API** (~$0.02/swap)
  - **DeepFaceLab** (Self-hosted, gratis)
- **Uso en n8n:** HTTP Request a API de face swap

---

### 🎤 ETAPA 3: GENERACIÓN DE VOZ (OBLIGATORIO: ElevenLabs)

#### ✅ ElevenLabs (TU ELECCIÓN)
- **Voice ID:** 3ekAN4FjFTd3LsBs8txD (tu voz clonada)
- **Plan actual:** Free Tier (10,000 caracteres/mes)
- **Problema actual:** Bloqueado desde tu IP (usar n8n para evitarlo)
- **Costo plan pago:** $5/mes (30,000 caracteres) o $22/mes (100,000 caracteres)
- **Ventajas:**
  - Voz ultra-realista (mejor del mercado)
  - Tu voz ya clonada
  - Control de stability, style, speed
- **Desventajas:**
  - Free tier muy limitado (10k caracteres = ~5 videos)
- **Uso en n8n:** HTTP Request a ElevenLabs API (desde servidor n8n)

---

### 🎬 ETAPA 4: GENERACIÓN DE VIDEO CON AVATAR

#### Opción A: Kling Avatar 2.0 via Kie.ai (✅ Tu elección actual)
- **Qué hace:** Crea video con lip-sync y gestos naturales
- **Costo:** 55 créditos = ~$0.28 por video (10 segundos)
- **Ventajas:**
  - Gestos muy naturales
  - Movimiento de manos controlable con prompts
  - Duraciones flexibles (5, 10, 15 segundos)
- **Desventajas:**
  - Requiere créditos en Kie.ai
  - Límite mensual (según plan)
- **Uso en n8n:** HTTP Request a Kie.ai API

#### Opción B: HeyGen Avatar (⭐ Más usado profesionalmente)
- **Qué hace:** Crea video con avatar hablando
- **Costo:**
  - Free: 1 min/mes (con watermark)
  - Creator: $24/mes (15 min/mes)
  - Business: $72/mes (90 min/mes)
- **Ventajas:**
  - Integración con ElevenLabs nativa
  - Muy usado en workflows profesionales
  - Subtítulos integrados opcionales
  - Más de 100 avatares pre-hechos (o custom)
- **Desventajas:**
  - Más caro que Kling
  - Watermark en free tier
- **Uso en n8n:** HeyGen node integrado o HTTP Request

#### Opción C: D-ID (Avatar videos realistas)
- **Qué hace:** Avatar videos con lip-sync
- **Costo:** $5.9/mes (20 videos) o $49/mes (300 videos)
- **Ventajas:**
  - Muy económico
  - API simple
- **Desventajas:**
  - Gestos menos naturales que Kling/HeyGen
- **Uso en n8n:** HTTP Request a D-ID API

#### Opción D: Runway Gen-3 Alpha Turbo (Video generativo, no avatar)
- **Qué hace:** Genera video desde texto (NO avatar hablando)
- **Costo:** ~$0.05/segundo
- **Ventajas:**
  - Videos cinematográficos de alta calidad
- **Desventajas:**
  - NO es avatar hablando (es video generado desde cero)
- **Uso en n8n:** HTTP Request a Runway API

#### Opción E: Google Veo 3 Fast (Nuevo, 2025)
- **Qué hace:** Genera videos cortos desde texto
- **Costo:** Aún en beta (probablemente ~$0.02/segundo cuando lance)
- **Ventajas:**
  - Calidad cinematográfica
  - Rápido (Fast variant)
- **Desventajas:**
  - NO es avatar hablando (video desde texto)
- **Uso en n8n:** HTTP Request (cuando esté disponible)

---

### ✨ ETAPA 5: POST-PROCESADO DE VIDEO (Opcional)

#### Opción A: Submagic (Subtítulos estilo TikTok)
- **Qué hace:** Agrega subtítulos animados palabra por palabra
- **Costo:** $20/mes (120 videos)
- **Ventajas:**
  - Subtítulos profesionales estilo viral
  - Emojis automáticos
  - Highlights de palabras clave
- **Desventajas:**
  - Costo adicional
- **Uso en n8n:** HTTP Request a Submagic API

#### Opción B: Shotstack (Edición automática)
- **Qué hace:** Agrega zooms, transiciones, subtítulos
- **Costo:** $29/mes (20 renders)
- **Ventajas:**
  - Control total sobre edición
  - Zooms dinámicos
  - Subtítulos personalizables
- **Desventajas:**
  - Más complejo de configurar
- **Uso en n8n:** HTTP Request a Shotstack API (ya lo tienes en código)

#### Opción C: Sin post-procesado (✅ Simple)
- **Qué hace:** Usa video tal como sale de Kling/HeyGen
- **Ventajas:**
  - Más rápido
  - Sin costos adicionales
- **Desventajas:**
  - Menos engagement (subtítulos ayudan mucho)

---

### 📤 ETAPA 6: PUBLICACIÓN EN INSTAGRAM

#### Opción A: Blotato (⭐ Más usado en workflows profesionales)
- **Qué hace:** Auto-posting a Instagram Reels + TikTok + YouTube Shorts
- **Costo:** $29/mes (ilimitado)
- **Ventajas:**
  - Multi-platform en 1 API
  - Scheduling automático
  - Analytics incluidos
  - Caption optimization con AI
- **Desventajas:**
  - Costo mensual
- **Uso en n8n:** HTTP Request a Blotato API

#### Opción B: Instagram Graph API (Oficial)
- **Qué hace:** Publica reels directamente con API oficial
- **Ventajas:**
  - Oficial (no viola TOS)
  - Gratis
- **Desventajas:**
  - Requiere Meta Business Account
  - OAuth complejo
  - Solo Instagram (no multi-platform)
- **Uso en n8n:** HTTP Request con OAuth2

#### Opción C: Manual (Supabase → Email → Publicas tú)
- **Qué hace:** El workflow genera el video y te lo envía por email
- **Ventajas:**
  - Control total sobre cuándo publicas
  - Puedes revisar antes de publicar
  - Gratis
- **Desventajas:**
  - No es totalmente automático
- **Uso en n8n:** Email node (ya lo tienes)

#### Opción D: Buffer / Hootsuite (Scheduling manual)
- **Qué hace:** Subes videos manualmente a Buffer/Hootsuite y ellos lo publican
- **Ventajas:**
  - Interfaz visual
  - Scheduling avanzado
- **Desventajas:**
  - Requiere subida manual
  - Costo mensual ($6-15/mes)

---

### 🧠 ETAPA 7: ANÁLISIS DE CONTENIDO DE COMPETIDOR (Estilo visual)

#### Opción A: GPT-4 Vision (Análisis de imagen)
- **Qué hace:** Analiza la imagen del post del competidor y describe estilo visual
- **Ventajas:**
  - Detecta colores, composición, estilo, mood
  - Puede generar prompt para replicar estilo
- **Desventajas:**
  - Costo: ~$0.01 por análisis
- **Uso en n8n:** OpenAI node con GPT-4 Vision

#### Opción B: Claude 3.5 Sonnet (Análisis multimodal)
- **Qué hace:** Analiza imágenes y videos del competidor
- **Ventajas:**
  - Análisis más profundo que GPT-4 Vision
  - Puede analizar videos frame por frame
- **Desventajas:**
  - Costo similar a GPT-4 Vision
- **Uso en n8n:** HTTP Request a Claude API

#### Opción C: Manual (Tú describes el estilo)
- **Qué hace:** Tú miras el post del competidor y escribes un prompt
- **Ventajas:**
  - Gratis
  - Control total
- **Desventajas:**
  - Requiere trabajo manual

---

## 🎯 4. PREGUNTAS ESTRATÉGICAS PARA DISEÑAR EL FLUJO PROFESIONAL

### 🔍 SECCIÓN A: ANÁLISIS DE COMPETIDORES

**A1. ¿Cómo quieres seleccionar qué posts de competidores replicar?**
- [ ] a) Automático (top posts con más engagement del día)
- [ ] b) Manual (tú seleccionas cuáles en Google Sheets)
- [ ] c) Mixto (sistema sugiere, tú apruebas)

**A2. ¿Cuántos competidores quieres analizar?**
- [ ] a) 2 (como ahora)
- [ ] b) 5
- [ ] c) 10+

**A3. ¿Quieres scraping automático de Instagram con Apify o prefieres trabajar con tu API actual?**
- [ ] a) Apify (scraping completo, costo ~$50/mes)
- [ ] b) Tu API actual (solo texto, gratis)
- [ ] c) Manual (Google Sheets, gratis)

**A4. ¿Quieres analizar el ESTILO VISUAL del post del competidor (colores, composición, mood)?**
- [ ] a) Sí (usa GPT-4 Vision para analizar imagen)
- [ ] b) No (solo replica texto)

---

### 🎨 SECCIÓN B: GENERACIÓN DE IMÁGENES/FOTOS

**B1. ¿Prefieres usar fotos existentes de Google Drive o generar nuevas fotos con AI?**
- [ ] a) Solo fotos existentes (ya las tienes)
- [ ] b) Generar nuevas fotos con AI (Flux, Midjourney)
- [ ] c) Mixto (usa existentes, pero genera nuevas si necesitas un estilo específico)

**B2. Si generas fotos con AI, ¿quieres replicar el estilo visual del competidor?**
- [ ] a) Sí (analiza foto del competidor y genera una similar con tu avatar)
- [ ] b) No (usa estilo genérico profesional)

**B3. ¿Consideras usar Face Swap para cambiar cara del competidor por la tuya?**
- [ ] a) Sí (replica EXACTAMENTE el estilo visual)
- [ ] b) No (ético/legal concern)

---

### 🎤 SECCIÓN C: VOZ Y AUDIO

**C1. ElevenLabs: ¿Estás dispuesto a pagar plan de $5/mes o $22/mes?**
- [ ] a) Sí, $5/mes (30k caracteres = ~15 videos/mes)
- [ ] b) Sí, $22/mes (100k caracteres = ~50 videos/mes)
- [ ] c) No, prefiero free tier (10k caracteres = ~5 videos/mes)

**C2. ¿Quieres que la voz replique el TONO del competidor?**
- [ ] a) Sí (analiza audio del competidor y ajusta stability/style)
- [ ] b) No (usa siempre tu tono estándar)

---

### 🎬 SECCIÓN D: GENERACIÓN DE VIDEO

**D1. ¿Prefieres Kling Avatar (actual) o cambiar a HeyGen?**
- [ ] a) Kling Avatar via Kie.ai ($0.28/video)
- [ ] b) HeyGen ($24/mes plan Creator = 15 min/mes)
- [ ] c) D-ID ($5.9/mes = 20 videos)
- [ ] d) Otro: _______________

**D2. ¿Qué duraciones de video quieres generar?**
- [ ] a) Solo 10 segundos (estándar)
- [ ] b) 5, 10, 15 segundos (sistema decide según contenido)
- [ ] c) Duración variable (analiza duración del post del competidor)

**D3. ¿Quieres post-procesado con subtítulos estilo TikTok?**
- [ ] a) Sí, con Submagic ($20/mes)
- [ ] b) Sí, con Shotstack ($29/mes)
- [ ] c) No (video sin subtítulos)

**D4. ¿Quieres zooms/transiciones dinámicas?**
- [ ] a) Sí (usa Shotstack)
- [ ] b) No (video estático del avatar)

---

### 📤 SECCIÓN E: PUBLICACIÓN

**E1. ¿Quieres publicación automática o manual?**
- [ ] a) Automática (Blotato $29/mes)
- [ ] b) Manual (recibes email con video, publicas tú)
- [ ] c) Semi-automática (se guarda en Supabase, tú programas con Buffer/Hootsuite)

**E2. ¿Quieres publicar en múltiples plataformas?**
- [ ] a) Solo Instagram
- [ ] b) Instagram + TikTok
- [ ] c) Instagram + TikTok + YouTube Shorts

**E3. ¿Quieres que el caption sea IDÉNTICO al del competidor o modificado?**
- [ ] a) Modificado con AI (cambia palabras, mantiene mensaje)
- [ ] b) Totalmente diferente (solo usa tema como inspiración)
- [ ] c) Idéntico (copia exacta)

---

### 🔄 SECCIÓN F: WORKFLOW Y AUTOMATIZACIÓN

**F1. ¿Cuántos videos quieres generar por día?**
- [ ] a) 1 video/día
- [ ] b) 3 videos/día
- [ ] c) 5+ videos/día

**F2. ¿A qué hora quieres que se ejecute el workflow?**
- [ ] a) 9 AM (como ahora)
- [ ] b) Varias veces al día (9 AM, 2 PM, 7 PM)
- [ ] c) Cuando tú lo actives manualmente

**F3. ¿Quieres aprobación manual antes de generar video?**
- [ ] a) Sí (sistema genera propuesta, tú apruebas, luego genera video)
- [ ] b) No (todo automático)

**F4. ¿Quieres que el sistema evite replicar el mismo post del competidor 2 veces?**
- [ ] a) Sí (guarda hash del post en base de datos)
- [ ] b) No necesario

---

### 💰 SECCIÓN G: PRESUPUESTO

**G1. ¿Cuál es tu presupuesto mensual para herramientas?**
- [ ] a) $0 (solo gratis)
- [ ] b) $20-50/mes
- [ ] c) $50-100/mes
- [ ] d) $100+/mes

**G2. Prioridad: ¿Prefieres CALIDAD o CANTIDAD?**
- [ ] a) Calidad (menos videos pero mejor producción)
- [ ] b) Cantidad (más videos aunque sean más simples)
- [ ] c) Balance

---

## 📋 5. RESUMEN DE COSTOS POR CONFIGURACIÓN

### CONFIGURACIÓN A: "PROFESIONAL PREMIUM"
**Objetivo:** Máxima calidad, replicación visual perfecta

- Apify (scraping): $50/mes
- ElevenLabs Creator: $22/mes
- HeyGen Business: $72/mes
- Submagic: $20/mes
- Blotato: $29/mes
- **TOTAL: $193/mes**
- **Capacidad:** ~30-50 videos/mes ultra-profesionales

---

### CONFIGURACIÓN B: "PROFESIONAL ECONÓMICO"
**Objetivo:** Buena calidad, costo moderado

- Tu API actual (scraping): $0
- ElevenLabs Starter: $5/mes
- Kling via Kie.ai: $30/mes (100 videos)
- Shotstack: $29/mes
- Blotato: $29/mes
- **TOTAL: $93/mes**
- **Capacidad:** ~30 videos/mes con buena calidad

---

### CONFIGURACIÓN C: "STARTER ECONÓMICO"
**Objetivo:** Mínimo costo, máximo valor

- Tu API actual: $0
- ElevenLabs Free: $0
- Kling via Kie.ai: $15/mes (50 videos)
- Sin post-procesado: $0
- Publicación manual: $0
- **TOTAL: $15/mes**
- **Capacidad:** ~5-10 videos/mes

---

### CONFIGURACIÓN D: "SEMI-AUTOMÁTICO GRATIS"
**Objetivo:** Cero costo, semi-manual

- Tu API actual: $0
- ElevenLabs Free: $0 (usar n8n)
- Kling via Kie.ai: $0 (recargas créditos según necesites)
- Sin post-procesado: $0
- Publicación manual: $0
- **TOTAL: $0 + créditos Kie.ai según uso**
- **Capacidad:** ~5 videos/mes (limitado por ElevenLabs free tier)

---

## 🎯 6. RECOMENDACIÓN BASADA EN TUS OBJETIVOS

### Basándome en lo que dijiste:
- ✅ Analizar competidores
- ✅ Replicar posts pero NO clon exacto
- ✅ Obligatorio: ElevenLabs para voz
- ✅ Flexible en herramienta de video

### Mi recomendación: **CONFIGURACIÓN B+ (Profesional Optimizado)**

```
FLUJO RECOMENDADO:

1. ANÁLISIS COMPETIDORES
   ├─ Tu API actual (ya funciona)
   └─ + GPT-4 Vision para analizar estilo visual ($0.01/análisis)

2. GENERACIÓN DE FOTO
   ├─ Fotos existentes de Google Drive (principal)
   └─ + Flux Pro para generar fotos específicas si necesitas ($0.055/imagen)

3. VOZ
   └─ ElevenLabs Starter ($5/mes) usando n8n (evita bloqueo IP)

4. VIDEO
   └─ Kling Avatar via Kie.ai ($0.28/video)

5. POST-PROCESADO
   └─ Shotstack ($29/mes) para subtítulos + zooms

6. PUBLICACIÓN
   └─ Blotato ($29/mes) para auto-post Instagram + TikTok

COSTO TOTAL: ~$63/mes + $0.01-0.05 por análisis visual
CAPACIDAD: ~30 videos/mes profesionales
```

### ¿Por qué esta configuración?
- ✅ Reutiliza lo que ya tienes (API, Google Drive)
- ✅ Agrega capacidades de análisis visual (GPT-4 Vision)
- ✅ ElevenLabs económico pero suficiente ($5/mes)
- ✅ Kling es mejor relación calidad/precio que HeyGen
- ✅ Shotstack agrega profesionalismo con subtítulos
- ✅ Blotato automatiza publicación multi-platform

---

## 📚 FUENTES CONSULTADAS

- [Create & Auto-Post Instagram Reels with AI Clones (HeyGen + Submagic + Blotato)](https://n8n.io/workflows/8918-create-and-auto-post-instagram-reels-with-ai-clones-script-to-post-heygen-submagic-blotato/)
- [AI-Powered Short-Form Video Generator (OpenAI, Flux, Kling, ElevenLabs)](https://n8n.io/workflows/3121-ai-powered-short-form-video-generator-with-openai-flux-kling-and-elevenlabs/)
- [Automate Instagram Content Discovery & Repurposing (Apify + GPT-4O + Perplexity)](https://n8n.io/workflows/4658-automate-instagram-content-discovery-and-repurposing-w-apify-gpt-4o-and-perplexity/)
- [Generate & Auto-Post AI Videos to Social Media (Veo3 + Blotato)](https://n8n.io/workflows/5035-generate-and-auto-post-ai-videos-to-social-media-with-veo3-and-blotato/)
- [Generate AI-Powered Competitor Analysis Reports (GPT-4 + Apify + Google Docs)](https://n8n.io/workflows/6580-generate-ai-powered-competitor-analysis-reports-with-gpt-4-apify-and-google-docs/)
- [AI-Powered Instagram Content Repurposing (OpenAI GPT-4O + Perplexity Research)](https://n8n.io/workflows/9445-ai-powered-instagram-content-repurposing-with-openai-gpt-4o-and-perplexity-research/)
- [ElevenLabs for Instagram Reels](https://elevenlabs.io/blog/elevenlabs-for-instagram-reels)
- [How to Integrate ElevenLabs with HeyGen](https://help.heygen.com/en/articles/8310663-how-to-integrate-elevenlabs-other-third-party-voices)
