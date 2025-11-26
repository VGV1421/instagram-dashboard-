# 📋 Guía para solicitar instagram_manage_messages en Meta App Review

## ✅ Requisitos previos

Antes de solicitar, asegúrate de tener:
- [x] Cuenta de Instagram Business o Creator
- [x] Facebook App creada
- [x] Privacy Policy URL pública
- [x] Terms of Service URL públicos
- [x] Webhook funcionando (puede ser en desarrollo)
- [ ] Video de demostración (ver abajo)

## 🎯 Información para la solicitud

### 1. **Nombre del permiso:**
`instagram_manage_messages`

### 2. **Caso de uso (Use Case):**
```
Automated Educational Content Delivery

Nuestra aplicación envía contenido educativo (guías en PDF, recursos gratuitos)
automáticamente vía DM cuando usuarios comentan con palabras clave específicas
en nuestros posts de Instagram.

Ejemplo de flujo:
1. Usuario comenta "INFO" en nuestro post
2. Sistema detecta la palabra clave
3. Envía DM con guía educativa gratuita relevante
4. Usuario recibe el contenido solicitado inmediatamente

Esto mejora la experiencia del usuario al proporcionar contenido instantáneo
sin necesidad de enlaces públicos o procesos manuales.
```

### 3. **Descripción detallada (Detailed Description):**
```
PROPÓSITO:
Proporcionar respuesta automática educativa a usuarios que solicitan información
sobre marketing digital, herramientas de IA y emprendimiento mediante comentarios
en Instagram.

FUNCIONAMIENTO:
- Usuario comenta con keyword (INFO, IA, MARKETING, GUIA, CURSO)
- Webhook detecta el comentario
- Sistema identifica la keyword
- Envía DM personalizado con documento educativo relevante
- Registra la interacción en base de datos

BENEFICIOS PARA USUARIOS:
- Acceso instantáneo a contenido educativo
- Sin necesidad de formularios o páginas externas
- Contenido personalizado según su interés
- Privacidad (DM vs comentario público)

NO ENVIAMOS:
❌ Spam no solicitado
❌ Mensajes promocionales masivos
❌ Contenido no relacionado con la solicitud
❌ Mensajes a usuarios que no interactuaron

SOLO ENVIAMOS:
✅ Contenido educativo gratuito
✅ Como respuesta a solicitud explícita (comentario)
✅ Relevante a la palabra clave usada
✅ Una única vez por solicitud
```

### 4. **Justificación (Why needed):**
```
Sin este permiso, tendríamos que:
1. Compartir links públicamente (menos privado)
2. Responder manualmente cada solicitud (no escalable)
3. Usar servicios terceros externos (peor UX)

Con instagram_manage_messages:
1. Respuesta automática 24/7
2. Contenido privado y personalizado
3. Mejor experiencia de usuario
4. Cumplimiento de solicitudes en tiempo real
```

## 🎥 Video de demostración (REQUERIDO)

Meta requiere un video mostrando:

### Contenido del video (2-3 minutos):

**Parte 1: Configuración (30 seg)**
- Mostrar tu app en Meta for Developers
- Mostrar configuración de webhook
- Mostrar Privacy Policy y Terms

**Parte 2: Flujo completo (1.5 min)**
1. Abrir Instagram en móvil
2. Ir a uno de tus posts
3. Escribir comentario con keyword "INFO"
4. Cambiar a vista de DMs
5. Mostrar que llega el DM automático
6. Abrir el DM y mostrar el contenido
7. Mostrar que el documento es educativo (PDF de guía)

**Parte 3: Dashboard (30 seg)**
- Mostrar tu panel de administración
- Mostrar logs de envíos en Supabase
- Mostrar configuración de keywords

### Herramientas para grabar:
- **Windows:** Xbox Game Bar (Win + G) o OBS Studio
- **Móvil:** Grabación de pantalla nativa
- **Edición:** CapCut, DaVinci Resolve (gratis)

### Tips para el video:
- Habla en inglés o subtítulos en inglés
- Muestra claramente que es contenido educativo
- Enfatiza que responde a solicitud explícita del usuario
- Muestra que NO es spam
- Duración: 2-5 minutos máximo

## 📄 URLs que necesitas proporcionar

```
App Domain: vgv1421.github.io

Privacy Policy URL:
https://vgv1421.github.io/instagram-dashboard-/PRIVACY-POLICY.html

Terms of Service URL:
https://vgv1421.github.io/instagram-dashboard-/TERMS-OF-SERVICE.html

Contact Email:
vgvtoringana@gmail.com
```

## 🔍 Preguntas frecuentes en App Review

### ¿Con qué frecuencia envías mensajes?
```
Solo enviamos UN mensaje por cada comentario con keyword.
No enviamos mensajes repetidos ni follow-ups automáticos.
```

### ¿Cómo previenen spam?
```
- Solo respondemos a comentarios con keywords específicos
- Un mensaje único por solicitud
- Usuario debe interactuar primero (comentario)
- No enviamos mensajes no solicitados
- Rate limiting implementado
```

### ¿Qué datos almacenan?
```
Solo metadata:
- Username
- Keyword usada
- Timestamp
- Estado de envío (success/error)

NO almacenamos:
- Contenido completo de mensajes
- Datos personales adicionales
- Conversaciones
```

### ¿Usuarios pueden optar out?
```
Sí, de múltiples formas:
1. No comentar con keywords
2. Bloquear la cuenta
3. Revocar permisos de la app
4. Solicitar eliminación de datos vía email
```

## 📋 Checklist antes de enviar

- [ ] App completamente funcional (aunque sea en development)
- [ ] Privacy Policy publicada y accesible
- [ ] Terms of Service publicados y accesibles
- [ ] Video de demostración grabado
- [ ] Caso de uso claro y detallado escrito
- [ ] Webhook verificado y funcionando
- [ ] Instagram account conectado
- [ ] Email de contacto válido configurado

## 🚀 Cómo enviar la solicitud

1. **Ve a Meta for Developers:**
   https://developers.facebook.com/apps/

2. **Selecciona tu app**

3. **Menú lateral > App Review > Permissions and Features**

4. **Busca:** `instagram_manage_messages`

5. **Click en "Request Advanced Access"**

6. **Completa el formulario:**
   - Use case: (copiar del punto 2)
   - Detailed description: (copiar del punto 3)
   - Upload video: (tu video de demo)
   - Submit

7. **Espera respuesta:** 3-7 días normalmente

## ⚠️ Razones comunes de rechazo

1. **Video no claro**
   - Solución: Remake del video mostrando flujo completo

2. **Caso de uso vago**
   - Solución: Usar texto detallado de arriba

3. **Falta Privacy Policy**
   - Solución: Ya la tienes en GitHub Pages ✅

4. **Parece spam**
   - Solución: Enfatizar que es respuesta a solicitud explícita

5. **No es Business/Creator account**
   - Solución: Convertir tu cuenta antes de solicitar

## 💡 Tips para aumentar probabilidad de aprobación

1. **Cuenta activa:** Ten posts recientes en Instagram
2. **Engagement real:** Algunos comentarios/likes reales
3. **Contenido profesional:** Posts de calidad sobre tu nicho
4. **Email corporativo:** Si tienes dominio propio, úsalo
5. **Documentación clara:** Privacy Policy detallada
6. **Video de calidad:** HD, bien editado, audio claro

## 📞 Si te rechazan

1. **Lee el feedback:** Meta explica por qué
2. **Corrige los problemas**
3. **Espera 7 días**
4. **Vuelve a aplicar** con los cambios

## ⏰ Mientras esperas aprobación

Puedes usar el sistema en modo "development":
- Solo tú y usuarios de prueba pueden usarlo
- Máximo 5 testers
- Suficiente para probar y validar

Para agregar testers:
1. Meta for Developers > Roles > Test Users
2. Agregar Instagram accounts para pruebas

---

## 📝 Template de email de seguimiento

Si no recibes respuesta en 7 días, puedes escribir:

```
Subject: Follow-up on instagram_manage_messages Review Request

Hello Meta Review Team,

I submitted a request for instagram_manage_messages permission for my app
[TU_APP_NAME] (App ID: [TU_APP_ID]) on [FECHA].

Use case: Educational content delivery via automated DMs in response to
user comments on Instagram posts.

Could you please provide an update on the review status?

Thank you,
[TU_NOMBRE]
Contact: vgvtoringana@gmail.com
```

---

## ✅ Después de la aprobación

1. El permiso se activa automáticamente
2. Cambia de "Standard Access" a "Advanced Access"
3. Tu app puede enviar DMs a cualquier usuario
4. Sin límite de usuarios (respetando rate limits)

**Rate Limits de Instagram:**
- ~100 DMs por hora
- ~1,000 DMs por día
- Más info: https://developers.facebook.com/docs/graph-api/overview/rate-limiting

---

¿Dudas? Revisa:
- Docs oficiales: https://developers.facebook.com/docs/messenger-platform/instagram
- App Review: https://developers.facebook.com/docs/app-review

**Última actualización:** 25 de noviembre de 2024
