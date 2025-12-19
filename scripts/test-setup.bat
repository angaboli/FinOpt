@echo off
REM Finopt Setup Test Script for Windows
REM Tests if your Finopt setup is working correctly

setlocal enabledelayedexpansion

echo ==================
echo Finopt Setup Test
echo ==================
echo.

set BASE_URL=http://localhost:8000
set TESTS_PASSED=0
set TESTS_FAILED=0

REM Check if Docker is running
echo Checking Docker...
docker ps >nul 2>&1
if %errorlevel% neq 0 (
    echo [X] Docker is not running
    echo Please start Docker Desktop and try again.
    exit /b 1
)
echo [OK] Docker is running
echo.

REM Check if containers are running
echo Checking containers...
docker-compose ps -q api >nul 2>&1
if %errorlevel% neq 0 (
    echo [X] API container is not running
    echo Run: docker-compose up -d
    exit /b 1
)
echo [OK] API container is running

docker-compose ps -q worker >nul 2>&1
if %errorlevel% neq 0 (
    echo [!] Worker container is not running
) else (
    echo [OK] Worker container is running
)

docker-compose ps -q redis >nul 2>&1
if %errorlevel% neq 0 (
    echo [X] Redis container is not running
) else (
    echo [OK] Redis container is running
)
echo.

REM Wait for API to be ready
echo Waiting for API to be ready...
set MAX_ATTEMPTS=30
set ATTEMPT=0

:wait_loop
curl -s %BASE_URL%/health >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] API is ready
    goto :api_ready
)
set /a ATTEMPT+=1
if %ATTEMPT% geq %MAX_ATTEMPTS% (
    echo [X] API did not start in time
    echo Check logs: docker-compose logs api
    exit /b 1
)
timeout /t 1 /nobreak >nul
goto :wait_loop

:api_ready
echo.
echo Running API tests...
echo.

REM Test health endpoint
echo Testing Health check...
curl -s -o nul -w "%%{http_code}" %BASE_URL%/health > temp_status.txt
set /p STATUS=<temp_status.txt
del temp_status.txt
if "%STATUS%"=="200" (
    echo [OK] Health check PASS
    set /a TESTS_PASSED+=1
) else (
    echo [X] Health check FAIL
    set /a TESTS_FAILED+=1
)

REM Test root endpoint
echo Testing Root endpoint...
curl -s -o nul -w "%%{http_code}" %BASE_URL%/ > temp_status.txt
set /p STATUS=<temp_status.txt
del temp_status.txt
if "%STATUS%"=="200" (
    echo [OK] Root endpoint PASS
    set /a TESTS_PASSED+=1
) else (
    echo [X] Root endpoint FAIL
    set /a TESTS_FAILED+=1
)

REM Test docs
echo Testing API docs...
curl -s -o nul -w "%%{http_code}" %BASE_URL%/docs > temp_status.txt
set /p STATUS=<temp_status.txt
del temp_status.txt
if "%STATUS%"=="200" (
    echo [OK] API docs PASS
    set /a TESTS_PASSED+=1
) else (
    echo [X] API docs FAIL
    set /a TESTS_FAILED+=1
)

echo.
echo ====================
echo Test Results:
echo [OK] Passed: %TESTS_PASSED%
if %TESTS_FAILED% gtr 0 (
    echo [X] Failed: %TESTS_FAILED%
) else (
    echo [OK] Failed: 0
)
echo.

if %TESTS_FAILED% equ 0 (
    echo [OK] All tests passed! Your setup is working correctly.
    echo.
    echo Next steps:
    echo 1. Create a user via API docs: %BASE_URL%/docs
    echo 2. Start mobile app: cd apps\mobile ^&^& npm start
    echo.
) else (
    echo [X] Some tests failed. Please check the errors above.
    echo.
    echo Troubleshooting:
    echo - Check logs: docker-compose logs -f
    echo - Verify .env file: type apps\api\.env
    echo - Restart services: docker-compose restart
    echo.
)

pause
