-- =====================================================
-- TABLAS PARA AUTOMATIZACIÓN DE CONTENIDO
-- Ejecutar en Supabase SQL Editor
-- =====================================================

-- 1. Tabla para almacenar análisis de competidores
CREATE TABLE IF NOT EXISTS competitor_analysis (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  analysis_data JSONB NOT NULL,
  statistics JSONB,
  competitor_ids UUID[],
  posts_analyzed INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para búsquedas por fecha
CREATE INDEX IF NOT EXISTS idx_competitor_analysis_created
ON competitor_analysis(created_at DESC);

-- 2. Tabla para contenido programado
CREATE TABLE IF NOT EXISTS scheduled_content (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id),
  content_type VARCHAR(50) NOT NULL CHECK (content_type IN ('post', 'reel', 'carousel', 'story')),
  topic VARCHAR(500),
  caption TEXT NOT NULL,
  script TEXT,
  hashtags TEXT[],
  suggested_media TEXT,
  media_url TEXT,
  scheduled_for TIMESTAMP WITH TIME ZONE,
  published_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'publishing', 'published', 'failed')),
  engagement_prediction VARCHAR(20),
  actual_engagement JSONB,
  metadata JSONB,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para scheduled_content
CREATE INDEX IF NOT EXISTS idx_scheduled_content_status ON scheduled_content(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_content_scheduled ON scheduled_content(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_scheduled_content_client ON scheduled_content(client_id);

-- 3. Tabla para logs de automatización expandida
ALTER TABLE automation_logs ADD COLUMN IF NOT EXISTS
  content_generated INTEGER DEFAULT 0;
ALTER TABLE automation_logs ADD COLUMN IF NOT EXISTS
  competitors_synced INTEGER DEFAULT 0;
ALTER TABLE automation_logs ADD COLUMN IF NOT EXISTS
  analysis_performed BOOLEAN DEFAULT FALSE;

-- 4. Agregar columna source a clients si no existe
ALTER TABLE clients ADD COLUMN IF NOT EXISTS source VARCHAR(100) DEFAULT 'organico';

-- 5. Agregar columna status a alerts si no existe
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'unread';

-- 6. Vista para contenido pendiente de publicar
CREATE OR REPLACE VIEW pending_content AS
SELECT
  sc.*,
  c.instagram_username,
  c.name as client_name
FROM scheduled_content sc
LEFT JOIN clients c ON sc.client_id = c.id
WHERE sc.status = 'scheduled'
  AND sc.scheduled_for <= NOW() + INTERVAL '1 hour'
ORDER BY sc.scheduled_for ASC;

-- 7. Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para scheduled_content
DROP TRIGGER IF EXISTS update_scheduled_content_updated_at ON scheduled_content;
CREATE TRIGGER update_scheduled_content_updated_at
  BEFORE UPDATE ON scheduled_content
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 8. Tabla para tracking de sincronización de competidores
CREATE TABLE IF NOT EXISTS competitor_sync_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  competitor_id UUID REFERENCES competitors(id),
  sync_type VARCHAR(50) CHECK (sync_type IN ('profile', 'posts', 'full')),
  posts_fetched INTEGER DEFAULT 0,
  success BOOLEAN DEFAULT TRUE,
  error_message TEXT,
  api_used VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_competitor_sync_created
ON competitor_sync_log(created_at DESC);

-- 9. Agregar campos útiles a competitors si no existen
ALTER TABLE competitors ADD COLUMN IF NOT EXISTS
  last_analysis_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE competitors ADD COLUMN IF NOT EXISTS
  avg_engagement_rate DECIMAL(5,2);
ALTER TABLE competitors ADD COLUMN IF NOT EXISTS
  sync_priority INTEGER DEFAULT 5;
ALTER TABLE competitors ADD COLUMN IF NOT EXISTS
  total_posts_synced INTEGER DEFAULT 0;

-- 10. Vista de competidores para sincronizar (priorizados)
CREATE OR REPLACE VIEW competitors_to_sync AS
SELECT
  c.*,
  COALESCE(
    EXTRACT(EPOCH FROM (NOW() - c.last_synced_at)) / 3600,
    999
  ) as hours_since_sync,
  COUNT(cp.id) as posts_count
FROM competitors c
LEFT JOIN competitor_posts cp ON cp.competitor_id = c.id
WHERE c.is_active = TRUE
GROUP BY c.id
ORDER BY
  c.sync_priority DESC,
  hours_since_sync DESC
LIMIT 10;

-- =====================================================
-- PERMISOS RLS (Row Level Security)
-- =====================================================

-- Habilitar RLS en nuevas tablas
ALTER TABLE competitor_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitor_sync_log ENABLE ROW LEVEL SECURITY;

-- Políticas permisivas para service role
CREATE POLICY "Service role full access to competitor_analysis" ON competitor_analysis
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access to scheduled_content" ON scheduled_content
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access to competitor_sync_log" ON competitor_sync_log
  FOR ALL USING (true) WITH CHECK (true);

-- =====================================================
-- DATOS DE PRUEBA (opcional)
-- =====================================================

-- Insertar contenido de ejemplo si la tabla está vacía
INSERT INTO scheduled_content (content_type, topic, caption, hashtags, status, engagement_prediction, scheduled_for)
SELECT
  'post',
  'Introducción a la IA para emprendedores',
  '🤖 ¿Sabías que el 80% de las tareas repetitivas de tu negocio pueden automatizarse con IA?

Hoy te cuento 3 herramientas GRATIS que están cambiando el juego:

1️⃣ ChatGPT - Para crear contenido
2️⃣ Canva AI - Para diseños automáticos
3️⃣ Notion AI - Para organizar tu negocio

¿Cuál vas a probar primero? 👇

#InteligenciaArtificial #Emprendimiento #IA #Productividad #NegociosDigitales',
  ARRAY['#InteligenciaArtificial', '#Emprendimiento', '#IA', '#Productividad', '#NegociosDigitales'],
  'scheduled',
  'high',
  NOW() + INTERVAL '1 day'
WHERE NOT EXISTS (SELECT 1 FROM scheduled_content LIMIT 1);

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

-- Mostrar tablas creadas
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('competitor_analysis', 'scheduled_content', 'competitor_sync_log')
ORDER BY table_name;
