const { google } = require('googleapis');
require('dotenv').config({ path: '.env.local' });

async function verifyPhotoMove() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/drive'],
  });

  const drive = google.drive({ version: 'v3', auth });
  
  const folderUnused = process.env.GOOGLE_DRIVE_FOLDER_UNUSED;
  const folderUsed = process.env.GOOGLE_DRIVE_FOLDER_USED;
  const targetPhoto = '1 (1).png';

  console.log('\n🔍 VERIFICANDO MOVIMIENTO DE FOTO\n');
  console.log('Buscando: "' + targetPhoto + '"\n');

  // Buscar en SIN USAR
  console.log('📁 Carpeta: FOTOS AVATAR SIN USAR');
  const unusedResponse = await drive.files.list({
    q: "'" + folderUnused + "' in parents and trashed=false and name='" + targetPhoto + "'",
    fields: 'files(id, name)',
  });

  if (unusedResponse.data.files && unusedResponse.data.files.length > 0) {
    console.log('   ❌ ENCONTRADA - La foto AÚN está en SIN USAR');
    console.log('   ID: ' + unusedResponse.data.files[0].id);
  } else {
    console.log('   ✅ NO encontrada - La foto se movió de SIN USAR');
  }

  // Buscar en USADAS
  console.log('\n📁 Carpeta: FOTOS AVAR USADAS');
  const usedResponse = await drive.files.list({
    q: "'" + folderUsed + "' in parents and trashed=false and name='" + targetPhoto + "'",
    fields: 'files(id, name)',
  });

  if (usedResponse.data.files && usedResponse.data.files.length > 0) {
    console.log('   ✅ ENCONTRADA - La foto está en USADAS');
    console.log('   ID: ' + usedResponse.data.files[0].id);
  } else {
    console.log('   ❌ NO encontrada - La foto NO está en USADAS');
  }

  // Contar totales
  const totalUnused = await drive.files.list({
    q: "'" + folderUnused + "' in parents and trashed=false",
    fields: 'files(id)',
  });

  const totalUsed = await drive.files.list({
    q: "'" + folderUsed + "' in parents and trashed=false",
    fields: 'files(id)',
  });

  console.log('\n📊 TOTALES:');
  console.log('   SIN USAR: ' + (totalUnused.data.files?.length || 0) + ' fotos');
  console.log('   USADAS: ' + (totalUsed.data.files?.length || 0) + ' fotos');
  console.log('');
}

verifyPhotoMove().catch(console.error);
