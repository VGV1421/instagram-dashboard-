/**
 * Script para verificar workflows activos en n8n
 *
 * Uso: node check-n8n-workflows.js
 */

const https = require('http');

const options = {
  hostname: 'localhost',
  port: 5678,
  path: '/api/v1/workflows',
  method: 'GET',
  headers: {
    'Accept': 'application/json'
  }
};

console.log('🔍 Consultando workflows de n8n...\n');

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      if (res.statusCode === 401) {
        console.log('⚠️  n8n requiere autenticación.');
        console.log('   Abre http://localhost:5678 en tu navegador para ver los workflows.\n');
        return;
      }

      if (res.statusCode !== 200) {
        console.log(`❌ Error: HTTP ${res.statusCode}`);
        console.log(data);
        return;
      }

      const workflows = JSON.parse(data);

      if (!workflows.data || workflows.data.length === 0) {
        console.log('📭 No hay workflows importados en n8n.\n');
        console.log('Para importar los workflows creados:');
        console.log('1. Abre http://localhost:5678');
        console.log('2. Ve a "Workflows" → "Import from File"');
        console.log('3. Selecciona los archivos .json de n8n-workflows/\n');
        return;
      }

      console.log(`📊 Total de workflows: ${workflows.data.length}\n`);

      workflows.data.forEach(w => {
        const status = w.active ? '✅ ACTIVO' : '⚪ Inactivo';
        console.log(`${status} - ${w.name}`);
        console.log(`   ID: ${w.id}`);
        console.log(`   Creado: ${new Date(w.createdAt).toLocaleString('es-ES')}`);
        if (w.updatedAt) {
          console.log(`   Actualizado: ${new Date(w.updatedAt).toLocaleString('es-ES')}`);
        }
        console.log('');
      });

      const activeCount = workflows.data.filter(w => w.active).length;
      console.log(`\n📈 Workflows activos: ${activeCount} de ${workflows.data.length}`);

      if (activeCount === 0) {
        console.log('\n💡 Para activar un workflow:');
        console.log('   1. Abre el workflow en n8n');
        console.log('   2. Activa el toggle en la esquina superior derecha\n');
      }

    } catch (error) {
      console.log('❌ Error parseando respuesta:', error.message);
      console.log('Respuesta raw:', data);
    }
  });
});

req.on('error', (error) => {
  console.log('❌ Error conectando a n8n:', error.message);
  console.log('\n¿n8n está corriendo?');
  console.log('Inicia n8n con: n8n start\n');
});

req.end();
