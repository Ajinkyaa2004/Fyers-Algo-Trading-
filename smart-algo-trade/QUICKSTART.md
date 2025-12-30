# ⚡ Quick Start in 60 Seconds

## For the Impatient

### Windows Users 🪟
```bash
1. Double-click: run.bat
2. Wait 30 seconds
3. Browser opens automatically at http://127.0.0.1:3000
4. Done! ✓
```

### Mac/Linux Users 🍎🐧
```bash
1. chmod +x run.sh
2. ./run.sh
3. Open http://127.0.0.1:3000
4. Done! ✓
```

---

## If Scripts Don't Work

### Open 2 Terminals:

**Terminal 1 (Backend):**
```bash
cd backend
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8001
```

**Terminal 2 (Frontend):**
```bash
npm run dev
```

**Browser:**
```
http://127.0.0.1:3000
```

---

## Login Credentials

- **Live Trading**: Use your Fyers account
- **Demo Mode**: Works without credentials (default)

---

## What You'll See

✅ Dashboard with portfolio overview
✅ Real-time market data
✅ Trading interface (place/cancel orders)
✅ Technical analysis charts
✅ P&L tracking

---

## Common Issues

| Issue | Fix |
|-------|-----|
| Port in use | Close other apps or kill process on port 3000/8001 |
| Module not found | Run `pip install -r backend/requirements.txt` |
| Node not found | Install Node.js from nodejs.org |
| Python not found | Install Python from python.org |

---

## Next Steps

- Read [SETUP_AND_RUN_GUIDE.md](SETUP_AND_RUN_GUIDE.md) for full details
- Check [QUICK_REFERENCE.md](QUICK_REFERENCE.md) for API docs
- See [README.md](README.md) for feature overview

---

**That's it! Happy trading! 📈**
