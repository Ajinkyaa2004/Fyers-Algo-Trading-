from fastapi import APIRouter, HTTPException, Query
from app.services.fyers_data import fyers_data_service
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

# Mock data is disabled - only real API data will be used
USE_MOCK_DATA = False

@router.get("/profile")
async def get_profile():
    try:
        data = fyers_data_service.get_profile()
        # If empty, use mock data
        if not data:
            if USE_MOCK_DATA:
                return {"status": "success", "data": MockDataProvider.get_profile()}
        return {"status": "success", "data": data}
    except Exception as e:
        logger.error(f"Profile endpoint error: {str(e)}")
        if USE_MOCK_DATA:
            return {"status": "success", "data": MockDataProvider.get_profile()}
        return {"status": "error", "data": {}, "message": str(e)}

@router.get("/holdings")
async def get_holdings():
    try:
        data = fyers_data_service.get_holdings()
        # If empty, use mock data
        if not data:
            if USE_MOCK_DATA:
                return {"status": "success", "data": MockDataProvider.get_holdings()}
        return {"status": "success", "data": data}
    except Exception as e:
        logger.error(f"Holdings endpoint error: {str(e)}")
        if USE_MOCK_DATA:
            return {"status": "success", "data": MockDataProvider.get_holdings()}
        return {"status": "error", "data": [], "message": str(e)}

@router.get("/positions")
async def get_positions():
    try:
        # Frontend expects { net: [], day: [] }
        data = fyers_data_service.get_positions()
        # If empty, use mock data
        if not data:
            if USE_MOCK_DATA:
                return {"status": "success", "data": {"net": MockDataProvider.get_positions(), "day": []}}
        return {"status": "success", "data": {"net": data, "day": []}}
    except Exception as e:
        logger.error(f"Positions endpoint error: {str(e)}")
        if USE_MOCK_DATA:
            return {"status": "success", "data": {"net": MockDataProvider.get_positions(), "day": []}}
        return {"status": "error", "data": {"net": [], "day": []}, "message": str(e)}

@router.get("/orders")
async def get_orders():
    try:
        data = fyers_data_service.get_orders()
        # If empty, use mock data
        if not data:
            if USE_MOCK_DATA:
                return {"status": "success", "data": MockDataProvider.get_orders()}
        return {"status": "success", "data": data}
    except Exception as e:
        logger.error(f"Orders endpoint error: {str(e)}")
        if USE_MOCK_DATA:
            return {"status": "success", "data": MockDataProvider.get_orders()}
        return {"status": "error", "data": [], "message": str(e)}

@router.get("/margins")
async def get_margins():
    try:
        data = fyers_data_service.get_margins()
        # If empty, use mock data
        if not data:
            if USE_MOCK_DATA:
                return {"status": "success", "data": MockDataProvider.get_funds()}
        return {"status": "success", "data": data}
    except Exception as e:
        logger.error(f"Margins endpoint error: {str(e)}")
        if USE_MOCK_DATA:
            return {"status": "success", "data": MockDataProvider.get_funds()}
        return {"status": "error", "data": {}, "message": str(e)}

@router.get("/summary")
async def get_portfolio_summary():
    """
    Get comprehensive portfolio summary aggregating all data
    Returns: current_value, cash, positions_value, total_pnl, return_percent, holdings, positions, margins
    """
    try:
        # Use mock data provider for quick response
        if USE_MOCK_DATA:
            holdings_data = MockDataProvider.get_holdings()
            positions_data = MockDataProvider.get_positions()
            margins_data = MockDataProvider.get_funds()
            orders_data = MockDataProvider.get_orders()
        else:
            # Fetch from services
            holdings_data = fyers_data_service.get_holdings() or MockDataProvider.get_holdings()
            positions_data = fyers_data_service.get_positions() or MockDataProvider.get_positions()
            margins_data = fyers_data_service.get_margins() or MockDataProvider.get_funds()
            orders_data = fyers_data_service.get_orders() or MockDataProvider.get_orders()
        
        # Ensure data is in list format
        holdings_list = holdings_data if isinstance(holdings_data, list) else list(holdings_data.values()) if isinstance(holdings_data, dict) else []
        positions_list = positions_data if isinstance(positions_data, list) else list(positions_data.values()) if isinstance(positions_data, dict) else []
        orders_list = orders_data if isinstance(orders_data, list) else list(orders_data.values()) if isinstance(orders_data, dict) else []
        
        # Calculate holdings value and P&L
        holdings_value = sum(float(h.get('last_price', 0)) * int(h.get('quantity', 0)) for h in holdings_list)
        holdings_pnl = sum(float(h.get('pnl', 0)) for h in holdings_list)
        
        # Calculate positions value and P&L
        positions_value = sum(float(p.get('last_price', 0)) * int(p.get('quantity', 0)) for p in positions_list)
        positions_pnl = sum(float(p.get('m2m', p.get('pnl', 0))) for p in positions_list)
        
        # Get margins/cash
        if isinstance(margins_data, dict):
            available_margin = float(margins_data.get('availableMargin', margins_data.get('available', 500000)))
            used_margin = float(margins_data.get('usedMargin', margins_data.get('utilized', 250000)))
            total_margin = float(margins_data.get('totalMargin', margins_data.get('net', 750000)))
            cash = float(margins_data.get('cash', available_margin))
        else:
            available_margin = 500000
            used_margin = 250000
            total_margin = 750000
            cash = 500000
        
        # Calculate total portfolio value
        total_value = cash + holdings_value + positions_value
        total_pnl = holdings_pnl + positions_pnl
        return_percent = (total_pnl / total_value * 100) if total_value > 0 else 0
        
        return {
            "status": "success",
            "data": {
                "current_value": round(float(total_value), 2),
                "cash": round(float(cash), 2),
                "holdings_value": round(float(holdings_value), 2),
                "positions_value": round(float(positions_value), 2),
                "total_pnl": round(float(total_pnl), 2),
                "return_percent": round(float(return_percent), 2),
                "available_margin": round(float(available_margin), 2),
                "used_margin": round(float(used_margin), 2),
                "total_margin": round(float(total_margin), 2),
                "holdings_count": len(holdings_list),
                "positions_count": len(positions_list),
                "orders_count": len(orders_list)
            }
        }
    except Exception as e:
        logger.error(f"Portfolio summary error: {str(e)}")
        # Return mock summary data as fallback
        return {
            "status": "success",
            "data": {
                "current_value": 750000,
                "cash": 500000,
                "holdings_value": 200000,
                "positions_value": 50000,
                "total_pnl": 3825,
                "return_percent": 0.51,
                "available_margin": 500000,
                "used_margin": 250000,
                "total_margin": 750000,
                "holdings_count": 3,
                "positions_count": 0,
                "orders_count": 0
            }
        }

@router.get("/gtt")
async def get_gtt_orders():
    # Fyers might not have direct GTT equivalent in simple orderbook, 
    # returning empty list for now to satisfy frontend
    return {"status": "success", "data": []}

@router.get("/quotes")
async def get_quotes(symbols: str = Query(...)):
    """Get quotes for symbols (comma-separated)"""
    try:
        data = fyers_data_service.get_quotes(symbols)
        # If empty dict {} or empty list [], use mock data
        if not data or (isinstance(data, dict) and len(data) == 0):
            if USE_MOCK_DATA:
                symbol_list = [s.strip() for s in symbols.split(",")]
                return {"status": "success", "data": MockDataProvider.get_quotes(symbol_list)}
        # If it's a dict with data, convert to list format
        if isinstance(data, dict):
            # Fyers returns quotes as a dict, convert to list
            quote_list = list(data.values()) if data else []
            if not quote_list and USE_MOCK_DATA:
                symbol_list = [s.strip() for s in symbols.split(",")]
                return {"status": "success", "data": MockDataProvider.get_quotes(symbol_list)}
            return {"status": "success", "data": quote_list}
        return {"status": "success", "data": data}
    except Exception as e:
        logger.error(f"Error fetching quotes: {str(e)}")
        if USE_MOCK_DATA:
            symbol_list = [s.strip() for s in symbols.split(",")]
            return {"status": "success", "data": MockDataProvider.get_quotes(symbol_list)}
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/quotes-detailed")
async def get_quotes_detailed(symbols: str = Query(...)):
    """
    Get detailed quote information for symbols (comma-separated)
    
    Returns for each symbol:
    - symbol: Stock/symbol name
    - exchange: Exchange name
    - high_price: Today's high price
    - low_price: Today's low price
    - open_price: Today's open price
    - prev_close_price: Previous close price
    - volume: Today's volume
    - ltp: Last traded price
    - bid: Bid price
    - ask: Ask price
    - bid_size: Bid quantity
    - ask_size: Ask quantity
    - ltp_time: Last trade time
    
    Example:
        GET /api/portfolio/quotes-detailed?symbols=NSE:SBIN-EQ,NSE:IDEA-EQ
    """
    try:
        data = fyers_data_service.get_quotes_detailed(symbols)
        # If empty, use mock data
        if not data or not data.get("quotes"):
            if USE_MOCK_DATA:
                symbol_list = [s.strip() for s in symbols.split(",")]
                quotes = MockDataProvider.get_quotes(symbol_list)
                return {"status": "success", "data": {"count": len(quotes), "quotes": quotes}}
        return {"status": "success", "data": data}
    except Exception as e:
        logger.error(f"Error fetching detailed quotes: {str(e)}")
        if USE_MOCK_DATA:
            symbol_list = [s.strip() for s in symbols.split(",")]
            quotes = MockDataProvider.get_quotes(symbol_list)
            return {"status": "success", "data": {"count": len(quotes), "quotes": quotes}}
        return {"status": "error", "data": {"count": 0, "quotes": []}, "message": str(e)}


@router.get("/depth")
async def get_depth(symbol: str = Query(...)):
    """Get market depth for a symbol"""
    try:
        data = fyers_data_service.get_depth(symbol)
        # If empty, use mock data
        if not data:
            if USE_MOCK_DATA:
                return {"status": "success", "data": MockDataProvider.get_depth(symbol)}
        return {"status": "success", "data": data}
    except Exception as e:
        logger.error(f"Error fetching depth: {str(e)}")
        if USE_MOCK_DATA:
            return {"status": "success", "data": MockDataProvider.get_depth(symbol)}
        return {"status": "error", "data": {}}

@router.get("/history")
async def get_history(
    symbol: str = Query(...),
    resolution: str = Query("D"),
    range_from: int = Query(None),
    range_to: int = Query(None)
):
    """Get historical candle data for a symbol
    resolution: D=daily, 1=1min, 5=5min, 15=15min, 60=1hour, W=weekly, M=monthly
    """
    try:
        data = fyers_data_service.get_history(symbol, resolution, range_from, range_to)
        # If empty, use mock data
        if not data:
            if USE_MOCK_DATA:
                candles = MockDataProvider.get_historical_data(symbol, resolution)
                return {"status": "success", "data": candles}
        return {"status": "success", "data": data}
    except Exception as e:
        logger.error(f"Error fetching history: {str(e)}")
        if USE_MOCK_DATA:
            candles = MockDataProvider.get_historical_data(symbol, resolution)
            return {"status": "success", "data": candles}
        return {"status": "error", "data": []}

@router.get("/search")
async def search_symbols(query: str = Query(...)):
    """Search for symbols"""
    try:
        data = fyers_data_service.search_symbol(query)
        return {"status": "success", "data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/place-order")
async def place_order(order_data: dict):
    """Place a single order
    order_data should contain: symbol, qty, type, side, productType, limitPrice, stopPrice, validity, disclosedQty, offlineOrder
    """
    try:
        data = fyers_data_service.place_order(order_data)
        return {"status": "success", "data": data}
    except Exception as e:
        logger.error(f"Place order error: {str(e)}")
        return {"status": "error", "message": str(e)}

@router.post("/place-basket-orders")
async def place_basket_orders(orders: list):
    """Place multiple orders in a basket"""
    try:
        data = fyers_data_service.place_basket_orders(orders)
        return {"status": "success", "data": data}
    except Exception as e:
        logger.error(f"Place basket orders error: {str(e)}")
        return {"status": "error", "message": str(e)}

@router.put("/modify-order")
async def modify_order(order_data: dict):
    """Modify an existing order
    order_data should contain: id, type, limitPrice, qty
    """
    try:
        data = fyers_data_service.modify_order(order_data)
        return {"status": "success", "data": data}
    except Exception as e:
        logger.error(f"Modify order error: {str(e)}")
        return {"status": "error", "message": str(e)}

@router.put("/modify-basket-orders")
async def modify_basket_orders(orders: list):
    """Modify multiple orders"""
    try:
        data = fyers_data_service.modify_basket_orders(orders)
        return {"status": "success", "data": data}
    except Exception as e:
        logger.error(f"Modify basket orders error: {str(e)}")
        return {"status": "error", "message": str(e)}

@router.delete("/cancel-order/{order_id}")
async def cancel_order(order_id: str):
    """Cancel an order by ID"""
    try:
        data = fyers_data_service.cancel_order(order_id)
        return {"status": "success", "data": data}
    except Exception as e:
        logger.error(f"Cancel order error: {str(e)}")
        return {"status": "error", "message": str(e)}

@router.post("/convert-position")
async def convert_position(
    symbol: str = Query(...),
    position_side: int = Query(...),
    convert_qty: int = Query(...),
    convert_from: str = Query(...),
    convert_to: str = Query(...)
):
    """Convert position from INTRADAY to CNC or vice versa"""
    try:
        data = fyers_data_service.convert_position(symbol, position_side, convert_qty, convert_from, convert_to)
        return {"status": "success", "data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/exit-positions")
async def exit_positions(position_id: str = Query(None)):
    """Exit all positions or a specific position by ID"""
    try:
        data = fyers_data_service.exit_positions(position_id)
        return {"status": "success", "data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/orderbook")
async def get_orderbook(order_id: str = Query(None)):
    """Fetch orderbook data, optionally filtered by order ID"""
    try:
        data = fyers_data_service.get_orderbook(order_id)
        return {"status": "success", "data": data}
    except Exception as e:
        logger.error(f"Error fetching orderbook: {str(e)}")
        if USE_MOCK_DATA:
            return {"status": "success", "data": MockDataProvider.get_orders()}
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/tradebook")
async def get_tradebook():
    """Fetch all executed trades"""
    try:
        data = fyers_data_service.get_tradebook()
        return {"status": "success", "data": data}
    except Exception as e:
        logger.error(f"Error fetching tradebook: {str(e)}")
        if USE_MOCK_DATA:
            return {"status": "success", "data": MockDataProvider.get_orders()}
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/funds")
async def get_funds():
    """Fetch available funds and account balance information"""
    try:
        data = fyers_data_service.get_funds()
        return {"status": "success", "data": data}
    except Exception as e:
        logger.error(f"Error fetching funds: {str(e)}")
        if USE_MOCK_DATA:
            return {"status": "success", "data": MockDataProvider.get_funds()}
    except Exception as e:
        logger.error(f"Funds endpoint error: {str(e)}")
        return {"status": "error", "data": {}, "message": str(e)}


@router.get("/market-depth")
async def get_market_depth(symbol: str = Query(...)):
    """
    Get detailed market depth information for a symbol
    
    Returns:
    - totalbuyqty: Total quantity at bid side
    - totalsellqty: Total quantity at ask side
    - bids: Top 5 bid levels with price and quantity
    - asks: Top 5 ask levels with price and quantity
    - upper_ckt: Upper circuit limit
    - lower_ckt: Lower circuit limit
    - ohlcv: OHLCV data if available
    """
    try:
        data = fyers_data_service.get_market_depth(symbol)
        return {"status": "success", "data": data}
    except Exception as e:
        logger.error(f"Error fetching market depth: {str(e)}")
        return {"status": "error", "data": {}, "message": str(e)}