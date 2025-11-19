@echo off
echo ========================================
echo MIGRACION DE BASE DE DATOS - SUPABASE
echo ========================================
echo.
echo Para ejecutar la migracion necesitas la CONTRASEÑA de PostgreSQL
echo.
echo COMO OBTENERLA:
echo 1. Ve a: https://supabase.com/dashboard/project/nwhdsboiojmqqfvbelwo/settings/database
echo 2. Busca "Database password" al inicio de la pagina
echo 3. Copia la contraseña
echo.
echo ----------------------------------------
echo.
set /p DB_PASSWORD="Pega aqui la contraseña de PostgreSQL: "
echo.
echo Ejecutando migracion...
echo.

cd /d "C:\Users\Usuario\CURSOR\instagram-dashboard"

npx supabase db push --db-url "postgresql://postgres.nwhdsboiojmqqfvbelwo:%DB_PASSWORD%@aws-0-eu-central-1.pooler.supabase.com:6543/postgres" --file supabase/schema.sql

echo.
echo ========================================
echo MIGRACION COMPLETADA
echo ========================================
pause
