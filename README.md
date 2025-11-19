# 📊 Instagram Analytics Dashboard

Dashboard profesional de analytics para Instagram con visualización de métricas, automatización de sincronización y sistema de alertas inteligente.

![Next.js](https://img.shields.io/badge/Next.js-16.0.3-black?style=flat&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat&logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green?style=flat&logo=supabase)
![n8n](https://img.shields.io/badge/n8n-Automation-orange?style=flat)

---

## ✨ Características Principales

### 📈 Analytics en Tiempo Real
- **Dashboard principal** con métricas clave de Instagram
- **Página de Tendencias** con gráficos interactivos (Recharts)
- Seguimiento de engagement rate, alcance, likes y comentarios
- Análisis por tipo de contenido (imágenes, videos, carruseles, reels)

### 🔄 Sincronización Automática
- Sincronización manual con un clic desde el dashboard
- Workflows de n8n para sincronización automática cada 24 horas
- Almacenamiento de datos históricos en Supabase
- Sistema de logs de todas las sincronizaciones

### 🚨 Sistema de Alertas
- Detección automática de engagement rate bajo (<5%)
- Identificación de contenido viral (>20% engagement)
- Alertas de alcance bajo (<3000)
- Notificaciones por email vía Resend/SMTP

### 🤖 Automatización con n8n
- 5 workflows configurados y listos para usar
- Sincronización diaria automática
- Monitoreo y alertas cada 6 horas
- Logs automáticos en base de datos

---

## 🛠️ Stack Tecnológico

### Frontend
- **Next.js 16.0.3** - Framework React con App Router y Turbopack
- **TypeScript** - Tipado estático completo
- **Tailwind CSS** - Estilos con paleta personalizada
- **shadcn/ui** - Componentes UI accesibles y customizables
- **Recharts** - Visualización de datos con gráficos interactivos
- **Lucide React** - Iconos
- **Sonner** - Notificaciones toast

### Backend
- **Supabase** - PostgreSQL con Row Level Security
- **Instagram Graph API** - Integración con Instagram Business
- **n8n** - Orquestación de workflows
- **Resend** - Emails transaccionales via SMTP

### Integraciones
- **OpenAI API** - IA para generación de contenido (configurado)
- **Notion API** - Buyer personas y referentes (configurado)
- **ManyChat** - Datos de leads y ventas (pendiente)

---

## 📦 Base de Datos

### Tablas en Supabase

#### `clients`
Cuentas de Instagram conectadas
- Información de la cuenta
- Access tokens
- Estado de la conexión

#### `posts`
Publicaciones de Instagram con métricas
- Tipo de contenido (IMAGE, VIDEO, CAROUSEL, REELS)
- Métricas: likes, comments, shares, saves
- Alcance e impresiones
- Engagement rate (calculado automáticamente)

#### `account_stats`
Estadísticas agregadas de la cuenta
- Seguidores y seguidos
- Promedios de engagement (7 y 30 días)
- Alcance promedio
- Total de interacciones

#### `alerts`
Sistema de alertas y notificaciones
- Tipo de alerta (low_engagement, viral_content, low_reach)
- Severidad (info, warning, error)
- Estado (leída/no leída)

#### `automation_logs`
Logs de ejecuciones de workflows n8n
- Nombre del workflow
- Estado de ejecución
- Posts sincronizados
- Metadatos y errores

---

## 🚀 Instalación

### Requisitos Previos
- Node.js 18+
- npm o yarn
- Cuenta de Supabase
- Cuenta de Facebook Developer (para Instagram API)
- n8n instalado (opcional, para automatización)

### 1. Clonar el Repositorio
```bash
git clone https://github.com/VGV1421/instagram-dashboard-.git
cd instagram-dashboard-
```

### 2. Instalar Dependencias
```bash
npm install
```

### 3. Configurar Variables de Entorno
Crea un archivo `.env.local` en la raíz del proyecto:

```env
# SUPABASE
NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_supabase_service_role_key

# INSTAGRAM GRAPH API
INSTAGRAM_APP_ID=tu_app_id
INSTAGRAM_APP_SECRET=tu_app_secret
INSTAGRAM_USER_ID=tu_user_id
INSTAGRAM_ACCESS_TOKEN=tu_access_token

# N8N (opcional)
N8N_URL=http://localhost:5678
N8N_API_KEY=tu_n8n_api_key
N8N_BASIC_AUTH_USER=tu_email
N8N_BASIC_AUTH_PASSWORD=tu_password

# RESEND (para emails)
RESEND_API_KEY=tu_resend_api_key
RESEND_FROM_EMAIL=onboarding@resend.dev

# OPENAI (opcional)
OPENAI_API_KEY=tu_openai_api_key

# NOTION (opcional)
NOTION_API_KEY=tu_notion_api_key
NOTION_BUYER_PERSONAS_PAGE_ID=tu_page_id
NOTION_REFERENTES_PAGE_ID=tu_page_id
```

### 4. Configurar Base de Datos
Ejecuta el schema SQL en tu proyecto de Supabase:

```bash
# El archivo está en:
supabase/schema.sql
```

O copia el contenido desde: `supabase/COPIAR_Y_PEGAR_EN_SUPABASE.html`

### 5. Ejecutar en Desarrollo
```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

---

## 📄 Páginas Implementadas

### `/` - Home
Dashboard principal con métricas en tiempo real:
- Tarjetas de métricas principales
- Gráfico de distribución de engagement
- Botón de sincronización manual
- Estado de la cuenta

### `/tendencias` - Tendencias
Análisis visual con gráficos interactivos:
- Evolución del engagement rate
- Alcance y likes por publicación
- Distribución por tipo de contenido
- Top 5 mejores posts
- Tabla de rendimiento por tipo

### `/setup-token` - Helper Token
Página auxiliar para generar y renovar tokens de Instagram:
- Instrucciones paso a paso
- Enlaces a Facebook Developer
- Verificación de permisos

---

## 🤖 Workflows de n8n

### 1. `instagram-sync-daily.json`
Sincronización automática cada 24 horas
- Ejecuta `/api/instagram/sync`
- Guarda logs en Supabase
- Envía email de confirmación

### 2. `instagram-sync-simple.json`
Sincronización básica sin emails
- Solo sincroniza datos
- Guarda logs

### 3. `instagram-alerts.json`
Sistema de alertas cada 6 horas
- Detecta anomalías en métricas
- Crea alertas en BD
- Envía emails solo cuando hay alertas

### 4. `test-email.json`
Workflow de prueba para validar SMTP
- Un solo nodo de email
- Útil para testing

### Importar Workflows
1. Inicia n8n: `n8n start`
2. Abre http://localhost:5678
3. Import from File → Selecciona el JSON
4. Configura credenciales SMTP si es necesario
5. Activa el workflow

Ver guía completa en: `n8n-workflows/README.md`

---

## 🔌 API Routes

### Instagram
- `GET /api/instagram/profile` - Perfil de Instagram
- `GET /api/instagram/media` - Posts y métricas
- `POST /api/instagram/sync` - Sincronizar a Supabase

### Analytics
- `GET /api/analytics/trends` - Datos para gráficos

### n8n
- `POST /api/n8n/log` - Guardar logs de workflows

### Alertas
- `POST /api/alerts/create` - Crear alertas automáticas

### Testing
- `GET /api/test-db` - Verificar conexión a Supabase

---

## 📊 Progreso del Proyecto

**Completado: 70% (7/10 módulos)**

✅ Base de datos Supabase
✅ Conexión Supabase
✅ Layout principal (Sidebar + Header)
✅ Instagram API con fallback a datos demo
✅ Sincronización a Supabase
✅ Automatización n8n
✅ Página de Tendencias con gráficos
⏳ Página de Alertas
⏳ Página de Scripts de IA
⏳ Otras páginas (Rendimiento, Personas, Embudo)

---

## 🔐 Seguridad

- ✅ Variables de entorno protegidas con `.gitignore`
- ✅ Supabase Row Level Security (RLS) habilitado
- ✅ Service Role Key solo en backend
- ✅ Middleware de autenticación
- ✅ Tokens de Instagram con expiración

**IMPORTANTE:** Nunca compartas tu `.env.local` ni hagas commit de credenciales.

---

## 📚 Documentación Adicional

- **Dosier técnico completo:** `DOSIER_TECNICO_COMPLETO.md`
- **Dosier funcional:** `DOSIER_TECNICO_FUNCIONAL_INSTAGRAM_DASHBOARD.md`
- **Guía token Instagram:** `GUIA_TOKEN_INSTAGRAM.md`
- **Guía SMTP n8n:** `n8n-workflows/GUIA_CONFIGURAR_SMTP.md`
- **Progreso:** `PROGRESO_FINAL.md` y `RESUMEN_SESION.md`

---

## 🐛 Troubleshooting

### Error: Token de Instagram expirado
El dashboard usa datos de demostración cuando el token no es válido. Para renovar:
1. Ve a `/setup-token`
2. Sigue las instrucciones
3. Actualiza `INSTAGRAM_ACCESS_TOKEN` en `.env.local`

### Error: No se conecta a Supabase
1. Verifica las credenciales en `.env.local`
2. Ejecuta `npm run dev` de nuevo
3. Revisa la consola del navegador

### Workflows de n8n no se ejecutan
1. Verifica que n8n esté corriendo: `n8n start`
2. Revisa que el workflow esté **Activado** (toggle verde)
3. Chequea los logs en n8n → Executions

---

## 🤝 Contribuciones

Este es un proyecto privado. Para sugerencias o mejoras, contacta al propietario del repositorio.

---

## 📝 Licencia

Proyecto privado. Todos los derechos reservados.

---

## 🙏 Créditos

**Desarrollado con:**
- ❤️ Next.js
- 🎨 Tailwind CSS
- 📊 Recharts
- 🗄️ Supabase
- 🤖 n8n
- ✨ shadcn/ui

**Creado para:** @digitalmindmillonaria

---

🤖 **Generated with [Claude Code](https://claude.com/claude-code)**
Co-Authored-By: Claude <noreply@anthropic.com>
