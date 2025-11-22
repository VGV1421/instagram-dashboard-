# Instagram Dashboard - Sistema Automatico de Contenido

Sistema completo y automatizado para analizar competidores de Instagram, generar contenido con IA y gestionar publicaciones automaticamente. Disenado para crecer seguidores y convertirlos en compradores.

![Next.js](https://img.shields.io/badge/Next.js-16.0.3-black?style=flat&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat&logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green?style=flat&logo=supabase)
![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o--mini-412991?style=flat&logo=openai)
![n8n](https://img.shields.io/badge/n8n-Automation-orange?style=flat)

---

## Flujo Automatico

```
1. ANALIZAR COMPETIDORES (Apify)
         |
         v
2. EXTRAER POSTS CON BUEN ENGAGEMENT
         |
         v
3. ANALIZAR CON IA (OpenAI)
         |
         v
4. GENERAR CONTENIDO NUEVO
   - Posts con caption
   - Reels con script
   - Carruseles
         |
         v
5. NOTIFICAR POR EMAIL (Resend)
   - Contenido completo listo para copiar
         |
         v
6. [OPCIONAL] GENERAR VIDEO CON AVATAR
   - HeyGen + ElevenLabs
```

---

## Funcionalidades Implementadas

### Analisis de Competidores
- **Scraping con Apify**: Extrae posts de cualquier cuenta publica de Instagram
- **Gestion desde Dashboard**: Activar/desactivar competidores con un clic
- **Gestion desde Excel**: Importar/exportar lista de competidores
- **Sincronizacion inteligente**: Solo sincroniza competidores activos

### Generacion de Contenido con IA
- **Analisis de tendencias**: Identifica que tipo de contenido funciona mejor
- **Generacion automatica**: Crea posts, reels y carruseles basados en analisis
- **Prediccion de engagement**: Clasifica contenido por potencial (high/medium/low)
- **Scripts para videos**: Genera guiones listos para grabar

### Notificaciones por Email
- **Reporte completo**: Recibe todo el contenido generado en tu email
- **Listo para movil**: Ver y copiar contenido sin necesidad del dashboard
- **Alertas de errores**: Notificaciones cuando algo falla

### Automatizacion con n8n
- **Ciclo diario**: Ejecuta todo el proceso cada 24 horas
- **Sin intervencion**: Despierta con contenido nuevo en tu bandeja

### Generacion de Videos (Opcional)
- **Avatar parlante**: Usa HeyGen para crear videos con avatar
- **Voz clonada**: Usa ElevenLabs para voz personalizada
- **Gestion de fotos**: Sistema de fotos usadas/sin usar para variedad

---

## Stack Tecnologico

| Componente | Tecnologia |
|------------|------------|
| Frontend | Next.js 16 + TypeScript + Tailwind CSS |
| UI | shadcn/ui + Recharts + Lucide Icons |
| Base de datos | Supabase (PostgreSQL) |
| Scraping | Apify Instagram Scraper |
| IA | OpenAI GPT-4o-mini |
| Email | Resend API |
| Automatizacion | n8n Workflows |
| Video (opcional) | HeyGen + ElevenLabs |

---

## Instalacion Rapida

### 1. Clonar e instalar

```bash
git clone https://github.com/TU_USUARIO/instagram-dashboard.git
cd instagram-dashboard
npm install
```

### 2. Configurar variables de entorno

Copia `.env.example` a `.env.local` y configura:

**Requeridas:**
- `NEXT_PUBLIC_SUPABASE_URL` - URL de tu proyecto Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Clave publica de Supabase
- `SUPABASE_SERVICE_ROLE_KEY` - Clave de servicio (backend)
- `APIFY_API_TOKEN` - Para scraping de competidores
- `OPENAI_API_KEY` - Para generacion de contenido
- `RESEND_API_KEY` - Para notificaciones por email
- `ALERT_EMAIL_TO` - Tu email para recibir notificaciones

**Opcionales:**
- `HEYGEN_API_KEY` - Para videos con avatar
- `ELEVENLABS_API_KEY` - Para voz clonada

### 3. Configurar base de datos

Ejecuta el schema en Supabase SQL Editor:

```bash
# Archivo: supabase/schema.sql
```

### 4. Iniciar aplicacion

```bash
npm run dev
```

Abre http://localhost:3000

---

## Uso del Sistema

### Agregar Competidores

1. Ve a `/competidores` en el dashboard
2. Haz clic en "Agregar Competidor"
3. Introduce el username de Instagram (sin @)
4. Activa/desactiva con el toggle

**O desde Excel:**
1. Llama a `GET /api/competitors/sync-csv` para exportar
2. Edita `COMPETIDORES.xlsx` - columna SELECCIONAR: SI/NO
3. Llama a `POST /api/competitors/sync-csv` para importar

### Ejecutar Ciclo Manual

```bash
curl -X POST http://localhost:3000/api/automation/run-full-cycle \
  -H "Content-Type: application/json" \
  -d '{
    "syncCompetitors": true,
    "analyzeContent": true,
    "generateContent": true,
    "competitorsToSync": 100,
    "contentToGenerate": 3
  }'
```

### Automatizar con n8n

1. Inicia n8n: `n8n start`
2. Importa `n8n-workflows/daily-automation-cycle.json`
3. Activa el workflow
4. El ciclo se ejecutara cada 24 horas automaticamente

---

## API Endpoints

### Competidores
| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| GET | `/api/competitors` | Lista competidores |
| POST | `/api/competitors` | Agregar competidor |
| PATCH | `/api/competitors` | Activar/desactivar |
| DELETE | `/api/competitors` | Eliminar competidor |
| GET | `/api/competitors/sync-csv` | Exportar a Excel |
| POST | `/api/competitors/sync-csv` | Importar desde Excel |
| POST | `/api/competitors/sync-apify` | Sincronizar con Apify |

### Contenido
| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| POST | `/api/competitors/analyze` | Analizar posts con IA |
| POST | `/api/content/generate-auto` | Generar contenido nuevo |
| GET | `/api/scheduled-content` | Ver contenido programado |

### Automatizacion
| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| POST | `/api/automation/run-full-cycle` | Ejecutar ciclo completo |
| GET | `/api/automation/run-full-cycle` | Estado de automatizacion |
| POST | `/api/notifications` | Enviar notificacion manual |

### Video (Opcional)
| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| POST | `/api/video/talking-avatar` | Generar video con avatar |
| GET | `/api/video/talking-avatar` | Listar fotos disponibles |

---

## Base de Datos

### Tablas Principales

| Tabla | Descripcion |
|-------|-------------|
| `competitors` | Lista de competidores a analizar |
| `competitor_posts` | Posts extraidos de competidores |
| `scheduled_content` | Contenido generado pendiente de publicar |
| `automation_logs` | Logs de ejecuciones automaticas |
| `alerts` | Sistema de alertas |

---

## Estructura del Proyecto

```
instagram-dashboard/
├── src/
│   ├── app/
│   │   ├── api/                    # API Routes
│   │   │   ├── automation/         # Ciclo automatico
│   │   │   ├── competitors/        # CRUD competidores
│   │   │   ├── content/            # Generacion contenido
│   │   │   ├── video/              # Videos con avatar
│   │   │   └── notifications/      # Email
│   │   ├── competidores/           # Pagina gestion competidores
│   │   ├── tendencias/             # Pagina analytics
│   │   └── page.tsx                # Home
│   ├── components/                 # Componentes React
│   └── lib/
│       ├── supabase/               # Cliente Supabase
│       ├── email/                  # Notificaciones
│       └── competitors/            # Logica de competidores
├── n8n-workflows/                  # Workflows de automatizacion
├── supabase/                       # Schema SQL
├── FOTOS AVATAR SIN USAR/          # Fotos para videos
└── FOTOS AVAR USADAS/              # Fotos ya utilizadas
```

---

## Email de Notificacion

Cuando se completa el ciclo, recibiras un email con:

- Resumen de competidores sincronizados
- Numero de piezas de contenido generadas
- **Contenido completo** de cada pieza:
  - Tipo (Post/Reel/Carrusel)
  - Tema
  - Caption listo para copiar
  - Script (si es reel)
  - Hashtags recomendados
  - Prediccion de engagement

---

## Troubleshooting

### El scraping de Apify falla
- Verifica que `APIFY_API_TOKEN` sea valido
- Comprueba que el username existe y es publico
- Revisa los creditos disponibles en Apify

### No se genera contenido
- Verifica `OPENAI_API_KEY`
- Asegurate de tener competidores activos con posts
- Revisa los logs en Supabase tabla `automation_logs`

### No llegan emails
- Verifica `RESEND_API_KEY` y `ALERT_EMAIL_TO`
- En desarrollo usa `onboarding@resend.dev` como remitente
- Revisa spam/promociones

### n8n no ejecuta
- Verifica que n8n este corriendo: `n8n start`
- Asegurate que el workflow este activado (toggle verde)
- Revisa Executions en n8n para ver errores

---

## Proximos Pasos (Roadmap)

- [ ] Integracion con Instagram Publishing API
- [ ] Calendario visual de contenido
- [ ] A/B testing de captions
- [ ] Analytics de rendimiento post-publicacion
- [ ] Integracion con ManyChat para leads

---

## Licencia

Proyecto privado. Todos los derechos reservados.

---

Generado con [Claude Code](https://claude.com/claude-code)
