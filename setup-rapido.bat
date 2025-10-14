@echo off
chcp 65001 >nul
echo ========================================
echo 🚀 Setup Rápido - Panel SMM
echo ========================================
echo.

REM Verificar si existe .env
if not exist .env (
    echo ⚠️  No se encontró archivo .env
    echo 📝 Creando .env desde .env.example...
    copy .env.example .env >nul
    echo ✅ Archivo .env creado
    echo.
    echo ⚠️  IMPORTANTE: Edita el archivo .env con tus datos reales
    echo    - DB_HOST, DB_USER, DB_PASSWORD, DB_NAME
    echo    - SMMCODER_API_KEY
    echo.
    pause
) else (
    echo ✅ Archivo .env encontrado
)

echo.
echo ========================================
echo 📦 Instalando dependencias...
echo ========================================
call npm install
if %errorlevel% neq 0 (
    echo ❌ Error instalando dependencias
    pause
    exit /b 1
)
echo ✅ Dependencias instaladas

echo.
echo ========================================
echo 🔧 Arreglando base de datos...
echo ========================================
call npm run fix-schema
if %errorlevel% neq 0 (
    echo ⚠️  Hubo un problema con la base de datos
    echo    Verifica que los datos en .env sean correctos
    pause
)

echo.
echo ========================================
echo ✅ Setup completado!
echo ========================================
echo.
echo Próximos pasos:
echo 1. Verifica que el archivo .env tenga los datos correctos
echo 2. Ejecuta: npm start
echo 3. Abre: http://localhost:3000
echo 4. Login: admin@panelsmm.com / Admin123!
echo.
echo Scripts disponibles:
echo   npm start         - Iniciar servidor
echo   npm run dev       - Iniciar con nodemon
echo   npm run fix-schema - Arreglar base de datos
echo   npm run test-orders - Probar creación de órdenes
echo.
pause
