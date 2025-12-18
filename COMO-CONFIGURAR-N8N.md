# 🔧 Cómo Configurar n8n para Renovación Automática de Token

## 📋 Resumen
Este workflow renovará automáticamente tu token de Instagram cada 50 días y te enviará un email con el nuevo token para que lo actualices en Vercel.

## 🚀 Paso 1: Configurar credenciales SMTP en n8n

1. Abre n8n en http://localhost:5678
2. Ve a **Settings** (⚙️) > **Credentials**
3. Haz clic en **Add Credential**
4. Busca y selecciona **SMTP**
5. Completa con estos datos:

```
Name: Resend SMTP
User: resend
Password: re_eyD99YB6_4HMJ41XCJG6YcEmJ717Cut6Y
Host: smtp.resend.com
Port: 587
SSL/TLS: false (desmarcado)
```

6. Haz clic en **Save**

## 📥 Paso 2: Importar el Workflow

1. En n8n, haz clic en el menú de hamburguesa (☰) arriba a la izquierda
2. Selecciona **Import from File**
3. Navega a: `C:\Users\Usuario\CURSOR\instagram-dashboard\n8n-workflows\instagram-token-renewal-simple.json`
4. Haz clic en **Open**
5. El workflow se cargará automáticamente

## ⚙️ Paso 3: Configurar los nodos de Email

1. Haz clic en el nodo **"Send Success Email with Token"** (el sobre verde)
2. En el panel derecho, ve a **Credentials**
3. Selecciona **"Resend SMTP"** (la credencial que creaste en Paso 1)
4. Haz clic en **Save**

5. Repite lo mismo para el nodo **"Send Error Email"** (el sobre rojo)

## ✅ Paso 4: Probar el Workflow

1. Haz clic en el nodo **"Refresh Instagram Token"** (el globo)
2. Haz clic en el botón **"Test step"** o **"Execute node"**
3. Deberías ver un resultado exitoso con:
   - success: true
   - new_token: [un token largo]
   - expires_in_days: 60

4. Si funciona, haz clic en el botón **"Execute workflow"** arriba a la derecha para probar todo el flujo

## 📧 Paso 5: Verificar el Email

Revisa tu email (vgvtoringana@gmail.com) y deberías recibir un mensaje con:
- ✅ El nuevo token de Instagram
- 📅 Fecha de expiración
- 💻 Comandos para actualizar Vercel

## 🔄 Paso 6: Activar el Workflow

1. En la esquina superior derecha, cambia el interruptor de **"Inactive"** a **"Active"**
2. El workflow ahora se ejecutará automáticamente cada 50 días

## 📝 ¿Qué hace el workflow?

1. **Cada 50 días**: Se dispara automáticamente
2. **Renueva el token**: Llama al API de tu dashboard
3. **Verifica éxito**: Comprueba si la renovación funcionó
4. **Envía email**: Te manda el nuevo token por correo
5. **Registra en BD**: Guarda un log en Supabase

## 🔐 Cuando recibas el email de renovación:

Ejecuta estos comandos en tu terminal:

```bash
cd C:\Users\Usuario\CURSOR\instagram-dashboard

# Eliminar token antiguo
vercel env rm INSTAGRAM_ACCESS_TOKEN production --yes

# Agregar nuevo token (copia el del email)
echo "NUEVO_TOKEN_AQUI" | vercel env add INSTAGRAM_ACCESS_TOKEN production

# Redesplegar
vercel --prod --yes
```

O actualiza manualmente en:
https://vercel.com/vanes-projects-abf9b0a4/instagram-dashboard/settings/environment-variables

## ❓ Solución de Problemas

### Error en "Send Success Email"
- **Problema**: No se configuraron las credenciales SMTP
- **Solución**: Repite el Paso 3

### Error en "Refresh Instagram Token"
- **Problema**: El servidor no está corriendo o el token actual expiró
- **Solución**: Verifica que el dashboard esté desplegado en Vercel

### No llega el email
- **Problema**: Resend requiere verificación de dominio
- **Solución**: El email viene de `onboarding@resend.dev`, revisa spam

## 📊 Monitoreo

Puedes ver todos los logs en tu dashboard:
https://instagram-dashboard-ten.vercel.app/api/n8n/log

O en la tabla `automation_logs` de Supabase.

---

✨ **¡Listo!** Tu token se renovará automáticamente cada 50 días y recibirás un email con instrucciones para actualizarlo.
