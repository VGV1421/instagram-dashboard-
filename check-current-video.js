require('dotenv').config({ path: '.env.local' });

const KIE_KEY = process.env.KIE_API_KEY || process.env.KIE_AI_API_KEY;
const TASK_ID = 'd0860dd1a6ed0d81f300740b2ff67f43';

async function checkVideo() {
  try {
    const response = await fetch(`https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${TASK_ID}`, {
      headers: {
        'Authorization': `Bearer ${KIE_KEY}`
      }
    });

    const data = await response.json();

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 ESTADO DEL VIDEO ACTUAL');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log(`Task ID: ${TASK_ID}`);
    console.log(`Estado: ${data.data?.state || 'desconocido'}\n`);

    if (data.data?.state === 'success') {
      const videoUrl = data.data.resultJson?.videoUrl ||
                       data.data.resultJson?.result ||
                       data.data.resultJson;

      console.log('✅ ¡VIDEO COMPLETADO!\n');
      console.log('📹 VIDEO URL:');
      console.log(videoUrl);
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🎉 ¡LISTO PARA VER!');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    } else if (data.data?.state === 'generating') {
      console.log('⏳ Video aún se está generando...');
      console.log('   Esto puede tomar hasta 10 minutos.\n');

      if (data.data?.createTime) {
        const elapsed = Math.floor((Date.now() - data.data.createTime) / 1000);
        console.log(`   Tiempo transcurrido: ${elapsed}s\n`);
      }

    } else if (data.data?.state === 'fail') {
      console.log('❌ VIDEO FALLÓ\n');
      console.log(`Error: ${data.data?.failMsg || 'Unknown error'}`);
      console.log(`Código: ${data.data?.failCode || 'N/A'}\n`);

    } else {
      console.log('Respuesta completa:');
      console.log(JSON.stringify(data, null, 2));
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkVideo();
