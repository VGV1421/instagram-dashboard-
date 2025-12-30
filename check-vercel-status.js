// Script para verificar si Vercel ya desplegó el endpoint

async function checkVercelStatus() {
  const VERCEL_URL = 'https://instagram-dashboard-ten.vercel.app';

  console.log('\n🔍 VERIFICANDO ESTADO DE VERCEL...\n');

  // Test 1: Verificar que el dominio responde
  console.log('1️⃣  Verificando dominio...');
  try {
    const homeResponse = await fetch(VERCEL_URL);
    console.log(`   ✅ Dominio responde: ${homeResponse.status}`);
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return;
  }

  // Test 2: Verificar endpoint con OPTIONS (pre-flight)
  console.log('\n2️⃣  Verificando endpoint con OPTIONS...');
  try {
    const optionsResponse = await fetch(`${VERCEL_URL}/api/video/generate-smart`, {
      method: 'OPTIONS'
    });
    console.log(`   Status: ${optionsResponse.status} ${optionsResponse.statusText}`);
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }

  // Test 3: Verificar endpoint con GET
  console.log('\n3️⃣  Verificando endpoint con GET...');
  try {
    const getResponse = await fetch(`${VERCEL_URL}/api/video/generate-smart`, {
      method: 'GET'
    });
    console.log(`   Status: ${getResponse.status} ${getResponse.statusText}`);

    if (getResponse.ok || getResponse.status === 405) {
      const text = await getResponse.text();
      if (text) {
        try {
          const json = JSON.parse(text);
          console.log('   Response:', JSON.stringify(json, null, 2).substring(0, 200));
        } catch {
          console.log('   Response (text):', text.substring(0, 200));
        }
      }
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }

  // Test 4: Verificar endpoint con POST
  console.log('\n4️⃣  Verificando endpoint con POST...');
  try {
    const postResponse = await fetch(`${VERCEL_URL}/api/video/generate-smart`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contentId: 'status-check',
        caption: 'Test de verificación',
        duration: 5,
        video_type: 'talking_head',
        objective: 'natural_gestures',
        budget_priority: 'low',
        has_audio: true
      })
    });

    console.log(`   Status: ${postResponse.status} ${postResponse.statusText}`);

    if (postResponse.status === 405) {
      console.log('\n   ⚠️  405 Method Not Allowed significa que:');
      console.log('      - El endpoint existe pero no acepta POST');
      console.log('      - O el deployment aún no terminó');
      console.log('      - O hay un error en el build');
    } else if (postResponse.ok) {
      console.log('   ✅ Endpoint POST funcional!');
    } else {
      const text = await postResponse.text();
      console.log('   Response:', text.substring(0, 300));
    }

  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n💡 RECOMENDACIÓN:');
  console.log('   - Si sigue 405, revisar Vercel dashboard');
  console.log('   - Ver logs de build en https://vercel.com/dashboard');
  console.log('   - Esperar 1-2 minutos más y reintentar\n');
}

console.log('⏳ Esperando 60 segundos adicionales...\n');
setTimeout(checkVercelStatus, 60000);
