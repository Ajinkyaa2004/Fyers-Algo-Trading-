# 🔧 Complete Troubleshooting & Configuration Guide

## ✅ What's Working

Your project now has:
- ✓ All Python packages installed (numpy, pandas, pytz, scipy, etc.)
- ✓ All npm dependencies configured  
- ✓ FastAPI backend ready
- ✓ React frontend ready
- ✓ Database models set up
- ✓ WebSocket support
- ✓ Technical indicators ready

---

## 🚀 Starting Everything

### Option 1: One-Click Startup (Windows)
```bash
startup.bat
```

### Option 2: One-Click Startup (Mac/Linux)
```bash
python3 startup.py
```

### Option 3: Manual Commands
**Terminal 1:**
```bash
cd backend
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8001
```

**Terminal 2:**
```bash
npm run dev
```

---

## 🌐 Access the Application

Once running, open in your browser:
- **Frontend**: http://127.0.0.1:3000
- **Backend API**: http://127.0.0.1:8001
- **API Docs**: http://127.0.0.1:8001/docs (interactive)
- **API Redoc**: http://127.0.0.1:8001/redoc

---

## 🔐 Configuration (Optional)

### For Live Trading with Fyers

Create `backend/.env` with your credentials:

```env
# Fyers API Credentials
FYERS_APP_ID=your_app_id_here
FYERS_APP_SECRET=your_app_secret_here
FYERS_REDIRECT_URI=http://127.0.0.1:3000/auth/callback

# Database (optional)
DATABASE_URL=sqlite:///./smart_algo_trade.db

# Other Settings
LOG_LEVEL=INFO
DEBUG=False
```

### Get Fyers Credentials

1. Visit: https://trade.fyers.in/
2. Go to API Settings
3. Create an app to get:
   - App ID
   - App Secret
4. Set Redirect URI to: `http://127.0.0.1:3000/auth/callback`
5. Copy credentials to `.env`

---

## 🐛 Common Issues & Solutions

### Issue 1: Port Already in Use

**Error:**
```
Address already in use: ('127.0.0.1', 3000)
```

**Solution:**

**Windows:**
```bash
# Kill process on port 3000
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Kill process on port 8001
netstat -ano | findstr :8001
taskkill /PID <PID> /F
```

**Mac/Linux:**
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Kill process on port 8001
lsof -ti:8001 | xargs kill -9
```

---

### Issue 2: Module Not Found Errors

**Error:**
```
ModuleNotFoundError: No module named 'numpy'
```

**Solution:**
```bash
# Reinstall all packages
pip install -r backend/requirements.txt --force-reinstall
```

---

### Issue 3: Frontend Won't Load

**Error:**
```
Cannot GET http://127.0.0.1:3000
```

**Solution:**
```bash
# Make sure npm server is running
# Check in Terminal 2 that you see:
# "Local: http://127.0.0.1:3000/"

# If not, start it:
npm run dev

# Clear node_modules and reinstall
rm -r node_modules package-lock.json
npm install
npm run dev
```

---

### Issue 4: Backend API Errors (500 errors)

**Error:**
```
HTTP 500 - Internal Server Error
```

**Solution:**

1. Check backend terminal for error messages
2. Verify Python version: `python --version` (need 3.8+)
3. Check all dependencies: `pip list`
4. Restart backend:
   ```bash
   cd backend
   python -m uvicorn main:app --reload --host 127.0.0.1 --port 8001
   ```

---

### Issue 5: WebSocket Connection Failed

**Error:**
```
WebSocket connection failed
```

**Solution:**
- This is normal if Fyers credentials aren't configured
- The app works in demo mode without real-time data
- To enable: Add `.env` file with Fyers credentials

---

### Issue 6: CORS Errors in Browser Console

**Error:**
```
Access to XMLHttpRequest blocked by CORS policy
```

**Solution:**

This is already fixed! The backend has CORS enabled. If you still see it:

1. Clear browser cache (Ctrl+Shift+Delete)
2. Hard refresh (Ctrl+Shift+R)
3. Restart backend server

---

### Issue 7: Database Errors

**Error:**
```
sqlalchemy.exc.OperationalError: No such table
```

**Solution:**
```bash
# The database auto-creates, but if needed, reset it:
# Windows:
del backend\smart_algo_trade.db

# Mac/Linux:
rm backend/smart_algo_trade.db

# Then restart the server
```

---

## 📊 Testing the API

### Using Swagger UI (Interactive)
1. Open: http://127.0.0.1:8001/docs
2. Click on any endpoint
3. Click "Try it out"
4. Click "Execute"

### Using cURL

**Test Backend Health:**
```bash
curl http://127.0.0.1:8001/health
```

**Get Login URL:**
```bash
curl http://127.0.0.1:8001/api/auth/login
```

**Get Portfolio Holdings:**
```bash
curl http://127.0.0.1:8001/api/portfolio/holdings
```

---

## 🔍 Debugging Tips

### Check Backend Logs
Look at the Terminal 1 output for:
- Server startup messages
- Request logs
- Error messages with timestamps

### Check Frontend Console
Press `F12` in browser, go to "Console" tab to see:
- JavaScript errors
- Network requests
- Application state

### Check Network Requests
In browser DevTools (F12):
1. Go to "Network" tab
2. Make an action (e.g., click a button)
3. See the request and response

### Enable Debug Mode

Add to `backend/.env`:
```env
DEBUG=True
LOG_LEVEL=DEBUG
```

Then restart the server.

---

## 📦 All Installed Packages

### Python Packages
```
fastapi          - Web framework
uvicorn          - ASGI server
sqlalchemy       - Database ORM
pydantic         - Data validation
numpy            - Scientific computing
pandas           - Data analysis
pytz             - Timezone support
scipy            - Scientific computing
scikit-learn     - Machine learning
matplotlib       - Plotting
ta-lib           - Technical analysis
requests         - HTTP client
websockets       - WebSocket support
python-dotenv    - Environment variables
PyJWT            - JWT tokens
cryptography     - Encryption
fyers-apiv3      - Trading API
```

### Frontend Packages
```
react            - UI library
typescript       - Type safety
vite             - Dev server
tailwindcss      - Styling
apexcharts       - Charts
react-apexcharts - Chart integration
lucide-react     - Icons
framer-motion    - Animations
```

---

## ✨ Features Available

### ✅ Working Features
- Dashboard with portfolio overview
- Holdings and positions tracking
- Order placement and cancellation
- Real-time quotes (demo data)
- Market depth visualization
- Technical indicators (SMA, RSI, MACD)
- Paper trading simulation
- Order history
- P&L calculation
- Responsive UI

### 🔄 API Endpoints

**Authentication**
- `GET /api/auth/login` - Get login URL
- `GET /api/auth/callback` - OAuth callback

**Portfolio**
- `GET /api/portfolio/profile` - User profile
- `GET /api/portfolio/holdings` - Holdings
- `GET /api/portfolio/positions` - Positions
- `GET /api/portfolio/orders` - Orders
- `GET /api/portfolio/margins` - Account margins

**Market Data**
- `GET /api/market/quotes` - Real-time quotes
- `GET /api/market/depth` - Market depth (bid/ask)
- `GET /api/market/search` - Symbol search

**Orders**
- `POST /api/orders/place` - Place order
- `POST /api/orders/modify` - Modify order
- `POST /api/orders/cancel` - Cancel order

**Technical Indicators**
- `GET /api/indicators/sma` - Simple Moving Average
- `GET /api/indicators/rsi` - RSI
- `GET /api/indicators/macd` - MACD
- `GET /api/indicators/bollinger` - Bollinger Bands

---

## 🚀 Performance Tips

### Frontend
- Clear browser cache if seeing old styles
- Use Chrome/Firefox for best compatibility
- Zoom to 100% for best layout

### Backend
- First request might be slow (cold start)
- Subsequent requests are fast
- Check API docs at `/docs` for response times

---

## 📝 Next Steps

1. **Read the Main Docs**
   - [README.md](README.md) - Project overview
   - [SETUP_AND_RUN_GUIDE.md](SETUP_AND_RUN_GUIDE.md) - Complete guide

2. **Get Fyers Credentials**
   - Visit https://trade.fyers.in/
   - Create your app to get credentials
   - Set up `.env` file

3. **Explore the API**
   - Open http://127.0.0.1:8001/docs
   - Try different endpoints
   - Check the response formats

4. **Customize the UI**
   - Edit files in `src/` for frontend
   - Edit files in `backend/app/` for backend
   - Changes auto-reload!

---

## 🆘 Still Having Issues?

1. **Check this guide first** - Most issues covered above
2. **Check the terminal output** - Usually shows the actual error
3. **Clear cache and restart**
   ```bash
   # Frontend
   rm -r node_modules
   npm install
   npm run dev
   
   # Backend
   pip install -r backend/requirements.txt --force-reinstall
   python -m uvicorn main:app --reload --host 127.0.0.1 --port 8001
   ```

3. **Check dependencies are installed**
   ```bash
   pip list | grep -E "numpy|pandas|pytz"
   ```

---

## ✅ Verification Checklist

- [ ] Python 3.8+ installed
- [ ] Node.js 16+ installed
- [ ] npm 7+ installed
- [ ] All Python packages installed
- [ ] All npm packages installed
- [ ] Backend starting on port 8001
- [ ] Frontend running on port 3000
- [ ] Browser opens to http://127.0.0.1:3000
- [ ] API docs work at http://127.0.0.1:8001/docs
- [ ] No errors in browser console (F12)
- [ ] No errors in terminal

---

**Everything is ready! Your application is fully configured and ready to run.** 🎉

