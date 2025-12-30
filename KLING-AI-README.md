# Kling AI Avatar 2.0 - Documentación

## ¿Qué es Kling AI Avatar 2.0?

Kling AI Avatar 2.0 es un modelo de IA generativa de última generación que crea videos de avatares parlantes ultra-realistas a partir de:
- **1 imagen** (foto del rostro/persona)
- **1 archivo de audio** (voz/narración)

### Ventajas sobre HeyGen

| Característica | HeyGen Free | Kling AI Avatar 2.0 |
|---------------|-------------|---------------------|
| Gestos naturales | ❌ Solo boca | ✅ **Gestos completos** |
| Movimiento corporal | ❌ Estático | ✅ **Natural** |
| Movimiento de manos | ❌ No | ✅ **Sí** |
| Calidad | 720p | **1080p** |
| Lip-sync | Bueno | **Perfecto** |
| Expresiones faciales | Básicas | **Avanzadas** |
| Precio | Gratis (límite) | $0.08/seg (1080p) |

---

## Configuración

### 1. API Keys ya guardadas en `.env.local`

```env
KLING_ACCESS_KEY=AgQ4tryndrDm9HdmbYkbFPBbfe9paKrG
KLING_SECRET_KEY=B8P3mTLfD9ARe3JyEQCPhre3EKLGhdQk
```

✅ Ya están configuradas correctamente

### 2. Requisitos de Imagen y Audio

**Imagen:**
- Formatos: JPEG, PNG, WebP
- Tamaño máximo: 10 MB
- Debe ser una **URL pública accesible**
- Recomendación: Foto de rostro frontal, buena iluminación

**Audio:**
- Formatos: MP3, WAV, AAC, MP4, OGG
- Tamaño máximo: 10 MB
- Debe ser una **URL pública accesible**
- Duración máxima: 15 segundos

---

## Uso

### Opción 1: Desde TypeScript

```typescript
import { createKlingAvatar } from '@/utils/klingAvatar';

const result = await createKlingAvatar({
  imageUrl: 'https://example.com/avatar.jpg',
  audioUrl: 'https://example.com/voice.mp3',
  callbackUrl: 'https://tu-dominio.com/api/webhook'  // Opcional
});

if (result.success) {
  console.log('Video generado:', result.videoUrl);
  console.log('Task ID:', result.taskId);
} else {
  console.error('Error:', result.error);
}
```

### Opción 2: Script de prueba

Crear archivo `test-kling-avatar.js`:

```javascript
require('dotenv').config({ path: '.env.local' });

async function testKling() {
  // Importar la función
  const { createKlingAvatar } = require('./src/utils/klingAvatar');

  // URLs públicas de prueba
  const imageUrl = 'URL_DE_IMAGEN_PUBLICA';
  const audioUrl = 'URL_DE_AUDIO_PUBLICO';

  const result = await createKlingAvatar({
    imageUrl,
    audioUrl
  });

  console.log('Resultado:', JSON.stringify(result, null, 2));
}

testKling();
```

Ejecutar:
```bash
node test-kling-avatar.js
```

---

## Integración con Sistema Existente

### Flujo Completo

```
1. Usuario aprueba post en Dashboard
   ↓
2. Obtener imagen de Google Drive
   ↓
3. Generar audio con ElevenLabs
   ↓
4. [NUEVO] Usar Kling AI en lugar de HeyGen
   ↓
5. Video con GESTOS NATURALES ✨
   ↓
6. Agregar subtítulos con FFmpeg + Whisper
   ↓
7. Video final listo
```

### Modificación Necesaria en `route.ts`

En `src/app/api/video/talking-avatar/route.ts`:

```typescript
// En lugar de HeyGen:
// const video = await createVideoWithHeyGenText(...);

// Usar Kling AI:
import { createKlingAvatar } from '@/utils/klingAvatar';

const klingResult = await createKlingAvatar({
  imageUrl: photoUrl,  // Foto de Google Drive
  audioUrl: audioUrl   // Audio de ElevenLabs
});

if (klingResult.success) {
  const videoUrl = klingResult.videoUrl;
  // Continuar con post-procesado (subtítulos, etc.)
}
```

---

## Costos

| Resolución | Precio por segundo | Video de 15s |
|-----------|-------------------|--------------|
| 720p | $0.04 | $0.60 |
| 1080p | $0.08 | **$1.20** |

**Plan Free:** No existe (es de pago)
**Recomendación:** Usar 1080p para máxima calidad

---

## Comparación Real

### HeyGen (actual)
- ✅ Gratis (3 videos/mes)
- ✅ Fácil de configurar
- ❌ Solo movimiento de boca
- ❌ Sin gestos ni movimiento corporal
- ❌ Marca de agua

### Kling AI Avatar 2.0 (nuevo)
- ✅ Gestos naturales de manos
- ✅ Movimiento corporal realista
- ✅ Expresiones faciales avanzadas
- ✅ Lip-sync perfecto
- ✅ Sin marca de agua
- ❌ De pago ($1.20 por video de 15s)

---

## Próximos Pasos

1. **Prueba Manual:**
   ```bash
   node test-kling-avatar.js
   ```

2. **Si funciona bien:**
   - Integrar en endpoint principal
   - Reemplazar HeyGen por Kling en producción

3. **Configurar Webhook (opcional):**
   - Crear endpoint `/api/webhooks/kling`
   - Recibir notificación cuando video esté listo

---

## Fuentes

- [Kling AI Avatar v2 Pro API (Pixazo)](https://www.pixazo.ai/blog/introducing-kling-ai-avatar-v2-pro-api)
- [Kling AI API Docs (KIE.ai)](https://docs.kie.ai/market/kling/image-to-video)
- [Kling Avatar API (fal.ai)](https://fal.ai/models/fal-ai/kling-video/ai-avatar/v2/pro)
- [Kling AI Official](https://www.klingai.com/global/)

---

## Soporte

- API Keys: Ya configuradas ✅
- Documentación: Este archivo
- Ejemplos: `src/utils/klingAvatar.ts`
