-- Tabla para cuentas de competidores
CREATE TABLE IF NOT EXISTS competitor_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  instagram_username TEXT NOT NULL,
  instagram_user_id TEXT,
  notes TEXT,
  tracking_enabled BOOLEAN DEFAULT true,
  last_sync TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(client_id, instagram_username)
);

-- Índices para mejor performance
CREATE INDEX IF NOT EXISTS idx_competitor_accounts_client_id ON competitor_accounts(client_id);
CREATE INDEX IF NOT EXISTS idx_competitor_accounts_tracking ON competitor_accounts(tracking_enabled);

-- RLS policies
ALTER TABLE competitor_accounts ENABLE ROW LEVEL SECURITY;

-- Tabla para posts de competidores
CREATE TABLE IF NOT EXISTS competitor_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  competitor_account_id UUID REFERENCES competitor_accounts(id) ON DELETE CASCADE,
  instagram_post_id TEXT NOT NULL UNIQUE,
  caption TEXT,
  media_type TEXT,
  permalink TEXT,
  timestamp TIMESTAMPTZ,
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  reach INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  engagement_rate DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_competitor_posts_account ON competitor_posts(competitor_account_id);
CREATE INDEX IF NOT EXISTS idx_competitor_posts_timestamp ON competitor_posts(timestamp);
CREATE INDEX IF NOT EXISTS idx_competitor_posts_engagement ON competitor_posts(engagement_rate);

-- RLS policies
ALTER TABLE competitor_posts ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE competitor_accounts IS 'Cuentas de Instagram de competidores a analizar';
COMMENT ON TABLE competitor_posts IS 'Posts de competidores para análisis comparativo';
