@echo off
REM This script clears port 8001
taskkill /F /IM python.exe >nul 2>&1
taskkill /F /IM node.exe >nul 2>&1
timeout /t 3
netsh int ipv4 set dyn tcp start=40000 num=25536
timeout /t 2
echo Port 8001 should now be free
pause
