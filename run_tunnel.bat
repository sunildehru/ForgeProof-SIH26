@echo off
title ForgeProof - Permanent ngrok Live Tunnel
color 0B
cd /d "%~dp0"
echo =====================================================================
echo                FORGEPROOF PERMANENT LIVE TUNNEL
echo =====================================================================
echo [*] Public Static URL   : https://truce-stride-veal.ngrok-free.dev
echo [*] Local Backend Target: http://127.0.0.1:8000
echo [*] Web Traffic Monitor : http://127.0.0.1:4040
echo =====================================================================
echo.
echo [*] Starting permanent tunnel to https://truce-stride-veal.ngrok-free.dev...
echo [*] Set VITE_API_URL=https://truce-stride-veal.ngrok-free.dev in Vercel once.
echo [*] Press Ctrl+C to terminate.
echo.

if exist ".\ngrok.exe" (
    .\ngrok.exe http --url=truce-stride-veal.ngrok-free.dev 8000
) else (
    ngrok http --url=truce-stride-veal.ngrok-free.dev 8000
)

echo.
echo [!] Tunnel disconnected.
pause
