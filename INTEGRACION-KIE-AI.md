# 🔗 INTEGRACIÓN KIE.AI + ASISTENTE SELECTOR

**Fecha:** 29 Diciembre 2025
**Estado:** Listo para implementar en Vercel

---

## 🎯 OBJETIVO

Integrar el asistente selector de proveedores con Kie.ai para generar videos inteligentemente según el tipo de contenido.

---

## 📊 FLUJO COMPLETO

```
1. n8n Webhook recibe nuevo contenido aprobado
   ↓
2. Llama a /api/ai/provider-selector (POST)
   → Envía: { duration, video_type, objective, budget_priority, caption, has_audio }
   → Recibe: { provider_id: 'kling/v1-avatar-standard', estimated_cost: 0.28 }
   ↓
3. Llama a Kie.ai API con el proveedor seleccionado
   → endpoint: https://api.kie.ai/v1/generate
   → provider: resultado del selector
   ↓
4. Recibe video generado
   ↓
5. Guarda en Supabase
   ↓
6. Notifica por email
```

---

## 🔧 PASO 1: Configurar Kie.ai

### 1.1 Crear Cuenta en Kie.ai

1. Ve a https://kie.ai
2. Crea cuenta
3. Ve a Settings > API Keys
4. Copia tu API key

### 1.2 Agregar a .env.local (Vercel)

```bash
# Kie.ai API
KIE_AI_API_KEY=kie_xxxxxxxxxxxxx

# OpenAI (para el selector)
OPENAI_API_KEY=sk-xxxxxxxxxxxxx

# Supabase (ya configurado)
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```

### 1.3 Agregar Variables en Vercel

1. Ve a tu proyecto en Vercel
2. Settings > Environment Variables
3. Agrega:
   - `KIE_AI_API_KEY`
   - `OPENAI_API_KEY` (si no está)

4. Redeploy: `vercel --prod`

---

## 🚀 PASO 2: Usar el Asistente Selector

### Endpoint: POST /api/ai/provider-selector

**URL en Vercel:**
```
https://tu-proyecto.vercel.app/api/ai/provider-selector
```

### Request Body:

```json
{
  "duration": 10,
  "video_type": "talking_head",
  "objective": "natural_gestures",
  "budget_priority": "medium",
  "caption": "Hoy te explico las 3 claves del marketing digital",
  "has_audio": true
}
```

### Response:

```json
{
  "success": true,
  "selection": {
    "provider_id": "kling/v1-avatar-standard",
    "provider_name": "Kling AI Avatar V1 Standard",
    "provider_type": "avatar",
    "reason": "Modelo de avatar con gestos muy naturales...",
    "estimated_cost": 0.28,
    "estimated_time": 180,
    "quality_score": 9,
    "speed_score": 7,
    "pros": ["Gestos muy naturales", "Lip-sync perfecto"],
    "cons": ["Requiere créditos Kie.ai"],
    "alternatives": [...]
  },
  "metadata": {
    "duration": 10,
    "video_type": "talking_head",
    "providers_evaluated": 10,
    "avatar_models_count": 3,
    "generative_models_count": 7
  }
}
```

---

## 📝 PASO 3: Generar Video con Kie.ai

### 3.1 Endpoint de Kie.ai

```typescript
// Después de obtener la selección del provider
const kieResponse = await fetch('https://api.kie.ai/v1/generate', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${process.env.KIE_AI_API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    provider: selection.provider_id, // ej: 'kling/v1-avatar-standard'
    inputs: {
      image_url: photoUrl,
      audio_url: audioUrl, // Si es avatar
      // O para generativos:
      prompt: captionText,
      duration: duration
    }
  })
});
```

### 3.2 Tipos de Input según Proveedor

#### Para Avatar Models (talking_head):
```json
{
  "provider": "kling/v1-avatar-standard",
  "inputs": {
    "image_url": "https://drive.google.com/...",
    "audio_url": "https://supabase.storage/.../audio.mp3",
    "duration": 10
  }
}
```

#### Para Generative Models (dance, motion, creative):
```json
{
  "provider": "kling/v2-6",
  "inputs": {
    "prompt": "Professional dancer performing viral TikTok choreography",
    "duration": 15,
    "aspect_ratio": "9:16"
  }
}
```

---

## 🔗 PASO 4: Integración con n8n

### 4.1 Flujo n8n Actualizado

```
[Webhook: Nuevo contenido aprobado]
   ↓
[HTTP Request: /api/ai/provider-selector]
   URL: https://tu-proyecto.vercel.app/api/ai/provider-selector
   Method: POST
   Body:
   {
     "duration": {{ $json["duration"] || 10 }},
     "video_type": "{{ $json["video_type"] || 'talking_head' }}",
     "objective": "natural_gestures",
     "budget_priority": "medium",
     "caption": "{{ $json["caption"] }}",
     "has_audio": {{ $json["has_audio"] !== false }}
   }
   ↓
[Set Variable: provider]
   provider_id: {{ $json["selection"]["provider_id"] }}
   estimated_cost: {{ $json["selection"]["estimated_cost"] }}
   provider_type: {{ $json["selection"]["provider_type"] }}
   ↓
[HTTP Request: Kie.ai Generate]
   URL: https://api.kie.ai/v1/generate
   Method: POST
   Headers:
     Authorization: Bearer {{$env.KIE_AI_API_KEY}}
   Body:
   {
     "provider": "{{ $json["provider_id"] }}",
     "inputs": {
       "image_url": "{{ $json["photo_url"] }}",
       "audio_url": "{{ $json["audio_url"] }}",
       "duration": {{ $json["duration"] }}
     }
   }
   ↓
[Wait for Video (Polling)]
   Cada 5s hasta status = 'completed'
   ↓
[Guardar en Supabase]
   suggested_media = video_url
   status = 'ready'
   ↓
[Enviar Email]
```

### 4.2 Nodo HTTP Request (Provider Selector)

**Configuración:**
- URL: `https://tu-proyecto.vercel.app/api/ai/provider-selector`
- Method: `POST`
- Authentication: `None`
- Body Content Type: `JSON`

**Body JSON:**
```json
{
  "duration": {{ $json["duration"] || 10 }},
  "video_type": "{{ $json["video_type"] || 'talking_head' }}",
  "objective": "{{ $json["objective"] || 'natural_gestures' }}",
  "budget_priority": "{{ $json["budget_priority"] || 'medium' }}",
  "caption": "{{ $json["caption"] }}",
  "has_audio": {{ $json["has_audio"] !== false }}
}
```

**Output:**
```javascript
// Guardar para el siguiente nodo:
const providerId = $json.selection.provider_id;
const estimatedCost = $json.selection.estimated_cost;
const providerType = $json.selection.provider_type;
```

---

## 💰 COSTOS ESTIMADOS

### Usando el Selector + Kie.ai

| Escenario | Selector AI | Kie.ai | Total |
|-----------|-------------|---------|-------|
| Talking Head 10s | $0.002 | $0.28 | $0.282 |
| Baile 15s | $0.002 | $0.675 | $0.677 |
| Showcase sin voz 10s | $0.002 | $0.30 | $0.302 |
| Creative 15s | $0.002 | $0.795 | $0.797 |

**Promedio:** $0.50 por video

**30 videos/mes:** $15.00/mes ✅ (muy por debajo de $50/mes)

---

## 🧪 TESTING EN VERCEL

### 1. Test Simple desde cURL

```bash
# Test 1: Talking Head
curl -X POST https://tu-proyecto.vercel.app/api/ai/provider-selector \
  -H "Content-Type: application/json" \
  -d '{
    "duration": 10,
    "video_type": "talking_head",
    "objective": "natural_gestures",
    "budget_priority": "medium"
  }'

# Debe retornar: kling/v1-avatar-standard
```

```bash
# Test 2: Baile
curl -X POST https://tu-proyecto.vercel.app/api/ai/provider-selector \
  -H "Content-Type: application/json" \
  -d '{
    "duration": 15,
    "video_type": "dance",
    "objective": "body_movement",
    "budget_priority": "medium",
    "has_audio": false
  }'

# Debe retornar: kling/v2-6 (generativo)
```

### 2. Test desde n8n

1. Crea un workflow simple:
   - Webhook trigger
   - HTTP Request a /api/ai/provider-selector
   - Debug node para ver la respuesta

2. Envía test payload:
```json
{
  "duration": 10,
  "video_type": "talking_head",
  "caption": "Test desde n8n"
}
```

3. Verifica que recibas:
```json
{
  "success": true,
  "selection": {
    "provider_id": "kling/v1-avatar-standard",
    ...
  }
}
```

---

## 📋 CHECKLIST DE IMPLEMENTACIÓN

### Antes de Integrar:

- [ ] Cuenta Kie.ai creada
- [ ] API key de Kie.ai obtenida
- [ ] KIE_AI_API_KEY agregada a Vercel
- [ ] OPENAI_API_KEY verificada en Vercel
- [ ] Código pusheado a GitHub
- [ ] Deploy en Vercel completado

### Testing:

- [ ] Test 1: Talking Head → retorna kling/v1-avatar-standard
- [ ] Test 2: Baile → retorna kling/v2-6
- [ ] Test 3: Showcase con voz → retorna avatar
- [ ] Test 4: Showcase sin voz → retorna generativo
- [ ] Test 5: GET /api/ai/provider-selector → lista proveedores

### Integración n8n:

- [ ] Workflow actualizado con nuevo nodo
- [ ] Test end-to-end completado
- [ ] Video generado correctamente
- [ ] Guardado en Supabase
- [ ] Email enviado

---

## 🔍 DEBUGGING

### Error: "OPENAI_API_KEY no configurado"

**Solución:**
1. Ve a Vercel > Settings > Environment Variables
2. Agrega: `OPENAI_API_KEY=sk-...`
3. Redeploy

### Error: "Provider selector failed"

**Solución:**
1. Verifica logs en Vercel
2. Asegúrate que OPENAI_API_KEY sea válida
3. Test con cURL directamente

### Error: "Kie.ai API failed"

**Solución:**
1. Verifica KIE_AI_API_KEY en Vercel
2. Revisa créditos en Kie.ai Dashboard
3. Verifica que el provider_id sea válido

---

## 📚 DOCUMENTACIÓN ADICIONAL

- [Kie.ai API Docs](https://docs.kie.ai)
- [Kie.ai Market](https://kie.ai/market)
- [BP4-ACTUALIZADO-KIEAI.md](./BP4-ACTUALIZADO-KIEAI.md) - Lista de proveedores
- [BP4-FIX-HALLUCINATIONS.md](./BP4-FIX-HALLUCINATIONS.md) - Fix de errores

---

## 🎉 PRÓXIMOS PASOS

1. **Push a GitHub:**
   ```bash
   git push origin main
   ```

2. **Verificar Deploy en Vercel:**
   - Vercel auto-deploy desde main
   - Verifica logs
   - Test endpoint en producción

3. **Actualizar n8n:**
   - Agregar nodo HTTP Request
   - Test con contenido real
   - Validar costos

4. **Monitoreo:**
   - Revisar costos diarios en Kie.ai
   - Verificar accuracy del selector
   - Ajustar parámetros si es necesario

---

**Estado:** ✅ LISTO PARA DEPLOYMENT EN VERCEL

**Comando para deploy:**
```bash
git push origin main
# Vercel auto-deploya
# Verifica en: https://vercel.com/tu-usuario/tu-proyecto
```
