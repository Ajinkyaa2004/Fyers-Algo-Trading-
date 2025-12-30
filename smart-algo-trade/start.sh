#!/bin/bash

# Smart Algo Trade Startup Script
# This script starts both backend and frontend servers

echo "🚀 Starting Smart Algo Trade..."
echo ""

# Get the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Create logs directory if it doesn't exist
mkdir -p logs

# Start backend in background
echo "🔧 Starting Backend Server (http://127.0.0.1:8001)..."
cd backend
./venv/bin/python -m uvicorn main:app --host 127.0.0.1 --port 8001 > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
echo "✅ Backend started (PID: $BACKEND_PID)"

# Wait a moment for backend to initialize
sleep 2

# Start frontend in background
echo "🎨 Starting Frontend Server (http://127.0.0.1:3000)..."
cd ..
npx vite > logs/frontend.log 2>&1 &
FRONTEND_PID=$!
echo "✅ Frontend started (PID: $FRONTEND_PID)"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✨ Smart Algo Trade is running!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🌐 Frontend: http://127.0.0.1:3000"
echo "⚙️  Backend:  http://127.0.0.1:8001"
echo "📚 API Docs: http://127.0.0.1:8001/docs"
echo ""
echo "💡 Press Ctrl+C to stop both servers"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Save PIDs to file for cleanup
echo $BACKEND_PID > .backend.pid
echo $FRONTEND_PID > .frontend.pid

# Wait for user interrupt
trap "echo ''; echo '🛑 Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; rm -f .backend.pid .frontend.pid; echo '✅ Servers stopped'; exit 0" INT

# Keep script running
wait

# cd /Users/ajinkya/Downloads/smart-algo-trade/smart-algo-trade
# ./start.sh