@echo off
title ForgeProof - Backend (Port 8000)
color 0B
cd /d "%~dp0"
echo =====================================================================
echo                FORGEPROOF BACKEND API SERVER
echo =====================================================================
echo [*] Starting FastAPI on http://127.0.0.1:8000 ...
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
echo.
echo [!] Backend process stopped.
pause
