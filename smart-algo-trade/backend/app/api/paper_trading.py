from fastapi import APIRouter, Query
from app.services.paper_trading import paper_trading_service
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/place-order")
async def place_paper_order(
    symbol: str = Query(...),
    quantity: int = Query(...),
    price: float = Query(...),
    side: str = Query(...),  # BUY or SELL
    order_type: str = Query("LIMIT"),
):
    """Place a paper trading order (simulated trading with virtual money)"""
    try:
        result = paper_trading_service.place_order(
            symbol=symbol, quantity=quantity, price=price, side=side, order_type=order_type
        )
        return result
    except Exception as e:
        logger.error(f"Error in paper trading order: {e}")
        return {"success": False, "message": str(e)}


@router.get("/portfolio")
async def get_paper_portfolio():
    """Get paper trading portfolio summary"""
    try:
        portfolio = paper_trading_service.get_portfolio()
        return {"status": "success", "data": portfolio}
    except Exception as e:
        logger.error(f"Error getting paper portfolio: {e}")
        return {"status": "error", "data": {}}


@router.get("/orders")
async def get_paper_orders(limit: int = Query(50)):
    """Get paper trading orders"""
    try:
        orders = paper_trading_service.get_orders(limit)
        return {"status": "success", "data": orders}
    except Exception as e:
        logger.error(f"Error getting paper orders: {e}")
        return {"status": "error", "data": []}


@router.get("/trades")
async def get_paper_trades(limit: int = Query(50)):
    """Get closed paper trading trades (round-trips)"""
    try:
        trades = paper_trading_service.get_trades(limit)
        return {"status": "success", "data": trades}
    except Exception as e:
        logger.error(f"Error getting paper trades: {e}")
        return {"status": "error", "data": []}


@router.get("/history")
async def get_paper_history():
    """Get paper trading historical data"""
    try:
        history = paper_trading_service.get_history()
        return {"status": "success", "data": history}
    except Exception as e:
        logger.error(f"Error getting paper history: {e}")
        return {"status": "error", "data": []}


@router.get("/stats")
async def get_paper_stats():
    """Get paper trading statistics"""
    try:
        stats = paper_trading_service.get_stats()
        return {"status": "success", "data": stats}
    except Exception as e:
        logger.error(f"Error getting paper stats: {e}")
        return {"status": "error", "data": {}}


@router.post("/reset")
async def reset_paper_portfolio():
    """Reset paper trading portfolio to initial state"""
    try:
        result = paper_trading_service.reset_portfolio()
        return result
    except Exception as e:
        logger.error(f"Error resetting paper portfolio: {e}")
        return {"success": False, "message": str(e)}

@router.post("/update-prices")
async def update_position_prices(prices: dict):
    """Update current market prices for all positions
    prices: {symbol: current_price}
    This is used to calculate unrealized P&L in real-time
    """
    try:
        paper_trading_service.update_position_prices(prices)
        portfolio = paper_trading_service.get_portfolio()
        return {"status": "success", "data": portfolio}
    except Exception as e:
        logger.error(f"Error updating prices: {e}")
        return {"status": "error", "message": str(e)}


@router.post("/close-position")
async def close_position(symbol: str = Query(...), current_price: float = Query(...)):
    """Close an open position at current market price
    Automatically calculates P&L based on actual entry vs current price
    """
    try:
        if symbol not in paper_trading_service.data["positions"]:
            return {"success": False, "message": f"No open position in {symbol}"}
        
        position = paper_trading_service.data["positions"][symbol]
        quantity = position["qty"]
        
        # Use close position functionality via sell order
        result = paper_trading_service.place_order(
            symbol=symbol,
            quantity=quantity,
            price=current_price,
            side="SELL"
        )
        
        return result
    except Exception as e:
        logger.error(f"Error closing position: {e}")
        return {"success": False, "message": str(e)}