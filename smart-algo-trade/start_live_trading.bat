@echo off
REM Quick Start Script for Live Trading Dashboard
REM This script starts both backend and frontend

setlocal enabledelayedexpansion

echo.
echo =====================================================
echo   🚀 Smart Algo Trade - Live Trading Dashboard
echo =====================================================
echo.

REM Check if running from correct directory
if not exist "package.json" (
    echo ERROR: package.json not found. Please run from project root.
    echo Current directory: %cd%
    pause
    exit /b 1
)

if not exist "backend\app_with_live_trading.py" (
    echo ERROR: backend\app_with_live_trading.py not found
    pause
    exit /b 1
)

echo Step 1: Checking Python environment...
if exist ".venv\Scripts\activate.bat" (
    call .venv\Scripts\activate.bat
    echo ✓ Virtual environment activated
) else (
    echo ERROR: Virtual environment not found
    echo Please run: python -m venv .venv
    pause
    exit /b 1
)

echo.
echo Step 2: Starting Backend Server (Port 8001)...
echo ========================================
start "Backend Server" cmd /k "cd /d backend && python main.py"
echo ✓ Backend server starting...
timeout /t 3 /nobreak

echo.
echo Step 3: Starting Frontend Server (Port 3000)...
echo ========================================
echo ✓ Frontend server starting...
npm run dev

echo.
echo =====================================================
echo   Dashboard URLs:
echo   Frontend:  http://127.0.0.1:3000
echo   Backend:   http://127.0.0.1:5000
echo =====================================================
echo.
echo Features:
echo   📊 Live Trading Desk  - Place trades and monitor portfolio
echo   📈 Market Data        - Real-time ticker and indicators
echo   📉 Live Charts        - Candlestick charts for technical analysis
echo.
echo =====================================================

pause
