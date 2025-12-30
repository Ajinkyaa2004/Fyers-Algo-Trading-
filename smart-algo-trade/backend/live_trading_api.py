# Live Trading API Integration
# Flask endpoints for live market order execution
# Connects to LiveTradingEngine for real-time price-based execution

from flask import Blueprint, request, jsonify
from decimal import Decimal
from datetime import datetime
import asyncio
from typing import Dict, Any

# Import trading engine
from live_market_trading import (
    LiveTradingEngine,
    LivePriceStream,
    PriceQuote,
    OrderStatus,
    on_price_update
)

# ============================================================================
# INITIALIZATION
# ============================================================================

# Global instances (in production, use dependency injection)
price_stream = LivePriceStream()
trading_engine = None  # Initialized on app startup

def init_live_trading(app, initial_balance: Decimal = Decimal('500000')):
    """
    Initialize live trading engine on app startup.
    
    Args:
        app: Flask app instance
        initial_balance: Wallet starting balance
    """
    global trading_engine
    
    @app.before_first_request
    async def startup():
        global trading_engine
        trading_engine = LiveTradingEngine(initial_balance, price_stream)
        await price_stream.connect_to_market_feed(None)  # Connect to Fyers
        print("✅ Live trading engine initialized")
    
    return app


# ============================================================================
# BLUEPRINT
# ============================================================================

live_trading_bp = Blueprint('live_trading', __name__, url_prefix='/api/live-trading')


# ============================================================================
# MARKET BUY ORDER
# ============================================================================

@live_trading_bp.route('/buy', methods=['POST'])
async def execute_buy_order():
    """
    Execute market BUY order at current live price.
    
    Request body:
    {
        "symbol": "NSE:SBIN-EQ",
        "quantity": 100,
        "stop_loss_price": 549.50,    (optional)
        "take_profit_price": 560.00   (optional)
    }
    
    Response:
    {
        "success": true,
        "message": "✅ BUY EXECUTED: 100 NSE:SBIN-EQ @ ₹550.00 ...",
        "order": {
            "order_id": "BUY-1",
            "symbol": "NSE:SBIN-EQ",
            "quantity": 100,
            "executed_price": 550.00,
            "timestamp": "2024-12-29T10:30:45.123456",
            "commission": 27.50
        }
    }
    """
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data.get('symbol') or not data.get('quantity'):
            return jsonify({
                'success': False,
                'message': '❌ Missing required fields: symbol, quantity'
            }), 400
        
        # Parse optional risk management parameters
        stop_loss = None
        take_profit = None
        
        if data.get('stop_loss_price'):
            stop_loss = Decimal(str(data['stop_loss_price']))
        if data.get('take_profit_price'):
            take_profit = Decimal(str(data['take_profit_price']))
        
        # Execute market buy
        success, msg, order = await trading_engine.market_buy(
            symbol=data['symbol'],
            quantity=int(data['quantity']),
            stop_loss_price=stop_loss,
            take_profit_price=take_profit
        )
        
        response = {
            'success': success,
            'message': msg
        }
        
        # Include order details if successful
        if success and order:
            response['order'] = {
                'order_id': order.order_id,
                'symbol': order.symbol,
                'quantity': order.quantity,
                'executed_price': float(order.executed_price),
                'timestamp': order.executed_timestamp.isoformat(),
                'commission': float(order.commission)
            }
        
        return jsonify(response), 200 if success else 400
    
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'❌ Error: {str(e)}'
        }), 500


# ============================================================================
# MARKET SELL ORDER
# ============================================================================

@live_trading_bp.route('/sell', methods=['POST'])
async def execute_sell_order():
    """
    Execute market SELL order at current live price.
    
    Request body:
    {
        "symbol": "NSE:SBIN-EQ",
        "quantity": 100
    }
    
    Response:
    {
        "success": true,
        "message": "✅ SELL EXECUTED: 100 NSE:SBIN-EQ @ ₹560.00 | P&L: ₹1000.00 (1.82%)",
        "order": {
            "order_id": "SELL-1",
            "symbol": "NSE:SBIN-EQ",
            "quantity": 100,
            "executed_price": 560.00,
            "timestamp": "2024-12-29T10:35:20.654321",
            "commission": 28.00
        }
    }
    """
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data.get('symbol') or not data.get('quantity'):
            return jsonify({
                'success': False,
                'message': '❌ Missing required fields: symbol, quantity'
            }), 400
        
        # Execute market sell
        success, msg, order = await trading_engine.market_sell(
            symbol=data['symbol'],
            quantity=int(data['quantity'])
        )
        
        response = {
            'success': success,
            'message': msg
        }
        
        if success and order:
            response['order'] = {
                'order_id': order.order_id,
                'symbol': order.symbol,
                'quantity': order.quantity,
                'executed_price': float(order.executed_price),
                'timestamp': order.executed_timestamp.isoformat(),
                'commission': float(order.commission)
            }
        
        return jsonify(response), 200 if success else 400
    
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'❌ Error: {str(e)}'
        }), 500


# ============================================================================
# PORTFOLIO P&L SUMMARY
# ============================================================================

@live_trading_bp.route('/portfolio', methods=['GET'])
async def get_portfolio_summary():
    """
    Get complete portfolio P&L summary.
    
    Returns:
    {
        "portfolio_value": 525000.00,
        "wallet_balance": 450000.00,
        "total_realized_pnl": 10000.00,
        "total_unrealized_pnl": 65000.00,
        "total_pnl": 75000.00,
        "total_pnl_percent": 15.00,
        "active_positions_count": 3,
        "order_count": 12,
        "positions": {
            "NSE:SBIN-EQ": {
                "quantity": 100,
                "avg_buy_price": 550.00,
                "current_price": 560.00,
                "unrealized_pnl": 1000.00,
                "unrealized_pnl_percent": 1.82
            }
        }
    }
    """
    try:
        pnl = await trading_engine.get_portfolio_pnl()
        return jsonify(pnl), 200
    
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'❌ Error: {str(e)}'
        }), 500


# ============================================================================
# ORDER HISTORY
# ============================================================================

@live_trading_bp.route('/orders', methods=['GET'])
async def get_orders():
    """
    Get order execution history.
    
    Query parameters:
        - symbol (optional): Filter by symbol
    
    Returns:
    [
        {
            "order_id": "BUY-1",
            "symbol": "NSE:SBIN-EQ",
            "type": "MARKET_BUY",
            "quantity": 100,
            "executed_price": 550.00,
            "timestamp": "2024-12-29T10:30:45.123456",
            "commission": 27.50,
            "status": "EXECUTED"
        }
    ]
    """
    try:
        symbol = request.args.get('symbol')
        orders = trading_engine.get_order_history(symbol)
        return jsonify({'orders': orders, 'total': len(orders)}), 200
    
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'❌ Error: {str(e)}'
        }), 500


# ============================================================================
# ACTIVE POSITIONS
# ============================================================================

@live_trading_bp.route('/positions', methods=['GET'])
async def get_positions():
    """
    Get all active trading positions.
    
    Returns:
    [
        {
            "symbol": "NSE:SBIN-EQ",
            "quantity": 100,
            "avg_buy_price": 550.00,
            "total_cost": 55000.00
        }
    ]
    """
    try:
        positions = trading_engine.get_active_positions()
        return jsonify({'positions': positions, 'total': len(positions)}), 200
    
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'❌ Error: {str(e)}'
        }), 500


# ============================================================================
# RISK MANAGEMENT ORDERS
# ============================================================================

@live_trading_bp.route('/risk-orders', methods=['GET'])
async def get_risk_orders():
    """
    Get all active stop-loss and take-profit orders.
    
    Returns:
    {
        "stop_losses": {
            "NSE:SBIN-EQ": [
                {
                    "trigger_price": 545.00,
                    "quantity": 100
                }
            ]
        },
        "take_profits": {
            "NSE:SBIN-EQ": [
                {
                    "trigger_price": 560.00,
                    "quantity": 100
                }
            ]
        }
    }
    """
    try:
        risk_orders = trading_engine.get_risk_orders()
        return jsonify(risk_orders), 200
    
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'❌ Error: {str(e)}'
        }), 500


# ============================================================================
# PRICE STREAM UPDATE (WebSocket integration point)
# ============================================================================

@live_trading_bp.route('/update-price', methods=['POST'])
async def update_price():
    """
    Receive real-time price update from market data source.
    
    This endpoint should be called by your WebSocket handler
    whenever a price tick arrives from Fyers API.
    
    Request body:
    {
        "symbol": "NSE:SBIN-EQ",
        "bid_price": 549.50,
        "ask_price": 550.00,
        "last_price": 549.75,
        "volume": 100000
    }
    
    Response:
    {
        "success": true,
        "message": "Price updated",
        "risk_orders_executed": []
    }
    """
    try:
        data = request.get_json()
        
        # Create price quote from incoming data
        quote = PriceQuote(
            symbol=data['symbol'],
            bid_price=Decimal(str(data['bid_price'])),
            ask_price=Decimal(str(data['ask_price'])),
            last_price=Decimal(str(data['last_price'])),
            volume=int(data.get('volume', 0)),
            timestamp=datetime.now()
        )
        
        # Update price stream (notifies subscribers)
        await price_stream.update_price(data['symbol'], quote)
        
        # Trigger risk order checks (stop-loss, take-profit)
        await on_price_update(trading_engine, data['symbol'], quote)
        
        return jsonify({
            'success': True,
            'message': 'Price updated'
        }), 200
    
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'❌ Error: {str(e)}'
        }), 500


# ============================================================================
# HEALTH CHECK
# ============================================================================

@live_trading_bp.route('/health', methods=['GET'])
async def health_check():
    """Check if live trading engine is operational"""
    return jsonify({
        'status': 'healthy',
        'engine_ready': trading_engine is not None,
        'price_stream_connected': price_stream.is_connected(),
        'timestamp': datetime.now().isoformat()
    }), 200


# ============================================================================
# INTEGRATION WITH FLASK APP
# ============================================================================

def register_live_trading_routes(app):
    """Register all live trading routes with Flask app"""
    app.register_blueprint(live_trading_bp)
    init_live_trading(app)
    print("✅ Live trading routes registered")
    return app
