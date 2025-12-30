require('dotenv').config({ path: '.env.local' });

const KIE_KEY = process.env.KIE_API_KEY;
const TASK_ID = '07c3f5de30c2ac838bdc1df7feeffee9';

async function getVideoUrl() {
  try {
    const response = await fetch(`https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${TASK_ID}`, {
      headers: {
        'Authorization': `Bearer ${KIE_KEY}`
      }
    });

    const data = await response.json();

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('RESPUESTA COMPLETA DE KIE.AI:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(JSON.stringify(data, null, 2));
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (data.data?.state === 'success') {
      const videoUrl = data.data.resultJson?.videoUrl ||
                       data.data.resultJson?.result ||
                       data.data.resultJson;

      console.log('✅ ¡VIDEO GENERADO EXITOSAMENTE!\n');
      console.log('📹 VIDEO URL:');
      console.log(videoUrl);
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🎉 COPIA ESTA URL PARA VER TU VIDEO');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    } else {
      console.log(`⏳ Estado actual: ${data.data?.state || 'desconocido'}`);

      if (data.data?.state === 'fail') {
        console.log(`❌ Error: ${data.data?.failMsg || 'Unknown error'}`);
      }
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

getVideoUrl();
