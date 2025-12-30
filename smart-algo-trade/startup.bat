@echo off
REM Smart Algo Trade - Full System Verification & Setup
REM Complete startup script with all checks and installations

echo.
echo ========================================
echo   Smart Algo Trade - Complete Startup
echo ========================================
echo.

REM Check Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Python not found!
    echo Please install Python 3.8+ from https://www.python.org/
    pause
    exit /b 1
)

echo [✓] Python found
python --version

REM Check Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: Node.js not found!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo [✓] Node.js found
node --version

REM Check npm
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: npm not found!
    pause
    exit /b 1
)

echo [✓] npm found
npm --version

echo.
echo ========================================
echo   Installing Dependencies
echo ========================================
echo.

REM Install backend dependencies
if not exist "backend\requirements.txt" (
    echo ERROR: backend/requirements.txt not found!
    pause
    exit /b 1
)

echo Installing backend dependencies...
pip install -q -r backend\requirements.txt
if %errorlevel% neq 0 (
    echo WARNING: Some dependencies failed to install
    echo This might be okay - trying to continue...
)

echo [✓] Backend dependencies processed

REM Install frontend dependencies
if not exist "package.json" (
    echo ERROR: package.json not found!
    pause
    exit /b 1
)

if not exist "node_modules" (
    echo Installing frontend dependencies...
    call npm install -q
    if %errorlevel% neq 0 (
        echo WARNING: npm install had issues
        echo This might be okay - trying to continue...
    )
    echo [✓] Frontend dependencies processed
) else (
    echo [✓] Frontend dependencies already installed
)

REM Check .env file
echo.
if exist "backend\.env" (
    echo [✓] Configuration found (backend\.env)
    echo    Live trading enabled
) else (
    echo [i] No backend\.env found
    echo    Running in demo mode
    echo    Create backend\.env to enable live trading
)

echo.
echo ========================================
echo   All Systems Ready!
echo ========================================
echo.
echo Starting servers...
echo.

REM Start servers in new windows
start "Smart Algo Trade - Backend" cmd /k "cd backend && python -m uvicorn main:app --reload --host 127.0.0.1 --port 8001"
timeout /t 2 /nobreak

start "Smart Algo Trade - Frontend" cmd /k "npm run dev"
timeout /t 3 /nobreak

echo.
echo [✓] Servers starting...
echo.
echo ========================================
echo   Access Your Application
echo ========================================
echo.
echo Frontend: http://127.0.0.1:3000
echo Backend:  http://127.0.0.1:8001
echo Docs:     http://127.0.0.1:8001/docs
echo.
echo ========================================
echo.

REM Try to open browser
echo Opening browser...
start http://127.0.0.1:3000

echo.
echo [✓] Application starting in your browser
echo.
echo Keep this window and the server windows open while using the app.
echo Press Ctrl+C in the server windows to stop them.
echo.

pause
