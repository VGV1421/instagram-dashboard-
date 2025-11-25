# 📨 Guía: Sistema de DMs Automáticos en Instagram

## ¿Qué hace este sistema?

Cuando alguien comenta en tus posts de Instagram con una palabra clave (ej: "INFO", "IA", "CURSO"), el sistema **automáticamente** le envía un mensaje directo con un documento o guía.

---

## 🎯 Palabras clave configuradas

| Keyword | Documento | Descripción |
|---------|-----------|-------------|
| INFO | Info General | Información sobre tu academia |
| IA | Herramientas IA | Guía de herramientas de IA gratuitas |
| MARKETING | Marketing Digital | Guía completa de marketing digital |
| GUIA | Guía Completa | Guía para empezar negocio digital |
| CURSO | Info del Curso | Información completa del curso |

---

## 📋 Requisitos previos

### 1. Cuenta de Instagram Business o Creator
Tu cuenta debe ser Business o Creator (no personal).

**Verificar:**
1. Abre Instagram en el móvil
2. Ve a tu perfil → Menú (☰) → Settings
3. Debe aparecer "Account type: Business" o "Creator"

**Convertir a Business:**
1. Settings → Account → Switch to professional account
2. Seleccionar "Business" o "Creator"

### 2. Facebook Page vinculada
Tu Instagram debe estar conectada a una Facebook Page.

**Verificar/Conectar:**
1. Instagram → Settings → Account → Linked accounts → Facebook
2. O desde Facebook: Settings → Instagram → Connect account

---

## 🔧 Configuración paso a paso

### Paso 1: Crear Facebook App

1. Ve a: https://developers.facebook.com/apps/
2. Click en **"Create App"**
3. Selecciona tipo: **"Business"**
4. Nombre de app: `Instagram Dashboard - [TuNombre]`
5. Email de contacto: `vgvtoringana@gmail.com`
6. Click **"Create App"**

### Paso 2: Agregar producto Instagram

1. En el dashboard de tu app, busca **"Instagram"**
2. Click **"Set Up"**
3. En "Instagram Basic Display" → Skip (no lo necesitamos)
4. En "Instagram Messaging" → **Configure**

### Paso 3: Generar Access Token

#### Opción A: Graph API Explorer (Recomendado)
1. Ve a: https://developers.facebook.com/tools/explorer/
2. Selecciona tu app en el dropdown
3. En "User or Page", selecciona tu **Instagram Business Account**
4. En "Permissions", agrega:
   - `instagram_basic`
   - `instagram_manage_comments`
   - `instagram_manage_messages` ⚠️ IMPORTANTE
   - `pages_show_list`
   - `pages_read_engagement`
5. Click **"Generate Access Token"**
6. **Convertir a Long-Lived Token:**
   ```bash
   curl -i -X GET "https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=TU_APP_ID&client_secret=TU_APP_SECRET&fb_exchange_token=TU_SHORT_LIVED_TOKEN"
   ```
7. Copia el `access_token` devuelto (válido por 60 días)

#### Opción B: Usar el helper de tu proyecto
1. Ve a: `http://localhost:3000/setup-token`
2. Sigue las instrucciones

### Paso 4: Obtener Instagram User ID

```bash
curl -i -X GET "https://graph.facebook.com/v18.0/me?fields=id,username&access_token=TU_ACCESS_TOKEN"
```

O usa: https://developers.facebook.com/tools/explorer/

### Paso 5: Configurar variables de entorno

Edita tu archivo `.env.local`:

```env
# Instagram Graph API
INSTAGRAM_APP_ID=tu_app_id_aqui
INSTAGRAM_APP_SECRET=tu_app_secret_aqui
INSTAGRAM_ACCESS_TOKEN=tu_long_lived_token_aqui
INSTAGRAM_USER_ID=tu_instagram_user_id
INSTAGRAM_WEBHOOK_VERIFY_TOKEN=mi_token_secreto_123

# App URL (para webhooks)
NEXT_PUBLIC_APP_URL=https://tu-dominio.com
# O para desarrollo local con ngrok:
# NEXT_PUBLIC_APP_URL=https://abc123.ngrok-free.dev
```

### Paso 6: Configurar Webhook (para desarrollo local)

#### 6.1 Instalar ngrok
```bash
# Windows (con chocolatey)
choco install ngrok

# O descarga desde: https://ngrok.com/download
```

#### 6.2 Ejecutar ngrok
```bash
ngrok http 3000
```

Copia la URL que te da (ej: `https://abc123.ngrok-free.dev`)

#### 6.3 Configurar en Facebook App
1. Ve a tu app en Meta for Developers
2. **Settings > Basic**:
   - Privacy Policy URL: `https://vgv1421.github.io/instagram-dashboard-/PRIVACY-POLICY.html`
   - Terms of Service URL: `https://vgv1421.github.io/instagram-dashboard-/TERMS-OF-SERVICE.html`
   - Save Changes
3. **Products > Instagram > Configuration > Webhooks**
4. Click **"Add Callback URL"**:
   - Callback URL: `https://abc123.ngrok-free.dev/api/instagram/webhook`
   - Verify Token: `mi_token_secreto_123` (el mismo del .env)
5. Click **"Verify and Save"**
6. Subscribe to:
   - ✅ `comments`
   - ✅ `messages`
7. Save

### Paso 7: Solicitar permisos avanzados (App Review)

⚠️ **IMPORTANTE:** Para enviar DMs en producción, necesitas aprobación de Meta.

1. Ve a **App Review > Permissions and Features**
2. Solicita: `instagram_manage_messages`
3. Explica tu uso:
   ```
   Nuestra app envía contenido educativo (guías PDF) vía DM cuando
   usuarios comentan con palabras clave específicas en nuestros posts.

   Ejemplo: Usuario comenta "INFO" → Recibe DM con guía gratuita.

   No enviamos spam. Solo respondemos a solicitudes explícitas.
   ```
4. Proporciona video de demostración
5. Espera aprobación (1-3 días)

---

## 📄 Subir tus documentos

### Opción 1: Google Drive (Recomendado)
1. Sube tu PDF a Google Drive
2. Click derecho → Compartir → Obtener enlace
3. Cambiar a **"Cualquiera con el enlace"**
4. Copiar URL

### Opción 2: GitHub Pages
1. Sube tus PDFs al repositorio:
   ```bash
   cd instagram-dashboard
   git checkout gh-pages
   cp /ruta/a/tu/documento.pdf ./
   git add documento.pdf
   git commit -m "Add documento.pdf"
   git push origin gh-pages
   ```
2. Accesible en: `https://vgv1421.github.io/instagram-dashboard-/documento.pdf`

### Opción 3: Dropbox
1. Sube a Dropbox
2. Click en Compartir → Crear enlace
3. Cambiar `?dl=0` por `?dl=1` en el enlace

---

## ⚙️ Configurar documentos

Edita: `src/lib/instagram/document-config.ts`

```typescript
{
  keyword: 'MIPALABRA',
  message: `¡Hola! 👋

Aquí tienes el documento que solicitaste.

¡Disfruta!`,
  documentUrl: 'https://tu-url-del-documento.pdf',
  documentType: 'guide'
}
```

---

## 🧪 Probar el sistema

### 1. Verificar webhook
```bash
curl -X GET "http://localhost:3000/api/instagram/webhook?hub.mode=subscribe&hub.verify_token=mi_token_secreto_123&hub.challenge=test_challenge"
# Debe devolver: test_challenge
```

### 2. Test de DM manual
Ve a: `http://localhost:3000/documentos` → Tab "Probar Envío"

### 3. Test real
1. Publica un post en Instagram
2. Comenta (desde OTRA cuenta): "INFO"
3. El sistema debe enviarte un DM automáticamente

⚠️ **Recuerda:** Instagram NO envía webhooks cuando TÚ comentas en TUS propios posts. Debe ser otro usuario.

---

## 🔍 Troubleshooting

### Error: "Permission denied"
**Causa:** No tienes permiso `instagram_manage_messages`
**Solución:** Solicitar en App Review (ver Paso 7)

### Error: "Webhook verification failed"
**Causa:** Token no coincide
**Solución:** Verificar que `INSTAGRAM_WEBHOOK_VERIFY_TOKEN` en .env coincida con el configurado en Facebook

### No llegan webhooks
**Causa:** ngrok cerrado o URL cambió
**Solución:**
1. Verificar que ngrok esté corriendo
2. Actualizar Callback URL en Facebook si cambió

### DM no se envía
**Checklist:**
- ✅ Access token válido (no expirado)
- ✅ Permiso `instagram_manage_messages` aprobado
- ✅ Cuenta de Instagram es Business/Creator
- ✅ `INSTAGRAM_USER_ID` correcto
- ✅ Webhook configurado correctamente

---

## 📊 Monitoreo

### Ver logs en tiempo real
```bash
# Terminal 1: Next.js dev server
npm run dev

# Terminal 2: Logs de webhooks
tail -f .next/development.log
```

### Ver DMs enviados
Ve a: Supabase Dashboard → Table Editor → `automation_logs`
Filtra por: `workflow_name = 'instagram-dm-sent'`

---

## 🚀 Despliegue a producción

### 1. Configurar dominio real

En `.env.production`:
```env
NEXT_PUBLIC_APP_URL=https://tu-dominio.com
```

### 2. Actualizar webhook en Facebook
1. Products > Instagram > Webhooks
2. Edit Callback URL
3. Cambiar a: `https://tu-dominio.com/api/instagram/webhook`
4. Verify and Save

### 3. Renovar Access Token antes de expirar
Los tokens expiran en 60 días. Configura un recordatorio o implementa renovación automática.

---

## 💡 Tips

1. **Mensajes personalizados:** Usa el username del usuario en el mensaje
2. **Rate limits:** Instagram limita a ~100 DMs por hora
3. **Múltiples keywords:** Un documento puede tener varios keywords
4. **Análisis:** Revisa qué keywords generan más conversiones

---

## 📞 Soporte

Si tienes problemas:
1. Revisa logs en la consola del navegador
2. Revisa logs del servidor Next.js
3. Verifica configuración en Meta for Developers
4. Contacta: vgvtoringana@gmail.com
