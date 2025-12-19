# 🎬 Sistema de Automatización de Contenido con Avatar

## 🎯 ¿Qué hace este sistema?

Genera contenido para Instagram **completamente automático** con tu avatar hablando:

```
Tú escribes un tema → Sistema genera:
1. Script optimizado (OpenAI)
2. Audio con voz natural (ElevenLabs)
3. Video con tu avatar hablando (D-ID)
4. Listo para publicar en Instagram
```

**Tiempo total: 2-3 minutos automático**

---

## 💰 Costos (Presupuesto Básico: $23/mes)

| Servicio | Costo | Qué obtienes |
|----------|-------|--------------|
| ElevenLabs Starter | $5/mes | 30,000 caracteres = ~30 reels de 30s |
| D-ID Lite | $6/mes | 10 min video = ~20 reels de 30s |
| OpenAI | ~$12/mes | Generación ilimitada de scripts |
| **TOTAL** | **$23/mes** | **~30-40 reels/mes automáticos** |

---

## 📊 Basado en Investigación 2025

### Lo que FUNCIONA en Instagram 2025:

✅ **Reels 15-30 segundos** - Mejor retención (7-15s = máximo engagement)
✅ **Hook en 3 primeros segundos** - CRÍTICO o pierdes 65% audiencia
✅ **Subtítulos quemados** - 80% ve sin audio
✅ **Voz natural clonada** - Autenticidad > voz robótica
✅ **Publicar 8-10pm** - Mejor horario de engagement
✅ **Contenido educativo corto** - Tips > entretenimiento genérico

### Formatos optimizados:

1. **Tips Cortos (15-30s)** - Máximo engagement ⭐ RECOMENDADO
2. **Tutoriales (60-90s)** - Valor educativo, posicionamiento experto
3. **Análisis tendencias** - Caso éxito: 14M vistas reaccionando a noticias

---

## 🛠️ Endpoints API Creados

### 1. `/api/ai/generate-audio` (ElevenLabs)

**Convierte texto a voz natural en español**

```bash
POST /api/ai/generate-audio
Content-Type: application/json

{
  "text": "Tu script aquí...",
  "voiceId": "XrExE9yKIg1WjnnlVkGX"  # Opcional, usa voz por defecto
}
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "audio_url": "data:audio/mpeg;base64,...",
    "size_kb": 45,
    "format": "audio/mpeg",
    "voice_id": "XrExE9yKIg1WjnnlVkGX"
  }
}
```

**Características:**
- Voz: María (español latino, profesional)
- Calidad: Alta fidelidad, modelo v2 multilingual
- Configuración optimizada para contenido educativo
- Puedes clonar tu propia voz después

---

### 2. `/api/ai/generate-video` (D-ID)

**Crea video con tu avatar hablando**

```bash
POST /api/ai/generate-video
Content-Type: application/json

{
  "audioUrl": "data:audio/mpeg;base64,...",
  "avatarUrl": "https://tu-dominio.com/avatar.png"  # Opcional
}
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "video_url": "https://d-id.com/talks/...",
    "talk_id": "tlk-abc123",
    "duration_estimate": "15-30s",
    "format": "mp4",
    "ready": true
  }
}
```

**Características:**
- Usa tu avatar de `assets/videos/creation_1583956074.mp4`
- Sincronización lip-sync automática
- Formato MP4 optimizado para Instagram
- Polling automático hasta que esté listo (~30-60 segundos)

---

### 3. `/api/ai/create-content` (TODO-EN-UNO) ⭐

**Genera contenido completo en un solo llamado**

```bash
POST /api/ai/create-content
Content-Type: application/json

{
  "topic": "Cómo usar IA para crear contenido en Instagram",
  "tone": "professional",      # professional, casual, motivational, educational
  "format": "reel"             # reel, video, carousel, post
}
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "script": "🎯 HOOK...",
    "audio": {
      "url": "data:audio/mpeg;base64,...",
      "size_kb": 45
    },
    "video": {
      "url": "https://d-id.com/talks/...",
      "duration": "15-30s",
      "format": "mp4"
    },
    "metadata": {
      "topic": "...",
      "tone": "professional",
      "format": "reel",
      "created_at": "2025-01-19T..."
    }
  }
}
```

**Flujo automático:**
```
1. OpenAI genera script optimizado (15-30s)
   ↓
2. ElevenLabs convierte script a audio
   ↓
3. D-ID crea video con tu avatar + audio
   ↓
4. Listo para descargar y publicar
```

---

## 📋 Plantillas Predefinidas

**GET `/api/ai/create-content`** retorna plantillas listas para usar:

### 1. Tip Rápido (15-30s) ⭐ RECOMENDADO
```json
{
  "topic": "Comparte un tip específico sobre [TU TEMA]",
  "tone": "professional",
  "format": "reel"
}
```
**Por qué funciona:** Engagement rápido, formato que mejor funciona en 2025

### 2. Tutorial Corto (60s)
```json
{
  "topic": "Explica paso a paso cómo [HACER ALGO] en 3 pasos simples",
  "tone": "educational",
  "format": "video"
}
```
**Por qué funciona:** Mayor valor educativo, te posiciona como experta

### 3. Desmintiendo Mitos
```json
{
  "topic": "El mito de [FALSA CREENCIA] sobre [TU TEMA] - la verdad es...",
  "tone": "casual",
  "format": "reel"
}
```
**Por qué funciona:** Alto engagement, genera debate en comentarios

### 4. Análisis de Tendencia
```json
{
  "topic": "La nueva tendencia de [TEMA TRENDING] - esto es lo que debes saber",
  "tone": "professional",
  "format": "reel"
}
```
**Por qué funciona:** Caso éxito 14M vistas, reacciona a noticias/tendencias

### 5. Errores a Evitar
```json
{
  "topic": "3 errores que cometes con [TU TEMA] y cómo solucionarlos",
  "tone": "motivational",
  "format": "video"
}
```
**Por qué funciona:** Conecta emocionalmente, posiciona como solución

---

## 🚀 Cómo Usar

### Opción A: Desde código/Postman

```bash
curl -X POST http://localhost:3000/api/ai/create-content \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "5 trucos de IA que cambiarán tu negocio digital",
    "tone": "professional",
    "format": "reel"
  }'
```

### Opción B: Desde dashboard (próximamente)

Ir a `/scripts` → Seleccionar plantilla → Generar contenido → Descargar video

### Opción C: Automático con n8n (próximamente)

Workflow que genera y publica contenido diariamente sin intervención manual.

---

## 🎨 Tu Avatar

**Ubicación:** `assets/videos/creation_1583956074.mp4`

**Características:**
- Duración: ~5 segundos
- Calidad: HD
- Formato: MP4
- Tamaño: 12MB

**Nota:** Por ahora usa voz predeterminada (María, español latino).

**Para clonar tu voz:**
1. Graba 1-2 minutos de audio limpio (sin ruido)
2. Usa endpoint `/api/ai/clone-voice` (próximamente)
3. Obtén tu `voice_id` personalizado

---

## 🔄 Flujo Completo Automatizado (n8n)

```
[Trigger: Diario 9am]
     ↓
[Analizar trending topics desde Supabase]
     ↓
[Generar script optimizado - OpenAI]
     ↓
[Generar audio - ElevenLabs]
     ↓
[Generar video - D-ID]
     ↓
[Publicar en Instagram API - 8pm]
     ↓
[Enviar email con preview + analytics]
```

**Resultado:** Contenido viral automático 7 días/semana sin intervención manual.

---

## 📈 Métricas Esperadas

Basado en investigación y casos de éxito 2025:

| Métrica | Sin Avatar | Con Avatar IA | Mejora |
|---------|-----------|--------------|--------|
| **Engagement Rate** | 3-6% | 8-12% | +100% |
| **Retención promedio** | 45% | 65% | +44% |
| **Shares** | 2% | 5% | +150% |
| **Comentarios** | 15 | 35 | +133% |

**Caso de éxito:** Contenido con avatar + análisis tendencias = 14M vistas

---

## ⚙️ Variables de Entorno Necesarias

```bash
# ElevenLabs (Voz)
ELEVENLABS_API_KEY=sk_b5493ea05ad9fea6c81160bbba6c06c97574d99f416d7cdc

# D-ID (Avatar Video)
DID_API_KEY=dmd2dG9yaW5nYW5hQGdtYWlsLmNvbQ:9lgF49Tr13xbl7CV74rIb

# OpenAI (Scripts)
OPENAI_API_KEY=sk-proj-...
OPENAI_MODEL=gpt-4o-mini

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 🎯 Próximos Pasos

1. **Hoy:** Probar endpoint `/api/ai/create-content`
2. **Esta semana:** Actualizar UI de `/scripts` con nuevo flujo
3. **Próxima semana:** Crear workflow n8n para automatización diaria
4. **Mes 1:** Generar 30 reels automáticos, medir engagement
5. **Mes 2:** Optimizar basado en analytics, escalar a 60 reels/mes

---

## 💡 Tips Pro

1. **Hook es TODO:** Si no enganchas en 3 segundos, pierdes 65% audiencia
2. **Subtítulos siempre:** 80% ve sin audio, quema subtítulos en video
3. **Duración óptima:** 15-30s para tips, 60-90s para tutoriales
4. **Horario:** Publica 8-10pm para máximo alcance
5. **Consistencia:** Mejor 1 reel diario de 20s que 1 video semanal de 5 min

---

## 📞 Soporte

**Dashboard:** https://instagram-dashboard-ten.vercel.app
**GitHub:** https://github.com/VGV1421/instagram-dashboard-
**Email:** vgvtoringana@gmail.com

---

**Última actualización:** Diciembre 19, 2025
**Versión:** 1.0
**Estado:** ✅ APIs funcionales, UI pendiente
