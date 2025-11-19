# 🔑 GUÍA COMPLETA: Renovar Token de Instagram (PASO A PASO)

**Última actualización:** 18 de noviembre de 2025
**Tiempo estimado:** 15-20 minutos
**Dificultad:** Media

---

## 📋 **ANTES DE EMPEZAR** - Requisitos

✅ Tener una cuenta de Facebook (la que creó la app de Meta)
✅ Tener acceso a la cuenta de Instagram @digitalmindmillonaria
✅ Ser **ADMIN** de la app de Meta (no solo Developer)
✅ Tener Instagram en tu móvil instalado y con sesión iniciada

---

## 🎯 **OBJETIVO**

Obtener un **token de larga duración (60 días)** para que tu dashboard pueda acceder a los datos reales de Instagram sin usar datos de demostración.

---

## 📱 **MÉTODO RECOMENDADO: Instagram Basic Display API**

Este es el método MÁS FÁCIL y CONFIABLE para cuentas personales de Instagram.

---

## 🚀 **PASO 1: Abrir Meta for Developers**

### 1.1 Ve a la consola de desarrolladores

```
URL: https://developers.facebook.com/apps
```

### 1.2 Inicia sesión
- Usa la cuenta de Facebook que creó la app
- Si te pide verificación en dos pasos, complétala

### 1.3 Localiza tu app
- Deberías ver tu app con ID: **777593705310683**
- Nombre de la app: (verifica cuál es)
- Haz clic en la app para abrirla

---

## 🔧 **PASO 2: Configurar Instagram Basic Display**

### 2.1 Agregar el producto (si no está)

1. En el menú lateral izquierdo, busca **"Add Product"** o **"Agregar producto"**
2. Busca **"Instagram Basic Display"**
3. Haz clic en **"Set Up"** o **"Configurar"**

**✅ Si ya está agregado:**
- Ve directamente a **"Instagram Basic Display"** en el menú lateral
- Luego haz clic en **"Basic Display"**

### 2.2 Configuración básica

**IMPORTANTE:** Asegúrate de que estos campos estén configurados:

| Campo | Valor |
|-------|-------|
| **Valid OAuth Redirect URIs** | `https://localhost/` |
| **Deauthorize Callback URL** | `https://localhost/` |
| **Data Deletion Request URL** | `https://localhost/` |

> ⚠️ **Nota:** Estos URLs son obligatorios pero NO se usan para generar tokens.

**Haz clic en "Save Changes" si hiciste cambios.**

---

## 👥 **PASO 3: Agregar Instagram Tester (CRÍTICO)**

Este es el paso donde más personas fallan. Sigue EXACTAMENTE estos pasos:

### 3.1 En Meta for Developers

1. Ve a **Instagram Basic Display** → **Basic Display**
2. Baja hasta la sección **"User Token Generator"**
3. Haz clic en **"Add or Remove Instagram Testers"**
4. Se abrirá una nueva pestaña

### 3.2 Agregar el tester

1. En la nueva pestaña, haz clic en **"Add Instagram Testers"**
2. Escribe el nombre de usuario de Instagram: **digitalmindmillonaria**
3. Haz clic en **"Submit"** o **"Enviar"**
4. Deberías ver un mensaje de confirmación

**✅ Checkpoint:** Deberías ver a @digitalmindmillonaria en la lista de "Instagram Testers"

### 3.3 Aceptar la invitación en Instagram (MÓVIL)

**⚠️ ESTE PASO ES OBLIGATORIO**

1. **Abre Instagram en tu móvil** (NO en navegador)
2. Ve a **Perfil** (icono de tu foto)
3. Toca el menú **☰** (tres líneas)
4. Ve a **Settings** o **Configuración**
5. Toca **Apps and Websites** o **Apps y sitios web**
6. Busca **"Tester Invites"** o **"Invitaciones de Tester"**
7. Deberías ver una invitación de tu app de Meta
8. **Toca "Accept"** o **"Aceptar"**

**✅ Checkpoint:** La invitación desaparece de "Tester Invites" y aparece en "Active"

---

## 🎫 **PASO 4: Generar Token de Corta Duración (1 hora)**

### 4.1 Volver a Meta for Developers

1. Vuelve a la pestaña de **Meta for Developers**
2. Ve a **Instagram Basic Display** → **Basic Display**
3. Baja hasta **"User Token Generator"**

### 4.2 Generar el token

1. Haz clic en **"Generate Token"** junto a @digitalmindmillonaria
2. Se abrirá una ventana popup de Instagram
3. **Inicia sesión** con @digitalmindmillonaria si te lo pide
4. Verás una pantalla de autorización que dice algo como:
   ```
   "[Nombre de tu App] would like to:"
   - Access your basic information
   - Access your photos, videos and media
   ```
5. Haz clic en **"Authorize"** o **"Autorizar"**

### 4.3 Copiar el token

1. Se cerrará el popup y aparecerá un token en la página
2. **Copia TODO el token** (empieza con algo como `IGQW` o `IGQ`)
3. Guárdalo temporalmente en un archivo de texto

**✅ Checkpoint:** Tienes un token que empieza con `IGQW` o `IGQ`

**⚠️ IMPORTANTE:** Este token solo dura **1 hora**. Necesitas convertirlo a uno de larga duración en el siguiente paso.

---

## ⏰ **PASO 5: Convertir a Token de Larga Duración (60 días)**

### 5.1 Preparar la URL

Copia esta URL y pégala en un editor de texto:

```
https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=aa8f1ee30472de16c7b985b9c06552bd&access_token=TU_TOKEN_AQUI
```

### 5.2 Reemplazar el token

1. Reemplaza `TU_TOKEN_AQUI` con el token que copiaste en el Paso 4.3
2. La URL final debería verse así:

```
https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=aa8f1ee30472de16c7b985b9c06552bd&access_token=IGQW...tu_token_completo...
```

### 5.3 Hacer la petición

1. **Copia la URL completa**
2. **Pégala en la barra de direcciones** de tu navegador
3. **Presiona Enter**

### 5.4 Obtener el token de larga duración

Verás una respuesta JSON como esta:

```json
{
  "access_token": "IGQW...NUEVO_TOKEN_LARGO...",
  "token_type": "bearer",
  "expires_in": 5184000
}
```

**Copia SOLO el valor de `access_token`** (el nuevo token largo)

**✅ Checkpoint:** Tienes un nuevo token que dura 60 días

---

## ✅ **PASO 6: Probar el Token**

### 6.1 Abrir la página de prueba

1. Asegúrate de que tu servidor está corriendo:
   ```bash
   cd C:\Users\Usuario\CURSOR\instagram-dashboard
   npm run dev
   ```

2. Abre en tu navegador:
   ```
   http://localhost:3000/setup-token
   ```

### 6.2 Probar el token

1. En la página, busca la sección **"4. Probar Nuevo Token"**
2. Pega el token de larga duración en el campo
3. Haz clic en **"Probar Token"**

**Si funciona:**
- ✅ Verás un mensaje de éxito con tu nombre de usuario
- ✅ Continúa al Paso 7

**Si NO funciona:**
- ❌ Revisa los errores comunes al final de este documento
- ❌ Vuelve a intentar desde el Paso 3

---

## 💾 **PASO 7: Guardar el Token en .env.local**

### 7.1 Abrir el archivo

```bash
# Abre el archivo .env.local en tu editor
code C:\Users\Usuario\CURSOR\instagram-dashboard\.env.local
```

O ábrelo manualmente con cualquier editor de texto.

### 7.2 Reemplazar el token

Busca la línea que dice:

```env
INSTAGRAM_ACCESS_TOKEN=EAALDN6SVqdsBP0ZA44W8Vxtm3bpjZBZAa...
```

Reemplázala con tu nuevo token:

```env
INSTAGRAM_ACCESS_TOKEN=IGQW...TU_NUEVO_TOKEN_DE_LARGA_DURACION...
```

### 7.3 Guardar y reiniciar

1. **Guarda el archivo** (Ctrl + S)
2. **Detén el servidor** de Next.js (Ctrl + C en la terminal)
3. **Inicia el servidor** de nuevo:
   ```bash
   npm run dev
   ```

---

## 🧪 **PASO 8: Verificar que Funciona**

### 8.1 Probar en el dashboard

1. Abre tu dashboard:
   ```
   http://localhost:3000
   ```

2. **NO deberías ver** el banner naranja que dice "Usando datos de demostración"

3. Haz clic en el botón **"Guardar en Supabase"**

4. Deberías ver una notificación de éxito con tus posts reales

### 8.2 Verificar en la consola

Abre las herramientas de desarrollador (F12) y ve a la pestaña "Console".

**NO deberías ver errores** como:
- ❌ "Invalid OAuth access token"
- ❌ "Token is expired"

**Deberías ver:**
- ✅ Logs de sincronización exitosa
- ✅ Datos reales de Instagram

---

## ❌ **ERRORES COMUNES Y SOLUCIONES**

### Error 1: "Invalid OAuth access token - Cannot parse access token"

**Causas posibles:**
- ❌ El token está mal copiado (falta un carácter)
- ❌ El token expiró (los de 1 hora duran poco)
- ❌ Copiaste el token de corta duración en lugar del de larga duración

**Solución:**
1. Vuelve al **Paso 5** y genera un nuevo token de larga duración
2. Asegúrate de copiar el token COMPLETO sin espacios al inicio/final
3. Verifica que usaste el `access_token` de la respuesta JSON del Paso 5.4

---

### Error 2: "Instagram account not connected to this app"

**Causas posibles:**
- ❌ No aceptaste la invitación de Tester en Instagram (Paso 3.3)
- ❌ Aceptaste con una cuenta diferente

**Solución:**
1. Ve a Instagram móvil → Settings → Apps and Websites
2. Verifica que tu app aparece en "Active"
3. Si no está, vuelve al **Paso 3** y acepta la invitación

---

### Error 3: "Insufficient developer role"

**Causas posibles:**
- ❌ No eres Admin de la app, solo Developer o Tester

**Solución:**
1. Ve a Meta for Developers → Tu app → Roles
2. Verifica que tu cuenta de Facebook es **Administrator**
3. Si no lo eres, pídele al Admin que te dé permisos o usa su cuenta

---

### Error 4: No aparece "Generate Token" en User Token Generator

**Causas posibles:**
- ❌ No agregaste a @digitalmindmillonaria como Instagram Tester
- ❌ No aceptaste la invitación en Instagram móvil

**Solución:**
1. Vuelve al **Paso 3** completo
2. Asegúrate de aceptar la invitación EN EL MÓVIL (no funciona en web)

---

### Error 5: El token funciona pero sigue mostrando datos de demo

**Causas posibles:**
- ❌ El servidor no se reinició después de cambiar .env.local
- ❌ Hay un error de caché

**Solución:**
1. Detén el servidor (Ctrl + C)
2. Borra la caché:
   ```bash
   rm -rf .next
   ```
3. Inicia el servidor:
   ```bash
   npm run dev
   ```
4. Recarga la página con Ctrl + Shift + R (hard reload)

---

## 🔄 **Renovación Automática del Token**

Los tokens de Instagram Basic Display duran **60 días**.

### Cuándo renovar

Recibirás un email de alerta cuando:
- El token tenga menos de 7 días de vida
- El token haya expirado

### Cómo renovar

**Opción 1: Generar uno nuevo desde cero**
- Sigue esta guía de nuevo desde el Paso 4

**Opción 2: Refrescar el token actual** (más fácil)
```
https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=TU_TOKEN_ACTUAL
```

Esto extiende la vida del token por 60 días más.

---

## 📧 **¿Necesitas Ayuda?**

Si después de seguir todos los pasos sigue sin funcionar:

1. **Revisa la página de prueba:**
   ```
   http://localhost:3000/setup-token
   ```

2. **Verifica el error exacto** en las herramientas de desarrollador (F12 → Console)

3. **Anota:**
   - El error exacto que ves
   - En qué paso te quedaste
   - Capturas de pantalla si es posible

---

## ✅ **Checklist Final**

Marca cada ítem cuando lo completes:

- [ ] Abrí Meta for Developers con la cuenta correcta
- [ ] Agregué Instagram Basic Display a mi app
- [ ] Configuré las URLs de callback
- [ ] Agregué @digitalmindmillonaria como Instagram Tester
- [ ] Acepté la invitación EN EL MÓVIL de Instagram
- [ ] Generé el token de corta duración (1 hora)
- [ ] Convertí el token a larga duración (60 días)
- [ ] Probé el token en /setup-token
- [ ] Guardé el token en .env.local
- [ ] Reinicié el servidor de Next.js
- [ ] Verifiqué que el dashboard muestra datos reales
- [ ] NO veo el banner de "datos de demostración"

---

**¡Listo! Tu dashboard ahora está conectado a Instagram con datos reales. 🎉**

---

## 📚 **Referencias Útiles**

- [Instagram Basic Display API Docs](https://developers.facebook.com/docs/instagram-basic-display-api)
- [Access Tokens Guide](https://developers.facebook.com/docs/instagram-basic-display-api/guides/getting-access-tokens-and-permissions)
- [Meta for Developers](https://developers.facebook.com/)
