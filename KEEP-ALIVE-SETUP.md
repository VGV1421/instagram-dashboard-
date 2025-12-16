# 🤖 Automatización Keep-Alive para Supabase

Este sistema evita que tu proyecto de Supabase se pause después de 7 días sin uso.

---

## ✅ ¿Qué se creó?

1. **Endpoint Keep-Alive:** `/api/keep-alive`
   - Hace una query simple a Supabase cada vez que se llama
   - Mantiene la base de datos activa

2. **GitHub Action:** `.github/workflows/keep-alive.yml`
   - Automatización que llama al endpoint cada 5 días

---

## 🚀 Opción 1: GitHub Actions (Recomendado)

### ✅ Ventajas:
- ✅ 100% gratis
- ✅ Completamente automático
- ✅ No requiere servicios externos

### 📋 Pasos:

#### 1. Sube el código a GitHub

Si aún no lo has hecho:

```bash
cd C:\Users\Usuario\CURSOR\instagram-dashboard
git add .
git commit -m "Add keep-alive automation"
git push origin main
```

#### 2. Despliega a Vercel (o cualquier hosting)

**Opción A: Vercel (Recomendado)**

```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
cd C:\Users\Usuario\CURSOR\instagram-dashboard
vercel
```

Sigue las instrucciones y copia la URL de producción (ej: `https://tu-dashboard.vercel.app`)

**Opción B: Netlify, Railway, etc.**
- Similar proceso, sube el repo y despliega

#### 3. Actualiza la GitHub Action

Edita el archivo `.github/workflows/keep-alive.yml` y reemplaza:

```yaml
# Línea 21 - Reemplaza con tu URL real
RESPONSE=$(curl -s -w "\n%{http_code}" https://tu-dashboard.vercel.app/api/keep-alive)
```

Por tu URL de producción:

```yaml
RESPONSE=$(curl -s -w "\n%{http_code}" https://instagram-dashboard-xxx.vercel.app/api/keep-alive)
```

#### 4. Commit y Push

```bash
git add .github/workflows/keep-alive.yml
git commit -m "Update keep-alive URL"
git push origin main
```

#### 5. Verifica que funcione

- Ve a tu repo en GitHub
- Click en "Actions" (pestaña superior)
- Deberías ver el workflow "Keep Supabase Alive"
- Click en "Run workflow" para testearlo manualmente

---

## 🌐 Opción 2: UptimeRobot (Más Simple)

### ✅ Ventajas:
- ✅ No requiere GitHub ni deploy
- ✅ Setup en 2 minutos
- ✅ 50 monitores gratis

### 📋 Pasos:

#### 1. Despliega tu dashboard primero

Necesitas una URL pública (Vercel, Netlify, etc.)

```bash
# Con Vercel
vercel

# Tu URL será algo como:
# https://instagram-dashboard-xxx.vercel.app
```

#### 2. Crea cuenta en UptimeRobot

Ve a: https://uptimerobot.com/signUp

#### 3. Crea un Monitor

- Click en **"+ Add New Monitor"**
- **Monitor Type:** HTTP(s)
- **Friendly Name:** Supabase Keep-Alive
- **URL:** `https://tu-dashboard.vercel.app/api/keep-alive`
- **Monitoring Interval:** 5 días (120 horas)
  - Nota: Plan gratuito mínimo es cada 5 minutos, elige el máximo disponible
- Click **"Create Monitor"**

#### 4. Listo!

UptimeRobot llamará a tu endpoint automáticamente.

---

## 🌍 Opción 3: Cron-Job.org (Alternativa)

Similar a UptimeRobot:

1. Ve a: https://cron-job.org/en/
2. Crea cuenta gratis
3. Crea un cron job:
   - URL: `https://tu-dashboard.vercel.app/api/keep-alive`
   - Schedule: `0 0 */5 * *` (cada 5 días a medianoche)
4. Activa el job

---

## 🧪 Testing

### Probar el endpoint localmente:

```bash
curl http://localhost:3000/api/keep-alive
```

Deberías ver:

```json
{
  "success": true,
  "message": "Supabase is alive! 🚀",
  "timestamp": "2025-12-16T...",
  "hasData": true
}
```

### Probar en producción:

```bash
curl https://tu-dashboard.vercel.app/api/keep-alive
```

---

## ❓ FAQ

### ¿Cada cuánto debe ejecutarse?

**Respuesta:** Cada 5-6 días es suficiente. Supabase se pausa después de 7 días.

### ¿Cuánto cuesta?

**Respuesta:** $0. Todas las opciones son gratuitas.

### ¿Qué pasa si falla?

**Respuesta:**
- GitHub Actions te notificará por email
- UptimeRobot te enviará una alerta
- Puedes verificar manualmente visitando la URL

### ¿Puedo usar ambas opciones?

**Respuesta:** Sí, pero no es necesario. Elige una.

### ¿Funciona con localhost?

**Respuesta:** No. Necesitas desplegar a un hosting público (Vercel, Netlify, etc.)

---

## 📊 Monitoreo

### Ver logs en Vercel:

1. Ve a tu proyecto en Vercel Dashboard
2. Click en "Logs"
3. Busca las llamadas a `/api/keep-alive`

### Ver logs en GitHub Actions:

1. Ve a tu repo en GitHub
2. Click en "Actions"
3. Click en la ejecución más reciente
4. Revisa los logs

---

## 🔧 Troubleshooting

### Error: "fetch failed"

**Causa:** Supabase está pausado o las credenciales son incorrectas.

**Solución:**
1. Reactiva Supabase manualmente
2. Verifica las variables de entorno en Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`

### Error: "404 Not Found"

**Causa:** El endpoint no existe en producción.

**Solución:**
1. Verifica que el archivo `src/app/api/keep-alive/route.ts` existe
2. Redespliega: `vercel --prod`

### GitHub Action no se ejecuta

**Causa:** El repo es privado o no tiene permisos.

**Solución:**
1. Ve a Settings → Actions → General
2. Habilita "Allow all actions and reusable workflows"

---

## ✅ Checklist Final

- [ ] Endpoint `/api/keep-alive` funciona localmente
- [ ] Dashboard desplegado en Vercel/Netlify
- [ ] GitHub Action configurada CON la URL correcta
- [ ] O UptimeRobot configurado
- [ ] Testeado manualmente una vez
- [ ] Supabase está activo

---

**¡Listo! Supabase nunca más se pausará automáticamente.** 🎉
