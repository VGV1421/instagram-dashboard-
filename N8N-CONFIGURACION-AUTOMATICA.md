# 🤖 Configuración n8n - 100% AUTOMÁTICO

## 🎯 Este workflow es COMPLETAMENTE AUTOMÁTICO
- ✅ Renueva el token cada 50 días
- ✅ Actualiza Vercel automáticamente
- ✅ Hace redeploy automático
- ✅ Te envía email solo para informarte
- ✅ **NO REQUIERE NINGUNA ACCIÓN MANUAL**

---

## 📋 Paso 1: Configurar Credenciales SMTP en n8n

1. Abre n8n en **http://localhost:5678**
2. Ve a **Settings** (⚙️) > **Credentials**
3. Haz clic en **Add Credential**
4. Busca y selecciona **SMTP**
5. Configura con estos datos:

```
Name: Resend SMTP
User: resend
Password: re_eyD99YB6_4HMJ41XCJG6YcEmJ717Cut6Y
Host: smtp.resend.com
Port: 587
SSL/TLS: false (desmarcado)
```

6. Haz clic en **Save**

---

## 📥 Paso 2: Importar el Workflow AUTOMÁTICO (SUPER-SIMPLE)

1. En n8n, haz clic en el menú (☰) arriba a la izquierda
2. Selecciona **Import from File**
3. Navega a:
   ```
   C:\Users\Usuario\CURSOR\instagram-dashboard\n8n-workflows\instagram-token-renewal-simple.json
   ```
4. Haz clic en **Open**

**Nota**: Este workflow es SUPER-SIMPLE - solo 5 nodos y llama a UN endpoint que hace TODO automáticamente.

---

## ⚙️ Paso 3: Configurar los Nodos de Email

### Nodo: "Send Success Email"
1. Haz clic en el nodo **"Send Success Email"** (sobre verde)
2. En el panel derecho, ve a **Credentials**
3. Selecciona **"Resend SMTP"**
4. Haz clic en **Save**

### Nodo: "Send Error Email"
1. Haz clic en el nodo **"Send Error Email"** (sobre rojo)
2. En el panel derecho, ve a **Credentials**
3. Selecciona **"Resend SMTP"**
4. Haz clic en **Save**

**Nota**: Solo estos 2 nodos necesitan configuración. El nodo principal ("Renew Token + Update Vercel + Redeploy") no necesita configuración.

---

## ✅ Paso 4: Probar el Workflow

### Probar el Nodo Principal:

#### Probar "Renew Token + Update Vercel + Redeploy"
1. Haz clic en el nodo **"Renew Token + Update Vercel + Redeploy"** (el globo)
2. Haz clic en **"Test step"** o **"Execute node"**
3. Deberías ver (puede tardar 30-60 segundos):
   ```json
   {
     "success": true,
     "message": "Token renovado y Vercel actualizado AUTOMATICAMENTE",
     "data": {
       "token_renewal": {
         "success": true,
         "expires_in_days": 60,
         "expires_at": "2026-02-16...",
         "token_type": "bearer"
       },
       "vercel_update": {
         "env_updated": true,
         "deployment_triggered": true,
         "deployment_url": "..."
       }
     }
   }
   ```

#### Probar el Workflow Completo
1. Haz clic en el botón **"Execute workflow"** arriba a la derecha
2. El workflow ejecutará:
   - Renueva el token ✅
   - Actualiza Vercel ✅
   - Hace redeploy ✅
   - Envía email de confirmación ✅
3. Deberías recibir un email en **vgvtoringana@gmail.com** en 1-2 minutos

---

## 🔄 Paso 5: Activar el Workflow

1. En la esquina superior derecha, cambia el interruptor de **"Inactive"** a **"Active"**
2. El workflow ahora se ejecutará automáticamente cada 50 días
3. ✅ **¡LISTO! TODO ES AUTOMÁTICO AHORA**

---

## 📧 ¿Qué Email Recibirás?

### Si TODO funciona correctamente:
```
Asunto: ✅ Token de Instagram renovado AUTOMATICAMENTE

🎉 ¡TOKEN RENOVADO AUTOMATICAMENTE!

El token de Instagram se renovó y actualizó en Vercel automáticamente.

📊 DETALLES DEL TOKEN:
- Expira en: 60 días
- Fecha de expiración: 2026-02-16
- Tipo: bearer

🚀 ACTUALIZACION DE VERCEL:
- Variable actualizada: SI
- Redeploy iniciado: SI

✅ NO SE REQUIERE NINGUNA ACCION MANUAL
```

### Si algo falla:
```
Asunto: ❌ ERROR en renovación automática de token

⚠️ ERROR EN LA RENOVACION AUTOMATICA

[Detalles del error y pasos para resolverlo manualmente]
```

---

## 🔍 Monitoreo

### Ver Logs del Workflow:
1. En n8n, ve a **Executions** en el menú izquierdo
2. Verás todas las ejecuciones del workflow
3. Haz clic en cualquiera para ver detalles

### Ver Logs en la Base de Datos:
- URL: https://instagram-dashboard-ten.vercel.app/api/n8n/log
- O directamente en Supabase tabla `automation_logs`

---

## 🎯 ¿Cómo Funciona el Flujo Automático?

```
Cada 50 días (automático)
         ↓
1. Renovar Token de Instagram
         ↓
2. Actualizar Token en Vercel
         ↓
3. Hacer Redeploy Automático
         ↓
4. Enviar Email de Confirmación
         ↓
5. Guardar Log en Base de Datos
```

**TODO ES AUTOMÁTICO - CERO INTERVENCIÓN MANUAL**

---

## ❓ Solución de Problemas

### Error: "VERCEL_API_TOKEN no configurado"
**Solución**: El token de Vercel ya está configurado en las variables de entorno de producción. Si ves este error, verifica que el deployment se haya completado correctamente.

### Error en "Send Success Email"
**Solución**: Verifica que configuraste las credenciales SMTP de Resend en n8n (Paso 3).

### Error: "Variables de Vercel no configuradas"
**Solución**: Las variables ya están en Vercel production. Espera a que el deployment se complete y vuelve a intentar.

### No llega el email
**Solución**: Revisa la carpeta de spam. El email viene de `onboarding@resend.dev`.

---

## 📊 Variables de Entorno Configuradas

Estas variables ya están configuradas en Vercel Production:

✅ `VERCEL_API_TOKEN` - Token para actualizar variables automáticamente
✅ `VERCEL_PROJECT_ID` - ID del proyecto en Vercel
✅ `VERCEL_TEAM_ID` - ID del team en Vercel
✅ `INSTAGRAM_ACCESS_TOKEN` - Token actual de Instagram
✅ `INSTAGRAM_APP_ID` - App ID de Facebook
✅ `INSTAGRAM_APP_SECRET` - App Secret de Facebook

---

## 🚀 Endpoints API Disponibles

### TODO-EN-UNO: Renovar + Actualizar + Redeploy (usado por n8n):
```bash
curl -X POST https://instagram-dashboard-ten.vercel.app/api/instagram/auto-renew
```
Este endpoint hace TODO automáticamente:
- ✅ Renueva el token de Instagram
- ✅ Actualiza la variable INSTAGRAM_ACCESS_TOKEN en Vercel
- ✅ Hace redeploy del proyecto en producción

### Renovar Token solamente:
```bash
curl -X POST https://instagram-dashboard-ten.vercel.app/api/instagram/refresh-token
```

### Actualizar Vercel manualmente:
```bash
curl -X POST https://instagram-dashboard-ten.vercel.app/api/vercel/update-env \
  -H "Content-Type: application/json" \
  -d '{"newToken": "NUEVO_TOKEN_AQUI"}'
```

### Ver Logs:
```bash
curl https://instagram-dashboard-ten.vercel.app/api/n8n/log
```

---

## ✨ Resumen

### Lo que hace el sistema AUTOMÁTICAMENTE:
1. ⏰ Se ejecuta cada 50 días (10 días antes de que expire el token)
2. 🔄 Renueva el token de Instagram
3. ☁️ Actualiza la variable en Vercel
4. 🚀 Hace redeploy del proyecto
5. 📧 Te envía un email informativo
6. 📝 Guarda log en la base de datos

### Lo que TÚ tienes que hacer:
**NADA** - Solo revisar el email de confirmación cada 50 días

---

## 🎉 ¡TODO LISTO!

Tu dashboard ahora tiene renovación de token **100% AUTOMÁTICA**.

**Dashboard:** https://instagram-dashboard-ten.vercel.app
**n8n:** http://localhost:5678

**Próxima renovación automática:** En 50 días desde hoy

**Estado:** ✅ COMPLETAMENTE AUTOMATIZADO
