# 🚀 Quick Start - 5 Minutes to Running

## ⚡ TL;DR

```bash
# 1. Install dependencies
cd backend && pip install -r requirements.txt && cd ..
npm install

# 2. Configure
cp .env.example .env
# Edit .env with your Fyers credentials

# 3. Run (2 terminals)
# Terminal 1:
cd backend && python main.py

# Terminal 2:
npm run dev

# 4. Open browser
# http://127.0.0.1:3000
```

---

## 📋 Step-by-Step

### Step 1: Install Python Dependencies (2 minutes)
```bash
cd backend
pip install -r requirements.txt
cd ..
```

✅ You'll see messages like:
```
Successfully installed fastapi-0.104.1 sqlalchemy-2.0.23 ...
```

### Step 2: Install Node Dependencies (1 minute)
```bash
npm install
```

✅ Completes with no errors

### Step 3: Configure Environment (1 minute)
```bash
# Copy template
cp .env.example .env

# Edit with your Fyers credentials
nano .env  # or use your editor
```

✅ Make sure these are set:
```env
FYERS_CLIENT_ID=your_actual_id
FYERS_SECRET_KEY=your_actual_key
```

### Step 4: Start Backend (Terminal 1)
```bash
cd backend
python main.py
```

✅ Should see:
```
INFO:     Uvicorn running on http://127.0.0.1:8001
INFO:     Application startup complete.
```

### Step 5: Start Frontend (Terminal 2)
```bash
npm run dev
```

✅ Should see:
```
VITE v7.3.0  ready in 353 ms
➜  Local:   http://127.0.0.1:3000/
```

### Step 6: Open Browser
```
http://127.0.0.1:3000
```

✅ You should see the login page

---

## ✅ What Was Added

| What | File | Purpose |
|------|------|---------|
| **Global State** | `src/context/AppContext.tsx` | Share data without prop drilling |
| **Error Handling** | `src/components/ErrorBoundary.tsx` | Catch component errors |
| **API Client** | `src/services/api.ts` | Better API calls |
| **Validation** | `backend/app/validators.py` | Validate inputs |
| **Database** | `backend/database.py` | Store data persistently |
| **Logging** | `backend/app/logger.py` | Track everything |
| **JWT Auth** | `backend/app/auth.py` | Secure tokens |
| **Strategy API** | `backend/app/api/strategy.py` | Manage strategies |

---

## 🎮 Try It Out

### 1. Login
- Click "Connect Fyers" button
- Use your Fyers credentials
- Get redirected back to app

### 2. Create a Strategy
```
Go to "Strategies" tab
Select risk level: Medium
Select strategy: Trend Follower
Click "Create Strategy"
```

### 3. Check Database
```bash
# Backend folder
sqlite3 smart_algo_trade.db
SELECT * FROM strategies;
.quit
```

### 4. View Logs
- Backend terminal shows API calls
- Browser console (F12) shows frontend calls

---

## 🆘 Common First-Run Issues

### Issue: `ModuleNotFoundError: No module named 'sqlalchemy'`
```bash
pip install -r backend/requirements.txt
```

### Issue: Port 8001 already in use
```bash
# Change port in backend/config.py
BACKEND_PORT = 8002
```

### Issue: CORS errors in browser
- Check CORS settings in `backend/config.py`
- Should have `http://127.0.0.1:3000`

### Issue: Database doesn't create
- Ensure write permission in backend folder
- Restart backend server

---

## 📁 Key Files Location

```
smart-algo-trade/
├── .env                         ← Your secrets (create from .env.example)
├── .env.example                 ← Template
├── npm run dev                  ← Start frontend
│
└── backend/
    ├── main.py                  ← Run this for backend
    ├── config.py                ← Configuration
    ├── database.py              ← Database setup
    ├── requirements.txt         ← Python packages
    ├── smart_algo_trade.db      ← Database (auto-created)
    └── app/
        ├── models.py            ← Data models
        └── api/
            ├── strategy.py      ← Strategy endpoints
            └── auth.py          ← Login endpoints
```

---

## 🔒 Security Defaults

✅ CORS limited to `http://127.0.0.1:3000`
✅ Debug mode OFF (set `DEBUG=False` in .env)
✅ Secrets from environment variables
✅ Input validation on all endpoints
✅ Request timeout: 30 seconds

---

## 🎯 What's Next?

1. ✅ Get it running (this guide)
2. 🧪 Test login and portfolio viewing
3. 🎨 Customize UI/styling
4. 📊 Add your trading logic
5. 🚀 Deploy to production

---

## 📖 Full Documentation

- **Detailed Guide**: `FIXES_AND_IMPROVEMENTS.md`
- **Integration**: `INTEGRATION_TASKS.md`
- **Reference**: `QUICK_REFERENCE.md`
- **Troubleshooting**: `TROUBLESHOOTING.md`
- **Full Report**: `COMPLETION_REPORT.md`

---

## 💬 Need Help?

1. Check `TROUBLESHOOTING.md` for issues
2. Review browser console (F12) for errors
3. Check backend terminal for API errors
4. Read `QUICK_REFERENCE.md` for examples

---

**Status**: ✅ Ready to run!
**Time to get started**: ~5 minutes
**Everything working**: Yes! ✨

Go ahead and start the servers! 🚀
