"""
Order Management API
Place and manage trading orders using Fyers API V3

Created By: Aseem Singhal
Fyers API V3
"""

import logging
import datetime
from typing import Optional, Dict, Any
from enum import Enum

from fastapi import APIRouter, Query
from pydantic import BaseModel

# Try to import Fyers API - will fall back gracefully if not available
try:
    from fyers_apiv3 import fyersModel
    FYERS_AVAILABLE = True
except ImportError:
    FYERS_AVAILABLE = False

logger = logging.getLogger(__name__)
router = APIRouter()


# ============================================================================
# Models & Enums
# ============================================================================


class OrderType(str, Enum):
    """Order type enumeration"""
    MARKET = "MARKET"
    LIMIT = "LIMIT"
    SL_LIMIT = "SL-LIMIT"


class OrderSide(str, Enum):
    """Order side enumeration"""
    BUY = "BUY"
    SELL = "SELL"


class BracketOrderRequest(BaseModel):
    """Bracket order request model"""
    symbol: str  # e.g., "NSE:SBIN-EQ"
    side: OrderSide
    quantity: int
    order_type: OrderType
    price: float = 0.0  # For LIMIT orders
    stop_price: float = 0.0  # For SL-LIMIT orders
    stop_loss: float  # Stop loss price
    take_profit: float  # Take profit price


class BracketOrderResponse(BaseModel):
    """Bracket order response model"""
    success: bool
    order_id: Optional[str] = None
    symbol: str
    side: str
    quantity: int
    order_type: str
    stop_loss: float
    take_profit: float
    message: Optional[str] = None
    timestamp: str


# ============================================================================
# Fyers Order Client
# ============================================================================


class FyersOrderClient:
    """Fyers API client for order management"""
    
    def __init__(self):
        self.fyers = None
        self.client_id = None
        self.access_token = None
        self.initialized = False
        self._init_fyers()
    
    def _init_fyers(self):
        """Initialize Fyers API client"""
        if not FYERS_AVAILABLE:
            logger.warning("Fyers API not available. Order operations disabled.")
            return
        
        try:
            from pathlib import Path
            
            # Try to read credentials from files
            client_id_path = Path("client_id.txt")
            access_token_path = Path("access_token.txt")
            
            if client_id_path.exists() and access_token_path.exists():
                self.client_id = client_id_path.read_text().strip()
                self.access_token = access_token_path.read_text().strip()
                
                # Initialize FyersModel
                self.fyers = fyersModel.FyersModel(
                    client_id=self.client_id,
                    is_async=False,
                    token=self.access_token,
                    log_path=""
                )
                self.initialized = True
                logger.info("Fyers Order client initialized successfully")
            else:
                logger.warning("Fyers credentials not found. Order operations disabled.")
        
        except Exception as e:
            logger.error(f"Failed to initialize Fyers Order client: {e}")
    
    def place_bracket_order(
        self,
        symbol: str,
        side: str,
        quantity: int,
        order_type: str,
        stop_loss: float,
        take_profit: float,
        price: float = 0.0,
        stop_price: float = 0.0,
    ) -> Dict[str, Any]:
        """
        Place a bracket order with stop loss and take profit levels
        
        Args:
            symbol: Trading symbol (e.g., 'NSE:SBIN-EQ')
            side: Order side ('BUY' or 'SELL')
            quantity: Order quantity
            order_type: Order type ('MARKET', 'LIMIT', 'SL-LIMIT')
            stop_loss: Stop loss price
            take_profit: Take profit (target) price
            price: Limit price (for LIMIT orders)
            stop_price: Stop price (for SL-LIMIT orders)
        
        Returns:
            Dictionary with order result
        """
        if not self.initialized or not self.fyers:
            return {
                "success": False,
                "message": "Fyers API not initialized",
                "symbol": symbol
            }
        
        try:
            # Get exchange and symbol details
            exch = symbol[:3]
            symb = symbol[4:]
            dt = datetime.datetime.now()
            
            logger.info(f"{dt.hour}:{dt.minute}:{dt.second} => {side} {symb} {quantity} {order_type} @ price={price}")
            
            # Map order type to Fyers format
            order_type_map = {
                "MARKET": 2,
                "LIMIT": 1,
                "SL-LIMIT": 4
            }
            
            type_code = order_type_map.get(order_type, 2)
            
            # Map side to Fyers format
            side_map = {
                "BUY": 1,
                "SELL": -1
            }
            
            side_code = side_map.get(side, 1)
            
            # Handle order type specific parameters
            if order_type == "MARKET":
                price = 0
                stop_price = 0
            elif order_type == "LIMIT":
                stop_price = 0
            elif order_type == "SL-LIMIT":
                pass  # Both price and stop_price are used
            
            # Prepare bracket order data
            order_data = {
                "symbol": symbol,
                "qty": quantity,
                "type": type_code,
                "side": side_code,
                "productType": "BO",  # Bracket Order
                "limitPrice": price,
                "stopPrice": stop_price,
                "validity": "DAY",
                "stopLoss": stop_loss,
                "takeProfit": take_profit
            }
            
            logger.debug(f"Placing bracket order: {order_data}")
            
            # Place the order
            response = self.fyers.place_order(order_data)
            
            logger.info(f"{dt.hour}:{dt.minute}:{dt.second} => {symb} Order placed: {response}")
            
            return {
                "success": True,
                "order_id": response,
                "symbol": symbol,
                "side": side,
                "quantity": quantity,
                "order_type": order_type,
                "stop_loss": stop_loss,
                "take_profit": take_profit,
                "message": f"Order placed successfully",
                "timestamp": dt.isoformat()
            }
        
        except Exception as e:
            logger.error(f"Error placing bracket order: {e}")
            return {
                "success": False,
                "symbol": symbol,
                "message": f"Failed to place order: {str(e)}",
                "timestamp": datetime.datetime.now().isoformat()
            }
    
    def place_simple_order(
        self,
        symbol: str,
        side: str,
        quantity: int,
        order_type: str,
        product_type: str = "INTRADAY",
        price: float = 0.0,
        stop_price: float = 0.0,
    ) -> Dict[str, Any]:
        """
        Place a simple intraday or delivery order
        
        Args:
            symbol: Trading symbol (e.g., 'NSE:SBIN-EQ')
            side: Order side ('BUY' or 'SELL')
            quantity: Order quantity
            order_type: Order type ('MARKET', 'LIMIT', 'SL-LIMIT')
            product_type: Product type ('INTRADAY' or 'DELIVERY')
            price: Limit price (for LIMIT orders)
            stop_price: Stop price (for SL-LIMIT orders)
        
        Returns:
            Dictionary with order result
        """
        if not self.initialized or not self.fyers:
            return {
                "success": False,
                "message": "Fyers API not initialized",
                "symbol": symbol
            }
        
        try:
            exch = symbol[:3]
            symb = symbol[4:]
            dt = datetime.datetime.now()
            
            logger.info(f"{dt.hour}:{dt.minute}:{dt.second} => {side} {symb} {quantity} {order_type} @ price={price}")
            
            # Map order type to Fyers format
            order_type_map = {
                "MARKET": 2,
                "LIMIT": 1,
                "SL-LIMIT": 4
            }
            
            type_code = order_type_map.get(order_type, 2)
            
            # Map side to Fyers format
            side_map = {
                "BUY": 1,
                "SELL": -1
            }
            
            side_code = side_map.get(side, 1)
            
            # Handle order type specific parameters
            if order_type == "MARKET":
                price = 0
                stop_price = 0
            elif order_type == "LIMIT":
                stop_price = 0
            elif order_type == "SL-LIMIT":
                pass  # Both price and stop_price are used
            
            # Prepare order data
            order_data = {
                "symbol": symbol,
                "qty": quantity,
                "type": type_code,
                "side": side_code,
                "productType": product_type,
                "limitPrice": price,
                "stopPrice": stop_price,
                "validity": "DAY",
            }
            
            logger.debug(f"Placing simple order: {order_data}")
            
            # Place the order
            response = self.fyers.place_order(order_data)
            
            logger.info(f"{dt.hour}:{dt.minute}:{dt.second} => {symb} Order placed: {response}")
            
            return {
                "success": True,
                "order_id": response,
                "symbol": symbol,
                "side": side,
                "quantity": quantity,
                "order_type": order_type,
                "product_type": product_type,
                "message": f"Order placed successfully",
                "timestamp": dt.isoformat()
            }
        
        except Exception as e:
            logger.error(f"Error placing simple order: {e}")
            return {
                "success": False,
                "symbol": symbol,
                "message": f"Failed to place order: {str(e)}",
                "timestamp": datetime.datetime.now().isoformat()
            }
    
    def cancel_order(self, order_id: str) -> Dict[str, Any]:
        """
        Cancel an existing order
        
        Args:
            order_id: Order ID to cancel (as string)
        
        Returns:
            Dictionary with cancellation result
        """
        if not self.initialized or not self.fyers:
            return {
                "success": False,
                "message": "Fyers API not initialized",
                "order_id": order_id
            }
        
        try:
            dt = datetime.datetime.now()
            
            # Convert to dictionary format required by Fyers
            order_id_dict = {"id": str(order_id)}
            
            logger.info(f"{dt.hour}:{dt.minute}:{dt.second} => Cancelling order: {order_id}")
            
            # Cancel the order
            response = self.fyers.cancel_order(order_id_dict)
            
            logger.info(f"{dt.hour}:{dt.minute}:{dt.second} => Order cancelled: {response}")
            
            return {
                "success": True,
                "order_id": order_id,
                "response": response,
                "message": "Order cancelled successfully",
                "timestamp": dt.isoformat()
            }
        
        except Exception as e:
            logger.error(f"Error cancelling order: {e}")
            return {
                "success": False,
                "order_id": order_id,
                "message": f"Failed to cancel order: {str(e)}",
                "timestamp": datetime.datetime.now().isoformat()
            }
    
    def modify_order(
        self,
        order_id: str,
        order_type: str,
        quantity: int,
        price: float = 0.0,
        stop_price: float = 0.0,
    ) -> Dict[str, Any]:
        """
        Modify an existing order
        
        Args:
            order_id: Order ID to modify
            order_type: New order type ('MARKET', 'LIMIT', 'SL-LIMIT')
            quantity: New quantity
            price: New limit price (for LIMIT orders)
            stop_price: New stop price (for SL-LIMIT orders)
        
        Returns:
            Dictionary with modification result
        """
        if not self.initialized or not self.fyers:
            return {
                "success": False,
                "message": "Fyers API not initialized",
                "order_id": order_id
            }
        
        try:
            dt = datetime.datetime.now()
            
            logger.info(f"{dt.hour}:{dt.minute}:{dt.second} => Modifying order: {order_id}")
            
            # Map order type to Fyers format
            order_type_map = {
                "MARKET": 2,
                "LIMIT": 1,
                "SL-LIMIT": 4
            }
            
            type_code = order_type_map.get(order_type, 2)
            
            # Handle order type specific parameters
            if order_type == "MARKET":
                price = 0
                stop_price = 0
            elif order_type == "LIMIT":
                stop_price = 0
            elif order_type == "SL-LIMIT":
                pass  # Both price and stop_price are used
            
            # Prepare modification data
            modify_data = {
                "id": str(order_id),
                "type": type_code,
                "limitPrice": price,
                "stopPrice": stop_price,
                "qty": quantity
            }
            
            logger.debug(f"Modifying order with data: {modify_data}")
            
            # Modify the order
            response = self.fyers.modify_order(data=modify_data)
            
            logger.info(f"{dt.hour}:{dt.minute}:{dt.second} => Order modified: {response}")
            
            return {
                "success": True,
                "order_id": order_id,
                "order_type": order_type,
                "quantity": quantity,
                "price": price,
                "response": response,
                "message": "Order modified successfully",
                "timestamp": dt.isoformat()
            }
        
        except Exception as e:
            logger.error(f"Error modifying order: {e}")
            return {
                "success": False,
                "order_id": order_id,
                "message": f"Failed to modify order: {str(e)}",
                "timestamp": datetime.datetime.now().isoformat()
            }


# Initialize order client
fyers_order_client = FyersOrderClient()


# ============================================================================
# API Endpoints
# ============================================================================


@router.post("/bracket-order", response_model=BracketOrderResponse)
async def place_bracket_order_endpoint(request: BracketOrderRequest) -> BracketOrderResponse:
    """
    Place a bracket order with stop loss and take profit
    
    A bracket order combines three orders:
    1. Primary order (BUY or SELL)
    2. Stop loss order (automatic exit on loss)
    3. Take profit order (automatic exit on profit)
    
    Example request:
    {
        "symbol": "NSE:SBIN-EQ",
        "side": "BUY",
        "quantity": 1,
        "order_type": "MARKET",
        "price": 0,
        "stop_price": 0,
        "stop_loss": 500,
        "take_profit": 550
    }
    """
    try:
        result = fyers_order_client.place_bracket_order(
            symbol=request.symbol,
            side=request.side.value,
            quantity=request.quantity,
            order_type=request.order_type.value,
            stop_loss=request.stop_loss,
            take_profit=request.take_profit,
            price=request.price,
            stop_price=request.stop_price,
        )
        
        return BracketOrderResponse(
            success=result.get("success", False),
            order_id=result.get("order_id"),
            symbol=result.get("symbol", request.symbol),
            side=result.get("side", request.side.value),
            quantity=result.get("quantity", request.quantity),
            order_type=result.get("order_type", request.order_type.value),
            stop_loss=request.stop_loss,
            take_profit=request.take_profit,
            message=result.get("message"),
            timestamp=result.get("timestamp", datetime.datetime.now().isoformat())
        )
    
    except Exception as e:
        logger.error(f"Error in bracket order endpoint: {e}")
        return BracketOrderResponse(
            success=False,
            symbol=request.symbol,
            side=request.side.value,
            quantity=request.quantity,
            order_type=request.order_type.value,
            stop_loss=request.stop_loss,
            take_profit=request.take_profit,
            message=str(e),
            timestamp=datetime.datetime.now().isoformat()
        )


@router.get("/order-types")
async def get_order_types():
    """Get list of supported order types"""
    return {
        "order_types": [
            {
                "type": "MARKET",
                "description": "Market order - executes immediately at market price",
                "requires_price": False,
                "requires_stop_price": False
            },
            {
                "type": "LIMIT",
                "description": "Limit order - executes at specified price or better",
                "requires_price": True,
                "requires_stop_price": False
            },
            {
                "type": "SL-LIMIT",
                "description": "Stop-Loss Limit - executes when price touches stop price, then acts as limit order",
                "requires_price": True,
                "requires_stop_price": True
            }
        ]
    }


@router.get("/order-sides")
async def get_order_sides():
    """Get list of supported order sides"""
    return {
        "sides": [
            {
                "side": "BUY",
                "description": "Buy order - increases position"
            },
            {
                "side": "SELL",
                "description": "Sell order - decreases position or goes short"
            }
        ]
    }


@router.get("/bracket-order-info")
async def get_bracket_order_info():
    """Get information about bracket orders"""
    return {
        "bracket_order_info": {
            "description": "Bracket Order (BO) - A combination of three orders",
            "components": [
                {
                    "name": "Primary Order",
                    "description": "Initial BUY or SELL order"
                },
                {
                    "name": "Stop Loss",
                    "description": "Exit order if price moves against you (loss limit)"
                },
                {
                    "name": "Take Profit",
                    "description": "Exit order if price reaches target level (profit target)"
                }
            ],
            "advantages": [
                "Risk is automatically limited by stop loss",
                "Profits can be automatically booked at target",
                "Reduces manual monitoring requirement",
                "Perfect for algorithmic trading"
            ],
            "example": {
                "symbol": "NSE:SBIN-EQ",
                "entry_price": 520,
                "stop_loss": 500,
                "take_profit": 550,
                "risk_per_trade": 20,
                "profit_target": 30,
                "risk_reward_ratio": "1:1.5"
            }
        }
    }


# ============================================================================
# Simple Order Endpoints (INTRADAY/DELIVERY)
# ============================================================================


class SimpleOrderRequest(BaseModel):
    """Simple order request model"""
    symbol: str
    side: OrderSide
    quantity: int
    order_type: OrderType
    product_type: str = "INTRADAY"  # INTRADAY or DELIVERY
    price: float = 0.0
    stop_price: float = 0.0


class SimpleOrderResponse(BaseModel):
    """Simple order response model"""
    success: bool
    order_id: Optional[str] = None
    symbol: str
    side: str
    quantity: int
    order_type: str
    product_type: str
    message: Optional[str] = None
    timestamp: str


@router.post("/place-order", response_model=SimpleOrderResponse)
async def place_simple_order_endpoint(request: SimpleOrderRequest) -> SimpleOrderResponse:
    """
    Place a simple intraday or delivery order
    
    Example request:
    {
        "symbol": "NSE:SBIN-EQ",
        "side": "BUY",
        "quantity": 1,
        "order_type": "MARKET",
        "product_type": "INTRADAY"
    }
    """
    try:
        result = fyers_order_client.place_simple_order(
            symbol=request.symbol,
            side=request.side.value,
            quantity=request.quantity,
            order_type=request.order_type.value,
            product_type=request.product_type,
            price=request.price,
            stop_price=request.stop_price,
        )
        
        return SimpleOrderResponse(
            success=result.get("success", False),
            order_id=result.get("order_id"),
            symbol=result.get("symbol", request.symbol),
            side=result.get("side", request.side.value),
            quantity=result.get("quantity", request.quantity),
            order_type=result.get("order_type", request.order_type.value),
            product_type=result.get("product_type", request.product_type),
            message=result.get("message"),
            timestamp=result.get("timestamp", datetime.datetime.now().isoformat())
        )
    
    except Exception as e:
        logger.error(f"Error in place order endpoint: {e}")
        return SimpleOrderResponse(
            success=False,
            symbol=request.symbol,
            side=request.side.value,
            quantity=request.quantity,
            order_type=request.order_type.value,
            product_type=request.product_type,
            message=str(e),
            timestamp=datetime.datetime.now().isoformat()
        )


@router.post("/cancel-order")
async def cancel_order_endpoint(order_id: str = Query(..., description="Order ID to cancel")):
    """
    Cancel an existing order
    
    Example:
        POST /api/orders/cancel-order?order_id=23091300358683
    """
    try:
        result = fyers_order_client.cancel_order(order_id)
        
        return {
            "success": result.get("success", False),
            "order_id": result.get("order_id"),
            "message": result.get("message"),
            "response": result.get("response"),
            "timestamp": result.get("timestamp")
        }
    
    except Exception as e:
        logger.error(f"Error in cancel order endpoint: {e}")
        return {
            "success": False,
            "order_id": order_id,
            "message": str(e),
            "timestamp": datetime.datetime.now().isoformat()
        }


class ModifyOrderRequest(BaseModel):
    """Modify order request model"""
    order_id: str
    order_type: OrderType
    quantity: int
    price: float = 0.0
    stop_price: float = 0.0


@router.post("/modify-order")
async def modify_order_endpoint(request: ModifyOrderRequest):
    """
    Modify an existing order
    
    Example request:
    {
        "order_id": "23091300358683",
        "order_type": "LIMIT",
        "quantity": 2,
        "price": 550
    }
    """
    try:
        result = fyers_order_client.modify_order(
            order_id=request.order_id,
            order_type=request.order_type.value,
            quantity=request.quantity,
            price=request.price,
            stop_price=request.stop_price,
        )
        
        return {
            "success": result.get("success", False),
            "order_id": result.get("order_id"),
            "order_type": result.get("order_type"),
            "quantity": result.get("quantity"),
            "price": result.get("price"),
            "message": result.get("message"),
            "response": result.get("response"),
            "timestamp": result.get("timestamp")
        }
    
    except Exception as e:
        logger.error(f"Error in modify order endpoint: {e}")
        return {
            "success": False,
            "order_id": request.order_id,
            "message": str(e),
            "timestamp": datetime.datetime.now().isoformat()
        }
