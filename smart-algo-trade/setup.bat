@echo off
REM Setup script for Smart Algo Trade improvements
setlocal enabledelayedexpansion

echo.
echo 🚀 Smart Algo Trade - Setup ^& Initialization
echo ============================================
echo.

REM Step 1: Install Python dependencies
echo [1/5] Installing Python dependencies...
cd backend
if not exist "requirements.txt" (
    echo ❌ requirements.txt not found
    exit /b 1
)
pip install -r requirements.txt
echo ✓ Python dependencies installed
echo.

REM Step 2: Setup environment variables
echo [2/5] Setting up environment variables...
if not exist ".env" (
    if exist ".env.example" (
        copy .env.example .env
        echo ⚠ .env created from template - please update with your credentials
    ) else (
        echo ❌ .env.example not found
        exit /b 1
    )
) else (
    echo ✓ .env already exists
)
echo.

REM Step 3: Initialize database
echo [3/5] Initializing database...
python -c "from database import init_db; init_db(); print('✓ Database initialized')"
echo.

REM Step 4: Validate configuration
echo [4/5] Validating configuration...
python -c "from config import settings; settings.validate(); print('✓ Configuration valid')"
echo.

REM Step 5: Install Node dependencies
echo [5/5] Installing Node dependencies...
cd ..
npm install
echo ✓ Node dependencies installed
echo.

echo.
echo ✅ Setup Complete!
echo.
echo 📝 Next steps:
echo 1. Update backend/.env with your Fyers credentials
echo 2. Run 'npm run dev' in one terminal
echo 3. Run 'python main.py' in backend folder in another terminal
echo 4. Open http://127.0.0.1:3000 in your browser
echo.
