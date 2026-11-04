@echo off
title AutoCover Backend API
echo ========================================================
echo Starting AutoCover Backend API on http://127.0.0.1:8000
echo ========================================================
echo.
echo Closing any previous process on port 8000...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8000 ^| findstr LISTENING') do taskkill /f /pid %%a 2>nul
echo Starting Uvicorn...
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
pause
