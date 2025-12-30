# 🔧 Guía Completa: Configurar n8n para Automatización

## 📋 Workflow Completo

```
Post aprobado → n8n detecta cambio → Genera audio con ElevenLabs →
Sube a Google Drive → Llama a API local → Video generado →
Actualizado en Supabase
```

## 🎯 Paso 1: Crear Workflow en n8n

### Abrir n8n

```bash
# Si n8n está corriendo en localhost:5678
# Abre: http://localhost:5678
```

### Crear Nuevo Workflow

1. Click en "+ New workflow"
2. Nombre: **"Instagram Avatar Video Generator"**

---

## 🔌 Paso 2: Configurar Nodos

### NODO 1: Supabase Trigger

**Tipo:** `Supabase Trigger` o `Webhook`

#### Si usas Supabase Trigger:
- **Database URL:** `https://nwhdsboiojmqqfvbelwo.supabase.co`
- **Service Role Key:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im53aGRzYm9pb2ptcXFmdmJlbHdvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzM2NjA5OSwiZXhwIjoyMDc4OTQyMDk5fQ.VCPKC1c3_PMpBiV1yLFvWd5J3np5H4pJNi4KxZ6oxzg`
- **Table:** `posts`
- **Events:** `UPDATE`
- **Filter:**
  ```sql
  status = 'approved' AND suggested_media IS NULL
  ```

#### Si usas Webhook (alternativa):
- **Webhook URL:** Copiar la URL generada
- Configurar en Supabase Database Webhooks

**Salida esperada:**
```json
{
  "id": "post-uuid",
  "caption": "Texto del post",
  "status": "approved",
  "suggested_media": null
}
```

---

### NODO 2: ElevenLabs - Text to Speech

**Tipo:** `HTTP Request` (o nodo ElevenLabs si existe)

#### Configuración:

**Method:** `POST`

**URL:** `https://api.elevenlabs.io/v1/text-to-speech/3ekAN4FjFTd3LsBs8txD`

**Authentication:** `Header Auth`
- **Name:** `xi-api-key`
- **Value:** `2832f520f8198dc81392a83db9f245ee4a5074ed95fbba5ed76c9ff1a038694b`

**Headers:**
```json
{
  "Accept": "audio/mpeg",
  "Content-Type": "application/json"
}
```

**Body (JSON):**
```json
{
  "text": "={{ $json.caption }}",
  "model_id": "eleven_multilingual_v2",
  "voice_settings": {
    "stability": 0.55,
    "similarity_boost": 0.75,
    "style": 0.6,
    "use_speaker_boost": true
  }
}
```

**Response Format:** `File`

**Salida esperada:** Archivo MP3 binario

---

### NODO 3: Google Drive - Upload File

**Tipo:** `Google Drive`

#### Configuración:

**Operation:** `Upload`

**Drive:** `My Drive`

**Folder:** Buscar "AUDIOS GENERADOS" o usar ID: `1MbsJB7c0qNSLJyXSd-FHxFp0m0NTzZEC`

**File Name:** `audio-={{ $('Supabase Trigger').item.json.id }}.mp3`

**Binary Data:** `true`

**Binary Property:** `data` (desde ElevenLabs)

**Salida esperada:**
```json
{
  "id": "google-drive-file-id",
  "name": "audio-post-uuid.mp3",
  "webViewLink": "https://drive.google.com/...",
  "webContentLink": "https://drive.google.com/..."
}
```

---

### NODO 4: HTTP Request - Llamar a API Local

**Tipo:** `HTTP Request`

#### Configuración:

**Method:** `POST`

**URL:** `http://localhost:3000/api/video/generate-from-audio`

**Authentication:** `None`

**Headers:**
```json
{
  "Content-Type": "application/json"
}
```

**Body (JSON):**
```json
{
  "postId": "={{ $('Supabase Trigger').item.json.id }}",
  "audioFileId": "={{ $('Google Drive').item.json.id }}",
  "caption": "={{ $('Supabase Trigger').item.json.caption }}"
}
```

**Response Format:** `JSON`

**Timeout:** `360000` (6 minutos)

**Salida esperada:**
```json
{
  "success": true,
  "postId": "post-uuid",
  "videoUrl": "https://kling-video-url.mp4",
  "taskId": "kling-task-id",
  "photoUsed": "foto-nombre.png",
  "message": "Video generado y guardado exitosamente"
}
```

---

### NODO 5 (Opcional): Notificación por Email

**Tipo:** `Send Email` (Resend)

#### Configuración:

**API Key:** `re_eyD99YB6_4HMJ41XCJG6YcEmJ717Cut6Y`

**From:** `onboarding@resend.dev`

**To:** `vgvtoringana@gmail.com`

**Subject:** `✅ Video generado para post {{ $('Supabase Trigger').item.json.id }}`

**Body:**
```
Video generado exitosamente!

Post ID: {{ $('Supabase Trigger').item.json.id }}
Video URL: {{ $('HTTP Request').item.json.videoUrl }}
Foto usada: {{ $('HTTP Request').item.json.photoUsed }}

Caption: {{ $('Supabase Trigger').item.json.caption }}
```

---

## 🔗 Conectar los Nodos

```
[Supabase Trigger]
    ↓
[ElevenLabs TTS]
    ↓
[Google Drive Upload]
    ↓
[HTTP Request - API Local]
    ↓
[Send Email] (opcional)
```

---

## ✅ Paso 3: Activar el Workflow

1. Click en **"Active"** en la esquina superior derecha
2. El workflow quedará escuchando cambios en Supabase

---

## 🧪 Paso 4: Probar el Workflow

### Opción A: Test desde n8n

1. Click en "Execute Workflow" en Supabase Trigger
2. Simula un post aprobado:
```json
{
  "id": "test-123",
  "caption": "Hola, esta es una prueba de video con inteligencia artificial.",
  "status": "approved",
  "suggested_media": null
}
```

### Opción B: Test real desde Dashboard

1. Abre el dashboard: `http://localhost:3000`
2. Ve a Posts
3. Aprueba un post que NO tenga video
4. Espera 3-5 minutos
5. Verifica que:
   - n8n ejecutó el workflow
   - Se generó el audio en Drive
   - Se generó el video
   - El post se actualizó en Supabase

---

## 📊 Monitoreo

### Ver Ejecuciones en n8n:
1. Ve a **"Executions"** en el menú lateral
2. Verás cada ejecución con:
   - ✅ Success
   - ❌ Error
   - Tiempo de ejecución
   - Datos de entrada/salida

### Logs del Sistema:
```bash
# Ver logs del servidor Next.js
# En la terminal donde corre npm run dev

# Verás:
# 🎬 Iniciando generación de video desde n8n
# 📥 Paso 1: Descargando audio de Google Drive...
# ☁️  Paso 2: Subiendo audio a Kie.ai...
# 📸 Paso 3: Obteniendo foto de avatar...
# ✨ Paso 4: Generando prompt optimizado...
# 🎬 Paso 5: Generando video con Kling Avatar...
# 💾 Paso 6: Guardando en Supabase...
# ✅ Proceso completado exitosamente!
```

---

## ⚠️ Troubleshooting

### Error: "KIE_API_KEY no configurado"
**Solución:** Verifica que `.env.local` tenga:
```
KIE_API_KEY=934bdbbac329efa641f1dba55e96c3f0
```

### Error: "Créditos insuficientes"
**Solución:** Agregar créditos en Kie.ai
- https://kie.ai/api-key
- Mínimo $10 (16 videos)

### Error: "No se encontraron fotos en el Drive"
**Solución:**
- Subir fotos a carpeta "FOTOS AVATAR SIN USAR"
- ID carpeta: `1eowZdSmeW7dxQaRQgvp-bdLYYDGatOpY`

### Error: "ElevenLabs unusual activity"
**Solución:** Este error NO debería pasar en n8n
- n8n tiene IP diferente
- Si pasa, usar plan pagado de ElevenLabs

### Workflow no se activa automáticamente
**Solución:**
- Verificar que el workflow está "Active"
- Verificar Supabase Trigger configuration
- Verificar que el post cumple el filtro: `status = 'approved' AND suggested_media IS NULL`

---

## 💰 Costos por Video

| Servicio | Costo |
|----------|-------|
| ElevenLabs | Gratis (10k créditos/mes) |
| Kling Avatar | $0.60 por video de 15s |
| Google Drive | Gratis |
| Supabase | Gratis (plan free) |
| **Total** | **$0.60/video** |

**Con $10 en Kie.ai → ~16 videos**

---

## 🎉 Resultado Final

Cuando todo funcione:

1. ✅ Apruebas un post en el dashboard
2. ✅ n8n detecta el cambio automáticamente
3. ✅ Genera audio con tu voz de ElevenLabs
4. ✅ Sube audio a Google Drive
5. ✅ Genera video con Kling Avatar
   - Sincronización labial perfecta
   - Gestos naturales de manos
   - Movimientos faciales realistas
6. ✅ Guarda video en Supabase
7. ✅ Post queda listo para publicar

**¡Todo automático!** 🚀

---

## 📝 Próximos Pasos

1. ⏳ Agregar créditos en Kie.ai ($10 mínimo)
2. ✅ Configurar workflow en n8n (siguiendo esta guía)
3. 🧪 Probar con un post de prueba
4. 🎉 ¡Ver el primer video generado!
5. 🔄 Automatizar completamente

---

## 🔗 Enlaces Útiles

- **n8n:** http://localhost:5678
- **Dashboard:** http://localhost:3000
- **Kie.ai Credits:** https://kie.ai/api-key
- **ElevenLabs:** https://elevenlabs.io
- **Supabase:** https://nwhdsboiojmqqfvbelwo.supabase.co

---

**Creado:** 2025-01-29
**Estado:** ✅ Listo para configurar
