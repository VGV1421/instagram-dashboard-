# 📧 Guía: Configurar SMTP en n8n para Resend

Esta guía te ayudará a configurar las credenciales SMTP de Resend en n8n para que los workflows puedan enviar emails automáticos.

---

## 📋 CREDENCIALES QUE NECESITAS

Tienes estas credenciales configuradas en `.env.local`:

```
Host SMTP: smtp.resend.com
Port: 465
Usuario: resend
Contraseña: re_eyD99YB6_4HMJ41XCJG6YcEmJ717Cut6Y
Email From: onboarding@resend.dev
```

---

## 🔧 MÉTODO 1: Configurar desde el Workflow (MÁS FÁCIL)

### Paso 1: Importar el workflow
1. Ve a n8n: http://localhost:5678
2. Haz clic en **"Add workflow"** (botón +)
3. Selecciona **"Import from File"**
4. Navega a: `C:\Users\Usuario\CURSOR\instagram-dashboard\n8n-workflows\`
5. Selecciona **`instagram-sync-daily.json`**

### Paso 2: Configurar SMTP desde el nodo de email
Una vez importado, verás que algunos nodos tienen un **ícono de advertencia (⚠️)**:

1. Haz clic en el nodo **"Send Success Email"** (o "Send Error Email")
2. Verás un campo **"Credential to connect with"** con un error
3. Haz clic en **"Select Credential"** → **"Create New Credential"**
4. Introduce los siguientes datos:

   **Configuración SMTP:**
   ```
   Credential Name: Resend SMTP

   User: resend
   Password: re_eyD99YB6_4HMJ41XCJG6YcEmJ717Cut6Y
   Host: smtp.resend.com
   Port: 465
   Security: SSL/TLS (activado)
   ```

5. Haz clic en **"Save"**

### Paso 3: Aplicar la credencial a todos los nodos de email
1. Haz clic en el nodo **"Send Error Email"**
2. En **"Credential to connect with"**, selecciona **"Resend SMTP"** (la que acabas de crear)
3. Guarda el workflow

---

## 🔧 MÉTODO 2: Configurar desde Settings (ALTERNATIVO)

Si prefieres crear la credencial antes de importar los workflows:

### Paso 1: Abrir el menú de credenciales
En n8n hay varias formas de acceder:

**Opción A: Desde el menú lateral**
- Busca un ícono de llave 🔑 o "Credentials" en el menú izquierdo

**Opción B: Desde tu perfil**
- Haz clic en tu email (esquina superior derecha)
- Selecciona **"Credentials"**

**Opción C: Crear desde un workflow**
- Abre cualquier workflow
- Agrega un nodo "Send Email"
- Haz clic en "Create New Credential"

### Paso 2: Crear nueva credencial SMTP
1. Haz clic en **"Add Credential"** o **"New"**
2. Busca y selecciona **"SMTP"**
3. Completa los campos:

   ```
   Credential Name: Resend SMTP
   User: resend
   Password: re_eyD99YB6_4HMJ41XCJG6YcEmJ717Cut6Y
   Host: smtp.resend.com
   Port: 465
   Security: SSL/TLS ✓
   ```

4. **(Opcional)** Haz clic en **"Test"** para verificar la conexión
5. Haz clic en **"Save"**

---

## ✅ VERIFICAR QUE FUNCIONA

### Opción 1: Prueba rápida con un workflow simple

Puedes crear un workflow de prueba con un solo nodo:

1. En n8n, crea un nuevo workflow
2. Agrega un nodo **"Send Email"**
3. Configura:
   - **Credential**: Resend SMTP
   - **From Email**: onboarding@resend.dev
   - **To Email**: vgvtoringana@gmail.com
   - **Subject**: Test desde n8n
   - **Message**: Este es un email de prueba
4. Haz clic en **"Execute Node"** (botón de play en el nodo)
5. Revisa tu email

### Opción 2: Ejecutar el workflow completo

1. Importa `instagram-sync-daily.json`
2. Asegúrate de que los nodos de email tengan la credencial configurada
3. Haz clic en **"Execute Workflow"** (botón ▶️ arriba)
4. Deberías recibir un email de confirmación

---

## ❌ SOLUCIÓN DE PROBLEMAS

### Error: "Authentication failed"
**Causa:** Usuario o contraseña incorrectos
**Solución:** Verifica que el usuario sea `resend` y la contraseña sea la API key completa

### Error: "Connection timeout"
**Causa:** Puerto o host incorrectos
**Solución:** Asegúrate de usar `smtp.resend.com` puerto `465` con SSL/TLS

### Error: "From email not verified"
**Causa:** El email "from" no está verificado en Resend
**Solución:** Usa `onboarding@resend.dev` que es el email de desarrollo de Resend

### No recibo emails
**Solución:**
1. Revisa la carpeta de spam
2. Verifica que el email destino sea correcto: `vgvtoringana@gmail.com`
3. Revisa los logs de ejecución en n8n

---

## 📚 INFORMACIÓN ADICIONAL

### ¿Qué es Resend?
Resend es un servicio de envío de emails transaccionales. Estás usando la versión de desarrollo que permite enviar emails desde `onboarding@resend.dev`.

### ¿Puedo cambiar el email "From"?
Sí, pero necesitas:
1. Verificar un dominio en Resend
2. Actualizar el email en los workflows

### ¿Cuántos emails puedo enviar?
Con la cuenta gratuita de Resend:
- 100 emails/día
- 3,000 emails/mes

---

## 🎯 SIGUIENTE PASO

Una vez configurado SMTP, importa los workflows:

1. ✅ **instagram-sync-daily.json** - Sincronización cada 24h + email de confirmación
2. ✅ **instagram-alerts.json** - Monitoreo cada 6h + email de alertas

---

**¿Necesitas ayuda?** Revisa los logs de ejecución en n8n o consulta la documentación de Resend: https://resend.com/docs
