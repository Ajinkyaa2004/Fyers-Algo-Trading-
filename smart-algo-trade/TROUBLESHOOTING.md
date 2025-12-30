# 🔧 Troubleshooting Guide

## Backend Issues

### Issue: `ModuleNotFoundError: No module named 'sqlalchemy'`
**Cause**: Python dependencies not installed
**Solution**:
```bash
cd backend
pip install -r requirements.txt
```

---

### Issue: `DatabaseError: Unable to create database`
**Cause**: Database URL misconfigured
**Solution**:
1. Check `DATABASE_URL` in `.env`
2. Ensure path is writable
3. Try: `DATABASE_URL=sqlite:///./smart_algo_trade.db`

---

### Issue: `ValueError: FYERS_CLIENT_ID not set`
**Cause**: Missing environment variables
**Solution**:
```bash
# Make sure .env exists and has:
FYERS_CLIENT_ID=your_id
FYERS_SECRET_KEY=your_key
```

---

### Issue: Backend starts but /api/auth/login returns 500 error
**Cause**: Fyers service configuration error
**Solution**:
1. Check Fyers credentials in `.env`
2. Verify internet connection
3. Check `backend/logs/` for detailed errors
4. Restart server: `python main.py`

---

### Issue: WebSocket connection fails
**Cause**: Port 8001 already in use or WebSocket not configured
**Solution**:
```bash
# Check what's using port 8001
netstat -ano | findstr :8001  # Windows
lsof -i :8001  # Mac/Linux

# Kill the process or use different port:
# In config.py: BACKEND_PORT = 8002
```

---

### Issue: `TypeError: 'NoneType' object is not subscriptable`
**Cause**: Database model issue
**Solution**:
1. Delete `smart_algo_trade.db`
2. Restart backend to recreate
3. Check model definitions in `app/models.py`

---

### Issue: Logging shows no output
**Cause**: Logger not configured
**Solution**:
```python
# In any backend file:
from app.logger import get_logger
logger = get_logger(__name__)
logger.info("Your message")
```

---

## Frontend Issues

### Issue: `Cannot find module '@context/AppContext'`
**Cause**: Import path error
**Solution**:
- Use: `import { useAppContext } from './context/AppContext';`
- Not: `import { useAppContext } from '@context/AppContext';`

---

### Issue: Toast notifications don't appear
**Cause**: Toaster component not in App
**Solution**:
```tsx
// Already done in App.tsx:
import { Toaster } from 'sonner';
<Toaster position="top-right" richColors />
```

---

### Issue: `useAppContext must be used within AppProvider`
**Cause**: Component used outside AppProvider
**Solution**:
Ensure component is wrapped:
```tsx
// In App.tsx (already done):
<AppProvider>
  <AppContent />
</AppProvider>
```

---

### Issue: WebSocket keeps reconnecting
**Cause**: Server connection unstable
**Solution**:
1. Check backend is running
2. Verify WebSocket URL in component
3. Check browser console for errors
4. Increase `reconnectAttempts` if needed

---

### Issue: API calls timeout
**Cause**: Backend slow or not responding
**Solution**:
1. Check backend is running: `python main.py`
2. Verify backend port: 8001
3. Increase timeout in `api.ts`: `timeout: 60000`

---

### Issue: CORS error in console
**Cause**: Frontend URL not whitelisted
**Solution**:
```python
# In backend/config.py:
ALLOWED_ORIGINS = [
    "http://127.0.0.1:3000",  # Add your frontend URL
    "http://localhost:3000",
]
```

---

### Issue: localStorage cleared on page refresh
**Cause**: Context doesn't persist
**Solution**:
Add to `AppContext.tsx`:
```tsx
// Save on change
useEffect(() => {
  localStorage.setItem('user', JSON.stringify(user));
}, [user]);

// Load on mount
useEffect(() => {
  const saved = localStorage.getItem('user');
  if (saved) setUser(JSON.parse(saved));
}, []);
```

---

### Issue: `npm run dev` fails with Vite error
**Cause**: Dependencies not installed
**Solution**:
```bash
rm -rf node_modules package-lock.json
npm install
npm run dev
```

---

## Integration Issues

### Issue: Login works but portfolio data doesn't load
**Cause**: Portfolio endpoint not implemented
**Solution**:
1. Check `app/api/data.py` has `/portfolio/summary` endpoint
2. Verify endpoint returns proper format
3. Check network tab for actual response

---

### Issue: Strategy creation fails with 422 error
**Cause**: Invalid input data
**Solution**:
```tsx
// Validate before sending:
const response = await apiClient.post('/api/strategy/create', {
  name: 'Strategy Name',  // String required
  strategy_type: 'trend',  // Must be: trend, reversion, scalp, manual
  symbol: 'NIFTY50',      // Valid symbol
  risk_level: 'medium',   // Must be: low, medium, high, custom
  capital: 50000,         // Positive number
  stop_loss: 1.0,         // Positive decimal
  target_profit: 2.0      // Positive decimal
});
```

---

### Issue: Database shows no data after strategy creation
**Cause**: Transaction not committed
**Solution**:
```python
# In strategy.py (should be done):
db.add(strategy)
db.commit()  # Required!
db.refresh(strategy)
```

---

### Issue: Refresh button doesn't update portfolio
**Cause**: Refresh endpoint not calling properly
**Solution**:
```tsx
const { refreshPortfolio } = useAppContext();

const handleRefresh = async () => {
  await refreshPortfolio();
  showToast.success('Portfolio updated');
};
```

---

### Issue: Logout doesn't clear session
**Cause**: Session persists
**Solution**:
```tsx
const { logout } = useAppContext();

const handleLogout = () => {
  logout();  // Clears user, portfolio, and redirects
};
```

---

## Server Connection Issues

### Issue: `Connection refused` when accessing backend
**Cause**: Backend not running
**Solution**:
1. Terminal 1: Start backend
   ```bash
   cd backend
   python main.py
   ```
2. Should see: `INFO: Uvicorn running on http://127.0.0.1:8001`

---

### Issue: Frontend shows "Loading..." forever
**Cause**: Auth check endpoint broken
**Solution**:
1. Check backend is running
2. Visit `http://127.0.0.1:8001/api/auth/status` manually
3. Should return JSON with `is_authenticated` field

---

### Issue: Network tab shows 404 errors
**Cause**: API endpoint doesn't exist
**Solution**:
1. Check endpoint path is correct
2. Verify router registered in `main.py`
3. Check for typos in API paths

---

## Performance Issues

### Issue: App is slow
**Cause**: Too many re-renders or heavy operations
**Solution**:
1. Use React DevTools Profiler
2. Memoize expensive components
3. Check for unnecessary state updates
4. Use `useCallback` for functions

---

### Issue: WebSocket memory leak
**Cause**: Connections not properly closed
**Solution**:
```tsx
// Already handled in useWebSocket.ts:
useEffect(() => {
  return () => {
    if (wsRef.current) {
      wsRef.current.close();  // Cleanup on unmount
    }
  };
}, []);
```

---

### Issue: Database getting too large
**Cause**: Too much historical data
**Solution**:
1. Archive old trades regularly
2. Implement data cleanup policies
3. Consider data compression
4. Split database if > 500MB

---

## Debugging Tips

### Enable Debug Mode
```env
# In .env
DEBUG=True
```

### View Detailed Logs
```bash
# Backend logs appear in console when running:
python main.py
```

### Check Browser Console
- F12 in browser
- Check Console tab for errors
- Check Network tab for API calls
- Check Application tab for localStorage

### View Database Contents
```bash
# Using sqlite3 CLI
sqlite3 smart_algo_trade.db

# View all tables
.tables

# View users
SELECT * FROM users;

# View strategies
SELECT * FROM strategies;
```

### Test API Endpoint Manually
```bash
# Using curl
curl http://127.0.0.1:8001/api/auth/status

# Or use Postman:
# GET http://127.0.0.1:8001/api/auth/status
```

---

## Reset & Restart

### Full Reset
```bash
# 1. Kill both servers (Ctrl+C)
# 2. Delete database
rm backend/smart_algo_trade.db

# 3. Clear cache
rm -rf node_modules/.vite

# 4. Restart
# Terminal 1:
cd backend
python main.py

# Terminal 2:
npm run dev
```

### Reset Database Only
```bash
# Delete database file
rm backend/smart_algo_trade.db

# Restart backend
# Automatically recreates on startup
```

### Clear Frontend Cache
```bash
# Clear browser cache (Ctrl+Shift+Delete)
# Or delete from DevTools Application > Cache Storage
```

---

## Getting Help

1. **Check Logs**
   - Backend: Console output
   - Frontend: Browser console (F12)
   - Database: Check `smart_algo_trade.db` exists

2. **Search Docs**
   - `FIXES_AND_IMPROVEMENTS.md`
   - `QUICK_REFERENCE.md`
   - `INTEGRATION_TASKS.md`

3. **Verify Setup**
   - Run `setup.sh` or `setup.bat`
   - Check `requirements.txt` installed
   - Verify `.env` has credentials

4. **Test Endpoints**
   - Use curl or Postman
   - Check response format
   - Verify status codes

5. **Check Git Status**
   - Ensure all files are in place
   - Check for merge conflicts
   - Verify dependencies installed

---

## Common Fix Commands

```bash
# Reinstall all Python dependencies
pip install -r backend/requirements.txt --upgrade

# Clear Python cache
find . -type d -name __pycache__ -exec rm -r {} +
find . -type f -name "*.pyc" -delete

# Reinstall Node dependencies
rm -rf node_modules package-lock.json
npm install

# Reset everything
rm -rf backend/smart_algo_trade.db
rm -rf node_modules
pip install -r backend/requirements.txt
npm install
```

---

**Last Updated**: 2024
**Version**: 3.0.1
