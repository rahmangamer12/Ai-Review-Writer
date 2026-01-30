@echo off
echo Starting Next.js Development Server with Turbopack...
echo.
set NEXT_TELEMETRY_DISABLED=1
cd /d "%~dp0"
call npm run dev
