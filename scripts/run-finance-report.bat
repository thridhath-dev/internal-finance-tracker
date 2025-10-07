@echo off
REM Finance Report Cron Job for Windows
REM This batch file can be used with Windows Task Scheduler

cd /d "%~dp0\.."
echo Starting Finance Report at %date% %time%

REM Check if Node.js is available
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Run the finance report
node scripts/finance-cron.js

if %errorlevel% equ 0 (
    echo Finance report completed successfully
) else (
    echo Finance report failed with error code %errorlevel%
)

echo Finished at %date% %time%
