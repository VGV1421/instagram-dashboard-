# Configuración de Instagram Webhooks para Comentarios (GRATIS)

## OBJETIVO
Recibir notificaciones automáticas cuando alguien comenta en tus posts para enviar documentos automáticamente.

---

## PASO 1: Crear Facebook App (5 minutos)

1. Ve a: https://developers.facebook.com/apps
2. Click **"Crear app"**
3. Selecciona: **"Empresa"** o **"Consumidor"**
4. Nombre de la app: `Instagram Automation` (o el que prefieras)
5. Email de contacto: tu email
6. Click **"Crear app"**

---

## PASO 2: Añadir Instagram Basic Display (3 minutos)

1. En el dashboard de tu app, busca **"Instagram"** en productos
2. Click **"Configurar"** en **"Instagram Basic Display"**
3. Scroll down y click **"Crear nueva app de Instagram"**
4. Completa:
   - **Display Name**: `Instagram Automation`
   - **Valid OAuth Redirect URIs**: `https://tu-dominio.com/auth/callback`
   - **Deauthorize Callback URL**: `https://tu-dominio.com/auth/deauthorize`
   - **Data Deletion Request URL**: `https://tu-dominio.com/auth/delete`
5. Click **"Guardar cambios"**

---

## PASO 3: Obtener Token de Acceso (10 minutos)

### 3.1 Convertir cuenta a Business/Creator
1. Abre Instagram App en tu móvil
2. Ve a: Perfil → Menú → Configuración → Cuenta
3. Click **"Cambiar a cuenta profesional"**
4. Elige: **Creador** o **Empresa**

### 3.2 Vincular a Facebook Page
1. Ve a: https://www.facebook.com/pages/create
2. Crea una página de Facebook (si no tienes)
3. En Instagram App: Configuración → Cuenta → Vincular página de Facebook

### 3.3 Obtener el token
1. Ve a: https://developers.facebook.com/tools/explorer
2. Selecciona tu app en el dropdown
3. Click **"Generar token de acceso"**
4. Selecciona tu página de Facebook
5. Permisos necesarios:
   - ✅ `instagram_basic`
   - ✅ `instagram_manage_comments`
   - ✅ `instagram_manage_messages`
   - ✅ `pages_read_engagement`
   - ✅ `pages_manage_metadata`
6. Click **"Generar token"**
7. **COPIA EL TOKEN** (lo necesitarás después)

### 3.4 Obtener tu Instagram Business Account ID
Ejecuta esta petición en Graph API Explorer:
```
GET /me/accounts?fields=instagram_business_account
```

Copia el `instagram_business_account.id`

---

## PASO 4: Configurar Webhooks (5 minutos)

### 4.1 Preparar endpoint en n8n
1. Abre n8n: http://localhost:5678
2. Crea nuevo workflow: **"Instagram Comment Handler"**
3. Añade nodo: **Webhook**
4. Configuración:
   - HTTP Method: `POST`
   - Path: `/instagram/webhook`
   - Authentication: `None` (por ahora)
5. Copia la **Webhook URL** (ej: `http://tu-ngrok.com/webhook/instagram`)

### 4.2 Exponer n8n públicamente (necesario para webhooks)

**Opción A: ngrok (recomendado para pruebas)**
```bash
# Instalar ngrok
winget install ngrok

# Exponer n8n
ngrok http 5678
```
Copia la URL https que te da (ej: `https://abc123.ngrok.io`)

**Opción B: Cloudflare Tunnel (gratis, permanente)**
```bash
# Instalar cloudflared
winget install Cloudflare.cloudflared

# Crear túnel
cloudflared tunnel --url http://localhost:5678
```

### 4.3 Registrar webhook en Facebook
1. Ve a: https://developers.facebook.com/apps → Tu App → Webhooks
2. Click **"Configurar webhooks"**
3. Selecciona: **Instagram**
4. Callback URL: `https://tu-ngrok.com/webhook/instagram`
5. Verify Token: escribe cualquier texto (ej: `mi_token_secreto_123`)
6. Click **"Verificar y guardar"**

### 4.4 Suscribirse a eventos
En la sección de Webhooks:
1. Click **"Suscribirse a este objeto"** en **Instagram**
2. Selecciona:
   - ✅ `comments` (para recibir comentarios)
   - ✅ `messages` (opcional, para DMs)
3. Click **"Suscribirse"**

---

## PASO 5: Actualizar variables de entorno

Añade a tu `.env.local`:
```bash
# Instagram Graph API
INSTAGRAM_ACCESS_TOKEN=tu_token_aqui
INSTAGRAM_BUSINESS_ACCOUNT_ID=tu_account_id_aqui

# Webhook verification
INSTAGRAM_WEBHOOK_VERIFY_TOKEN=mi_token_secreto_123
```

---

## PASO 6: Probar el webhook (2 minutos)

1. Haz un comentario en uno de tus posts de Instagram
2. Revisa los logs de n8n
3. Deberías ver el payload del comentario

**Ejemplo de payload:**
```json
{
  "object": "instagram",
  "entry": [{
    "id": "tu_ig_account_id",
    "changes": [{
      "field": "comments",
      "value": {
        "id": "comment_id",
        "text": "INFO",
        "from": {
          "id": "user_id",
          "username": "usuario123"
        }
      }
    }]
  }]
}
```

---

## PROBLEMAS COMUNES

### ❌ "URL no es accesible"
- Asegúrate de que ngrok/cloudflare esté corriendo
- La URL debe ser HTTPS
- Facebook debe poder acceder a tu servidor

### ❌ "Token inválido"
- El token expira cada 60 días
- Genera un token de larga duración:
```
GET /oauth/access_token?grant_type=fb_exchange_token
  &client_id=TU_APP_ID
  &client_secret=TU_APP_SECRET
  &fb_exchange_token=TU_TOKEN_CORTO
```

### ❌ No recibo webhooks
- Verifica que estés suscrito a "comments"
- Comenta en un post tuyo (no de otros)
- Revisa los logs de n8n

---

## SIGUIENTE PASO

Una vez configurado, continúa con:
- **Crear workflow en n8n** (PASO 2 de la implementación)

---

## REFERENCIA

- Docs oficiales: https://developers.facebook.com/docs/instagram-api/webhooks
- Graph API Explorer: https://developers.facebook.com/tools/explorer
- Permisos necesarios: https://developers.facebook.com/docs/instagram-api/overview#permissions
