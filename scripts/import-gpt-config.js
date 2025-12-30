/**
 * Script para importar configuraciones de GPTs personalizados
 *
 * Uso:
 * node scripts/import-gpt-config.js gpt-configs/mi-gpt.json
 */

const fs = require('fs');
const path = require('path');

async function importGPTConfig(jsonPath) {
  console.log('📦 Importando configuración de GPT...\n');

  // 1. Leer el JSON
  const fullPath = path.resolve(jsonPath);

  if (!fs.existsSync(fullPath)) {
    console.error(`❌ Archivo no encontrado: ${fullPath}`);
    process.exit(1);
  }

  const config = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
  console.log(`📝 GPT: ${config.gpt_name}`);

  // 2. Validar campos requeridos
  const required = ['gpt_name', 'conversation_starters', 'recommended_prompt_template_for_users'];
  const missing = required.filter(field => !config[field]);

  if (missing.length > 0) {
    console.error(`❌ Faltan campos requeridos: ${missing.join(', ')}`);
    process.exit(1);
  }

  // 3. Verificar si el system prompt está completado
  if (config.system_prompt?.value === '<PASTE_SYSTEM_PROMPT_HERE>') {
    console.warn('⚠️  ADVERTENCIA: El system prompt no ha sido completado.');
    console.warn('   Abre el GPT Builder y copia las instrucciones del sistema.\n');
  }

  // 4. Generar ID del GPT
  const gptId = config.gpt_name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  console.log(`🆔 ID generado: ${gptId}`);

  // 5. Crear la configuración para promptGenerators.ts
  const generatorConfig = {
    id: gptId,
    name: config.gpt_name,
    systemPrompt: config.system_prompt?.value || '<PASTE_SYSTEM_PROMPT_HERE>',
    template: config.recommended_prompt_template_for_users?.template || '',
    conversationStarters: config.conversation_starters || [],
    capabilities: config.capabilities || {},
    settings: {
      temperature: 0.7,
      maxTokens: 1000
    }
  };

  // 6. Guardar la configuración procesada
  const outputPath = path.join('gpt-configs', 'processed', `${gptId}.json`);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(generatorConfig, null, 2));

  console.log(`\n✅ Configuración procesada guardada en:`);
  console.log(`   ${outputPath}\n`);

  // 7. Mostrar instrucciones para agregar al código
  console.log('📋 SIGUIENTE PASO:');
  console.log('   Agrega esto a src/utils/promptGenerators.ts:\n');
  console.log(`  '${gptId}': {`);
  console.log(`    name: '${config.gpt_name}',`);
  console.log(`    systemPrompt: \``);
  console.log(`      [COPIA EL SYSTEM PROMPT AQUÍ]`);
  console.log(`    \`.trim(),`);
  console.log(`    temperature: 0.7,`);
  console.log(`    maxTokens: 1000`);
  console.log(`  },\n`);

  // 8. Mostrar conversation starters como ejemplos
  console.log('💡 Conversation Starters (úsalos como ejemplos de prueba):');
  config.conversation_starters.forEach((starter, i) => {
    console.log(`   ${i + 1}. ${starter.substring(0, 80)}...`);
  });
  console.log('');
}

// Ejecutar
const [,, configPath] = process.argv;

if (!configPath) {
  console.log('❌ Uso: node scripts/import-gpt-config.js <ruta-al-json>\n');
  console.log('Ejemplo:');
  console.log('  node scripts/import-gpt-config.js gpt-configs/mi-gpt.json\n');
  process.exit(1);
}

importGPTConfig(configPath);
