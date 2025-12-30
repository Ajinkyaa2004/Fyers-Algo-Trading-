#!/bin/bash

# Smart Algo Trade Stop Script
# This script stops both backend and frontend servers

echo "🛑 Stopping Smart Algo Trade..."

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Read PIDs from files
if [ -f .backend.pid ]; then
    BACKEND_PID=$(cat .backend.pid)
    kill $BACKEND_PID 2>/dev/null && echo "✅ Backend stopped (PID: $BACKEND_PID)" || echo "⚠️  Backend not running"
    rm -f .backend.pid
fi

if [ -f .frontend.pid ]; then
    FRONTEND_PID=$(cat .frontend.pid)
    kill $FRONTEND_PID 2>/dev/null && echo "✅ Frontend stopped (PID: $FRONTEND_PID)" || echo "⚠️  Frontend not running"
    rm -f .frontend.pid
fi

# Also kill any running uvicorn or vite processes as fallback
pkill -f "uvicorn main:app" 2>/dev/null
pkill -f "vite" 2>/dev/null

echo "✅ All servers stopped"
