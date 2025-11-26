@echo off
echo ========================================
echo  Subiendo a GitHub Pages
echo ========================================
echo.

cd /d "%~dp0"

REM Preguntar usuario de GitHub
set /p GITHUB_USER="Cual es tu usuario de GitHub? "

echo.
echo Inicializando Git...
git init 2>nul
git checkout -b gh-pages 2>nul || git checkout gh-pages

echo.
echo Añadiendo archivos...
git add index.html PRIVACY-POLICY.md TERMS-OF-SERVICE.md

echo.
echo Creando commit...
git commit -m "Add privacy policy and terms for Instagram Dashboard" 2>nul || echo Commit ya existe

echo.
echo Conectando con GitHub...
git remote remove origin 2>nul
git remote add origin https://github.com/%GITHUB_USER%/instagram-dashboard-legal.git

echo.
echo Subiendo a GitHub...
git push -u origin gh-pages

echo.
echo ========================================
echo  EXITO! Archivos subidos
echo ========================================
echo.
echo Ahora activa GitHub Pages:
echo 1. Ve a: https://github.com/%GITHUB_USER%/instagram-dashboard-legal/settings/pages
echo 2. Source: gh-pages
echo 3. Click Save
echo.
echo Tus URLs seran (en 2-3 minutos):
echo - https://%GITHUB_USER%.github.io/instagram-dashboard-legal/
echo - https://%GITHUB_USER%.github.io/instagram-dashboard-legal/PRIVACY-POLICY
echo - https://%GITHUB_USER%.github.io/instagram-dashboard-legal/TERMS-OF-SERVICE
echo.
pause
