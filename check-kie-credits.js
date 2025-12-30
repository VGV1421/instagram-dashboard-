/**
 * Verificar créditos disponibles en Kie.ai
 */

require('dotenv').config({ path: '.env.local' });

async function checkCredits() {
  const apiKey = process.env.KIE_API_KEY;

  if (!apiKey) {
    console.error('❌ KIE_API_KEY no configurado');
    process.exit(1);
  }

  console.log('💰 Verificando créditos en Kie.ai...\n');

  try {
    // Endpoint para verificar créditos
    const response = await fetch('https://api.kie.ai/api/v1/common/getAccountCredits', {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`❌ Error: ${error}`);
      process.exit(1);
    }

    const data = await response.json();
    console.log('📊 Información de cuenta:\n');
    console.log(JSON.stringify(data, null, 2));

    if (data.data?.credits !== undefined) {
      const credits = data.data.credits;
      console.log(`\n💰 Créditos disponibles: ${credits}`);
      console.log(`💵 Equivalente en USD: $${(credits * 0.005).toFixed(2)}`);

      // Calcular cuántos videos de Kling Avatar puedes generar
      const creditsPerVideo = 120; // ~$0.60 = 120 créditos
      const videosAvailable = Math.floor(credits / creditsPerVideo);

      console.log(`\n🎬 Videos de Kling Avatar que puedes generar: ${videosAvailable}`);

      if (credits < creditsPerVideo) {
        console.log('\n⚠️  NECESITAS MÁS CRÉDITOS');
        console.log(`   Faltan: ${creditsPerVideo - credits} créditos (~$${((creditsPerVideo - credits) * 0.005).toFixed(2)})`);
        console.log('\n💡 Opciones:');
        console.log('   1. Agregar $10 → 2000 créditos → ~16 videos');
        console.log('   2. Agregar $25 → 5000 créditos → ~41 videos');
        console.log('   3. Agregar $50 → 10000 créditos → ~83 videos');
        console.log('\n🔗 Ir a: https://kie.ai/api-key\n');
      } else {
        console.log('\n✅ Tienes créditos suficientes para generar videos!\n');
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkCredits();
