@echo off
REM Smart Algo Trade - Quick Start Script for Windows
REM This script starts both the backend and frontend servers

echo.
echo ========================================
echo   Smart Algo Trade - Quick Start
echo ========================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: Node.js not found. Please install Node.js first.
    echo Download from: https://nodejs.org/
    pause
    exit /b 1
)

REM Check if Python is installed
where python >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: Python not found. Please install Python first.
    echo Download from: https://www.python.org/
    pause
    exit /b 1
)

echo ✓ Node.js found
echo ✓ Python found
echo.

REM Check if dependencies are installed
if not exist "node_modules" (
    echo Installing frontend dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install frontend dependencies
        pause
        exit /b 1
    )
)

if not exist "backend\venv" (
    if not exist ".venv" (
        echo Creating Python virtual environment...
        python -m venv .venv
    )
)

REM Activate virtual environment
if exist ".venv\Scripts\activate.bat" (
    call .venv\Scripts\activate.bat
) else if exist "backend\venv\Scripts\activate.bat" (
    call backend\venv\Scripts\activate.bat
)

REM Install backend dependencies
echo Installing backend dependencies...
pip install -q -r backend\requirements.txt
if %errorlevel% neq 0 (
    echo ERROR: Failed to install backend dependencies
    pause
    exit /b 1
)

echo.
echo ========================================
echo   Starting Servers...
echo ========================================
echo.
echo 📝 INFO:
echo   Backend will start on: http://127.0.0.1:8001
echo   Frontend will start on: http://127.0.0.1:3000
echo   API Docs: http://127.0.0.1:8001/docs
echo.
echo ⚠️  IMPORTANT:
echo   - Keep both terminal windows open while using the app
echo   - Press Ctrl+C in either window to stop that server
echo   - To stop everything, close both windows
echo.

REM Start backend in new window
echo Starting Backend Server...
start "Smart Algo Trade - Backend" cmd /k "cd backend && python -m uvicorn main:app --reload --host 127.0.0.1 --port 8001"

REM Wait a moment for backend to start
timeout /t 2 /nobreak

REM Start frontend in new window
echo Starting Frontend Server...
start "Smart Algo Trade - Frontend" cmd /k "npm run dev"

REM Wait for frontend to start
timeout /t 3 /nobreak

REM Try to open browser
echo.
echo Opening http://127.0.0.1:3000 in your browser...
start http://127.0.0.1:3000

echo.
echo ✓ Both servers started!
echo ✓ Browser opening...
echo.
echo 📚 Next Steps:
echo   1. Wait for both servers to fully start (see terminal windows)
echo   2. Login with your Fyers credentials
echo   3. Start trading!
echo.
echo 💡 Tips:
echo   - If port is in use, kill the process and try again
echo   - Check terminal windows for error messages
echo   - Press F12 in browser to see console
echo.

pause
