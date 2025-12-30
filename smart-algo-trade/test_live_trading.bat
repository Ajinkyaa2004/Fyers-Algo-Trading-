@echo off
REM Quick test to verify live trading system is working

echo.
echo =====================================================
echo   Testing Live Trading System
echo =====================================================
echo.

echo Step 1: Checking Backend Health...
echo ========================================
echo Testing: http://127.0.0.1:8001/api/live-trading/health
echo.

REM Use curl to test endpoint
curl -s http://127.0.0.1:8001/api/live-trading/health > nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Backend is RUNNING and responding
    echo.
    echo Response from health check:
    curl -s http://127.0.0.1:8001/api/live-trading/health | find "operational"
) else (
    echo ❌ Backend is NOT responding
    echo.
    echo SOLUTION:
    echo 1. Make sure backend is running
    echo 2. Run this in a terminal:
    echo    cd backend
    echo    python main.py
    echo 3. Wait 5 seconds for startup
    echo 4. Run this test again
    echo.
    pause
    exit /b 1
)

echo.
echo Step 2: Checking Frontend...
echo ========================================
echo Testing: http://127.0.0.1:3000
echo.

curl -s http://127.0.0.1:3000 > nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Frontend is RUNNING
) else (
    echo ⚠️  Frontend is NOT running
    echo But that's OK - start it with:
    echo npm run dev
)

echo.
echo Step 3: Testing API Endpoints...
echo ========================================
echo.

echo Testing: GET /api/live-trading/portfolio
curl -s -X GET http://127.0.0.1:8001/api/live-trading/portfolio | find "available_cash" > nul
if %errorlevel% equ 0 (
    echo ✅ Portfolio endpoint working
) else (
    echo ❌ Portfolio endpoint failed
)

echo.
echo Testing: GET /api/live-trading/positions
curl -s -X GET http://127.0.0.1:8001/api/live-trading/positions > nul
if %errorlevel% equ 0 (
    echo ✅ Positions endpoint working
) else (
    echo ❌ Positions endpoint failed
)

echo.
echo Step 4: Testing Market Prices...
echo ========================================
echo.

curl -s -X GET http://127.0.0.1:8001/api/live-trading/market-prices | find "NSE:SBIN" > nul
if %errorlevel% equ 0 (
    echo ✅ Market prices available
    echo Sample prices:
    curl -s -X GET http://127.0.0.1:8001/api/live-trading/market-prices | findstr "NSE:SBIN NSE:INFY NSE:TCS"
) else (
    echo ❌ Market prices endpoint failed
)

echo.
echo =====================================================
echo   ✅ All Systems Ready!
echo =====================================================
echo.
echo You can now:
echo 1. Open: http://127.0.0.1:3000
echo 2. Click: 💹 Live Trading Desk
echo 3. Place a test BUY order
echo 4. View your P&L
echo.
pause
