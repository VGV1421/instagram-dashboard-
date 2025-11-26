@echo off
echo ========================================
echo  Publicando en GitHub Pages
echo ========================================
echo.

cd /d "%~dp0"

REM Verificar si git esta instalado
git --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Git no esta instalado
    echo Instalando Git...
    winget install Git.Git --accept-source-agreements --accept-package-agreements
    echo.
    echo Git instalado. Por favor CIERRA Y VUELVE A ABRIR esta terminal
    echo y ejecuta este script de nuevo.
    pause
    exit /b 1
)

echo [1/6] Verificando repositorio Git...
if not exist ".git" (
    echo Inicializando repositorio Git...
    git init
)

echo.
echo [2/6] Creando branch gh-pages...
git checkout -b gh-pages 2>nul || git checkout gh-pages

echo.
echo [3/6] Convirtiendo Markdown a HTML...
REM Aqui necesitamos convertir los .md a .html para GitHub Pages
copy PRIVACY-POLICY.md PRIVACY-POLICY.html >nul
copy TERMS-OF-SERVICE.md TERMS-OF-SERVICE.html >nul

echo.
echo [4/6] Añadiendo archivos...
git add index.html PRIVACY-POLICY.html TERMS-OF-SERVICE.html PRIVACY-POLICY.md TERMS-OF-SERVICE.md

echo.
echo [5/6] Creando commit...
git commit -m "Add privacy policy and terms of service for GitHub Pages"

echo.
echo ========================================
echo  ACCION REQUERIDA
echo ========================================
echo.
echo Para completar la publicacion:
echo.
echo 1. Crea un repositorio en GitHub:
echo    https://github.com/new
echo    Nombre sugerido: instagram-dashboard-legal
echo.
echo 2. NO marques "Initialize with README"
echo.
echo 3. Copia el comando que GitHub te muestra:
echo    git remote add origin https://github.com/TU_USUARIO/instagram-dashboard-legal.git
echo.
echo 4. Ejecuta:
echo    git push -u origin gh-pages
echo.
echo 5. Ve a Settings ^> Pages en tu repositorio
echo    Source: gh-pages branch
echo    Click Save
echo.
echo 6. Tu politica estara en:
echo    https://TU_USUARIO.github.io/instagram-dashboard-legal/
echo.
pause
