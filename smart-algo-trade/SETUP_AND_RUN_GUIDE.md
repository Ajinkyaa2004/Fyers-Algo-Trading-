# 🚀 Smart Algo Trade - Setup & Run Guide

A complete guide to set up and run the Smart Algo Trade project in minutes.

---

## 📋 Quick Start (3 Steps)

### Step 1: Install Dependencies
```bash
npm install
cd backend && pip install -r requirements.txt && cd ..
```

### Step 2: Configure Environment (Optional for Demo)
Create a `.env` file in the `backend/` folder with your Fyers credentials:
```env
FYERS_APP_ID=your_app_id
FYERS_APP_SECRET=your_app_secret
FYERS_REDIRECT_URI=http://127.0.0.1:3000/auth/callback
```

### Step 3: Run the Project
**Option A - Using Scripts (Recommended)**
- **Windows**: Double-click `run.bat`
- **Mac/Linux**: Run `./run.sh`

**Option B - Manual Commands**

Open two terminals:

**Terminal 1 - Backend:**
```bash
cd backend
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8001
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

### Step 4: Open in Browser
```
http://127.0.0.1:3000
```

Login with your Fyers credentials (or use demo mode if not configured).

---

## 🔧 System Requirements

| Requirement | Minimum | Recommended |
|------------|---------|-------------|
| **Python** | 3.8+ | 3.10+ |
| **Node.js** | 16+ | 18+ |
| **npm** | 7+ | 9+ |
| **RAM** | 2GB | 4GB+ |
| **Internet** | Required | Required |

### Check Your Versions
```bash
python --version
node --version
npm --version
```

---

## 📁 Project Structure

```
smart-algo-trade/
├── backend/                    # FastAPI server (Python)
│   ├── main.py                 # Entry point
│   ├── requirements.txt         # Python dependencies
│   ├── .env                     # Configuration (optional)
│   └── app/
│       ├── api/                 # API endpoints
│       └── services/            # Business logic
│
├── src/                         # Frontend code (React + TypeScript)
│   ├── pages/                   # Page components
│   ├── components/              # Reusable components
│   └── App.tsx                  # Main app
│
├── package.json                 # Frontend dependencies
├── tsconfig.json                # TypeScript config
├── vite.config.ts               # Vite config
└── index.html                   # HTML entry point
```

---

## 🎯 Available Commands

### Frontend Commands
```bash
npm run dev          # Start dev server (http://127.0.0.1:3000)
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Check code style
```

### Backend Commands
```bash
# From backend/ folder:
python -m uvicorn main:app --reload                    # Development
python -m uvicorn main:app --host 0.0.0.0 --port 8001 # Production
```

---

## ⚡ Using the Startup Scripts

### Windows (run.bat)
Simply double-click `run.bat` and it will:
- Open two terminals
- Start the backend server (port 8001)
- Start the frontend dev server (port 3000)
- Automatically open http://127.0.0.1:3000 in your browser

### Mac/Linux (run.sh)
```bash
chmod +x run.sh
./run.sh
```

This will do the same as the Windows script.

---

## 🔐 Configuration (Optional)

### Without Configuration
- The project runs in **demo mode**
- All features work with mock data
- No Fyers account needed

### With Live Trading
1. Get Fyers credentials from https://trade.fyers.in/
2. Create `backend/.env`:
```env
FYERS_APP_ID=your_app_id_here
FYERS_APP_SECRET=your_app_secret_here
FYERS_REDIRECT_URI=http://127.0.0.1:3000/auth/callback
```
3. Restart the servers
4. Login with your Fyers account

---

## 🐛 Troubleshooting

### Port Already in Use
**Error:** `Address already in use`

**Solution:** Kill the process on that port:
```bash
# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux:
lsof -ti:3000 | xargs kill -9
```

### Dependencies Not Installing
**Error:** `pip install failed` or `npm install failed`

**Solution:**
```bash
# Clear cache and reinstall
pip cache purge && pip install -r requirements.txt
npm cache clean --force && npm install
```

### Module Not Found
**Error:** `ModuleNotFoundError: No module named 'fastapi'`

**Solution:** Ensure you're in the virtual environment and installed dependencies:
```bash
# Windows:
.venv\Scripts\activate

# Mac/Linux:
source .venv/bin/activate

pip install -r backend/requirements.txt
```

### Frontend Won't Load
**Error:** Can't connect to http://127.0.0.1:3000

**Solution:** Check if npm server is running:
```bash
npm run dev
# Should show: "Local: http://127.0.0.1:3000/"
```

### Backend API Errors
**Error:** 500 errors or connection refused

**Solution:**
1. Check backend is running: http://127.0.0.1:8001/docs
2. Check `.env` file configuration
3. Check Python version is 3.8+
4. Check all backend dependencies installed

---

## 📊 Features Overview

### ✅ What Works Out of the Box
- **Authentication** - Login with Fyers OAuth
- **Dashboard** - Portfolio overview with P&L
- **Market Data** - Real-time quotes & charts
- **Portfolio** - Holdings, positions, orders
- **Trading** - Place, modify, cancel orders
- **Analysis** - Technical indicators (SMA, RSI, MACD)

### ⚙️ Configuration Options
- See [backend/.env.example](backend/.env.example) for all config options
- See [QUICK_REFERENCE.md](QUICK_REFERENCE.md) for API endpoints

---

## 🚀 Development Workflow

### Making Changes
1. Edit code in `src/` or `backend/app/`
2. Changes are auto-reloaded (no restart needed)
3. Check browser console for frontend errors
4. Check terminal for backend errors

### Testing API
- Backend Swagger UI: http://127.0.0.1:8001/docs
- All endpoints documented with interactive testing

### Debugging
```bash
# Backend logs show in terminal
# Frontend logs show in browser console (F12)
# Check network tab for API calls
```

---

## 📚 Next Steps

1. **Read**: [README.md](README.md) - Project overview
2. **Explore**: [QUICK_REFERENCE.md](QUICK_REFERENCE.md) - Code examples
3. **Deploy**: See deployment guides in documentation
4. **Contribute**: See contributing guidelines

---

## 🆘 Need Help?

1. Check [QUICK_REFERENCE.md](QUICK_REFERENCE.md) for API examples
2. Check backend logs for errors
3. Check browser console (F12) for frontend errors
4. See [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for common issues

---

## 📦 Dependencies

### Frontend
- React 19
- TypeScript
- Vite (dev server)
- TailwindCSS (styling)
- ApexCharts (charting)

### Backend
- FastAPI (web framework)
- Uvicorn (server)
- SQLAlchemy (database)
- Fyers-API v3 (trading)

---

## ✅ Checklist Before Starting

- [ ] Python 3.8+ installed
- [ ] Node.js 16+ installed
- [ ] Internet connection available
- [ ] Ports 3000 & 8001 are free
- [ ] Optional: .env configured with Fyers credentials

Once checked, you're ready to go! 🎉

---

## 🎓 Learning Resources

- [FastAPI Docs](https://fastapi.tiangolo.com/)
- [React Docs](https://react.dev/)
- [Fyers API Docs](https://api-docs.fyers.in/)
- [TypeScript Docs](https://www.typescriptlang.org/)

---

**Happy Trading! 📈**
