# 🎯 BREAKPOINTS - Implementación Por Partes

**Estrategia:** Probar cada componente individualmente antes de integrar

---

## ✅ BREAKPOINT 1: Análisis de Competidores (BÁSICO)

### Objetivo:
Probar que podemos obtener posts de competidores y calcular engagement

### Qué probar:
1. Endpoint `/api/automation/analyze-posts`
2. Obtener posts de competidores últimas 72h
3. Calcular engagement rate
4. Excluir posts ya procesados

### Test:
```bash
node test-analyze-competitors.js
```

### Salida esperada:
```json
{
  "success": true,
  "post": {
    "url": "https://instagram.com/p/...",
    "caption": "...",
    "media_url": "https://...",
    "engagement_rate": 8.5,
    "competitor": "@competidor1"
  }
}
```

### Validación:
- ✅ Obtiene posts correctamente
- ✅ Calcula engagement rate
- ✅ No repite posts ya usados
- ✅ Retorna el mejor post

---

## ✅ BREAKPOINT 2: Análisis Visual con GPT-4 Vision

### Objetivo:
Analizar estilo visual de un post del competidor

### Qué probar:
1. Endpoint `/api/ai/analyze-visual-style`
2. GPT-4 Vision analiza imagen
3. Genera prompt para Flux
4. Decide si usar Flux o Drive

### Test:
```bash
node test-visual-analysis.js
```

### Input:
```json
{
  "media_url": "https://scontent.cdninstagram.com/..."
}
```

### Salida esperada:
```json
{
  "visual_style": {
    "colors": ["blue", "white"],
    "background": "modern minimalist office",
    "lighting": "soft natural daylight",
    "mood": "professional confident",
    "complexity_score": 7
  },
  "flux_prompt": "Professional woman in her 30s, modern office...",
  "use_flux": true,
  "cost": 0.01
}
```

### Validación:
- ✅ GPT-4 Vision analiza correctamente
- ✅ Genera prompt para Flux
- ✅ Decide correctamente si usar Flux (score > 6)
- ✅ Costo = $0.01

---

## ✅ BREAKPOINT 3: Generación de Foto (Flux AI)

### Objetivo:
Generar foto de avatar con estilo específico usando Flux

### Qué probar:
1. Endpoint `/api/ai/generate-photo-flux`
2. Flux Pro genera imagen
3. Sube a Google Drive
4. Retorna URL

### Test:
```bash
node test-flux-generation.js
```

### Input:
```json
{
  "flux_prompt": "Professional woman in her 30s, modern minimalist office, wearing cream blazer, natural makeup, looking directly at camera with confident expression, 85mm f/1.4 lens, ISO 200, natural skin texture with visible pores, matte finish"
}
```

### Salida esperada:
```json
{
  "success": true,
  "image_url": "https://drive.google.com/uc?id=...",
  "file_id": "1abc...",
  "cost": 0.055
}
```

### Validación:
- ✅ Flux genera imagen realista
- ✅ Sube a Google Drive correctamente
- ✅ URL accesible públicamente
- ✅ Costo = $0.055

---

## ✅ BREAKPOINT 4: Asistente Selector de Proveedor (AI)

### Objetivo:
Probar que el asistente AI elige el mejor proveedor según parámetros

### Qué probar:
1. Endpoint `/api/ai/provider-selector`
2. Analiza: duración, tipo, objetivo, presupuesto
3. Elige mejor proveedor
4. Explica razón

### Test:
```bash
node test-provider-selector.js
```

### Input:
```json
{
  "duration": 10,
  "video_type": "talking_head",
  "objective": "natural_gestures",
  "budget_priority": "medium"
}
```

### Salida esperada:
```json
{
  "provider": "kling/v1-avatar-standard",
  "reason": "Mejor balance calidad/precio para videos de 10s con gestos naturales. Kling Standard ofrece calidad 9/10 a $0.28, ideal para talking heads.",
  "estimated_cost": 0.28,
  "estimated_time": 180
}
```

### Validación:
- ✅ Elige proveedor lógico
- ✅ Explica razón clara
- ✅ Costo correcto
- ✅ Tiempo estimado razonable

---

## ✅ BREAKPOINT 5: Caption Mejorado (GPT-4)

### Objetivo:
Reescribir caption del competidor manteniendo mensaje

### Qué probar:
1. Endpoint `/api/ai/improve-caption`
2. GPT-4 reescribe caption
3. Mismo mensaje, diferentes palabras
4. Cuenta palabras para determinar duración

### Test:
```bash
node test-caption-improvement.js
```

### Input:
```json
{
  "original_caption": "Hoy te enseño las 3 claves esenciales del marketing digital que revolucionarán completamente tu estrategia de redes sociales"
}
```

### Salida esperada:
```json
{
  "improved_caption": "Descubre las 3 estrategias fundamentales de marketing online que transformarán radicalmente tu presencia en redes",
  "word_count": 17,
  "estimated_duration": 5,
  "cost": 0.002
}
```

### Validación:
- ✅ Caption mejorado diferente al original
- ✅ Mantiene el mismo mensaje/tema
- ✅ Cuenta palabras correctamente
- ✅ Duración estimada correcta (5/10/15s)

---

## ✅ BREAKPOINT 6: Audio con ElevenLabs (desde n8n)

### Objetivo:
Generar audio desde n8n evitando bloqueo IP

### Qué probar:
1. Workflow n8n simple
2. HTTP Request a ElevenLabs
3. Genera MP3
4. Sube a Google Drive

### Test:
```
Ejecutar workflow en n8n manualmente
```

### Input (n8n):
```json
{
  "text": "Descubre las 3 estrategias fundamentales de marketing online",
  "voice_id": "3ekAN4FjFTd3LsBs8txD"
}
```

### Salida esperada:
```json
{
  "audio_url": "https://drive.google.com/uc?id=...",
  "duration": 5.2,
  "file_size": 125000
}
```

### Validación:
- ✅ ElevenLabs NO bloquea (IP diferente)
- ✅ Audio generado correctamente
- ✅ Duración ~5 segundos
- ✅ Subido a Drive

---

## ✅ BREAKPOINT 7: Video con Kie.ai (Provider Dinámico)

### Objetivo:
Generar video usando provider elegido por asistente

### Qué probar:
1. Endpoint `/api/video/generate-with-provider`
2. Usa provider dinámico (no hardcoded)
3. Polling hasta completar
4. Retorna URL del video

### Test:
```bash
node test-video-generation.js
```

### Input:
```json
{
  "photo_url": "https://drive.google.com/uc?id=...",
  "audio_url": "https://drive.google.com/uc?id=...",
  "prompt": "Professional woman speaking confidently...",
  "provider": "kling/v1-avatar-standard"
}
```

### Salida esperada:
```json
{
  "success": true,
  "video_url": "https://kie.ai/videos/abc123.mp4",
  "task_id": "abc123",
  "duration": 10.2,
  "credits_used": 55,
  "cost": 0.28
}
```

### Validación:
- ✅ Video generado correctamente
- ✅ Provider correcto usado
- ✅ Gestos naturales
- ✅ Lip-sync perfecto
- ✅ Duración correcta

---

## ✅ BREAKPOINT 8: Subir a Google Drive

### Objetivo:
Descargar video de Kie.ai y subir a Drive

### Qué probar:
1. Descarga video de URL temporal
2. Sube a carpeta "VIDEOS GENERADOS"
3. Genera link compartible
4. Naming convention: {date}_{competitor}_{duration}s.mp4

### Test:
```bash
node test-drive-upload.js
```

### Input:
```json
{
  "video_url": "https://kie.ai/videos/abc123.mp4",
  "metadata": {
    "competitor": "competidor1",
    "duration": 10
  }
}
```

### Salida esperada:
```json
{
  "success": true,
  "drive_url": "https://drive.google.com/uc?id=...",
  "file_id": "1xyz...",
  "file_name": "20250129_competidor1_10s.mp4",
  "file_size": 2400000
}
```

### Validación:
- ✅ Video descargado correctamente
- ✅ Subido a Drive sin errores
- ✅ Nombre correcto
- ✅ URL accesible

---

## ✅ BREAKPOINT 9: Guardar en Supabase

### Objetivo:
Guardar post completo en base de datos

### Qué probar:
1. INSERT en tabla `posts`
2. INSERT en tabla `processed_competitor_posts`
3. Relaciones correctas
4. Status = 'pending_approval'

### Test:
```bash
node test-supabase-save.js
```

### Input:
```json
{
  "caption": "Caption mejorado...",
  "video_url": "https://drive.google.com/...",
  "duration": 10,
  "competitor_source": "https://instagram.com/p/...",
  "visual_style": { "colors": [...] },
  "provider_used": "kling-standard",
  "generation_cost": 0.30
}
```

### Salida esperada:
```json
{
  "success": true,
  "post_id": "abc-123-def-456",
  "competitor_hash": "a1b2c3d4...",
  "status": "pending_approval"
}
```

### Validación:
- ✅ Post guardado correctamente
- ✅ Hash de competidor guardado
- ✅ No se puede replicar mismo post 2 veces
- ✅ Todos los campos poblados

---

## ✅ BREAKPOINT 10: Email de Aprobación

### Objetivo:
Enviar email con video para aprobar

### Qué probar:
1. Template HTML profesional
2. Links funcionan (Ver Video, Aprobar, Rechazar)
3. Información completa del video

### Test:
```bash
node test-approval-email.js
```

### Input:
```json
{
  "post_id": "abc-123",
  "video_url": "https://drive.google.com/...",
  "caption": "Caption...",
  "competitor": "@competidor1",
  "engagement_rate": 8.5,
  "duration": 10,
  "cost": 0.30
}
```

### Salida esperada:
Email enviado con:
- Preview del video
- Caption
- Métricas del competidor
- Botones: [Ver Video] [Aprobar] [Rechazar]

### Validación:
- ✅ Email recibido correctamente
- ✅ Video preview funciona
- ✅ Links de aprobación funcionan
- ✅ Diseño profesional

---

## ✅ BREAKPOINT 11: Publicación Instagram (API)

### Objetivo:
Publicar video en Instagram Reels

### Qué probar:
1. Upload video container
2. Publish reel
3. Caption incluido
4. Captions nativos automáticos

### Test:
```bash
node test-instagram-publish.js
```

### Input:
```json
{
  "video_url": "https://drive.google.com/...",
  "caption": "Caption mejorado...",
  "ig_user_id": "123456789"
}
```

### Salida esperada:
```json
{
  "success": true,
  "instagram_post_id": "18012345678901234",
  "post_url": "https://www.instagram.com/reel/..."
}
```

### Validación:
- ✅ Video publicado en Instagram
- ✅ Caption correcto
- ✅ Captions nativos funcionan
- ✅ Post ID guardado

---

## ✅ BREAKPOINT 12: Workflow n8n Completo

### Objetivo:
Integrar todos los breakpoints en un workflow

### Qué probar:
1. Trigger 7 AM
2. Ejecuta todos los pasos secuencialmente
3. Error handling funciona
4. Email de notificación

### Test:
```
Ejecutar workflow manualmente en n8n
```

### Flujo:
```
Trigger → Analyze Posts → Visual Analysis → Decision (Flux/Drive)
→ Caption Improvement → Audio (ElevenLabs) → Provider Selector
→ Video Generation → Upload Drive → Save Supabase
→ Send Email → Wait Approval
```

### Validación:
- ✅ Workflow completo sin errores
- ✅ Video generado y guardado
- ✅ Email recibido
- ✅ Status = pending_approval
- ✅ Tiempo total < 10 minutos

---

## 🎯 ORDEN DE IMPLEMENTACIÓN SUGERIDO

1. **BREAKPOINT 1** → Más simple, sin APIs externas costosas
2. **BREAKPOINT 5** → Caption improvement (barato, fácil de probar)
3. **BREAKPOINT 4** → Asistente selector (prueba lógica AI)
4. **BREAKPOINT 2** → Análisis visual (GPT-4 Vision)
5. **BREAKPOINT 3** → Flux generation (costoso, probar al final)
6. **BREAKPOINT 6** → Audio ElevenLabs (desde n8n)
7. **BREAKPOINT 7** → Video Kie.ai
8. **BREAKPOINT 8** → Upload Drive
9. **BREAKPOINT 9** → Guardar Supabase
10. **BREAKPOINT 10** → Email aprobación
11. **BREAKPOINT 11** → Publicar Instagram
12. **BREAKPOINT 12** → Workflow completo n8n

---

## 💰 COSTO ESTIMADO POR BREAKPOINT

| Breakpoint | Costo por Test | Tests Necesarios | Costo Total |
|------------|----------------|------------------|-------------|
| BP1 | $0 | 3-5 | $0 |
| BP2 | $0.01 | 3-5 | $0.05 |
| BP3 | $0.055 | 2-3 | $0.17 |
| BP4 | $0.002 | 5-10 | $0.02 |
| BP5 | $0.002 | 3-5 | $0.01 |
| BP6 | $0 | 3-5 | $0 |
| BP7 | $0.28 | 2-3 | $0.84 |
| BP8 | $0 | 3-5 | $0 |
| BP9 | $0 | 5-10 | $0 |
| BP10 | $0 | 3-5 | $0 |
| BP11 | $0 | 2-3 | $0 |
| BP12 | $0.35 | 2-3 | $1.05 |
| **TOTAL** | | | **~$2.14** |

---

## ✅ ¿POR DÓNDE EMPEZAMOS?

**RECOMENDACIÓN:** Empezar por **BREAKPOINT 4** (Asistente Selector de Proveedor)

**¿Por qué?**
- ✅ Costo muy bajo ($0.002/test)
- ✅ No requiere configuraciones complejas
- ✅ Prueba la lógica AI más interesante
- ✅ Fácil de validar resultados
- ✅ Rápido de implementar (30 min)

**¿Empezamos con BP4?**
