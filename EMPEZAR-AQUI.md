# 🚀 EMPEZAR AQUÍ - Automatización Completa

## ✅ Lo que ya está configurado

1. ✅ **Endpoint API creado** - `/api/video/generate-from-audio`
2. ✅ **ElevenLabs configurado**
   - API Key: Guardada ✅
   - Voice ID: `3ekAN4FjFTd3LsBs8txD` ✅
3. ✅ **Google Drive configurado**
   - Carpeta de audios: `1MbsJB7c0qNSLJyXSd-FHxFp0m0NTzZEC` ✅
   - Carpeta de fotos sin usar: `1eowZdSmeW7dxQaRQgvp-bdLYYDGatOpY` ✅
   - Carpeta de fotos usadas: `1yKdyhkRbow83W3a67wAnw4rGHMqEN3KV` ✅
4. ✅ **Kling Avatar integrado** - Via Kie.ai
5. ✅ **Sistema de prompts optimizados** - Con IA

---

## ⚠️ Lo que FALTA para que funcione

### 1. Agregar Créditos en Kie.ai 💰

**CRÍTICO:** Sin esto no se pueden generar videos

**Acción:**
1. Ir a: https://kie.ai/api-key
2. Agregar mínimo **$10** (= 16 videos de 15s)
3. Con $25 = 41 videos
4. Con $50 = 83 videos

**Costo por video:** $0.60 (15 segundos, 720p)

---

### 2. Configurar Workflow en n8n 🔧

**Archivo de guía:** `GUIA-N8N-SETUP.md`

**Tiempo estimado:** 15-20 minutos

**Pasos:**
1. Abrir n8n: http://localhost:5678
2. Crear nuevo workflow
3. Agregar 4 nodos:
   - Supabase Trigger
   - ElevenLabs TTS
   - Google Drive Upload
   - HTTP Request (al endpoint local)
4. Conectar nodos
5. Activar workflow

**👉 Ver guía completa en:** `GUIA-N8N-SETUP.md`

---

## 🧪 Opción A: Probar ANTES de configurar n8n

Si quieres ver el sistema funcionando antes de configurar n8n:

### Pasos:

1. **Agregar créditos en Kie.ai** ($10 mínimo)

2. **Ejecutar test del endpoint:**
   ```bash
   node test-endpoint-generate-from-audio.js
   ```

   Esto:
   - Sube un audio de prueba a Drive
   - Llama al endpoint local
   - Genera el video con Kling Avatar
   - Te muestra el resultado

3. **Ver el video generado** en la URL que te muestra

4. **Si funciona** → Configurar n8n para automatizar todo

---

## 🎯 Opción B: Ir directo a la automatización

Si prefieres configurar todo de una vez:

### Pasos:

1. **Agregar créditos en Kie.ai** ($10 mínimo)

2. **Configurar n8n** (ver `GUIA-N8N-SETUP.md`)

3. **Probar con un post real:**
   - Aprobar un post en el dashboard
   - Esperar 3-5 minutos
   - Verificar que se generó el video

---

## 📊 Flujo Completo (una vez configurado)

```
┌─────────────────────────────────────────────────┐
│  1. Apruebas post en el dashboard               │
│     ↓                                            │
│  2. n8n detecta el post aprobado (automático)   │
│     ↓                                            │
│  3. n8n genera audio con ElevenLabs             │
│     • Usa tu voz personalizada                  │
│     • Voice ID: 3ekAN4FjFTd3LsBs8txD            │
│     ↓                                            │
│  4. n8n sube audio a Google Drive               │
│     • Carpeta: AUDIOS GENERADOS                 │
│     ↓                                            │
│  5. n8n llama al endpoint local                 │
│     • POST /api/video/generate-from-audio       │
│     ↓                                            │
│  6. Sistema descarga audio de Drive             │
│     ↓                                            │
│  7. Sistema obtiene foto aleatoria              │
│     • De "FOTOS AVATAR SIN USAR"                │
│     ↓                                            │
│  8. Sistema genera prompt optimizado            │
│     • Con IA (GPT-4)                            │
│     ↓                                            │
│  9. Sistema genera video con Kling Avatar       │
│     • Gestos naturales de manos ✅              │
│     • Sincronización labial perfecta ✅         │
│     • Movimientos faciales realistas ✅         │
│     • Espera: 3-5 minutos                       │
│     ↓                                            │
│  10. Sistema guarda video en Supabase           │
│     • Campo: suggested_media                    │
│     ↓                                            │
│  11. Sistema mueve foto a "USADAS"              │
│     ↓                                            │
│  12. Post queda listo para publicar             │
└─────────────────────────────────────────────────┘
```

**TODO AUTOMÁTICO** 🎉

---

## 💰 Costos Reales

| Concepto | Costo |
|----------|-------|
| ElevenLabs | **Gratis** (10,000 créditos/mes) |
| Kling Avatar | **$0.60** por video de 15s |
| Google Drive | **Gratis** |
| Supabase | **Gratis** (plan free) |
| n8n | **Gratis** (self-hosted) |
| **Total por video** | **$0.60** |

**Con $10 → 16 videos**
**Con $25 → 41 videos**
**Con $50 → 83 videos**

---

## 📁 Archivos Importantes

| Archivo | Propósito |
|---------|-----------|
| `GUIA-N8N-SETUP.md` | Guía paso a paso para configurar n8n |
| `test-endpoint-generate-from-audio.js` | Probar el endpoint sin n8n |
| `test-kling-video-corto.js` | Probar solo Kling Avatar |
| `FLUJO-N8N-ELEVENLABS-KLING.md` | Documentación del flujo completo |
| `.env.local` | Configuración (ya está todo) |
| `src/app/api/video/generate-from-audio/route.ts` | Endpoint API |

---

## 🐛 Troubleshooting Rápido

### "Créditos insuficientes"
→ Agregar créditos en https://kie.ai/api-key

### "No se encontraron fotos"
→ Subir fotos JPG/PNG a carpeta "FOTOS AVATAR SIN USAR"

### "ElevenLabs error"
→ Verificar API key en `.env.local`

### "Endpoint no responde"
→ Verificar que `npm run dev` esté corriendo

### "n8n no detecta cambios"
→ Verificar que el workflow esté "Active"

---

## ✅ Checklist Final

Antes de empezar, verifica:

- [ ] Créditos agregados en Kie.ai ($10 mínimo)
- [ ] Servidor corriendo: `npm run dev`
- [ ] Fotos en carpeta "FOTOS AVATAR SIN USAR"
- [ ] n8n corriendo: http://localhost:5678
- [ ] ElevenLabs API key válida
- [ ] Google Drive configurado

---

## 🎯 Próximo Paso

**Elige tu camino:**

### Camino A: Prueba Rápida (Recomendado)
1. Agregar créditos en Kie.ai
2. Ejecutar: `node test-endpoint-generate-from-audio.js`
3. Ver el video generado
4. Si funciona → Configurar n8n

### Camino B: Automatización Completa
1. Agregar créditos en Kie.ai
2. Configurar n8n (ver `GUIA-N8N-SETUP.md`)
3. Aprobar un post de prueba
4. Esperar el video

---

## 🔗 Enlaces Útiles

- **Dashboard:** http://localhost:3000
- **n8n:** http://localhost:5678
- **Kie.ai Credits:** https://kie.ai/api-key
- **ElevenLabs Voices:** https://elevenlabs.io/app/voice-library
- **Supabase Dashboard:** https://nwhdsboiojmqqfvbelwo.supabase.co

---

## 📞 Soporte

Si algo no funciona:
1. Ver los logs en la consola donde corre `npm run dev`
2. Revisar ejecuciones en n8n (Executions)
3. Verificar el checklist de arriba

---

**Estado:** ✅ Todo listo excepto créditos en Kie.ai

**Creado:** 2025-01-29
**Última actualización:** 2025-01-29

---

# 🎉 ¡Listo para Comenzar!

**Siguiente paso inmediato:**
👉 Agregar créditos en https://kie.ai/api-key

Después de eso, todo funciona automáticamente 🚀
