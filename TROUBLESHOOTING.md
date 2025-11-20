# Troubleshooting - Instagram Dashboard

## Problema: Servidor no inicia o está en error constantemente

### Síntomas
- Página muestra error 500
- Puerto 3000 en uso
- Múltiples procesos Node.js corriendo
- Errores de lockfile en Next.js

### Solución Rápida

1. **Detener TODOS los procesos de Node.js:**
```bash
taskkill /F /IM node.exe
```

2. **Esperar 2-3 segundos:**
```bash
sleep 3
```

3. **Limpiar caché de Next.js:**
```bash
cd C:\Users\Usuario\CURSOR\instagram-dashboard
rm -rf .next .turbopack
```

4. **Iniciar servidor limpio:**
```bash
npm run dev
```

### Usando el Script Automático

Puedes usar el script `restart-server.sh` que hace todo automáticamente:

```bash
cd C:\Users\Usuario\CURSOR\instagram-dashboard
bash restart-server.sh
npm run dev
```

## Advertencias Comunes (NO son errores)

### ⚠️ Port 3000 is in use
**Causa:** Otro proceso está usando el puerto 3000
**Solución:** Sigue los pasos de "Solución Rápida" arriba

### ⚠️ Multiple lockfiles detected
**Causa:** Existe un package-lock.json en directorio padre
**Impacto:** Solo advertencia, no afecta funcionalidad
**Solución:** Se puede ignorar o eliminar lockfile de `C:\Users\Usuario\package-lock.json`

### ⚠️ Middleware file convention is deprecated
**Causa:** Next.js 16 deprecó el nombre "middleware"
**Impacto:** Solo advertencia, funciona normalmente
**Solución:** En futuro renombrar a "proxy.ts" cuando sea necesario

## Problemas con OpenAI API

### Error: OpenAI API key not configured

**Causa:** Variable de entorno no configurada
**Solución:**
1. Verifica que `.env.local` existe
2. Verifica que tiene: `OPENAI_API_KEY=sk-...`
3. Reinicia el servidor después de agregar la variable

## Verificar que Todo Funciona

Prueba estas URLs en tu navegador:
- http://localhost:3000 - Home
- http://localhost:3000/tendencias - Tendencias
- http://localhost:3000/insights - Insights
- http://localhost:3000/generator - Generador IA (NUEVO)
- http://localhost:3000/scripts - Scripts

Todas deberían cargar sin errores.

## Consejos para Prevenir Problemas

1. **NO ejecutar múltiples `npm run dev` al mismo tiempo**
2. **Siempre matar procesos antes de reiniciar:**
   ```bash
   taskkill /F /IM node.exe && npm run dev
   ```
3. **Limpiar caché si hay cambios raros:**
   ```bash
   rm -rf .next .turbopack
   ```
4. **Verificar puerto antes de iniciar:**
   ```bash
   netstat -ano | findstr :3000
   ```

## Estado Actual del Proyecto

✅ Todas las páginas funcionando
✅ API de generación de captions con IA
✅ Integración con OpenAI GPT-4o-mini
✅ Análisis de hashtags
✅ Servidor corriendo en puerto 3000

**Última actualización:** 2025-11-20
