# 📋 DOSIER TÉCNICO-FUNCIONAL COMPLETO
## Dashboard de Analytics para Instagram con Automatización n8n

**Versión:** 1.0  
**Fecha:** 14 noviembre 2025  
**Destinatario:** Claude Code (Cursor) + Equipo de desarrollo  
**Propietario:** VGV

---

## 📑 ÍNDICE

1. [Resumen Ejecutivo](#1-resumen-ejecutivo)
2. [Contexto y Objetivos de Negocio](#2-contexto-y-objetivos-de-negocio)
3. [Decisiones Técnicas Confirmadas](#3-decisiones-técnicas-confirmadas)
4. [Arquitectura del Sistema](#4-arquitectura-del-sistema)
5. [Modelo de Datos Completo](#5-modelo-de-datos-completo)
6. [Integraciones y APIs](#6-integraciones-y-apis)
7. [Workflows n8n](#7-workflows-n8n)
8. [Plan de Entrega Modular](#8-plan-de-entrega-modular)
9. [Estructura del Repositorio](#9-estructura-del-repositorio)
10. [Configuración de Entorno](#10-configuración-de-entorno)
11. [Comandos de Setup Inicial](#11-comandos-de-setup-inicial)
12. [Checklist de Desarrollo](#12-checklist-de-desarrollo)

---

## 1. RESUMEN EJECUTIVO

### Propósito
Dashboard web para análisis automatizado de métricas de Instagram que permite tomar decisiones informadas sobre estrategia de contenido y detectar proactivamente caídas de rendimiento.

### Problema que Resuelve
- **Antes:** Análisis manual disperso, decisiones sin datos consolidados, detección tardía de problemas
- **Después:** Dashboard centralizado, KPIs automáticos, alertas proactivas, automatización con n8n

### Alcance MVP
✅ Ingesta automática de 1 cuenta Instagram Creator vía Graph API  
✅ Dashboard Home + Analytics + Content Library + Alerts  
✅ Sistema de alertas (umbral: engagement < 2%)  
✅ Acceso para 2 usuarios (propietario + colaborador)  
✅ Workflows n8n para ingesta, cálculos y alertas

❌ Análisis de competencia (Fase 2 con Apify)  
❌ TikTok/YouTube (Fase 2)  
❌ Scheduler/Calendar (Fase 2)  
❌ Multi-tenancy completo (Fase 2)

### Tech Stack
| Capa | Tecnología |
|------|------------|
| Frontend | Next.js 14+ (App Router), Tailwind, shadcn/ui |
| Backend | Supabase (PostgreSQL + Auth + Storage) |
| Automatización | n8n self-hosted (VPS) |
| Email | Resend (plan gratuito 3k/mes) |
| APIs | Instagram Graph API, OpenAI API (~$10/mes) |
| Deploy | Vercel (frontend) + VPS (n8n) |

### Timeline
**Duración:** 8-10 semanas  
**Horas:** 200-250h (25-30h/semana)

---

## 2. CONTEXTO Y OBJETIVOS DE NEGOCIO

### Usuarios
**Actual (MVP):**
- Usuario principal: Creador de contenido (cuenta Instagram Creator)
- Usuario secundario: 1 colaborador
- Frecuencia: Diaria/semanal según necesidad

**Futuro (Fase 2):**
- Modelo agencia: 10-50 clientes con dashboards individuales
- Cada cliente ve solo sus datos

### KPIs del Producto
| KPI | Meta MVP | Medición |
|-----|----------|----------|
| Time to value | <24h desde setup | Manual |
| Tiempo de carga dashboard | <2s (LCP) | Lighthouse |
| Frecuencia de uso | >3 sesiones/semana | Logs |
| Precisión de alertas | >90% relevantes | Feedback |
| Uptime | >99% | UptimeRobot |

---

## 3. DECISIONES TÉCNICAS CONFIRMADAS

### ✅ Fuentes de Datos
- **Instagram Graph API** (oficial, gratuito) para TUS datos
- Cuenta Creator lista ✅
- **Apify** para competencia → Fase 2 (pospuesto)
- TikTok → Fase 2 (pospuesto)

### ✅ Alcance del MVP
Opción B: n8n ingesta tu cuenta Instagram → Supabase → Dashboard Home + Analytics con métricas reales básicas (últimos 10-20 posts, engagement, followers, reach)

### ✅ Automatización n8n
- Ingesta + cálculos + alertas
- **Umbral:** Engagement rate promedio últimos 5 posts < 2%
- Incluye tablas: `alerts`, `automation_logs`, columnas calculadas (`engagement_rate_7d_avg`)

### ✅ Usuarios
- **Ahora:** Tú + 1 colaborador, 1 cuenta Creator
- **Futuro:** Modelo agencia (múltiples clientes, dashboards individuales)

### ✅ Hosting y Servicios
- **n8n:** Self-hosted en VPS (~$5-10/mes)
- **Email:** Resend plan gratuito (3,000 emails/mes)
- **Analytics/Telemetría:** Pospuesto para Fase 2

---

## 4. ARQUITECTURA DEL SISTEMA

### Diagrama de Flujo Principal

```
Instagram API (Graph API)
        │
        │ cada 6h (cron)
        ▼
   n8n Workflows
   ┌─────────────────┐
   │ 1. Ingestion    │ → Fetch posts + insights
   │ 2. Calculations │ → Engagement, trends
   │ 3. Alerts       │ → Check thresholds
   └────────┬────────┘
            │ write via Supabase client
            ▼
      Supabase Cloud
   ┌──────────────────────┐
   │ PostgreSQL Database  │
   │  - clients           │
   │  - posts             │
   │  - account_stats     │
   │  - alerts            │
   │  - automation_logs   │
   ├──────────────────────┤
   │ Supabase Auth        │
   │ Supabase Storage     │
   │ Supabase Realtime    │
   └────────┬─────────────┘
            │ REST API + Realtime
            ▼
   Next.js Frontend (Vercel)
   ┌──────────────────────┐
   │ - /dashboard (Home)  │
   │ - /analytics         │
   │ - /content           │
   │ - /alerts            │
   └──────────────────────┘
            │
            ▼
     Usuario (Browser)
```

---

## 5. MODELO DE DATOS COMPLETO

### Esquema SQL - Supabase

```sql
-- ============================================
-- EXTENSIONES
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- FUNCIÓN HELPER: Update timestamp
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- ============================================
-- TABLA: clients
-- ============================================
CREATE TABLE clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  instagram_username text UNIQUE NOT NULL,
  instagram_user_id text UNIQUE NOT NULL,
  access_token text NOT NULL,
  token_expires_at timestamptz,
  status text DEFAULT 'active' CHECK (status IN ('active', 'paused', 'archived')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_clients_instagram_user_id ON clients(instagram_user_id);
CREATE INDEX idx_clients_status ON clients(status);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view clients"
  ON clients FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TABLA: posts
-- ============================================
CREATE TABLE posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  instagram_post_id text UNIQUE NOT NULL,
  media_type text NOT NULL CHECK (media_type IN ('IMAGE', 'VIDEO', 'CAROUSEL_ALBUM', 'REELS')),
  media_url text,
  thumbnail_url text,
  permalink text NOT NULL,
  caption text,
  timestamp timestamptz NOT NULL,
  likes integer DEFAULT 0,
  comments integer DEFAULT 0,
  shares integer DEFAULT 0,
  saves integer DEFAULT 0,
  reach integer DEFAULT 0,
  impressions integer DEFAULT 0,
  engagement_rate numeric(5,2),
  is_deleted boolean DEFAULT false,
  last_fetched_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_posts_client_id ON posts(client_id);
CREATE INDEX idx_posts_timestamp_desc ON posts(client_id, timestamp DESC);
CREATE INDEX idx_posts_media_type ON posts(media_type);
CREATE INDEX idx_posts_engagement_rate ON posts(engagement_rate DESC NULLS LAST);
CREATE INDEX idx_posts_caption_search ON posts USING gin(to_tsvector('spanish', caption));

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view posts"
  ON posts FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para calcular engagement_rate automáticamente
CREATE OR REPLACE FUNCTION calculate_engagement_rate()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.reach > 0 THEN
    NEW.engagement_rate := ((NEW.likes + NEW.comments + NEW.saves)::numeric / NEW.reach) * 100;
  ELSE
    NEW.engagement_rate := 0;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_engagement_rate
BEFORE INSERT OR UPDATE ON posts
FOR EACH ROW EXECUTE FUNCTION calculate_engagement_rate();

-- ============================================
-- TABLA: account_stats
-- ============================================
CREATE TABLE account_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  followers_count integer DEFAULT 0,
  following_count integer DEFAULT 0,
  media_count integer DEFAULT 0,
  avg_engagement_rate_7d numeric(5,2),
  avg_reach_7d integer,
  total_likes_7d integer,
  total_comments_7d integer,
  total_shares_7d integer,
  total_saves_7d integer,
  avg_engagement_rate_30d numeric(5,2),
  avg_reach_30d integer,
  total_likes_30d integer,
  total_comments_30d integer,
  calculated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_account_stats_client ON account_stats(client_id, calculated_at DESC);

ALTER TABLE account_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view account_stats"
  ON account_stats FOR SELECT
  USING (auth.role() = 'authenticated');

-- ============================================
-- TABLA: alerts
-- ============================================
CREATE TABLE alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  alert_type text NOT NULL,
  severity text DEFAULT 'warning' CHECK (severity IN ('info', 'warning', 'critical')),
  title text NOT NULL,
  message text NOT NULL,
  metadata jsonb,
  status text DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'dismissed')),
  read_at timestamptz,
  dismissed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_alerts_client_id ON alerts(client_id);
CREATE INDEX idx_alerts_status ON alerts(status, created_at DESC);
CREATE INDEX idx_alerts_client_status ON alerts(client_id, status, created_at DESC);

ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view alerts"
  ON alerts FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update alerts"
  ON alerts FOR UPDATE
  USING (auth.role() = 'authenticated');

-- ============================================
-- TABLA: automation_logs
-- ============================================
CREATE TABLE automation_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  workflow_name text NOT NULL,
  execution_id text,
  status text NOT NULL CHECK (status IN ('success', 'error', 'warning')),
  posts_ingested integer,
  duration_ms integer,
  error_message text,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_automation_logs_client_id ON automation_logs(client_id, created_at DESC);
CREATE INDEX idx_automation_logs_workflow ON automation_logs(workflow_name, created_at DESC);
CREATE INDEX idx_automation_logs_status ON automation_logs(status);

ALTER TABLE automation_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view automation_logs"
  ON automation_logs FOR SELECT
  USING (auth.role() = 'authenticated');

-- ============================================
-- FUNCIONES SQL ÚTILES
-- ============================================

-- Función: Obtener overview del dashboard
CREATE OR REPLACE FUNCTION get_dashboard_overview(p_client_id uuid)
RETURNS json AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'followers_count', COALESCE(followers_count, 0),
    'media_count', COALESCE(media_count, 0),
    'avg_engagement_rate_7d', COALESCE(avg_engagement_rate_7d, 0),
    'avg_engagement_rate_30d', COALESCE(avg_engagement_rate_30d, 0),
    'avg_reach_7d', COALESCE(avg_reach_7d, 0),
    'calculated_at', calculated_at
  ) INTO result
  FROM account_stats
  WHERE client_id = p_client_id
  ORDER BY calculated_at DESC
  LIMIT 1;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función: Top posts por engagement
CREATE OR REPLACE FUNCTION get_top_posts(
  p_client_id uuid,
  p_limit integer DEFAULT 5,
  p_days integer DEFAULT 30
)
RETURNS SETOF posts AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM posts
  WHERE client_id = p_client_id
    AND timestamp > NOW() - (p_days || ' days')::interval
    AND is_deleted = false
  ORDER BY engagement_rate DESC NULLS LAST
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función: Búsqueda fulltext de posts
CREATE OR REPLACE FUNCTION search_posts(
  p_client_id uuid,
  p_query text,
  p_media_types text[] DEFAULT NULL,
  p_limit integer DEFAULT 20,
  p_offset integer DEFAULT 0
)
RETURNS SETOF posts AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM posts
  WHERE client_id = p_client_id
    AND (
      p_query IS NULL 
      OR p_query = ''
      OR to_tsvector('spanish', caption) @@ plainto_tsquery('spanish', p_query)
    )
    AND (
      p_media_types IS NULL 
      OR media_type = ANY(p_media_types)
    )
    AND is_deleted = false
  ORDER BY timestamp DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- SEED DATA (Cliente de prueba - MVP)
-- ============================================
-- NOTA: Reemplazar valores con los reales después de obtener el token de Instagram

INSERT INTO clients (id, name, instagram_username, instagram_user_id, access_token, status)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Mi Cuenta Principal',
  'tu_username_aqui',
  'tu_instagram_user_id_aqui',
  'tu_access_token_aqui',
  'active'
);
```

---

## 6. INTEGRACIONES Y APIS

### Instagram Graph API

**Configuración inicial:**

1. Crear app en https://developers.facebook.com/apps
2. Agregar producto "Instagram Basic Display"
3. Solicitar permisos: `instagram_basic`, `pages_show_list`, `instagram_manage_insights`
4. Obtener access token desde Graph API Explorer
5. Convertir a long-lived token (60 días):

```bash
curl -i -X GET "https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret={app-secret}&access_token={short-lived-token}"
```

**Endpoints principales:**

```http
# Perfil
GET https://graph.instagram.com/{user-id}
  ?fields=username,followers_count,follows_count,media_count
  &access_token={token}

# Posts
GET https://graph.instagram.com/{user-id}/media
  ?fields=id,media_type,media_url,thumbnail_url,permalink,caption,timestamp
  &limit=50
  &access_token={token}

# Insights por post
GET https://graph.instagram.com/{media-id}/insights
  ?metric=likes,comments,shares,saved,reach,impressions
  &access_token={token}
```

**Rate limits:** 200 req/hora por usuario

### Resend API

**Configuración:**
1. Crear cuenta en https://resend.com
2. Verificar dominio (DNS: SPF, DKIM)
3. Obtener API key

**Ejemplo de envío:**

```bash
curl -X POST https://api.resend.com/emails \
  -H "Authorization: Bearer re_123abc..." \
  -H "Content-Type: application/json" \
  -d '{
    "from": "alerts@tudominio.com",
    "to": ["usuario@example.com"],
    "subject": "⚠️ Low Engagement Alert",
    "html": "<h1>Alert</h1><p>Engagement dropped to 1.3%</p>"
  }'
```

### OpenAI API

**Uso:** Análisis de captions, sugerencias (opcional en MVP)

```bash
curl https://api.openai.com/v1/chat/completions \
  -H "Authorization: Bearer sk-proj-..." \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4o-mini",
    "messages": [
      {"role": "system", "content": "Analiza este caption de Instagram"},
      {"role": "user", "content": "Check out this sunset! 🌅"}
    ],
    "max_tokens": 150
  }'
```

**Costo estimado:** ~$2/mes con 100 análisis/día

---

## 7. WORKFLOWS N8N

### Workflow 1: Instagram Ingestion

**Trigger:** Cron `0 */6 * * *` (cada 6 horas)

**Nodos:**
1. **Cron Trigger**
2. **Supabase: Get client** → SELECT * FROM clients WHERE status = 'active'
3. **HTTP Request: Get profile** → Instagram API `/me`
4. **HTTP Request: Get media** → Instagram API `/me/media?limit=50`
5. **Loop: For each post**
   - HTTP Request: Get insights → `/media-id/insights`
   - Transform data (JS Code)
   - Supabase: Upsert post → ON CONFLICT DO UPDATE
6. **Supabase: Log execution** → INSERT INTO automation_logs

**Variables de entorno necesarias:**
- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`
- `INSTAGRAM_ACCESS_TOKEN` (o leer de tabla clients)

### Workflow 2: Calculate Metrics

**Trigger:** Cron `10 */6 * * *` (10 min después de ingesta)

**Nodos:**
1. **Cron Trigger**
2. **Supabase: Query posts** → Últimos 30 días
3. **JS Code: Calculate metrics**
   - avg_engagement_rate_7d
   - avg_engagement_rate_30d
   - avg_reach_7d/30d
   - totales de likes, comments, etc.
4. **Supabase: Upsert account_stats**

### Workflow 3: Check Engagement Threshold

**Trigger:** Cron `15 */6 * * *` (15 min después de calcular métricas)

**Nodos:**
1. **Cron Trigger**
2. **Supabase: Query account_stats** → Último cálculo
3. **IF: engagement_rate_7d < 2**
   - **TRUE:**
     - Supabase: Insert alert
     - HTTP Request: Resend API (enviar email)
   - **FALSE:** End
4. **Supabase: Log execution**

**Template de email:** Ver sección 6 del dosier completo

---

## 8. PLAN DE ENTREGA MODULAR

### Roadmap (8-10 semanas)

```
SEMANA 1-2:  Módulo 0 (Fundaciones)
             ✅ Setup Supabase, Instagram API, n8n
             ✅ Auth funcionando
             ✅ Ingesta básica funcionando

SEMANA 3-4:  Módulo 1 (Dashboard Home)
             ✅ Dashboard con métricas reales
             ✅ Gráfico de engagement
             ✅ Top 5 posts

SEMANA 5-6:  Módulo 2 (Analytics)
             ✅ Página con filtros
             ✅ Múltiples gráficos
             ✅ Tabla de posts

SEMANA 7:    Módulo 3 (Content Library)
             ✅ Búsqueda fulltext
             ✅ Grid con infinite scroll

SEMANA 8:    Módulo 4 (Alerts System)
             ✅ Sistema de alertas funcionando
             ✅ Emails automáticos

SEMANA 9:    Módulo 5 (Polish)
             ✅ Dark mode
             ✅ Responsive completo
             ✅ Performance optimizations

SEMANA 10:   Testing + Deploy
             ✅ E2E tests
             ✅ Deploy a producción
```

### Módulo 0: Fundaciones (CRÍTICO - EMPEZAR AQUÍ)

**Objetivo:** Infraestructura base funcional

**Tickets:**

**0.1 Setup Supabase**
- [ ] Crear proyecto en Supabase Cloud
- [ ] Ejecutar SQL schema completo (sección 5)
- [ ] Crear bucket de Storage: `post-thumbnails`
- [ ] Configurar RLS policies
- [ ] Insertar seed data (1 cliente)

**0.2 Setup Instagram API**
- [ ] Crear app en Meta for Developers
- [ ] Solicitar permisos necesarios
- [ ] Obtener long-lived token
- [ ] Actualizar token en tabla clients
- [ ] Documentar proceso de refresh

**0.3 Setup n8n (self-hosted)**
- [ ] Provisionar VPS (DigitalOcean, Hetzner, etc)
- [ ] Instalar Docker + Docker Compose
- [ ] Deploy n8n:
  ```bash
  docker run -d --name n8n \
    -p 5678:5678 \
    -e N8N_BASIC_AUTH_ACTIVE=true \
    -e N8N_BASIC_AUTH_USER=admin \
    -e N8N_BASIC_AUTH_PASSWORD=securepassword \
    -v ~/.n8n:/home/node/.n8n \
    n8nio/n8n
  ```
- [ ] Configurar variables de entorno
- [ ] Instalar MCP oficial de n8n
- [ ] Crear workflow "Instagram Ingestion v1"
- [ ] Probar ejecución manual (ingestar 10 posts)

**0.4 Setup Proyecto Next.js**
- [ ] Inicializar proyecto:
  ```bash
  npx create-next-app@latest instagram-dashboard \
    --typescript \
    --tailwind \
    --app \
    --eslint
  ```
- [ ] Instalar dependencias:
  ```bash
  npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
  npm install @tanstack/react-query recharts date-fns
  npm install lucide-react class-variance-authority clsx tailwind-merge
  ```
- [ ] Configurar shadcn/ui:
  ```bash
  npx shadcn-ui@latest init
  ```
- [ ] Crear estructura de carpetas (ver sección 9)
- [ ] Configurar variables de entorno (.env.local)

**0.5 Implementar Autenticación**
- [ ] Crear `/app/login/page.tsx` con Google OAuth
- [ ] Crear callback handler `/app/auth/callback/route.ts`
- [ ] Crear middleware para proteger rutas
- [ ] Crear layout con header básico
- [ ] Probar login → redirect a /dashboard

**Criterio de completitud Módulo 0:**
✅ n8n ingesta datos cada 6h → Supabase tiene posts
✅ Puedes hacer login y ver dashboard vacío protegido

---

## 9. ESTRUCTURA DEL REPOSITORIO

```
instagram-dashboard/
├── .env.local                    # Variables de entorno (NO commitear)
├── .env.example                  # Template de env vars
├── .gitignore
├── next.config.js
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── components.json               # shadcn/ui config
├── README.md
│
├── docs/
│   ├── DOSIER_TECNICO.md        # Este documento
│   ├── ARQUITECTURA.md
│   └── API_REFERENCE.md
│
├── src/
│   ├── app/                     # Next.js App Router
│   │   ├── layout.tsx           # Root layout
│   │   ├── page.tsx             # Home (redirect a /dashboard)
│   │   │
│   │   ├── login/
│   │   │   └── page.tsx         # Página de login
│   │   │
│   │   ├── auth/
│   │   │   └── callback/
│   │   │       └── route.ts     # OAuth callback handler
│   │   │
│   │   ├── dashboard/
│   │   │   ├── layout.tsx       # Dashboard layout (sidebar + header)
│   │   │   ├── page.tsx         # Dashboard Home
│   │   │   └── loading.tsx      # Loading UI
│   │   │
│   │   ├── analytics/
│   │   │   └── page.tsx         # Analytics page
│   │   │
│   │   ├── content/
│   │   │   └── page.tsx         # Content Library
│   │   │
│   │   ├── alerts/
│   │   │   └── page.tsx         # Alerts page
│   │   │
│   │   └── api/                 # API Routes
│   │       ├── dashboard/
│   │       │   └── overview/
│   │       │       └── route.ts
│   │       ├── analytics/
│   │       │   ├── metrics/
│   │       │   └── posts/
│   │       └── alerts/
│   │           ├── route.ts
│   │           └── [id]/
│   │               └── route.ts
│   │
│   ├── components/
│   │   ├── ui/                  # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   └── ...
│   │   │
│   │   ├── dashboard/
│   │   │   ├── StatCard.tsx
│   │   │   ├── EngagementChart.tsx
│   │   │   └── TopPostsGrid.tsx
│   │   │
│   │   ├── analytics/
│   │   │   ├── PostsTable.tsx
│   │   │   ├── MetricsGrid.tsx
│   │   │   └── BreakdownCharts.tsx
│   │   │
│   │   ├── content/
│   │   │   ├── PostCard.tsx
│   │   │   ├── PostDetailModal.tsx
│   │   │   └── ContentGrid.tsx
│   │   │
│   │   ├── alerts/
│   │   │   ├── AlertCard.tsx
│   │   │   ├── AlertBadge.tsx
│   │   │   └── AlertFilters.tsx
│   │   │
│   │   └── layout/
│   │       ├── DashboardLayout.tsx
│   │       ├── Header.tsx
│   │       └── Sidebar.tsx
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts        # Client-side Supabase client
│   │   │   ├── server.ts        # Server-side Supabase client
│   │   │   └── middleware.ts    # Supabase middleware
│   │   │
│   │   ├── utils.ts             # Utility functions (cn, formatDate, etc)
│   │   ├── constants.ts         # Constants
│   │   └── queries.ts           # React Query hooks
│   │
│   ├── types/
│   │   ├── database.ts          # Supabase types (auto-generated)
│   │   ├── instagram.ts         # Instagram API types
│   │   └── index.ts
│   │
│   └── hooks/
│       ├── useAuth.ts           # Auth hook
│       ├── useDashboard.ts      # Dashboard data hook
│       └── useAlerts.ts         # Alerts hook
│
├── public/
│   ├── logo.svg
│   └── favicon.ico
│
├── n8n/
│   ├── workflows/
│   │   ├── instagram-ingestion.json
│   │   ├── calculate-metrics.json
│   │   └── check-alerts.json
│   └── credentials/
│       └── README.md            # Cómo configurar credentials
│
└── supabase/
    ├── schema.sql               # Schema completo (de sección 5)
    ├── seed.sql                 # Seed data
    └── migrations/
        └── 001_initial_schema.sql
```

---

## 10. CONFIGURACIÓN DE ENTORNO

### Archivo `.env.example`

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://tuproyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Instagram (opcional si se guarda en DB)
INSTAGRAM_ACCESS_TOKEN=IGQVJXabc123...

# Resend
RESEND_API_KEY=re_123abc...

# OpenAI (opcional)
OPENAI_API_KEY=sk-proj-...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

### Archivo `.env.local` (crear después de setup Supabase)

```bash
# Copiar valores reales de Supabase Project Settings > API
NEXT_PUBLIC_SUPABASE_URL=tu_url_real
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_real
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_real

# Resto de keys después de configurar servicios
RESEND_API_KEY=
OPENAI_API_KEY=
```

---

## 11. COMANDOS DE SETUP INICIAL

### 1. Crear proyecto Next.js

```bash
npx create-next-app@latest instagram-dashboard \
  --typescript \
  --tailwind \
  --app \
  --eslint \
  --src-dir \
  --import-alias "@/*"

cd instagram-dashboard
```

### 2. Instalar dependencias

```bash
# Core
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs @supabase/ssr

# State management & data fetching
npm install @tanstack/react-query zustand

# UI & Charts
npm install recharts date-fns lucide-react
npm install class-variance-authority clsx tailwind-merge

# Forms (para filtros)
npm install react-hook-form @hookform/resolvers zod

# Dev dependencies
npm install -D @types/node
```

### 3. Setup shadcn/ui

```bash
npx shadcn-ui@latest init

# Instalar componentes necesarios
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add input
npx shadcn-ui@latest add label
npx shadcn-ui@latest add select
npx shadcn-ui@latest add table
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add toast
npx shadcn-ui@latest add skeleton
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add calendar
npx shadcn-ui@latest add popover
```

### 4. Configurar Supabase

```bash
# En el proyecto Supabase (web):
# 1. Ir a SQL Editor
# 2. Copiar todo el SQL de la sección 5 de este dosier
# 3. Ejecutar

# Configurar Storage:
# 1. Ir a Storage
# 2. Crear bucket: "post-thumbnails"
# 3. Configurar como público
```

### 5. Crear estructura de archivos base

```bash
# Crear directorios
mkdir -p src/{components/{ui,dashboard,analytics,content,alerts,layout},lib/{supabase},types,hooks}
mkdir -p docs n8n/{workflows,credentials} supabase

# Crear archivos de configuración
touch .env.local .env.example
touch src/lib/supabase/{client,server,middleware}.ts
touch src/lib/{utils,constants,queries}.ts
touch src/types/{database,instagram,index}.ts
```

### 6. Configurar Supabase clients

**src/lib/supabase/client.ts** (para uso client-side):

```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

**src/lib/supabase/server.ts** (para uso server-side):

```typescript
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createClient() {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )
}
```

### 7. Configurar middleware de autenticación

**src/middleware.ts**:

```typescript
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Proteger rutas /dashboard/*
  if (request.nextUrl.pathname.startsWith('/dashboard') && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Redirect logged users away from /login
  if (request.nextUrl.pathname === '/login' && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: ['/dashboard/:path*', '/login'],
}
```

### 8. Setup n8n (VPS)

```bash
# En tu VPS (SSH):

# 1. Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 2. Instalar Docker Compose
sudo apt-get update
sudo apt-get install docker-compose-plugin

# 3. Crear directorio para n8n
mkdir ~/n8n-data

# 4. Crear docker-compose.yml
cat > docker-compose.yml <<EOF
version: '3'

services:
  n8n:
    image: n8nio/n8n
    restart: always
    ports:
      - "5678:5678"
    environment:
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=admin
      - N8N_BASIC_AUTH_PASSWORD=CHANGE_THIS_PASSWORD
      - N8N_HOST=your-vps-ip
      - N8N_PORT=5678
      - N8N_PROTOCOL=http
      - GENERIC_TIMEZONE=Europe/Madrid
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_SERVICE_KEY=${SUPABASE_SERVICE_KEY}
      - RESEND_API_KEY=${RESEND_API_KEY}
    volumes:
      - ~/n8n-data:/home/node/.n8n
EOF

# 5. Crear .env con tus valores
cat > .env <<EOF
SUPABASE_URL=tu_url
SUPABASE_SERVICE_KEY=tu_key
RESEND_API_KEY=tu_key
EOF

# 6. Iniciar n8n
docker-compose up -d

# 7. Verificar logs
docker-compose logs -f n8n

# 8. Acceder a n8n
# http://tu-vps-ip:5678
# User: admin
# Pass: (lo que pusiste en docker-compose.yml)
```

---

## 12. CHECKLIST DE DESARROLLO

### Módulo 0: Fundaciones ✅

- [ ] Supabase proyecto creado y schema ejecutado
- [ ] Instagram API configurada, token obtenido
- [ ] n8n instalado en VPS y accesible
- [ ] Proyecto Next.js inicializado con todas las dependencias
- [ ] Autenticación funciona (login + redirect + logout)
- [ ] Workflow n8n "Instagram Ingestion" creado
- [ ] Primera ejecución manual exitosa (posts en Supabase)

### Módulo 1: Dashboard Home ✅

- [ ] Página `/dashboard` renderiza
- [ ] Componente `StatCard` creado y funcional
- [ ] API route `/api/dashboard/overview` retorna datos correctos
- [ ] Gráfico de engagement muestra datos reales
- [ ] Top 5 posts se visualizan correctamente
- [ ] Loading states implementados
- [ ] Error handling implementado
- [ ] Responsive en mobile/tablet/desktop

### Módulo 2: Analytics ✅

- [ ] Página `/analytics` renderiza
- [ ] Date range picker funciona
- [ ] Post type filters funcionan
- [ ] KPI cards muestran métricas correctas
- [ ] 4 gráficos renderizan correctamente
- [ ] Tabla de posts con sorting y paginación
- [ ] Modal de detalle de post funciona
- [ ] Filtros sincronizan con URL (shareable)

### Módulo 3: Content Library ✅

- [ ] Página `/content` renderiza
- [ ] Search bar con debounce funciona
- [ ] Fulltext search retorna resultados relevantes
- [ ] Filtros de media type funcionan
- [ ] Grid con infinite scroll carga más posts
- [ ] PostCard component muestra info correcta
- [ ] Modal de detalle funciona
- [ ] Empty state cuando no hay resultados

### Módulo 4: Alerts System ✅

- [ ] Workflow n8n "Check Alerts" creado
- [ ] Alerta se crea cuando engagement < 2%
- [ ] Email se envía vía Resend
- [ ] Página `/alerts` lista alertas correctamente
- [ ] Badge en sidebar muestra count de unread
- [ ] Puede marcar alerta como read/dismissed
- [ ] Filtros de alertas funcionan
- [ ] Realtime update (opcional) funciona

### Módulo 5: Polish & Deploy ✅

- [ ] Dark mode implementado y funciona
- [ ] Responsive revisado en todas las páginas
- [ ] Performance: Lighthouse score >85
- [ ] E2E tests críticos pasan
- [ ] Deploy a Vercel exitoso
- [ ] n8n workflows en producción funcionan
- [ ] Documentación actualizada

---

## PRÓXIMOS PASOS INMEDIATOS

### Para EMPEZAR AHORA con Claude Code:

1. **Descargar este dosier** y guardarlo en el repositorio como `docs/DOSIER_TECNICO.md`

2. **Ejecutar comandos de setup** (sección 11):
   ```bash
   npx create-next-app@latest instagram-dashboard --typescript --tailwind --app --eslint
   cd instagram-dashboard
   # ... seguir comandos
   ```

3. **Configurar Supabase** (web UI):
   - Crear proyecto
   - Ejecutar SQL de sección 5
   - Copiar credenciales a .env.local

4. **Primera iteración con Claude Code**:
   - Pedir implementar layout base
   - Luego página de login
   - Luego middleware de auth
   - Probar flujo completo de autenticación

5. **Setup n8n en VPS**:
   - Provisionar VPS
   - Seguir comandos de sección 11.8
   - Crear primer workflow de ingesta

---

## GLOSARIO

- **MVP:** Minimum Viable Product (Producto Mínimo Viable)
- **RLS:** Row Level Security (Seguridad a Nivel de Fila en PostgreSQL)
- **SSR:** Server-Side Rendering
- **LCP:** Largest Contentful Paint (métrica Web Vitals)
- **FID:** First Input Delay (métrica Web Vitals)
- **CLS:** Cumulative Layout Shift (métrica Web Vitals)
- **JWT:** JSON Web Token
- **OAuth:** Open Authorization
- **API:** Application Programming Interface
- **VPS:** Virtual Private Server
- **SPF:** Sender Policy Framework (email)
- **DKIM:** DomainKeys Identified Mail (email)

---

## CONTACTO Y SOPORTE

Para dudas durante el desarrollo:
- **Instagram Graph API:** https://developers.facebook.com/docs/instagram-api
- **Supabase Docs:** https://supabase.com/docs
- **n8n Docs:** https://docs.n8n.io
- **Next.js Docs:** https://nextjs.org/docs
- **shadcn/ui Docs:** https://ui.shadcn.com

---

**FIN DEL DOSIER TÉCNICO-FUNCIONAL**

Este documento debe ser la referencia única de verdad durante todo el desarrollo. Cualquier cambio en decisiones técnicas debe actualizarse aquí primero.
