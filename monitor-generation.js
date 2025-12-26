/**
 * Monitor del proceso de generación en background
 */
const fs = require('fs');
const path = require('path');

const TASK_FILE = 'C:\\Users\\Usuario\\AppData\\Local\\Temp\\claude\\C--Users-Usuario-CURSOR-instagram-dashboard\\tasks\\be69075.output';
const CHECK_INTERVAL = 10000; // 10 segundos
let lastSize = 0;
let startTime = Date.now();

console.log('🔄 Monitoreando generación de propuestas...');
console.log('   Archivo:', TASK_FILE);
console.log('   Iniciado:', new Date().toLocaleTimeString());
console.log('');

function checkStatus() {
  const elapsed = Math.floor((Date.now() - startTime) / 1000);
  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;

  try {
    if (!fs.existsSync(TASK_FILE)) {
      console.log(`⏱️  ${minutes}:${seconds.toString().padStart(2, '0')} - Esperando archivo de salida...`);
      return;
    }

    const stats = fs.statSync(TASK_FILE);
    const currentSize = stats.size;

    if (currentSize > lastSize) {
      console.log(`⏱️  ${minutes}:${seconds.toString().padStart(2, '0')} - Generando contenido... (${currentSize} bytes)`);
      lastSize = currentSize;
    } else if (currentSize > 0) {
      // Leer últimas líneas para ver si terminó
      const content = fs.readFileSync(TASK_FILE, 'utf8');
      const lines = content.trim().split('\n');
      const lastLine = lines[lines.length - 1];

      if (lastLine.includes('HTTP Status:')) {
        const statusMatch = lastLine.match(/HTTP Status: (\d+)/);
        const status = statusMatch ? statusMatch[1] : 'unknown';

        console.log('');
        console.log('✅ PROCESO COMPLETADO!');
        console.log('   Tiempo total:', `${minutes}:${seconds.toString().padStart(2, '0')}`);
        console.log('   HTTP Status:', status);
        console.log('');

        if (status === '200') {
          console.log('🎉 Generación exitosa!');
          console.log('   Revisa tu email para ver las propuestas generadas.');
        } else {
          console.log('⚠️  Hubo un problema. Verifica los logs del servidor.');
        }

        console.log('');
        console.log('📋 Últimas líneas:');
        lines.slice(-10).forEach(line => console.log('   ', line));

        process.exit(0);
      } else {
        console.log(`⏱️  ${minutes}:${seconds.toString().padStart(2, '0')} - Procesando...`);
      }
    }

    // Timeout después de 15 minutos
    if (elapsed > 900) {
      console.log('');
      console.log('⏰ TIMEOUT - El proceso ha tardado más de 15 minutos');
      console.log('   Probablemente hay un problema. Verifica:');
      console.log('   1. Los logs del servidor Next.js');
      console.log('   2. Que OpenAI API Key esté configurada');
      console.log('   3. Que haya competidores activos en la BD');
      process.exit(1);
    }

  } catch (error) {
    console.log(`⏱️  ${minutes}:${seconds.toString().padStart(2, '0')} - Error leyendo archivo:`, error.message);
  }
}

// Verificar cada 10 segundos
checkStatus();
const interval = setInterval(checkStatus, CHECK_INTERVAL);

// Manejar Ctrl+C
process.on('SIGINT', () => {
  console.log('\n\n⏹️  Monitoreo detenido');
  clearInterval(interval);
  process.exit(0);
});
