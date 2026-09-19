@echo off
title ForgeProof Master Launcher
color 0A

echo =====================================================================
echo                FORGEPROOF MASTER LAUNCHER (SIH 2026)
echo =====================================================================
echo.

:: 1. Free ports 8000 and 5173
echo [*] Freeing ports 8000 and 5173...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8000" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5173" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>&1
)
taskkill /F /IM cloudflared.exe >nul 2>&1

echo [*] Launching Backend Server (FastAPI + AI Pipelines)...
start "ForgeProof - Backend" "%~dp0backend\run_backend.bat"

echo [*] Launching Frontend Portal (Vite + React)...
start "ForgeProof - Frontend" "%~dp0frontend\run_frontend.bat"

if exist "%~dp0cloudflared.exe" (
    echo [*] Launching Cloudflare Live Tunnel...
    start "ForgeProof - Tunnel" "%~dp0run_tunnel.bat"
)

echo.
echo =====================================================================
echo  Services are now initializing:
echo    - Backend API:  http://127.0.0.1:8000 (Swagger: /docs)
echo    - Government UI: http://localhost:5173
echo =====================================================================
echo.
echo [*] Opening ForgeProof Portal in your browser in 5 seconds...
ping 127.0.0.1 -n 6 >nul
start http://localhost:5173

echo.
echo You can close this launcher window now.
echo To stop all services later, double-click: stop_forgeproof.bat
echo.
pause
