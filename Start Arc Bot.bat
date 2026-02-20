@echo off
title Arc Raiders Discord Bot
echo Starting Arc Raiders Event Bot...
echo.

REM Add Node.js to PATH
set PATH=%PATH%;C:\Program Files\nodejs

REM Change to bot directory
cd /d "D:\App Projects\Arc Discord Bot"

REM Start the bot
npm start

REM Keep window open if there's an error
if errorlevel 1 (
    echo.
    echo Bot stopped with an error. Press any key to close...
    pause >nul
)
