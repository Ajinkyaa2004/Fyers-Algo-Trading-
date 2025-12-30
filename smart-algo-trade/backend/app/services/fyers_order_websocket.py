"""
Fyers Order WebSocket Service for Real-time Order/Trade/Position Updates
Supports OnOrders, OnTrades, OnPositions, OnGeneral events
"""

import threading
from typing import Dict, List, Callable, Optional, Set
from fyers_apiv3.FyersWebsocket import order_ws
import logging

logger = logging.getLogger(__name__)


class FyersOrderWebSocketService:
    """
    Manages Order WebSocket connections for real-time order/trade/position updates
    Supports: OnOrders, OnTrades, OnPositions, OnGeneral
    """
    
    _instance = None
    _lock = threading.Lock()
    
    def __new__(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
                    cls._instance._initialized = False
        return cls._instance
    
    def __init__(self):
        if self._initialized:
            return
            
        self.access_token = None
        self.websocket = None
        self.is_connected = False
        
        # Subscribed event types
        self.subscribed_types: Set[str] = set()
        
        # Message callbacks for each event type
        self.message_callbacks = {
            "OnOrders": [],
            "OnTrades": [],
            "OnPositions": [],
            "OnGeneral": []
        }
        
        # Connection event callbacks
        self.connection_callbacks = {
            "on_connect": [],
            "on_close": [],
            "on_error": []
        }
        
        # Current data storage
        self.current_data = {
            "orders": [],
            "trades": [],
            "positions": [],
            "general": []
        }
        
        self._connection_thread = None
        self._initialized = True
    
    def initialize(self, access_token: str) -> bool:
        """Initialize Order WebSocket with access token"""
        try:
            self.access_token = access_token
            logger.info("Order WebSocket service initialized")
            return True
        except Exception as e:
            logger.error(f"Error initializing Order WebSocket: {str(e)}")
            return False
    
    def _on_order(self, message: Dict):
        """Handle order updates"""
        try:
            if isinstance(message, dict):
                # Store latest order data
                order_id = message.get('id')
                if order_id:
                    # Update or add order
                    existing = next((o for o in self.current_data["orders"] if o.get('id') == order_id), None)
                    if existing:
                        existing.update(message)
                    else:
                        self.current_data["orders"].append(message)
                    
                    # Keep only last 100 orders
                    if len(self.current_data["orders"]) > 100:
                        self.current_data["orders"] = self.current_data["orders"][-100:]
                
                # Call all registered callbacks
                for callback in self.message_callbacks["OnOrders"]:
                    try:
                        callback(message, "OnOrders")
                    except Exception as e:
                        logger.error(f"Error in order callback: {str(e)}")
        except Exception as e:
            logger.error(f"Error processing order message: {str(e)}")
    
    def _on_trade(self, message: Dict):
        """Handle trade updates"""
        try:
            if isinstance(message, dict):
                trade_id = message.get('trade_id')
                if trade_id:
                    # Update or add trade
                    existing = next((t for t in self.current_data["trades"] if t.get('trade_id') == trade_id), None)
                    if existing:
                        existing.update(message)
                    else:
                        self.current_data["trades"].append(message)
                    
                    # Keep only last 100 trades
                    if len(self.current_data["trades"]) > 100:
                        self.current_data["trades"] = self.current_data["trades"][-100:]
                
                # Call all registered callbacks
                for callback in self.message_callbacks["OnTrades"]:
                    try:
                        callback(message, "OnTrades")
                    except Exception as e:
                        logger.error(f"Error in trade callback: {str(e)}")
        except Exception as e:
            logger.error(f"Error processing trade message: {str(e)}")
    
    def _on_position(self, message: Dict):
        """Handle position updates"""
        try:
            if isinstance(message, dict):
                position_id = message.get('id')
                if position_id:
                    # Update or add position
                    existing = next((p for p in self.current_data["positions"] if p.get('id') == position_id), None)
                    if existing:
                        existing.update(message)
                    else:
                        self.current_data["positions"].append(message)
                
                # Call all registered callbacks
                for callback in self.message_callbacks["OnPositions"]:
                    try:
                        callback(message, "OnPositions")
                    except Exception as e:
                        logger.error(f"Error in position callback: {str(e)}")
        except Exception as e:
            logger.error(f"Error processing position message: {str(e)}")
    
    def _on_general(self, message: Dict):
        """Handle general messages"""
        try:
            if isinstance(message, dict):
                self.current_data["general"].append(message)
                
                # Keep only last 50 general messages
                if len(self.current_data["general"]) > 50:
                    self.current_data["general"] = self.current_data["general"][-50:]
                
                # Call all registered callbacks
                for callback in self.message_callbacks["OnGeneral"]:
                    try:
                        callback(message, "OnGeneral")
                    except Exception as e:
                        logger.error(f"Error in general callback: {str(e)}")
        except Exception as e:
            logger.error(f"Error processing general message: {str(e)}")
    
    def _on_error(self, error: Dict):
        """Handle WebSocket errors"""
        logger.error(f"Order WebSocket error: {error}")
        for callback in self.connection_callbacks["on_error"]:
            try:
                callback(error)
            except Exception as e:
                logger.error(f"Error in error callback: {str(e)}")
    
    def _on_close(self, message: Dict):
        """Handle WebSocket close"""
        logger.warning(f"Order WebSocket closed: {message}")
        self.is_connected = False
        for callback in self.connection_callbacks["on_close"]:
            try:
                callback(message)
            except Exception as e:
                logger.error(f"Error in close callback: {str(e)}")
    
    def _on_connect(self):
        """Handle WebSocket connection"""
        logger.info("Order WebSocket connected")
        self.is_connected = True
        
        # Resubscribe to event types
        if self.subscribed_types:
            self.subscribe(list(self.subscribed_types))
        
        for callback in self.connection_callbacks["on_connect"]:
            try:
                callback()
            except Exception as e:
                logger.error(f"Error in connect callback: {str(e)}")
    
    def connect(self) -> bool:
        """Establish Order WebSocket connection"""
        if not self.access_token:
            logger.error("Access token not set")
            return False
        
        if self.is_connected:
            logger.warning("Already connected")
            return True
        
        try:
            self.websocket = order_ws.FyersOrderSocket(
                access_token=self.access_token,
                write_to_file=False,
                log_path="",
                on_connect=self._on_connect,
                on_close=self._on_close,
                on_error=self._on_error,
                on_orders=self._on_order,
                on_trades=self._on_trade,
                on_positions=self._on_position,
                on_general=self._on_general
            )
            
            self.websocket.connect()
            self.is_connected = True
            logger.info("Order WebSocket connection established")
            return True
        except Exception as e:
            logger.error(f"Failed to establish Order WebSocket connection: {str(e)}")
            return False
    
    def disconnect(self) -> bool:
        """Close Order WebSocket connection"""
        try:
            if self.websocket and self.is_connected:
                self.websocket.close()
                self.is_connected = False
                logger.info("Order WebSocket disconnected")
                return True
            return True
        except Exception as e:
            logger.error(f"Error disconnecting Order WebSocket: {str(e)}")
            return False
    
    def subscribe(self, event_types: List[str]) -> bool:
        """Subscribe to order/trade/position events"""
        try:
            if not self.websocket or not self.is_connected:
                logger.warning("Order WebSocket not connected, queuing subscription")
                self.subscribed_types.update(event_types)
                return False
            
            # Format event types for subscription
            data_type = ",".join(event_types)
            self.websocket.subscribe(data_type=data_type)
            self.subscribed_types.update(event_types)
            logger.info(f"Subscribed to {len(event_types)} event types: {data_type}")
            return True
        except Exception as e:
            logger.error(f"Error subscribing: {str(e)}")
            return False
    
    def unsubscribe(self, event_types: List[str]) -> bool:
        """Unsubscribe from event types"""
        try:
            self.subscribed_types.difference_update(event_types)
            
            if self.subscribed_types and self.websocket and self.is_connected:
                # Resubscribe to remaining types
                data_type = ",".join(self.subscribed_types)
                self.websocket.subscribe(data_type=data_type)
            
            logger.info(f"Unsubscribed from {len(event_types)} event types")
            return True
        except Exception as e:
            logger.error(f"Error unsubscribing: {str(e)}")
            return False
    
    def get_orders(self) -> List[Dict]:
        """Get all stored orders"""
        return self.current_data["orders"].copy()
    
    def get_trades(self) -> List[Dict]:
        """Get all stored trades"""
        return self.current_data["trades"].copy()
    
    def get_positions(self) -> List[Dict]:
        """Get all stored positions"""
        return self.current_data["positions"].copy()
    
    def get_general_messages(self) -> List[Dict]:
        """Get all general messages"""
        return self.current_data["general"].copy()
    
    def get_current_data(self) -> Dict:
        """Get all current data"""
        return {
            "orders": len(self.current_data["orders"]),
            "trades": len(self.current_data["trades"]),
            "positions": len(self.current_data["positions"]),
            "general": len(self.current_data["general"])
        }
    
    def register_message_callback(self, callback: Callable, event_type: str):
        """Register callback for incoming messages"""
        if event_type in self.message_callbacks:
            self.message_callbacks[event_type].append(callback)
            logger.info(f"Registered message callback for {event_type}")
    
    def register_connection_callback(self, callback: Callable, event: str):
        """Register callback for connection events"""
        if event in self.connection_callbacks:
            self.connection_callbacks[event].append(callback)
            logger.info(f"Registered {event} callback")
    
    def get_connection_status(self) -> Dict:
        """Get Order WebSocket connection status"""
        return {
            "connected": self.is_connected,
            "subscribed_types": list(self.subscribed_types),
            "data_counts": self.get_current_data()
        }
    
    def clear_old_data(self, keep_count: int = 100):
        """Clear old data to manage memory"""
        self.current_data["orders"] = self.current_data["orders"][-keep_count:]
        self.current_data["trades"] = self.current_data["trades"][-keep_count:]
        self.current_data["positions"] = self.current_data["positions"][-keep_count:]
        self.current_data["general"] = self.current_data["general"][-50:]


# Singleton instance
fyers_order_websocket_service = FyersOrderWebSocketService()
