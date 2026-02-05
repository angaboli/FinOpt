@echo off
cls
echo ================================================================
echo   RECHARGEMENT COMPLET DE L'APP FINOPT MOBILE
echo ================================================================
echo.

echo [1/5] Nettoyage des caches Expo et Metro...
if exist .expo rmdir /s /q .expo
if exist .metro-cache rmdir /s /q .metro-cache
if exist node_modules\.cache rmdir /s /q node_modules\.cache
echo    OK Caches supprimes
echo.

echo [2/5] Suppression des fichiers temporaires dans node_modules\.bin...
cd ..\..\node_modules\.bin
del /q .escodegen-* 2>nul
del /q .esgenerate-* 2>nul
del /q .jest-* 2>nul
cd ..\..\apps\mobile
echo    OK Fichiers temporaires supprimes
echo.

echo [3/5] Verification du dossier app (Expo Router)...
if exist app (
    echo    ATTENTION: Le dossier 'app' existe encore!
    echo    Expo Router l'utiliserait au lieu de App.tsx
    echo    Renommage en app.OLD...
    if exist app.OLD rmdir /s /q app.OLD
    move app app.OLD >nul
    echo    OK Dossier app deplace vers app.OLD
) else (
    echo    OK Pas de dossier app (correct)
)
echo.

echo [4/5] Verification des fichiers d'entree...
if exist App.tsx (
    echo    OK App.tsx trouve
) else (
    echo    ERREUR: App.tsx manquant!
    pause
    exit /b 1
)

if exist index.js (
    echo    OK index.js trouve
) else (
    echo    ERREUR: index.js manquant!
    pause
    exit /b 1
)
echo.

echo OK Nettoyage termine avec succes!
echo.
echo ================================================================
echo   [5/5] REDEMARRAGE D'EXPO
echo ================================================================
echo.
echo Apres le demarrage:
echo    1. Scannez le QR code avec Expo Go
echo    2. Secouez le telephone pour ouvrir le menu dev
echo    3. Cliquez sur 'Reload'
echo    4. Vous devriez voir l'ecran de connexion Finopt!
echo.
echo ================================================================
echo.

npm start -- --clear --reset-cache
