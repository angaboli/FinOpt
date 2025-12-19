@echo off
REM Finopt Setup Script for Windows
REM This script helps you set up Finopt quickly

echo ======================
echo Finopt Setup Script
echo ======================
echo.

echo Checking prerequisites...
echo.

REM Check Docker
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [X] Docker is not installed. Please install Docker Desktop.
    exit /b 1
)
echo [OK] Docker found

REM Check Docker Compose
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [X] Docker Compose is not installed.
    exit /b 1
)
echo [OK] Docker Compose found

REM Check Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [!] Node.js is not installed. Required for mobile app.
) else (
    echo [OK] Node.js found
)

echo.
echo Setting up environment files...
echo.

REM Setup API .env
if not exist "apps\api\.env" (
    copy "apps\api\.env.example" "apps\api\.env"
    echo [OK] Created apps\api\.env
    echo [!] IMPORTANT: Edit apps\api\.env and add your:
    echo     - DATABASE_URL (from Neon)
    echo     - ANTHROPIC_API_KEY
    echo     - JWT_SECRET_KEY (generate a random string)
) else (
    echo [i] apps\api\.env already exists
)

REM Setup Mobile .env
if not exist "apps\mobile\.env" (
    copy "apps\mobile\.env.example" "apps\mobile\.env"
    echo [OK] Created apps\mobile\.env
) else (
    echo [i] apps\mobile\.env already exists
)

echo.
echo Installing dependencies...
echo.

REM Install root dependencies
if exist "package.json" (
    echo Installing Node.js dependencies...
    call npm install
    echo [OK] Dependencies installed
)

echo.
echo Building Docker images...
docker-compose build

echo.
echo [OK] Setup complete!
echo.
echo Next steps:
echo    1. Create a Neon account at https://neon.tech
echo    2. Create a new project and get your connection string
echo    3. Edit apps\api\.env and add your DATABASE_URL
echo    4. Get an Anthropic API key from https://console.anthropic.com
echo    5. Edit apps\api\.env and add your ANTHROPIC_API_KEY
echo    6. Run: docker-compose up -d
echo    7. Visit http://localhost:8000/docs to see the API
echo.
echo For detailed instructions, see: docs\docker-guide.md
echo.
pause
