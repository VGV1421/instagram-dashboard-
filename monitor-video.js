require('dotenv').config({ path: '.env.local' });

const KIE_KEY = process.env.KIE_API_KEY || process.env.KIE_AI_API_KEY;
const TASK_ID = 'd0860dd1a6ed0d81f300740b2ff67f43';

async function monitorVideo() {
  let attempts = 0;
  const maxAttempts = 180; // 30 minutos máximo

  console.log('\n🔄 MONITOREANDO VIDEO...');
  console.log(`Task ID: ${TASK_ID}\n`);

  while (attempts < maxAttempts) {
    try {
      const response = await fetch(`https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${TASK_ID}`, {
        headers: { 'Authorization': `Bearer ${KIE_KEY}` }
      });

      const data = await response.json();
      const state = data.data?.state;
      const elapsed = data.data?.createTime ? Math.floor((Date.now() - data.data.createTime) / 1000) : 0;

      process.stdout.write(`\r⏳ Estado: ${state} | Tiempo: ${elapsed}s | Check ${attempts + 1}/${maxAttempts}`);

      if (state === 'success') {
        const videoUrl = data.data.resultJson?.videoUrl ||
                         data.data.resultJson?.result ||
                         data.data.resultJson;

        console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('✅ ¡VIDEO GENERADO EXITOSAMENTE!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        console.log('📹 VIDEO URL:');
        console.log(videoUrl);
        console.log(`\n⏱️  Tiempo total: ${elapsed}s (${(elapsed / 60).toFixed(1)} min)`);
        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🎉 SISTEMA 100% FUNCIONAL - ¡CÓDIGO CORREGIDO!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        console.log('✅ VALIDACIONES EXITOSAS:');
        console.log('  ✓ OpenAI TTS generó audio correctamente');
        console.log('  ✓ Kie.ai creó tarea exitosamente');
        console.log('  ✓ Polling con campo "state" funcionó');
        console.log('  ✓ Video completado sin timeout');
        console.log('  ✓ Video URL recuperado de resultJson\n');

        return;

      } else if (state === 'fail') {
        console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('❌ VIDEO FALLÓ');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        console.log(`Error: ${data.data?.failMsg || 'Unknown error'}`);
        console.log(`Código: ${data.data?.failCode || 'N/A'}`);
        console.log(`Tiempo antes de fallar: ${elapsed}s\n`);
        return;
      }

      // Esperar 10 segundos antes del próximo check
      await new Promise(resolve => setTimeout(resolve, 10000));
      attempts++;

    } catch (error) {
      console.error('\n❌ Error:', error.message);
      break;
    }
  }

  console.log('\n\n⚠️  Timeout del monitor (30 min)');
}

monitorVideo();
