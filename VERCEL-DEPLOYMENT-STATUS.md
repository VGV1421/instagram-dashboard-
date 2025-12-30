# 🚀 DEPLOYMENT A VERCEL - STATUS Y VERIFICACIÓN

## ✅ COMMIT REALIZADO

**Commit:** `5837309`
**Branch:** `main`
**Push:** Exitoso a GitHub
**Fecha:** 2024-12-30

### Archivos Actualizados:
- ✅ `src/app/api/video/generate-smart/route.ts` - Endpoint principal
- ✅ `src/app/api/ai/provider-selector/route.ts` - Selector AI
- ✅ Scripts de monitoreo (check-current-video.js, monitor-video.js)
- ✅ Documentación completa (15 archivos MD)

---

## 🔍 VERIFICAR DEPLOYMENT EN VERCEL

### 1. Acceder al Dashboard de Vercel
```
https://vercel.com/dashboard
```

### 2. Buscar el Proyecto
- Nombre: `instagram-dashboard`
- Última actualización: Hace ~1 minuto

### 3. Verificar Estado del Deployment
- ✅ **Building** → Compilando código
- ✅ **Deploying** → Desplegando a producción
- ✅ **Ready** → Deployment exitoso
- ❌ **Error** → Ver logs para debugging

### 4. Ver Logs del Build
En el dashboard de Vercel:
1. Click en el deployment más reciente
2. Click en "View Function Logs"
3. Verificar que no hay errores de compilación

---

## 🧪 PROBAR ENDPOINT EN PRODUCCIÓN

### URL del Endpoint:
```
https://instagram-dashboard-ten.vercel.app/api/video/generate-smart
```

### Test Automático:
El script `test-vercel-produccion.js` está ejecutándose automáticamente.

### Test Manual con cURL:
```bash
curl -X POST https://instagram-dashboard-ten.vercel.app/api/video/generate-smart \
  -H "Content-Type: application/json" \
  -d '{
    "contentId": "test-manual",
    "caption": "Hola! Prueba de Vercel en producción.",
    "duration": 8,
    "video_type": "talking_head",
    "objective": "natural_gestures",
    "budget_priority": "medium",
    "has_audio": true
  }'
```

### Test Manual con Node.js:
```javascript
const response = await fetch('https://instagram-dashboard-ten.vercel.app/api/video/generate-smart', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    contentId: 'test-' + Date.now(),
    caption: 'Prueba de producción',
    duration: 8,
    video_type: 'talking_head',
    objective: 'natural_gestures',
    budget_priority: 'medium',
    has_audio: true
  })
});

const result = await response.json();
console.log(result);
```

---

## 🔗 INTEGRACIÓN CON N8N

### Webhook URL en n8n:
El workflow de n8n debe llamar a:
```
https://instagram-dashboard-ten.vercel.app/api/video/generate-smart
```

### Configuración del Nodo HTTP Request en n8n:

**Method:** POST
**URL:** `https://instagram-dashboard-ten.vercel.app/api/video/generate-smart`
**Authentication:** None
**Headers:**
```json
{
  "Content-Type": "application/json"
}
```

**Body (JSON):**
```json
{
  "contentId": "{{ $json.contentId }}",
  "caption": "{{ $json.caption }}",
  "duration": {{ $json.duration }},
  "video_type": "{{ $json.video_type }}",
  "objective": "{{ $json.objective }}",
  "budget_priority": "{{ $json.budget_priority }}",
  "has_audio": {{ $json.has_audio }}
}
```

**Timeout:** 600000 (10 minutos) - Los videos pueden tardar hasta 15 min

---

## ✅ VALIDACIONES EXITOSAS (LOCAL)

- ✅ **Selector AI:** GPT-4o-mini eligiendo proveedor óptimo
- ✅ **OpenAI TTS:** Audio generado con voz 'nova'
- ✅ **Kie.ai API:** Endpoints correctos (`/api/v1/jobs/createTask`, `/recordInfo`)
- ✅ **Polling:** Campo "state" funcionando (generating → success)
- ✅ **Video URL:** Recuperado de `resultJson.videoUrl`
- ✅ **Video Generado:** https://tempfile.aiquickdraw.com/h/d0860dd1a6ed0d81f300740b2ff67f43_1767082532.mp4
- ✅ **Tiempo:** 12.9 minutos (dentro de lo esperado para Kling Avatar)
- ✅ **Costo:** $0.282 total

---

## 🐛 TROUBLESHOOTING

### Error 404 o 405 en Vercel:
1. Verificar que el deployment está en estado "Ready"
2. Esperar 1-2 minutos adicionales para propagación
3. Verificar logs en Vercel dashboard
4. Revisar que el archivo `route.ts` está en la ubicación correcta

### Error de Timeout:
- Los videos pueden tardar hasta 15 minutos
- Aumentar timeout en n8n a 900000ms (15 min)
- El polling interno ya está configurado para 10 min (120 intentos)

### Error de API Keys:
- Verificar que las environment variables están configuradas en Vercel:
  - `KIE_API_KEY` (o `KIE_AI_API_KEY`)
  - `OPENAI_API_KEY`
  - `ELEVENLABS_API_KEY`
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `GOOGLE_DRIVE_FOLDER_ID`
  - `GOOGLE_DRIVE_USADAS_FOLDER_ID`

### Verificar Variables en Vercel:
1. Ir a https://vercel.com/dashboard
2. Seleccionar proyecto `instagram-dashboard`
3. Settings → Environment Variables
4. Verificar que todas las keys están presentes

---

## 📊 PRÓXIMOS PASOS

1. ⏳ **Esperar deployment** (45 segundos aprox.)
2. ✅ **Verificar test automático** de `test-vercel-produccion.js`
3. 🧪 **Probar manualmente** si test automático falla
4. 🔗 **Actualizar n8n workflow** con URL de Vercel
5. 🎉 **Generar video de prueba** desde n8n
6. 📝 **Documentar resultados** y tiempos de generación

---

## 💡 NOTAS IMPORTANTES

- **Tiempo de Generación:** 10-15 minutos por video (Kling Avatar es lento pero de alta calidad)
- **Límite de Vercel:** Timeout máximo de 10 minutos en plan free (puede cortar antes de que el video termine)
- **Solución al Timeout:** El polling continúa en Kie.ai, usar `check-current-video.js` para recuperar
- **ElevenLabs:** Puede estar bloqueado en free tier, OpenAI TTS es fallback automático
- **Costos:** ~$0.28 por video de 10 segundos con Kling Avatar

---

## 🎯 OBJETIVO FINAL

Sistema 100% en la nube:
- ✅ n8n Cloud genera contenido con GPT-4
- ✅ Webhook llama a Vercel
- ✅ Vercel procesa con OpenAI TTS + Kie.ai
- ✅ Video guardado en Supabase
- ✅ URL retornado a n8n
- ✅ n8n publica en Instagram

**TODO SIN SERVIDOR LOCAL** 🚀
