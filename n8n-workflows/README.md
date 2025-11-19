# 🤖 n8n Workflows - Instagram Dashboard

Este directorio contiene workflows de n8n para automatizar la sincronización y monitoreo de tu cuenta de Instagram.

## 📋 Workflows Disponibles

### 1. **instagram-sync-daily.json**
Sincroniza automáticamente tus datos de Instagram cada 24 horas.

**Características:**
- ⏰ Se ejecuta cada 24 horas automáticamente
- 📊 Obtiene posts, métricas y estadísticas
- 💾 Guarda todo en Supabase
- 📧 Envía email de confirmación después de cada sincronización
- 📝 Registra logs de ejecución en la base de datos

**Nodos incluidos:**
1. Schedule Trigger (cada 24h)
2. HTTP Request → `/api/instagram/sync`
3. Log to Supabase → `/api/n8n/log`
4. Conditional check (éxito/error)
5. Send Email (notificación)

---

### 2. **instagram-alerts.json**
Monitorea el rendimiento y envía alertas cuando detecta anomalías.

**Características:**
- ⏰ Revisa métricas cada 6 horas
- 🚨 Detecta engagement rate bajo (<5%)
- 🚀 Identifica contenido viral (>20% engagement)
- 📉 Alerta sobre alcance bajo (<3000)
- ❌ Reporta errores de sincronización
- 💾 Guarda alertas en Supabase
- 📧 Envía email solo cuando hay alertas

**Alertas que detecta:**
- `low_engagement`: Engagement < 5%
- `viral_content`: Engagement > 20%
- `low_reach`: Alcance < 3000
- `sync_errors`: Errores al sincronizar posts

---

## 🚀 Cómo Importar los Workflows

### Paso 1: Iniciar n8n

```bash
# Si no tienes n8n instalado
npm install -g n8n

# Iniciar n8n
n8n start

# n8n estará disponible en http://localhost:5678
```

### Paso 2: Configurar Credenciales SMTP (para emails)

1. Ve a **Settings** → **Credentials** en n8n
2. Crea una nueva credencial tipo **SMTP**
3. Configuración para Resend:
   ```
   Host: smtp.resend.com
   Port: 465
   SSL/TLS: Activado
   User: resend
   Password: re_eyD99YB6_4HMJ41XCJG6YcEmJ717Cut6Y
   From Email: onboarding@resend.dev
   ```
4. Guarda con el nombre: **"Resend SMTP"**

### Paso 3: Importar Workflows

1. En n8n, ve a **Workflows**
2. Haz clic en **Import from File**
3. Selecciona `instagram-sync-daily.json`
4. Repite para `instagram-alerts.json`

### Paso 4: Configurar URLs

Asegúrate de que las URLs en los workflows apunten a tu servidor:

```
http://localhost:3000/api/instagram/sync
http://localhost:3000/api/n8n/log
http://localhost:3000/api/alerts/create
```

Si tu dashboard está en otro puerto, actualiza las URLs en los nodos HTTP Request.

### Paso 5: Activar los Workflows

1. Abre cada workflow
2. En la esquina superior derecha, activa el toggle **"Active"**
3. ✅ Los workflows ahora se ejecutarán automáticamente

---

## 📧 Configuración de Emails

Los workflows envían emails a: **vgvtoringana@gmail.com**

Para cambiar el email:
1. Abre el workflow en n8n
2. Haz clic en el nodo **"Send Email"**
3. Cambia el campo **"To Email"**
4. Guarda el workflow

---

## 🧪 Probar Manualmente

Puedes ejecutar los workflows manualmente para probar:

1. Abre el workflow
2. Haz clic en **"Execute Workflow"** (botón ▶️)
3. Verás la ejecución en tiempo real
4. Revisa los resultados de cada nodo

---

## 📊 Ver Logs de Ejecución

Los logs se guardan automáticamente en Supabase:

**Tabla:** `automation_logs`

**Campos:**
- `workflow_name`: Nombre del workflow
- `execution_id`: ID único de la ejecución
- `status`: success | error
- `execution_data`: JSON con todos los datos
- `posts_synced`: Número de posts sincronizados
- `executed_at`: Timestamp de ejecución

**Query para ver logs:**
```sql
SELECT
  workflow_name,
  status,
  posts_synced,
  executed_at
FROM automation_logs
ORDER BY executed_at DESC
LIMIT 20;
```

---

## 🚨 Ver Alertas

Las alertas se guardan en Supabase:

**Tabla:** `alerts`

**Campos:**
- `alert_type`: low_engagement | viral_content | low_reach | sync_errors
- `severity`: info | warning | error
- `message`: Descripción de la alerta
- `metadata`: JSON con métricas y valores
- `is_read`: Boolean para marcar como leída
- `created_at`: Timestamp

**Query para ver alertas no leídas:**
```sql
SELECT
  alert_type,
  severity,
  message,
  created_at
FROM alerts
WHERE is_read = false
ORDER BY created_at DESC;
```

---

## 🔧 Personalización

### Cambiar frecuencia de sincronización

**Workflow: instagram-sync-daily.json**

1. Abre el nodo **"Schedule Every 24 Hours"**
2. Cambia el intervalo:
   - Cada 12 horas: `hoursInterval: 12`
   - Cada día a las 9 AM: Usa `cron` → `0 9 * * *`
   - Cada semana: `0 9 * * 1` (lunes a las 9 AM)

### Ajustar umbrales de alertas

**Workflow: instagram-alerts.json**

Edita el nodo **"Analyze Metrics"** (código JavaScript):

```javascript
// Engagement rate bajo
if (metrics.engagement_rate < 5) { // Cambia el 5 por tu umbral

// Engagement rate alto (viral)
if (metrics.engagement_rate > 20) { // Cambia el 20 por tu umbral

// Alcance bajo
if (metrics.avg_reach < 3000) { // Cambia el 3000 por tu umbral
```

---

## ❓ Troubleshooting

### Error: "Cannot connect to localhost:3000"

**Solución:** Asegúrate de que tu dashboard de Next.js esté corriendo:
```bash
cd C:\Users\Usuario\CURSOR\instagram-dashboard
npm run dev
```

### Error: "SMTP connection failed"

**Solución:** Verifica que las credenciales SMTP estén configuradas correctamente en n8n.

### Workflow no se ejecuta automáticamente

**Solución:**
1. Verifica que el workflow esté **Activado** (toggle verde)
2. Revisa que n8n esté corriendo
3. Chequea los logs en n8n → **Executions**

### Emails no llegan

**Solución:**
1. Verifica la configuración SMTP
2. Revisa la bandeja de spam
3. Confirma que la API key de Resend sea válida

---

## 📚 Recursos

- [Documentación de n8n](https://docs.n8n.io/)
- [n8n Schedule Trigger](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.scheduletrigger/)
- [n8n HTTP Request](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.httprequest/)
- [Resend SMTP](https://resend.com/docs/send-with-smtp)

---

## ✅ Checklist de Configuración

- [ ] n8n instalado e iniciado
- [ ] Credenciales SMTP configuradas
- [ ] Workflow `instagram-sync-daily.json` importado
- [ ] Workflow `instagram-alerts.json` importado
- [ ] URLs verificadas y correctas
- [ ] Email de destino configurado
- [ ] Workflows activados
- [ ] Prueba manual ejecutada con éxito
- [ ] Logs verificados en Supabase

---

¡Listo! Tus workflows están configurados para automatizar completamente la sincronización y monitoreo de Instagram. 🎉
