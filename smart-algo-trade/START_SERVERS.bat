@echo off
REM Smart Algo Trade - Complete Startup Script for Windows
REM This script starts both backend and frontend servers

echo.
echo ============================================================
echo  SMART ALGO TRADE - LIVE TRADING SYSTEM
echo ============================================================
echo.
echo Starting servers...
echo.

REM Get the current directory
set SCRIPT_DIR=%~dp0

REM Define paths
set BACKEND_DIR=%SCRIPT_DIR%backend
set FRONTEND_DIR=%SCRIPT_DIR%frontend

REM Check if directories exist
if not exist "%BACKEND_DIR%" (
    echo ERROR: Backend directory not found at %BACKEND_DIR%
    pause
    exit /b 1
)

if not exist "%FRONTEND_DIR%" (
    echo ERROR: Frontend directory not found at %FRONTEND_DIR%
    pause
    exit /b 1
)

echo.
echo Step 1: Starting Backend Server (Port 8001)...
echo ============================================================
cd /d "%BACKEND_DIR%"

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    pause
    exit /b 1
)

REM Start backend in a new window
echo Launching FastAPI backend...
start "Smart Algo Trade - Backend" cmd /k "python -m uvicorn main:app --reload --host 127.0.0.1 --port 8001"

REM Wait a moment for backend to start
timeout /t 3 /nobreak

echo.
echo Step 2: Starting Frontend Server (Port 3000)...
echo ============================================================
cd /d "%FRONTEND_DIR%"

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed or not in PATH
    pause
    exit /b 1
)

REM Start frontend in a new window
echo Launching React frontend...
start "Smart Algo Trade - Frontend" cmd /k "npm run dev"

REM Wait for frontend to start
timeout /t 5 /nobreak

echo.
echo ============================================================
echo  STARTUP COMPLETE!
echo ============================================================
echo.
echo Frontend:     http://127.0.0.1:3000
echo Backend API:  http://127.0.0.1:8001/api/portfolio
echo.
echo Services will open in separate windows.
echo Close either window to stop that service.
echo.
echo Press any key to continue...
echo ============================================================
pause

REM Open the application in browser
echo Opening application in browser...
start http://127.0.0.1:3000

echo.
echo Application is ready! Use the windows above or navigate to:
echo http://127.0.0.1:3000
echo.
