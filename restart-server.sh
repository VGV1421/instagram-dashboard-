#!/bin/bash

# Script para reiniciar el servidor Next.js limpiamente
# Uso: bash restart-server.sh

echo "🛑 Deteniendo procesos de Node.js..."
taskkill //F //IM node.exe 2>/dev/null

echo "⏳ Esperando 2 segundos..."
sleep 2

echo "🧹 Limpiando caché de Next.js..."
rm -rf .next .turbopack

echo "🔓 Removiendo lockfile de desarrollo..."
rm -f .next/dev/lock

echo "✅ Listo! Ahora puedes ejecutar: npm run dev"
echo ""
echo "Servidor listo para iniciar en el puerto 3000"
