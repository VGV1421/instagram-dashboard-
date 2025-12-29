# 🚀 SETUP COMPLETO - GENERACIÓN INTELIGENTE DE VIDEOS

**Fecha:** 29 Diciembre 2025
**Tiempo estimado:** 15 minutos
**Todo automatizado y listo para usar**

---

## ✅ QUÉ SE IMPLEMENTÓ

### 1. **Endpoint Inteligente Completo**
- **URL:** `/api/video/generate-smart`
- **Hace TODO automáticamente:**
  - ✅ Consulta asistente selector AI
  - ✅ Elige mejor proveedor de Kie.ai
  - ✅ Genera video (avatar o generativo)
  - ✅ Guarda en Supabase
  - ✅ Envía email de notificación

### 2. **Workflow n8n Listo**
- **Archivo:** `n8n-workflow-kie-ai-smart.json`
- **Solo importar y usar**

### 3. **Soporte Completo de Tipos de Video**
- Talking Head (avatar hablando)
- Baile/Danza (generativo movimiento)
- Showcase con voz (avatar)
- Showcase sin voz (generativo)
- Motion (generativo)
- Creative/Efectos (generativo alta calidad)
- Cinematográfico (generativo premium)

---

## 📋 PASO 1: CONFIGURAR VARIABLES EN VERCEL (5 min)

### 1.1 Obtener API Keys

#### Kie.ai (REQUERIDO)
1. Ve a: https://kie.ai
2. Crea cuenta gratis
3. Settings > API Keys
4. Copia tu key: `kie_xxxxxxxxxxxxx`

#### OpenAI (REQUERIDO - ya deberías tenerlo)
1. Ve a: https://platform.openai.com/api-keys
2. Copia tu key: `sk-xxxxxxxxxxxxx`

#### ElevenLabs (OPCIONAL - para mejor voz)
1. Ve a: https://elevenlabs.io
2. Profile > API Keys
3. Copia tu key: `xxxxxxxxxxxxx`

### 1.2 Agregar en Vercel

1. Ve a: https://vercel.com/tu-usuario/instagram-dashboard
2. Settings > Environment Variables
3. Agrega estas 3 variables:

```
KIE_AI_API_KEY=kie_xxxxxxxxxxxxx
OPENAI_API_KEY=sk-xxxxxxxxxxxxx
ELEVENLABS_API_KEY=xxxxxxxxxxxxx (opcional)
```

4. Click "Save"
5. **Redeploy:** Settings > Deployments > Latest > ... > Redeploy

---

## 📋 PASO 2: IMPORTAR WORKFLOW EN N8N (3 min)

### 2.1 Importar

1. Abre n8n
2. Click en "+" (nuevo workflow)
3. Click en "..." (menú) > "Import from File"
4. Selecciona: `n8n-workflow-kie-ai-smart.json`
5. Click "Import"

### 2.2 Configurar Variable de Entorno

En n8n, agrega esta variable:

```
VERCEL_URL=https://tu-proyecto.vercel.app
```

**Cómo agregar:**
1. Settings > Variables
2. Click "Add Variable"
3. Name: `VERCEL_URL`
4. Value: `https://tu-proyecto.vercel.app`
5. Save

### 2.3 Activar Workflow

1. Click en el toggle "Active" (arriba a la derecha)
2. Copia la URL del webhook (aparece en el nodo "Webhook Trigger")

---

## 📋 PASO 3: PROBAR EL SISTEMA (5 min)

### Test 1: Talking Head (Avatar)

```bash
curl -X POST https://n8n.tu-dominio.com/webhook/instagram-smart-video \
  -H "Content-Type: application/json" \
  -d '{
    "contentId": "test-001",
    "caption": "Hoy te explico las 3 claves del marketing digital que todo emprendedor debe conocer",
    "duration": 10,
    "video_type": "talking_head",
    "objective": "natural_gestures",
    "budget_priority": "medium",
    "has_audio": true
  }'
```

**Resultado esperado:**
```json
{
  "success": true,
  "message": "Video generado exitosamente",
  "videoUrl": "https://...",
  "provider": "Kling AI Avatar V1 Standard",
  "cost": 0.28,
  "type": "talking_head"
}
```

### Test 2: Baile (Generativo)

```bash
curl -X POST https://n8n.tu-dominio.com/webhook/instagram-smart-video \
  -H "Content-Type: application/json" \
  -d '{
    "contentId": "test-002",
    "caption": "Baile viral de TikTok con movimientos increíbles",
    "duration": 15,
    "video_type": "dance",
    "objective": "body_movement",
    "budget_priority": "medium",
    "has_audio": false
  }'
```

**Resultado esperado:**
```json
{
  "success": true,
  "videoUrl": "https://...",
  "provider": "Kling 2.6 (Latest)",
  "cost": 0.675,
  "type": "dance"
}
```

### Test 3: Showcase con Voz (Avatar)

```bash
curl -X POST https://n8n.tu-dominio.com/webhook/instagram-smart-video \
  -H "Content-Type: application/json" \
  -d '{
    "contentId": "test-003",
    "caption": "Te muestro la nueva función de Kling 2.6 que revolucionará tus videos",
    "duration": 10,
    "video_type": "showcase",
    "objective": "natural_gestures",
    "has_audio": true
  }'
```

**Resultado esperado:**
- Proveedor: Kling Avatar Standard (avatar)
- Costo: $0.28

---

## 🎯 PARÁMETROS DEL REQUEST

### Requeridos:
```json
{
  "contentId": "string",  // ID único del contenido
  "caption": "string"     // Texto del video
}
```

### Opcionales (con defaults inteligentes):
```json
{
  "duration": 5 | 10 | 15,  // Default: 10
  "video_type": "talking_head" | "dance" | "showcase" | "motion" | "creative" | "cinematic" | "simple",  // Default: talking_head
  "objective": "natural_gestures" | "body_movement" | "visual_effects" | "fast_generation" | "high_quality" | "budget" | "creative",  // Default: natural_gestures
  "budget_priority": "low" | "medium" | "high",  // Default: medium
  "has_audio": true | false  // Default: true (significa voz hablada)
}
```

---

## 💰 COSTOS ESTIMADOS

| Tipo de Video | Proveedor Típico | Costo (10s) | Uso Mensual (30x) |
|---------------|------------------|-------------|-------------------|
| Talking Head | Kling Avatar Standard | $0.28 | $8.40 |
| Baile 15s | Kling 2.6 | $0.675 | $20.25 |
| Showcase | Kling Avatar o Veo Fast | $0.28-0.30 | $8.40-9.00 |
| Creative | Runway Gen-3 | $0.53 | $15.90 |

**Promedio:** $0.50/video
**30 videos/mes:** $15/mes ✅

---

## 🔍 CÓMO FUNCIONA INTERNAMENTE

```
[n8n Webhook]
   ↓
[POST /api/video/generate-smart]
   ↓
1. Consulta asistente selector AI
   → GPT-4o-mini analiza parámetros
   → Retorna: { provider_id: "kling/v1-avatar-standard", cost: 0.28 }
   ↓
2. Prepara inputs según tipo
   → Si avatar: Descarga foto de Drive + genera audio con ElevenLabs
   → Si generativo: Solo usa el caption como prompt
   ↓
3. Llama a Kie.ai API
   → POST https://api.kie.ai/v1/generate
   → Body: { provider: "kling/v1-avatar-standard", inputs: {...} }
   ↓
4. Polling (espera video)
   → Cada 5s consulta status
   → Máximo 10 minutos
   ↓
5. Guarda en Supabase
   → suggested_media = videoUrl
   → metadata con provider, cost, etc.
   ↓
6. Envía email notificación
   ↓
[Retorna success + videoUrl]
```

---

## 🧪 VALIDACIÓN POST-SETUP

### Checklist de Verificación:

- [ ] **Vercel Variables:**
  - [ ] KIE_AI_API_KEY configurada
  - [ ] OPENAI_API_KEY configurada
  - [ ] ELEVENLABS_API_KEY configurada (opcional)
  - [ ] Redeploy realizado

- [ ] **n8n Workflow:**
  - [ ] Workflow importado
  - [ ] VERCEL_URL configurada
  - [ ] Workflow activado
  - [ ] Webhook URL copiada

- [ ] **Tests:**
  - [ ] Test 1 (Talking Head) exitoso
  - [ ] Test 2 (Baile) exitoso
  - [ ] Test 3 (Showcase) exitoso
  - [ ] Video guardado en Supabase
  - [ ] Email recibido

---

## 🔧 TROUBLESHOOTING

### Error: "KIE_AI_API_KEY no configurado"
**Solución:**
1. Verifica en Vercel > Settings > Environment Variables
2. Asegúrate que el nombre sea exacto: `KIE_AI_API_KEY`
3. Redeploy

### Error: "Selector AI falló"
**Solución:**
1. Verifica OPENAI_API_KEY en Vercel
2. Revisa créditos en OpenAI
3. Verifica logs en Vercel

### Error: "No hay fotos disponibles en Google Drive"
**Solución:**
1. Sube fotos a la carpeta "FOTOS AVATAR SIN USAR" en Google Drive
2. Verifica permisos del Service Account
3. O cambia a video generativo (no requiere foto)

### Error: "Kie.ai API error"
**Solución:**
1. Verifica créditos en Kie.ai Dashboard
2. Revisa que provider_id sea válido
3. Verifica logs para ver el error exacto

### Video tarda mucho
**Normal:**
- Avatar: 2-4 minutos
- Generativo simple: 2-3 minutos
- Generativo complejo (Runway, Sora): 5-8 minutos

---

## 📊 MONITOREO

### Ver Logs en Vercel:
1. Ve a https://vercel.com/tu-usuario/instagram-dashboard
2. Deployments > Latest > Functions
3. Click en `/api/video/generate-smart`
4. Ver logs en tiempo real

### Ver Tareas en Kie.ai:
1. Ve a https://kie.ai/dashboard
2. Tasks > Recent
3. Ver status de cada video

### Ver Datos en Supabase:
```sql
SELECT
  id,
  caption,
  suggested_media,
  metadata->>'provider' as provider,
  metadata->>'estimated_cost' as cost,
  metadata->>'video_type' as type,
  created_at
FROM scheduled_content
WHERE metadata->>'video_generated' = 'true'
ORDER BY created_at DESC
LIMIT 10;
```

---

## 🎉 PRÓXIMOS PASOS

### 1. Integrar con tu Flujo Existente

Si ya tienes un workflow de Instagram, solo reemplaza el nodo de generación de video con:

```
[Tu flujo actual]
   ↓
[HTTP Request: /api/video/generate-smart]
   ↓
[Continúa tu flujo]
```

### 2. Personalizar Tipos de Video

Puedes crear reglas en n8n para auto-detectar el tipo:

```javascript
// En un nodo "Set" antes del HTTP Request
const caption = $json.caption.toLowerCase();

let video_type = 'talking_head'; // default
let has_audio = true;

if (caption.includes('baile') || caption.includes('danza')) {
  video_type = 'dance';
  has_audio = false;
} else if (caption.includes('muestra') || caption.includes('nuevo')) {
  video_type = 'showcase';
  has_audio = caption.includes('explica') || caption.includes('enseña');
}

return {
  ...$json,
  video_type,
  has_audio
};
```

### 3. A/B Testing de Proveedores

Puedes probar diferentes configuraciones:
- Budget low vs medium vs high
- Diferentes objectives
- Duraciones variables

---

## 📚 DOCUMENTACIÓN ADICIONAL

- `BP4-ACTUALIZADO-KIEAI.md` - Lista completa de proveedores
- `BP4-FIX-HALLUCINATIONS.md` - Solución de errores
- `INTEGRACION-KIE-AI.md` - Guía técnica detallada

---

## 🎯 RESUMEN EJECUTIVO

**Sistema completamente automatizado:**
1. Un solo endpoint hace TODO
2. Workflow n8n de 5 nodos (importar y usar)
3. Selección inteligente de proveedor
4. Soporte para 7 tipos de video
5. Auto-guarda en Supabase
6. Email automático

**Costos:**
- Promedio: $0.50/video
- 30 videos/mes: $15/mes
- Muy por debajo del límite de $50/mes

**Estado:** ✅ **LISTO PARA USAR EN PRODUCCIÓN**

**Comando para verificar deploy:**
```bash
curl https://tu-proyecto.vercel.app/api/video/generate-smart
```

Debe retornar:
```json
{
  "success": true,
  "status": {
    "kieAiConfigured": true,
    "openaiConfigured": true,
    "ready": true
  }
}
```

---

**¿Listo?** Solo necesitas:
1. Agregar las 3 API keys en Vercel (5 min)
2. Importar el workflow en n8n (2 min)
3. Hacer un test (1 min)

**¡Todo lo demás ya está hecho! 🚀**
