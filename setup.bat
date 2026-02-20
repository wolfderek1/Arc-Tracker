@echo off
echo ============================================
echo Arc Raiders Event Bot - Setup
echo ============================================
echo.

where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed!
    echo.
    echo Please install Node.js from: https://nodejs.org/
    echo Recommended: Download the LTS version
    echo.
    echo After installation:
    echo 1. Restart this terminal
    echo 2. Run this script again
    echo.
    pause
    exit /b 1
)

echo Node.js version:
node --version
echo npm version:
npm --version
echo.

echo Installing dependencies...
call npm install

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ============================================
    echo Installation successful!
    echo ============================================
    echo.
    echo Next steps:
    echo 1. Copy .env.example to .env
    echo 2. Edit .env and add your Discord bot token
    echo 3. Run: npm start
    echo.
) else (
    echo.
    echo [ERROR] Installation failed!
    echo.
)

pause
