#!/bin/bash
# Setup script for Smart Algo Trade improvements

set -e

echo "🚀 Smart Algo Trade - Setup & Initialization"
echo "=============================================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Step 1: Install Python dependencies
echo -e "${BLUE}[1/5]${NC} Installing Python dependencies..."
cd backend
if [ ! -f "requirements.txt" ]; then
    echo "❌ requirements.txt not found"
    exit 1
fi
pip install -r requirements.txt
echo -e "${GREEN}✓ Python dependencies installed${NC}"

# Step 2: Setup environment variables
echo -e "${BLUE}[2/5]${NC} Setting up environment variables..."
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo -e "${YELLOW}⚠ .env created from template - please update with your credentials${NC}"
    else
        echo "❌ .env.example not found"
        exit 1
    fi
else
    echo "✓ .env already exists"
fi

# Step 3: Initialize database
echo -e "${BLUE}[3/5]${NC} Initializing database..."
python -c "
from database import init_db
init_db()
print('✓ Database initialized')
"

# Step 4: Validate configuration
echo -e "${BLUE}[4/5]${NC} Validating configuration..."
python -c "
from config import settings
settings.validate()
print('✓ Configuration valid')
"

# Step 5: Install Node dependencies
echo -e "${BLUE}[5/5]${NC} Installing Node dependencies..."
cd ..
npm install
echo -e "${GREEN}✓ Node dependencies installed${NC}"

echo ""
echo -e "${GREEN}✅ Setup Complete!${NC}"
echo ""
echo "📝 Next steps:"
echo "1. Update backend/.env with your Fyers credentials"
echo "2. Run 'npm run dev' in one terminal"
echo "3. Run 'python main.py' in backend folder in another terminal"
echo "4. Open http://127.0.0.1:3000 in your browser"
echo ""
