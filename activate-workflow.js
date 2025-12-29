require('dotenv').config({ path: '.env.local' });

const N8N_API_KEY = process.env.N8N_API_KEY;
const N8N_URL = 'http://localhost:5678';
const WORKFLOW_ID = 'Dnc4Ei0PhoXBxZqn';

async function activateWorkflow() {
  try {
    const response = await fetch(`${N8N_URL}/api/v1/workflows/${WORKFLOW_ID}/activate`, {
      method: 'POST',
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY
      }
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ Workflow activado exitosamente');
      console.log('   ID:', data.id);
      console.log('   Nombre:', data.name);
      console.log('   Estado:', data.active ? 'ACTIVO ✅' : 'INACTIVO ❌');
      console.log('   Webhook URL: http://localhost:5678/webhook/instagram-smart-video');
    } else {
      console.error('❌ Error activando workflow:', data.message || data);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

activateWorkflow();
