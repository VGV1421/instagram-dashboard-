/**
 * Script de prueba para verificar el token de Instagram
 */

require('dotenv').config({ path: '.env.local' });

const INSTAGRAM_GRAPH_API = 'https://graph.instagram.com';

async function testInstagramToken() {
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
  const userId = process.env.INSTAGRAM_USER_ID;

  console.log('\n🔍 Verificando configuración...');
  console.log('Token configurado:', accessToken ? `✅ Sí (${accessToken.substring(0, 20)}...)` : '❌ No');
  console.log('User ID configurado:', userId ? `✅ ${userId}` : '❌ No');

  if (!accessToken || !userId) {
    console.log('\n❌ Error: Credenciales no configuradas en .env.local\n');
    process.exit(1);
  }

  console.log('\n📡 Probando conexión con Instagram Graph API...\n');

  try {
    // Probar obtener perfil
    const fields = 'id,username,name,followers_count,follows_count,media_count';
    const url = `${INSTAGRAM_GRAPH_API}/${userId}?fields=${fields}&access_token=${accessToken}`;

    console.log('Endpoint:', `${INSTAGRAM_GRAPH_API}/${userId}`);

    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      console.log('❌ Error de la API de Instagram:');
      console.log(JSON.stringify(data, null, 2));
      console.log('\n💡 Posibles causas:');
      console.log('   - Token expirado (duran 60 días)');
      console.log('   - Permisos insuficientes');
      console.log('   - User ID incorrecto');
      console.log('\n🔗 Genera un nuevo token en:');
      console.log('   https://developers.facebook.com/tools/explorer/\n');
      process.exit(1);
    }

    console.log('✅ ¡Token válido! Datos del perfil:\n');
    console.log('   👤 Usuario:', data.username);
    console.log('   📝 Nombre:', data.name);
    console.log('   👥 Seguidores:', data.followers_count);
    console.log('   ➕ Siguiendo:', data.follows_count);
    console.log('   📸 Posts:', data.media_count);
    console.log('\n🎉 El token funciona correctamente\n');

    // Probar obtener posts
    console.log('📡 Obteniendo últimos posts...\n');
    const mediaUrl = `${INSTAGRAM_GRAPH_API}/${userId}/media?fields=id,caption,media_type,timestamp&limit=5&access_token=${accessToken}`;
    const mediaResponse = await fetch(mediaUrl);
    const mediaData = await mediaResponse.json();

    if (mediaResponse.ok && mediaData.data) {
      console.log(`✅ Se encontraron ${mediaData.data.length} posts recientes:`);
      mediaData.data.forEach((post, index) => {
        console.log(`   ${index + 1}. [${post.media_type}] ${post.caption ? post.caption.substring(0, 50) + '...' : 'Sin caption'}`);
      });
      console.log();
    }

  } catch (error) {
    console.log('❌ Error al conectar con Instagram:');
    console.log(error.message);
    console.log();
    process.exit(1);
  }
}

testInstagramToken();
