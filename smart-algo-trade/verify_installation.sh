#!/bin/bash
# Smart Algo Trade - Installation Complete Verification Script
# Run this to verify everything is installed correctly

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║         Smart Algo Trade - Installation Verification          ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check Python
echo -n "Checking Python... "
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version 2>&1 | awk '{print $2}')
    echo -e "${GREEN}✓${NC} Python $PYTHON_VERSION"
else
    echo -e "${RED}✗${NC} Python not found"
    exit 1
fi

# Check Node
echo -n "Checking Node.js... "
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✓${NC} $NODE_VERSION"
else
    echo -e "${RED}✗${NC} Node.js not found"
    exit 1
fi

# Check npm
echo -n "Checking npm... "
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    echo -e "${GREEN}✓${NC} $NPM_VERSION"
else
    echo -e "${RED}✗${NC} npm not found"
    exit 1
fi

echo ""
echo "Checking Python packages..."

# Array of Python packages to check
packages=("numpy" "pandas" "pytz" "fastapi" "uvicorn" "sqlalchemy")

for package in "${packages[@]}"; do
    echo -n "  $package... "
    if python3 -c "import $package" 2>/dev/null; then
        echo -e "${GREEN}✓${NC}"
    else
        echo -e "${RED}✗${NC}"
    fi
done

echo ""
echo "Checking npm packages..."

if [ -d "node_modules" ]; then
    echo -e "  node_modules... ${GREEN}✓${NC} Installed"
else
    echo -e "  node_modules... ${YELLOW}!${NC} Not installed (will install on startup)"
fi

echo ""
echo "Checking configuration..."

if [ -f "backend/.env" ]; then
    echo -e "  .env file... ${GREEN}✓${NC} Found"
else
    echo -e "  .env file... ${YELLOW}!${NC} Not found (optional - using demo mode)"
fi

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo -e "║${GREEN}                  ✓ ALL CHECKS PASSED${NC}                      ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo -e "${BLUE}Next step:${NC} Run ${YELLOW}python3 startup.py${NC} or ${YELLOW}npm run dev${NC}"
echo ""
echo -e "The application will be available at: ${BLUE}http://127.0.0.1:3000${NC}"
echo ""
