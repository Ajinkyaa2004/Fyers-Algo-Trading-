#!/bin/bash

# Smart Algo Trade - Quick Start Script for Mac/Linux
# This script starts both the backend and frontend servers

echo ""
echo "========================================"
echo "  Smart Algo Trade - Quick Start"
echo "========================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js not found. Please install Node.js first."
    echo "Download from: https://nodejs.org/"
    exit 1
fi

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "ERROR: Python not found. Please install Python first."
    echo "Download from: https://www.python.org/"
    exit 1
fi

echo "✓ Node.js found"
echo "✓ Python found"
echo ""

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "ERROR: Failed to install frontend dependencies"
        exit 1
    fi
fi

# Create virtual environment if it doesn't exist
if [ ! -d ".venv" ] && [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv .venv
fi

# Activate virtual environment
if [ -f ".venv/bin/activate" ]; then
    source .venv/bin/activate
elif [ -f "venv/bin/activate" ]; then
    source venv/bin/activate
fi

# Install backend dependencies
echo "Installing backend dependencies..."
pip install -q -r backend/requirements.txt
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to install backend dependencies"
    exit 1
fi

echo ""
echo "========================================"
echo "  Starting Servers..."
echo "========================================"
echo ""
echo "📝 INFO:"
echo "   Backend will start on: http://127.0.0.1:8001"
echo "   Frontend will start on: http://127.0.0.1:3000"
echo "   API Docs: http://127.0.0.1:8001/docs"
echo ""
echo "⚠️  IMPORTANT:"
echo "   - Keep both terminal windows/tabs open while using the app"
echo "   - Press Ctrl+C in either window to stop that server"
echo "   - To stop everything, press Ctrl+C in both windows"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "Shutting down servers..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM

# Start backend in background
echo "Starting Backend Server..."
cd backend
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8001 &
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 2

# Start frontend in background
echo "Starting Frontend Server..."
npm run dev &
FRONTEND_PID=$!

# Wait for frontend to start
sleep 3

echo ""
echo "✓ Both servers started!"
echo ""
echo "📚 Next Steps:"
echo "   1. Wait for both servers to fully start"
echo "   2. Open http://127.0.0.1:3000 in your browser"
echo "   3. Login with your Fyers credentials"
echo "   4. Start trading!"
echo ""
echo "💡 Tips:"
echo "   - If ports are in use, kill the processes and try again"
echo "   - Check terminal output for error messages"
echo "   - Press Ctrl+Shift+K in browser to see console"
echo ""

# Try to open browser (macOS and Linux)
if command -v open &> /dev/null; then
    # macOS
    open http://127.0.0.1:3000
elif command -v xdg-open &> /dev/null; then
    # Linux
    xdg-open http://127.0.0.1:3000
fi

# Wait for background processes
wait
