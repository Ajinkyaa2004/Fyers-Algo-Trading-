#!/usr/bin/env python3
"""
Smart Algo Trade - Full System Verification & Startup
This script checks all dependencies and starts the application
"""

import subprocess
import sys
import os
import time
import webbrowser
from pathlib import Path

# Colors for output
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    END = '\033[0m'

def print_header(text):
    print(f"\n{Colors.BLUE}{'='*60}{Colors.END}")
    print(f"{Colors.BLUE}{text.center(60)}{Colors.END}")
    print(f"{Colors.BLUE}{'='*60}{Colors.END}\n")

def print_success(text):
    print(f"{Colors.GREEN}✓ {text}{Colors.END}")

def print_error(text):
    print(f"{Colors.RED}✗ {text}{Colors.END}")

def print_info(text):
    print(f"{Colors.YELLOW}ℹ {text}{Colors.END}")

def check_python():
    """Check Python version"""
    print_header("Checking Python Environment")
    
    version = sys.version_info
    if version.major >= 3 and version.minor >= 8:
        print_success(f"Python {version.major}.{version.minor}.{version.micro} found")
        return True
    else:
        print_error(f"Python 3.8+ required, found {version.major}.{version.minor}")
        return False

def check_node():
    """Check Node.js installation"""
    try:
        result = subprocess.run(["node", "--version"], capture_output=True, text=True)
        version = result.stdout.strip()
        print_success(f"Node.js {version} found")
        return True
    except FileNotFoundError:
        print_error("Node.js not found. Install from https://nodejs.org/")
        return False

def check_npm():
    """Check npm installation"""
    try:
        result = subprocess.run(["npm", "--version"], capture_output=True, text=True)
        version = result.stdout.strip()
        print_success(f"npm {version} found")
        return True
    except FileNotFoundError:
        print_error("npm not found")
        return False

def check_python_packages():
    """Check required Python packages"""
    print_header("Checking Python Packages")
    
    required = [
        "fastapi", "uvicorn", "sqlalchemy", "pydantic",
        "requests", "numpy", "pandas", "pytz"
    ]
    
    missing = []
    for package in required:
        try:
            __import__(package.replace("-", "_"))
            print_success(f"{package} installed")
        except ImportError:
            print_error(f"{package} NOT installed")
            missing.append(package)
    
    return len(missing) == 0, missing

def install_backend_dependencies():
    """Install Python backend dependencies"""
    print_header("Installing Backend Dependencies")
    
    backend_path = Path("backend")
    if not backend_path.exists():
        print_error("backend/ folder not found")
        return False
    
    requirements_file = backend_path / "requirements.txt"
    if not requirements_file.exists():
        print_error("requirements.txt not found")
        return False
    
    try:
        print_info(f"Installing from {requirements_file}...")
        result = subprocess.run(
            [sys.executable, "-m", "pip", "install", "-r", str(requirements_file), "-q"],
            capture_output=True,
            text=True,
            timeout=180
        )
        if result.returncode == 0:
            print_success("Backend dependencies installed")
            return True
        else:
            print_error(f"pip install failed: {result.stderr}")
            return False
    except subprocess.TimeoutExpired:
        print_error("Installation timeout (too long)")
        return False
    except Exception as e:
        print_error(f"Installation error: {str(e)}")
        return False

def install_frontend_dependencies():
    """Install npm dependencies"""
    print_header("Installing Frontend Dependencies")
    
    if not Path("package.json").exists():
        print_error("package.json not found")
        return False
    
    try:
        print_info("Running npm install...")
        result = subprocess.run(
            ["npm", "install", "-q"],
            capture_output=True,
            text=True,
            timeout=300
        )
        if result.returncode == 0:
            print_success("Frontend dependencies installed")
            return True
        else:
            print_error(f"npm install failed: {result.stderr}")
            return False
    except subprocess.TimeoutExpired:
        print_error("Installation timeout (too long)")
        return False
    except Exception as e:
        print_error(f"Installation error: {str(e)}")
        return False

def check_env_file():
    """Check for .env configuration"""
    print_header("Checking Configuration")
    
    env_file = Path("backend/.env")
    if env_file.exists():
        print_success(".env file found - Using live credentials")
        return True
    else:
        print_info(".env not found - Running in demo mode")
        print_info("Create backend/.env to enable live trading")
        return True

def start_servers():
    """Start both backend and frontend servers"""
    print_header("Starting Servers")
    
    # Start backend
    print_info("Starting Backend (port 8001)...")
    backend_process = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "main:app", "--reload", "--host", "127.0.0.1", "--port", "8001"],
        cwd="backend",
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE
    )
    
    time.sleep(2)  # Wait for backend to start
    
    # Start frontend
    print_info("Starting Frontend (port 3000)...")
    frontend_process = subprocess.Popen(
        ["npm", "run", "dev"],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE
    )
    
    time.sleep(3)  # Wait for frontend to start
    
    print_success("Backend running on http://127.0.0.1:8001")
    print_success("Frontend running on http://127.0.0.1:3000")
    print_success("API Docs: http://127.0.0.1:8001/docs")
    
    return backend_process, frontend_process

def main():
    """Main execution"""
    print_header("Smart Algo Trade - Full Startup")
    
    # Change to project directory
    try:
        project_dir = Path(__file__).parent
        os.chdir(project_dir)
    except Exception as e:
        print_error(f"Failed to change directory: {e}")
        return False
    
    # Check prerequisites
    if not check_python():
        return False
    
    if not check_node() or not check_npm():
        return False
    
    # Check and install packages
    packages_ok, missing = check_python_packages()
    if not packages_ok:
        print_info(f"Installing missing packages: {', '.join(missing)}")
        if not install_backend_dependencies():
            print_error("Failed to install backend dependencies")
            return False
    
    if not Path("node_modules").exists():
        if not install_frontend_dependencies():
            print_error("Failed to install frontend dependencies")
            return False
    
    # Check environment
    check_env_file()
    
    # Start servers
    try:
        backend, frontend = start_servers()
        
        print_header("Application Ready!")
        print_success("✓ All systems operational")
        print(f"\n{Colors.BLUE}📊 Access the Application:{Colors.END}")
        print(f"   Frontend: {Colors.GREEN}http://127.0.0.1:3000{Colors.END}")
        print(f"   Backend:  {Colors.GREEN}http://127.0.0.1:8001{Colors.END}")
        print(f"   Docs:     {Colors.GREEN}http://127.0.0.1:8001/docs{Colors.END}")
        
        print(f"\n{Colors.BLUE}💡 Tips:{Colors.END}")
        print("   • Press Ctrl+C to stop all servers")
        print("   • Check terminal output for errors")
        print("   • Press F12 in browser for console")
        
        # Try to open browser
        print("\n" + Colors.YELLOW + "Opening browser..." + Colors.END)
        time.sleep(1)
        webbrowser.open("http://127.0.0.1:3000")
        
        # Keep processes running
        print("\n" + Colors.GREEN + "Servers running. Press Ctrl+C to stop." + Colors.END + "\n")
        backend.wait()
        frontend.wait()
        
    except KeyboardInterrupt:
        print("\n" + Colors.YELLOW + "Shutting down..." + Colors.END)
        backend.terminate()
        frontend.terminate()
        return True
    except Exception as e:
        print_error(f"Error starting servers: {e}")
        return False
    
    return True

if __name__ == "__main__":
    try:
        success = main()
        sys.exit(0 if success else 1)
    except Exception as e:
        print_error(f"Fatal error: {e}")
        sys.exit(1)
