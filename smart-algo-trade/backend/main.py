from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
from dotenv import load_dotenv
import sys
import logging

# Add the backend directory to the path
sys.path.insert(0, str(Path(__file__).parent))

# Force load env first
env_path = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=env_path, override=True)

from app.api.auth import router as auth_router
from app.api.data import router as data_router
from app.api.market import router as market_router
from app.api.websocket import router as websocket_router
from app.api.order_stream import router as order_stream_router
from app.api.paper_trading import router as paper_trading_router
from app.api.websocket_market import router as websocket_market_router
from app.api.historical_data import router as historical_data_router
from app.api.orders import router as orders_router
from app.api.price_action import router as price_action_router
from app.api.technical_indicators import router as technical_indicators_router
from app.api.automated_trading import router as automated_trading_router
from app.api.websocket_data import router as websocket_data_router
from app.api.options_chain import router as options_chain_router
from app.api.live_trading import router as live_trading_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Smart Algo Trade - Fyers",
    version="3.0.1",
    description="Algorithmic trading system using Fyers API v3"
)

# CORS Setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {
        "status": "ok",
        "message": "Fyers Trading Backend Running",
        "version": "3.0.1",
        "endpoints": {
            "auth": "/api/auth/login",
            "health": "/health",
            "portfolio": "/api/portfolio",
            "market": "/api/market",
            "paper_trading": "/api/paper-trading"
        }
    }

@app.get("/health")
def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "version": "3.0.1"}

# Register routers
app.include_router(auth_router, prefix="/api/auth", tags=["Authentication"])
app.include_router(data_router, prefix="/api/portfolio", tags=["Portfolio"])
app.include_router(market_router, prefix="/api/market", tags=["Market"])
app.include_router(orders_router, prefix="/api/orders", tags=["Orders"])
app.include_router(price_action_router, prefix="/api/patterns", tags=["Price Action Patterns"])
app.include_router(technical_indicators_router, prefix="/api/indicators", tags=["Technical Indicators"])
app.include_router(automated_trading_router, prefix="/api/trading", tags=["Automated Trading"])
app.include_router(websocket_data_router, prefix="/api/websocket", tags=["WebSocket Data Collection"])
app.include_router(options_chain_router, prefix="/api/options", tags=["Options Chain & Analysis"])
app.include_router(paper_trading_router, prefix="/api/paper-trading", tags=["Paper Trading"])
app.include_router(live_trading_router, tags=["Live Trading"])
app.include_router(websocket_router, tags=["WebSocket Streaming"])
app.include_router(order_stream_router, tags=["Order Stream"])
app.include_router(websocket_market_router, tags=["Market Data WebSocket"])
app.include_router(historical_data_router, prefix="/api/portfolio", tags=["Historical Data"])

@app.on_event("startup")
def startup_event():
    """Initialize on startup."""
    logger.info("Application started")

@app.on_event("shutdown")
def shutdown_event():
    """Cleanup on shutdown."""
    logger.info("Application shutdown")
