import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://postgres:fihBQZ2FNKn12GQv@db.nwhdsboiojmqqfvbelwo.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function createTables() {
  console.log('🔌 Conectando a PostgreSQL...');

  try {
    await client.connect();
    console.log('✅ Conectado!\n');

    // 1. Crear scheduled_content
    console.log('📦 Creando tabla scheduled_content...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS scheduled_content (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        client_id UUID,
        content_type VARCHAR(50) NOT NULL,
        topic VARCHAR(500),
        caption TEXT NOT NULL,
        script TEXT,
        hashtags TEXT[],
        suggested_media TEXT,
        scheduled_for TIMESTAMP WITH TIME ZONE,
        status VARCHAR(50) DEFAULT 'draft',
        engagement_prediction VARCHAR(20),
        metadata JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log('   ✅ scheduled_content creada\n');

    // 2. Crear competitor_analysis
    console.log('📦 Creando tabla competitor_analysis...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS competitor_analysis (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        analysis_data JSONB NOT NULL,
        statistics JSONB,
        posts_analyzed INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log('   ✅ competitor_analysis creada\n');

    // 3. Agregar columnas a automation_logs
    console.log('📦 Actualizando automation_logs...');
    try {
      await client.query(`ALTER TABLE automation_logs ADD COLUMN IF NOT EXISTS content_generated INTEGER DEFAULT 0;`);
      await client.query(`ALTER TABLE automation_logs ADD COLUMN IF NOT EXISTS competitors_synced INTEGER DEFAULT 0;`);
      await client.query(`ALTER TABLE automation_logs ADD COLUMN IF NOT EXISTS analysis_performed BOOLEAN DEFAULT FALSE;`);
      console.log('   ✅ automation_logs actualizada\n');
    } catch (e) {
      console.log('   ⚠️ Algunas columnas ya existen\n');
    }

    // 4. Agregar columna source a clients
    console.log('📦 Actualizando clients...');
    try {
      await client.query(`ALTER TABLE clients ADD COLUMN IF NOT EXISTS source VARCHAR(100) DEFAULT 'organico';`);
      console.log('   ✅ clients actualizada\n');
    } catch (e) {
      console.log('   ⚠️ Columna source ya existe\n');
    }

    // 5. Agregar campos a competitors
    console.log('📦 Actualizando competitors...');
    try {
      await client.query(`ALTER TABLE competitors ADD COLUMN IF NOT EXISTS sync_priority INTEGER DEFAULT 5;`);
      await client.query(`ALTER TABLE competitors ADD COLUMN IF NOT EXISTS total_posts_synced INTEGER DEFAULT 0;`);
      await client.query(`ALTER TABLE competitors ADD COLUMN IF NOT EXISTS last_analysis_at TIMESTAMP WITH TIME ZONE;`);
      console.log('   ✅ competitors actualizada\n');
    } catch (e) {
      console.log('   ⚠️ Algunas columnas ya existen\n');
    }

    // Verificar tablas creadas
    console.log('📋 Verificando tablas...');
    const result = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('scheduled_content', 'competitor_analysis', 'automation_logs', 'competitors')
      ORDER BY table_name;
    `);

    console.log('\n✅ TABLAS VERIFICADAS:');
    result.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });

    console.log('\n🎉 ¡Configuración completada!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

createTables();
