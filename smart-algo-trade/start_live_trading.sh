#!/bin/bash

# Quick Start Script for Live Trading Dashboard
# This script starts both backend and frontend

echo ""
echo "====================================================="
echo "  🚀 Smart Algo Trade - Live Trading Dashboard"
echo "====================================================="
echo ""

# Check if running from correct directory
if [ ! -f "package.json" ]; then
    echo "ERROR: package.json not found. Please run from project root."
    echo "Current directory: $(pwd)"
    exit 1
fi

if [ ! -f "backend/main.py" ]; then
    echo "ERROR: backend/main.py not found"
    exit 1
fi

# Check Python environment
echo "Step 1: Checking Python environment..."
if [ -f ".venv/bin/activate" ]; then
    source .venv/bin/activate
    echo "✓ Virtual environment activated"
else
    echo "ERROR: Virtual environment not found"
    echo "Please run: python3 -m venv .venv"
    exit 1
fi

# Start Backend Server
echo ""
echo "Step 2: Starting Backend Server (Port 8001)..."
echo "========================================="
cd backend
python main.py &
BACKEND_PID=$!
echo "✓ Backend server starting... (PID: $BACKEND_PID)"
sleep 3
cd ..

# Start Frontend Server
echo ""
echo "Step 3: Starting Frontend Server (Port 3000)..."
echo "========================================="
echo "✓ Frontend server starting..."
npm run dev &
FRONTEND_PID=$!

echo ""
echo "====================================================="
echo "  Dashboard URLs:"
echo "  Frontend:  http://127.0.0.1:3000"
echo "  Backend:   http://127.0.0.1:5000"
echo "====================================================="
echo ""
echo "Features:"
echo "  📊 Live Trading Desk  - Place trades and monitor portfolio"
echo "  📈 Market Data        - Real-time ticker and indicators"
echo "  📉 Live Charts        - Candlestick charts for technical analysis"
echo ""
echo "====================================================="
echo ""
echo "Press Ctrl+C to stop both servers..."
echo ""

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID

# Cleanup on exit
echo ""
echo "Stopping servers..."
kill $BACKEND_PID 2>/dev/null
kill $FRONTEND_PID 2>/dev/null
echo "Done!"
