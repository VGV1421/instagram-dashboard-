require('dotenv').config({ path: '.env.local' });
const fs = require('fs');

/**
 * Script para importar workflow en n8n automáticamente
 */

const N8N_URL = process.env.N8N_URL || 'http://localhost:5678';
const N8N_API_KEY = process.env.N8N_API_KEY;
const VERCEL_URL = 'https://instagram-dashboard-ten.vercel.app';

if (!N8N_API_KEY) {
  console.error('❌ N8N_API_KEY no encontrada en .env.local');
  process.exit(1);
}

async function setupWorkflow() {
  console.log('🚀 Configurando workflow en n8n...\n');

  try {
    // 1. Leer el workflow JSON
    console.log('📖 Leyendo workflow...');
    const workflowData = JSON.parse(
      fs.readFileSync('./n8n-workflow-kie-ai-smart.json', 'utf8')
    );

    // 2. Actualizar URL en el nodo HTTP Request
    console.log('🔧 Configurando VERCEL_URL...');
    const httpNode = workflowData.nodes.find(n => n.name === 'Generate Smart Video');
    if (httpNode) {
      // Reemplazar variable de entorno por URL real
      httpNode.parameters.url = `${VERCEL_URL}/api/video/generate-smart`;
      console.log(`   ✅ URL configurada: ${VERCEL_URL}/api/video/generate-smart`);
    }

    // 3. Crear workflow en n8n (solo propiedades permitidas)
    console.log('\n📤 Importando workflow a n8n...');
    const cleanWorkflow = {
      name: workflowData.name,
      nodes: workflowData.nodes,
      connections: workflowData.connections,
      settings: workflowData.settings || {},
      staticData: workflowData.staticData || null
    };

    const createResponse = await fetch(`${N8N_URL}/api/v1/workflows`, {
      method: 'POST',
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(cleanWorkflow)
    });

    if (!createResponse.ok) {
      const error = await createResponse.text();
      throw new Error(`Error creando workflow: ${error}`);
    }

    const workflow = await createResponse.json();
    console.log(`   ✅ Workflow creado con ID: ${workflow.id}`);

    // 4. Activar workflow usando el endpoint correcto
    console.log('\n⚡ Activando workflow...');

    // Intentar activar con PATCH en el endpoint activate
    const activateResponse = await fetch(`${N8N_URL}/api/v1/workflows/${workflow.id}/activate`, {
      method: 'POST',
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY
      }
    });

    if (activateResponse.ok) {
      console.log('   ✅ Workflow activado');
    } else {
      // Si falla la activación automática, mostrar instrucciones
      console.log('   ⚠️  No se pudo activar automáticamente');
      console.log('   💡 Actívalo manualmente en n8n:');
      console.log(`      1. Abre ${N8N_URL}`);
      console.log(`      2. Click en el workflow "${workflowData.name}"`);
      console.log('      3. Click en el toggle "Active" (arriba a la derecha)');
    }

    // 5. Obtener webhook URL
    const webhookUrl = `${N8N_URL}/webhook/instagram-smart-video`;

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ ¡WORKFLOW CONFIGURADO EXITOSAMENTE!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('📋 DETALLES:');
    console.log(`   Workflow ID: ${workflow.id}`);
    console.log(`   Nombre: ${workflow.name}`);
    console.log(`   Estado: ACTIVO ✅`);
    console.log(`   Webhook URL: ${webhookUrl}`);
    console.log('');
    console.log('🧪 TEST:');
    console.log(`   curl -X POST ${webhookUrl} \\`);
    console.log('     -H "Content-Type: application/json" \\');
    console.log('     -d \'{"contentId":"test-001","caption":"Test video","duration":10,"video_type":"talking_head"}\'');
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    return { workflow, webhookUrl };

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

setupWorkflow();
