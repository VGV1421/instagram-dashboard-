# 🎭 Cómo Probar Kling AI Avatar 2.0 con Google Drive

## ✅ Audio YA GENERADO

El audio está listo en:
```
C:\Users\Usuario\CURSOR\instagram-dashboard\temp\kling-audio-for-drive.mp3
```

## 📤 Paso 1: Sube el Audio a Google Drive

1. **Abre Google Drive:** https://drive.google.com

2. **Sube el archivo:**
   - Arrastra `kling-audio-for-drive.mp3` a Drive
   - O usa el botón "Nuevo" > "Subir archivo"

3. **Hazlo PÚBLICO:**
   - Click derecho en el archivo
   - Selecciona "Compartir" o "Share"
   - Click en "Change to anyone with the link"
   - Asegúrate que diga "**Anyone with the link CAN VIEW**"
   - Click "Done"

4. **Copia el FILE ID:**
   - Click derecho > "Get link" o "Obtener enlace"
   - Verás algo como:
     ```
     https://drive.google.com/file/d/1ABC123xyz456/view?usp=sharing
     ```
   - Copia SOLO el FILE ID: `1ABC123xyz456`

## 🚀 Paso 2: Ejecuta Kling AI

Ejecuta este comando reemplazando `TU_FILE_ID` por el ID que copiaste:

```bash
node test-kling-final.js TU_FILE_ID
```

**Ejemplo:**
```bash
node test-kling-final.js 1ABC123xyz456
```

## ⏳ Paso 3: Espera 3-5 Minutos

El script mostrará:
```
🎭 Generando video con Kling AI...
   ✅ Tarea creada: XXXX
   ⏳ Estado: processing (1/60)
   ⏳ Estado: processing (2/60)
   ...
   ✅ Estado: completed

🎉 ¡VIDEO GENERADO!
📹 URL: https://kling.../video.mp4
```

## 💡 Lo Que Obtendrás

- ✅ **Gestos naturales de manos** (que pedías!)
- ✅ **Movimiento corporal**
- ✅ **Expresiones faciales avanzadas**
- ✅ **Lip-sync perfecto**
- ✅ **Calidad 1080p**
- ✅ **Sin marca de agua**

**Costo:** ~$1.20 por este video de 20 segundos

---

## 🔄 Archivos Generados

- ✅ **Foto de Drive:** Ya seleccionada automáticamente
- ✅ **Audio extraído:** `temp/kling-audio-for-drive.mp3`
- 📤 **Pendiente:** Subir audio a Drive y obtener FILE ID
