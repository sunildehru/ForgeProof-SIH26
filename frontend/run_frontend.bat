@echo off
title ForgeProof - Frontend (Port 5173)
color 0E
cd /d "%~dp0"
echo =====================================================================
echo                FORGEPROOF FRONTEND PORTAL
echo =====================================================================
echo [*] Starting Vite on http://localhost:5173 ...
call npm run dev -- --host 0.0.0.0 --port 5173
echo.
echo [!] Frontend process stopped.
pause
