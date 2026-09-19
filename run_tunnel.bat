@echo off
title ForgeProof - Cloudflare Tunnel
color 0D
cd /d "%~dp0"
echo =====================================================================
echo                FORGEPROOF CLOUDFLARE LIVE TUNNEL
echo =====================================================================
echo [*] Connecting local backend (http://127.0.0.1:8000) to Cloudflare...
echo [*] Look for your public URL below:
echo.
cloudflared.exe tunnel --protocol http2 --url http://127.0.0.1:8000
echo.
echo [!] Tunnel disconnected.
pause
