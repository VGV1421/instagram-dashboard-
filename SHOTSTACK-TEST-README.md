# 🎬 Guía de Prueba: Shotstack Post-Procesado

## ⚠️ IMPORTANTE: Límites del Plan Free de HeyGen

**Plan FREE de HeyGen:**
- ❌ **Solo 3 videos por mes** (se renuevan mensualmente)
- ❌ Watermark en los videos exportados
- ❌ Calidad máxima 720p
- ❌ Videos de hasta 5 minutos cada uno

**Por eso creamos este endpoint de prueba:** Para poder probar Shotstack SIN gastar más créditos de HeyGen.

---

## 🚀 Método 1: Script Node.js (MÁS FÁCIL)

### Paso 1: Obtener URL del video existente

1. Abre el email del video que recibiste de HeyGen
2. Busca la URL del video (ejemplo: `https://resource2.heygen.ai/video/xxxxx.mp4`)
3. Copia esa URL completa

### Paso 2: Configurar el script

1. Abre `test-shotstack.js`
2. Reemplaza esta línea:
   ```javascript
   const VIDEO_URL = 'https://resource2.heygen.ai/video/TU_VIDEO_AQUI.mp4';
   ```

   Con la URL real que copiaste:
   ```javascript
   const VIDEO_URL = 'https://resource2.heygen.ai/video/abc123def456.mp4';
   ```

3. (Opcional) Cambia el texto para los subtítulos si quieres

### Paso 3: Ejecutar

```bash
node test-shotstack.js
```

### Paso 4: Resultado

El script te mostrará:
- ✅ URL del video original
- ✅ URL del video procesado con zooms y subtítulos
- ✅ Tiempo de procesado

---

## 🔧 Método 2: Llamada API Directa

### Con cURL (Windows)

```bash
curl -X POST http://localhost:3000/api/video/test-shotstack ^
  -H "Content-Type: application/json" ^
  -d "{\"videoUrl\":\"https://resource2.heygen.ai/video/TU_VIDEO.mp4\",\"text\":\"Tu texto aquí para los subtítulos\"}"
```

### Con PowerShell

```powershell
$body = @{
    videoUrl = "https://resource2.heygen.ai/video/TU_VIDEO.mp4"
    text = "Tu texto aquí para los subtítulos"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/video/test-shotstack" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body
```

### Con Postman / Thunder Client

**Endpoint:** `POST http://localhost:3000/api/video/test-shotstack`

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "videoUrl": "https://resource2.heygen.ai/video/TU_VIDEO.mp4",
  "text": "¿Sabes qué? Hoy quiero compartir algo increíble contigo. Algo que va a cambiar tu forma de crear contenido para siempre."
}
```

---

## 📊 ¿Qué hace el post-procesado?

### ✅ Zooms Dinámicos (4 segmentos)
- Segmento 1: ZoomIn
- Segmento 2: ZoomOut
- Segmento 3: ZoomInSlow
- Segmento 4: ZoomOutSlow

### ✅ Transiciones Suaves
- Fade entre cada segmento
- Flujo natural sin cortes bruscos

### ✅ Subtítulos Estilo TikTok
- Palabra por palabra
- Animación slideUp/slideDown
- Gradiente de fondo
- Text-stroke negro
- Sombras para legibilidad
- Posición inferior del video

### ✅ Formato Optimizado
- Aspect ratio 9:16 (vertical)
- Resolución 1080x1920 (HD)
- Formato MP4

---

## ⏱️ Tiempo de Procesado

- **Shotstack rendering:** 1-3 minutos dependiendo de la duración del video
- **El script hace polling automático** cada 5 segundos
- **Timeout máximo:** 5 minutos

---

## 💰 Costos

### HeyGen Free Plan
- 3 videos/mes gratis
- Plan Creator: $29/mes (ilimitado)

### Shotstack Free Plan
- **20 renders/mes gratis** ✅
- Plan Lite: $19/mes (200 renders)

**💡 Tip:** Con Shotstack free puedes hacer 20 pruebas por mes sin costo!

---

## 🐛 Troubleshooting

### Error: "SHOTSTACK_API_KEY no configurada"
- Verifica que agregaste la API key en `.env.local`
- Reinicia el servidor: `npm run dev`

### Error: "Shotstack render failed"
- Verifica que la URL del video sea válida
- Asegúrate que el video sea accesible públicamente

### El video se ve cortado
- Ajusta el texto para que coincida con la duración real del video
- La duración se calcula en: ~2.5 palabras por segundo

### Los subtítulos no coinciden con el audio
- Usa el MISMO texto que usaste para generar el video original
- Ajusta la velocidad si es necesario (línea 87 de route.ts)

---

## 📚 Referencias

- [HeyGen Pricing](https://www.heygen.com/pricing)
- [Shotstack Documentation](https://shotstack.io/docs)
- [API Limits HeyGen](https://docs.heygen.com/reference/limits)

---

## ✨ Próximos Pasos

Una vez que hayas probado el post-procesado:

1. ✅ Si te gusta el resultado, el sistema lo aplicará automáticamente a todos los videos nuevos
2. ✅ Puedes ajustar los parámetros de zoom en `src/app/api/video/talking-avatar/route.ts`
3. ✅ Puedes personalizar el estilo de los subtítulos (colores, fuentes, posición)

**¡Disfruta creando contenido dinámico sin gastar créditos de HeyGen!** 🚀
