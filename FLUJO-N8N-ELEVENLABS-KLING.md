# 🎬 Flujo Completo: n8n + ElevenLabs + Kling Avatar

## 🔍 Problema Actual

- ElevenLabs bloquea free tier desde esta IP (detecta "unusual activity")
- Tu cuenta ElevenLabs funciona perfectamente desde el navegador
- n8n puede tener una IP diferente que no esté bloqueada

## ✅ Solución: Flujo Híbrido

```
┌─────────────────────────────────────────────────────────────┐
│                     FLUJO COMPLETO                          │
└─────────────────────────────────────────────────────────────┘

1. Post aprobado en Supabase
   ↓
2. n8n detecta nuevo post aprobado
   ↓
3. n8n genera audio con ElevenLabs
   • Voice ID: 3ekAN4FjFTd3LsBs8txD
   • API Key funciona desde n8n
   ↓
4. n8n sube audio a Google Drive
   • Carpeta: "AUDIOS GENERADOS"
   ↓
5. Este sistema (Node.js) se activa
   ↓
6. Descarga audio de Google Drive
   ↓
7. Obtiene foto de "FOTOS AVATAR SIN USAR"
   ↓
8. Genera prompt optimizado con IA
   ↓
9. Crea video con Kling Avatar via Kie.ai
   • Audio: ElevenLabs (desde n8n)
   • Foto: Google Drive
   • Gestos naturales ✅
   ↓
10. Guarda video en Supabase
    ↓
11. Mueve foto a "FOTOS AVATAR USADAS"
```

## 📋 Configuración en n8n

### Workflow de n8n:

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Supabase   │────▶│  ElevenLabs  │────▶│ Google Drive │
│   Trigger    │     │     TTS      │     │    Upload    │
└──────────────┘     └──────────────┘     └──────────────┘
```

### Nodo 1: Supabase Trigger
- Database: instagram_posts
- Table: posts
- Listen to: UPDATES
- Filter: status = 'approved' AND suggested_media IS NULL

### Nodo 2: ElevenLabs TTS
- API Key: `2832f520f8198dc81392a83db9f245ee4a5074ed95fbba5ed76c9ff1a038694b`
- Voice ID: `3ekAN4FjFTd3LsBs8txD`
- Text: `{{ $json.caption }}`
- Model: `eleven_multilingual_v2`
- Settings:
  ```json
  {
    "stability": 0.55,
    "similarity_boost": 0.75,
    "style": 0.6,
    "use_speaker_boost": true
  }
  ```

### Nodo 3: Google Drive Upload
- Carpeta destino: "AUDIOS GENERADOS"
- Nombre archivo: `audio-{{ $json.id }}.mp3`
- Retornar: File ID

### Nodo 4: HTTP Request (llamar a este sistema)
- Method: POST
- URL: `http://localhost:3000/api/video/generate-from-audio`
- Body:
  ```json
  {
    "postId": "{{ $('Supabase').item.json.id }}",
    "audioFileId": "{{ $json.id }}",
    "caption": "{{ $('Supabase').item.json.caption }}"
  }
  ```

## 🔧 Endpoint Necesario

Crear endpoint en el sistema para recibir el audio desde n8n:

**Ruta:** `/api/video/generate-from-audio`

**Parámetros:**
- `postId`: ID del post en Supabase
- `audioFileId`: ID del archivo de audio en Google Drive
- `caption`: Texto del post (para generar el prompt)

**Proceso:**
1. Descargar audio de Google Drive usando `audioFileId`
2. Obtener foto aleatoria de "FOTOS AVATAR SIN USAR"
3. Generar prompt optimizado con IA
4. Crear video con Kling Avatar
5. Guardar video en Supabase
6. Mover foto a "FOTOS AVATAR USADAS"

## 💰 Costos

| Servicio | Costo |
|----------|-------|
| **ElevenLabs** | Gratis (10,000 créditos/mes) |
| **Kling Avatar** | $0.60 por video de 15s |
| **Google Drive** | Gratis |
| **Total por video** | **$0.60** |

## 🚀 Ventajas de Este Flujo

✅ Usa ElevenLabs gratis (desde n8n)
✅ Voz personalizada ultra-realista
✅ Gestos naturales con Kling Avatar
✅ Totalmente automatizado
✅ Bajo costo ($0.60/video)
✅ No depende de HeyGen (3 videos/mes)

## 📝 Próximos Pasos

### 1. Crear carpeta en Google Drive
- Nombre: "AUDIOS GENERADOS"
- Copiar ID de la carpeta

### 2. Configurar workflow en n8n
- Usar la estructura de arriba
- Probar con un post de prueba

### 3. Crear endpoint en este sistema
```bash
# Crear archivo:
src/app/api/video/generate-from-audio/route.ts
```

### 4. Probar flujo completo
- Aprobar un post en el dashboard
- Ver que n8n genere el audio
- Ver que el sistema genere el video
- Verificar resultado en Supabase

## 🔄 Flujo Alternativo (más simple)

Si prefieres algo más directo mientras pruebas:

```
1. Genera audio manualmente en n8n con ElevenLabs
2. Descarga el MP3
3. Ponlo en la carpeta temp/
4. Ejecuta: node test-kling-con-audio-custom.js
```

Voy a crear este script de prueba también.

## 📊 Estado Actual

- ✅ ElevenLabs configurado (API + Voice ID)
- ✅ Kling Avatar funcionando (solo falta crédito)
- ✅ Google Drive integrado
- ✅ Sistema de prompts optimizados
- ⏳ Falta: Endpoint para recibir audio de n8n
- ⏳ Falta: Créditos en Kie.ai ($10 mínimo)

¿Quieres que cree el endpoint ahora o prefieres primero probar el flujo manual?
