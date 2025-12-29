# 🔑 API KEYS A CONFIGURAR EN VERCEL

**Fecha:** 29 Diciembre 2025
**Estado:** ✅ Código desplegado - Solo falta configurar keys

---

## ✅ TODO EL CÓDIGO YA ESTÁ DESPLEGADO EN VERCEL

El sistema completo ya está en GitHub y Vercel lo está desplegando automáticamente.

**Solo necesitas agregar 3 API keys en Vercel.**

---

## 📋 PASO A PASO

### 1️⃣ IR A VERCEL

1. Ve a: https://vercel.com
2. Login con tu cuenta
3. Selecciona tu proyecto: `instagram-dashboard`
4. Click en "Settings" (arriba)
5. Click en "Environment Variables" (izquierda)

---

### 2️⃣ OBTENER API KEYS

#### A) KIE.AI (REQUERIDO)

**Qué es:** Plataforma que da acceso a 10 modelos de video AI (Kling, Runway, Veo, Sora, etc.)

**Cómo obtenerla:**
1. Ve a: https://kie.ai
2. Click "Sign Up" (arriba derecha)
3. Crea cuenta con Google o email
4. Verifica email
5. Una vez dentro, click en tu perfil (esquina superior derecha)
6. Click "API Keys"
7. Click "Create API Key"
8. Copia la key (empieza con `kie_`)

**Formato:** `kie_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

**Dónde pegarla en Vercel:**
- Name: `KIE_AI_API_KEY`
- Value: `kie_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx` (pega la key que copiaste)

---

#### B) OPENAI (YA DEBERÍAS TENERLA)

**Qué es:** Para el asistente selector AI (elige el mejor proveedor)

**Ya la tienes configurada, pero verifica:**
1. Ve a: https://platform.openai.com/api-keys
2. Debería haber una key activa
3. Si no, crea una nueva: "Create new secret key"
4. Copia la key (empieza con `sk-`)

**Formato:** `sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

**Dónde verificar/pegar en Vercel:**
- Name: `OPENAI_API_KEY`
- Value: `sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

---

#### C) ELEVENLABS (OPCIONAL - RECOMENDADO)

**Qué es:** Voz AI ultra-realista en español para los avatares

**Cómo obtenerla:**
1. Ve a: https://elevenlabs.io
2. Sign Up gratis (10,000 caracteres/mes gratis)
3. Una vez dentro, click en tu perfil (esquina superior derecha)
4. Click "Profile + API Keys"
5. Copia la API key

**Formato:** `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` (32 caracteres alfanuméricos)

**Dónde pegarla en Vercel:**
- Name: `ELEVENLABS_API_KEY`
- Value: `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

**¿Qué pasa si no la configuro?**
- El sistema usará TTS nativo de Kie.ai (voces de Microsoft Azure)
- Calidad ligeramente inferior
- Pero funciona perfectamente

---

### 3️⃣ AGREGAR EN VERCEL

Para cada API key:

1. En Vercel > Settings > Environment Variables
2. Click "Add New"
3. Name: (exactamente como se indica arriba)
4. Value: (pega la key copiada)
5. Environment: Selecciona **todas** (Production, Preview, Development)
6. Click "Save"

**Agregar estas 3:**

```
Name: KIE_AI_API_KEY
Value: kie_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
Environment: ✓ Production ✓ Preview ✓ Development

Name: OPENAI_API_KEY
Value: sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
Environment: ✓ Production ✓ Preview ✓ Development

Name: ELEVENLABS_API_KEY
Value: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
Environment: ✓ Production ✓ Preview ✓ Development
```

---

### 4️⃣ REDEPLOY

**IMPORTANTE:** Después de agregar las keys, debes hacer redeploy para que las variables se carguen.

1. Ve a: Deployments (en el menú superior)
2. Click en el deployment más reciente (el primero de la lista)
3. Click en los 3 puntos "..." (arriba a la derecha)
4. Click "Redeploy"
5. Click "Redeploy" en el modal de confirmación

**Espera 1-2 minutos hasta que veas "Ready"**

---

### 5️⃣ VERIFICAR QUE FUNCIONA

**Test 1: Verificar que las keys están configuradas**

```bash
curl https://tu-proyecto.vercel.app/api/video/generate-smart
```

**Debe retornar:**
```json
{
  "success": true,
  "status": {
    "kieAiConfigured": true,      ← Debe ser true
    "openaiConfigured": true,     ← Debe ser true
    "elevenLabsConfigured": true, ← Debe ser true (o false si no la configuraste)
    "ready": true                 ← Debe ser true
  }
}
```

**Test 2: Verificar el selector AI**

```bash
curl -X POST https://tu-proyecto.vercel.app/api/ai/provider-selector \
  -H "Content-Type: application/json" \
  -d '{
    "duration": 10,
    "video_type": "talking_head",
    "objective": "natural_gestures",
    "budget_priority": "medium"
  }'
```

**Debe retornar:**
```json
{
  "success": true,
  "selection": {
    "provider_id": "kling/v1-avatar-standard",
    "provider_name": "Kling AI Avatar V1 Standard",
    "estimated_cost": 0.28,
    ...
  }
}
```

---

## 🚨 ERRORES COMUNES

### Error: "kieAiConfigured: false"

**Causa:** No agregaste KIE_AI_API_KEY en Vercel

**Solución:**
1. Ve a https://kie.ai
2. Obtén tu API key
3. Agrégala en Vercel como `KIE_AI_API_KEY`
4. Redeploy

---

### Error: "openaiConfigured: false"

**Causa:** No agregaste OPENAI_API_KEY en Vercel

**Solución:**
1. Ve a https://platform.openai.com/api-keys
2. Copia tu API key (o crea una nueva)
3. Agrégala en Vercel como `OPENAI_API_KEY`
4. Redeploy

---

### Error: "Invalid API key"

**Causa:** La key está mal copiada o es inválida

**Solución:**
1. Verifica que copiaste la key completa (sin espacios al inicio/final)
2. Verifica que el nombre de la variable sea exacto (mayúsculas/minúsculas)
3. Genera una nueva key en la plataforma
4. Reemplaza en Vercel
5. Redeploy

---

### No veo cambios después de agregar las keys

**Causa:** No hiciste redeploy

**Solución:**
1. Vercel > Deployments
2. Click en el último deployment
3. ... > Redeploy
4. Espera 1-2 minutos

---

## 💰 LÍMITES GRATUITOS

### Kie.ai Free Tier
- **Créditos gratuitos:** ~$5 al mes
- **Suficiente para:** ~17 videos de talking head (10s)
- **Upgrade:** $20/mes para ~70 videos

### OpenAI (ya lo tienes)
- **Costo selector AI:** $0.002 por consulta
- **100 videos = $0.20**
- **Muy económico**

### ElevenLabs Free Tier
- **Caracteres gratuitos:** 10,000/mes
- **Suficiente para:** ~10-15 videos
- **Upgrade:** $5/mes para 30,000 caracteres

---

## 📊 SIGUIENTE PASO: N8N

Una vez que las API keys estén configuradas y verificadas:

1. Abre n8n
2. Importa el workflow: `n8n-workflow-kie-ai-smart.json`
3. Configura la variable `VERCEL_URL` en n8n
4. Activa el workflow
5. Haz un test

**Guía completa:** `SETUP-COMPLETO.md`

---

## ✅ CHECKLIST

- [ ] Cuenta Kie.ai creada
- [ ] API key Kie.ai obtenida
- [ ] API key Kie.ai agregada en Vercel como `KIE_AI_API_KEY`
- [ ] OPENAI_API_KEY verificada en Vercel
- [ ] (Opcional) ELEVENLABS_API_KEY agregada en Vercel
- [ ] Redeploy realizado
- [ ] Test 1 exitoso (GET /api/video/generate-smart retorna ready: true)
- [ ] Test 2 exitoso (POST /api/ai/provider-selector retorna provider)

**Una vez completado, continúa con:** `SETUP-COMPLETO.md` para configurar n8n

---

## 🎯 RESUMEN

**Solo 3 pasos:**
1. Obtener API keys (5 min)
2. Agregarlas en Vercel (2 min)
3. Redeploy (1 min)

**Total:** 8 minutos

**Después de esto, el sistema está 100% funcional y listo para generar videos automáticamente.**
