-- Tabla para almacenar competidores
CREATE TABLE IF NOT EXISTS competitors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  instagram_username VARCHAR(255) NOT NULL UNIQUE,
  instagram_url TEXT NOT NULL,
  display_name VARCHAR(255),
  bio TEXT,
  followers_count INTEGER,
  following_count INTEGER,
  posts_count INTEGER,
  profile_picture_url TEXT,
  category VARCHAR(100),
  is_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  last_synced_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para posts de competidores
CREATE TABLE IF NOT EXISTS competitor_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  competitor_id UUID NOT NULL REFERENCES competitors(id) ON DELETE CASCADE,
  instagram_post_id VARCHAR(255) NOT NULL UNIQUE,
  caption TEXT,
  media_type VARCHAR(50),
  media_url TEXT,
  permalink TEXT,
  timestamp TIMESTAMP WITH TIME ZONE,
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  engagement_rate DECIMAL(5,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_competitors_username ON competitors(instagram_username);
CREATE INDEX IF NOT EXISTS idx_competitors_active ON competitors(is_active);
CREATE INDEX IF NOT EXISTS idx_competitor_posts_competitor ON competitor_posts(competitor_id);
CREATE INDEX IF NOT EXISTS idx_competitor_posts_engagement ON competitor_posts(engagement_rate DESC);
CREATE INDEX IF NOT EXISTS idx_competitor_posts_timestamp ON competitor_posts(timestamp DESC);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_competitors_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_competitors_updated_at
  BEFORE UPDATE ON competitors
  FOR EACH ROW
  EXECUTE FUNCTION update_competitors_updated_at();

-- RLS Policies (si usas Row Level Security)
ALTER TABLE competitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitor_posts ENABLE ROW LEVEL SECURITY;

-- Policy para permitir lectura pública (ajusta según tus necesidades)
CREATE POLICY "Enable read access for all users" ON competitors
  FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON competitor_posts
  FOR SELECT USING (true);

-- Policy para permitir escritura (ajusta según tus necesidades)
CREATE POLICY "Enable insert for all users" ON competitors
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON competitors
  FOR UPDATE USING (true);

CREATE POLICY "Enable insert for all users" ON competitor_posts
  FOR INSERT WITH CHECK (true);

COMMENT ON TABLE competitors IS 'Almacena información de perfiles de competidores de Instagram';
COMMENT ON TABLE competitor_posts IS 'Almacena posts de competidores para análisis de contenido';
