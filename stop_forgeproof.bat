@echo off
title ForgeProof Stopper
color 0C

echo =====================================================================
echo                STOPPING FORGEPROOF SERVICES
echo =====================================================================
echo.

echo [*] Terminating Backend on port 8000...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8000" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>&1
)

echo [*] Terminating Frontend on port 5173...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5173" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>&1
)

echo [*] Terminating Cloudflare Tunnel...
taskkill /F /IM cloudflared.exe >nul 2>&1

echo.
echo All ForgeProof services have been stopped.
ping 127.0.0.1 -n 3 >nul
