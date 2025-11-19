-- ============================================
-- INSTAGRAM DASHBOARD - SCHEMA COMPLETO
-- Base de datos para Analytics de Instagram
-- ============================================

-- ============================================
-- EXTENSIONES NECESARIAS
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
-- Almacena las cuentas de Instagram conectadas
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
-- Almacena todos los posts de Instagram
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
-- Estadísticas agregadas de la cuenta
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
-- Sistema de alertas automáticas
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
-- Logs de ejecución de workflows n8n
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

ALTER TABLE automation_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view automation_logs"
  ON automation_logs FOR SELECT
  USING (auth.role() = 'authenticated');

-- ============================================
-- FUNCIONES SQL ÚTILES
-- ============================================

-- Función: Dashboard overview
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

-- Función: Top posts
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

-- Función: Búsqueda fulltext
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
-- SEED DATA: Insertar cuenta de Instagram
-- ============================================
INSERT INTO clients (
  id,
  name,
  instagram_username,
  instagram_user_id,
  access_token,
  status
)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Digital Mind Millonaria',
  'digitalmindmillonaria',
  '17841475742645634',
  'EAALDN6SVqdsBP1VxaXOd5LEeIJxpC6c7tZBkdxXZCpXNFJ4ReZCIrAIHIcAbnTv9B9cieT8p1CMiBQgRl0N13pQgyFpi5D34JIZACov0SWIghTOOZACXZAryFs2P44MR1iDlWlcnE6UUVMOWXhnOLYcp5K1LlLjZCvpUg0HChfZAuwwNoGklrcu7wNn0YqIcVF0SQfjVP4MZClsKnqqZAhZBfprVoAPjB4ci5vKR3wZBfmneVwZDZD',
  'active'
);
