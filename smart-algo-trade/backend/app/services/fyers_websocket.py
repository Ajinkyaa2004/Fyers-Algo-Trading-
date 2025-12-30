"""
Fyers WebSocket Service for Real-time Data Streaming
Supports SymbolUpdate, DepthUpdate, IndexUpdate with subscription management
"""

import threading
import time
from typing import Dict, List, Callable, Optional
from fyers_apiv3.FyersWebsocket import data_ws
import logging

logger = logging.getLogger(__name__)


class FyersWebSocketService:
    """
    Manages WebSocket connections for real-time data streaming
    Supports multiple data types: SymbolUpdate, DepthUpdate, IndexUpdate
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
            
        self.client_id = None
        self.access_token = None
        self.websocket = None
        self.is_connected = False
        self.subscribed_symbols = {
            "SymbolUpdate": set(),
            "DepthUpdate": set(),
            "IndexUpdate": set()
        }
        self.message_callbacks = {
            "SymbolUpdate": [],
            "DepthUpdate": [],
            "IndexUpdate": []
        }
        self.connection_callbacks = {
            "on_connect": [],
            "on_close": [],
            "on_error": []
        }
        self.current_data = {
            "SymbolUpdate": {},
            "DepthUpdate": {},
            "IndexUpdate": {}
        }
        self._connection_thread = None
        self._initialized = True
    
    def initialize(self, access_token: str) -> bool:
        """Initialize WebSocket with access token"""
        try:
            self.access_token = access_token
            logger.info("WebSocket service initialized with access token")
            return True
        except Exception as e:
            logger.error(f"Error initializing WebSocket: {str(e)}")
            return False
    
    def _on_message(self, message: Dict):
        """Handle incoming WebSocket messages"""
        try:
            if isinstance(message, dict):
                # Determine data type from message structure
                data_type = self._identify_data_type(message)
                
                # Store current data
                symbol = message.get('symbol', 'unknown')
                self.current_data[data_type][symbol] = message
                
                # Call all registered callbacks for this data type
                for callback in self.message_callbacks[data_type]:
                    try:
                        callback(message, data_type)
                    except Exception as e:
                        logger.error(f"Error in message callback: {str(e)}")
        except Exception as e:
            logger.error(f"Error processing message: {str(e)}")
    
    def _on_error(self, error: Dict):
        """Handle WebSocket errors"""
        logger.error(f"WebSocket error: {error}")
        for callback in self.connection_callbacks["on_error"]:
            try:
                callback(error)
            except Exception as e:
                logger.error(f"Error in error callback: {str(e)}")
    
    def _on_close(self, message: Dict):
        """Handle WebSocket close"""
        logger.warning(f"WebSocket closed: {message}")
        self.is_connected = False
        for callback in self.connection_callbacks["on_close"]:
            try:
                callback(message)
            except Exception as e:
                logger.error(f"Error in close callback: {str(e)}")
    
    def _on_connect(self):
        """Handle WebSocket connection"""
        logger.info("WebSocket connected")
        self.is_connected = True
        
        # Resubscribe to all symbols
        for data_type, symbols in self.subscribed_symbols.items():
            if symbols:
                self.subscribe(list(symbols), data_type)
        
        for callback in self.connection_callbacks["on_connect"]:
            try:
                callback()
            except Exception as e:
                logger.error(f"Error in connect callback: {str(e)}")
    
    def _identify_data_type(self, message: Dict) -> str:
        """Identify data type from message structure"""
        if 'bid' in message or 'ask' in message:
            return "DepthUpdate"
        elif 'nifty' in str(message.get('symbol', '')).lower():
            return "IndexUpdate"
        else:
            return "SymbolUpdate"
    
    def connect(self) -> bool:
        """Establish WebSocket connection"""
        if not self.access_token:
            logger.error("Access token not set")
            return False
        
        if self.is_connected:
            logger.warning("Already connected")
            return True
        
        try:
            self.websocket = data_ws.FyersDataSocket(
                access_token=self.access_token,
                log_path="",
                litemode=False,
                write_to_file=False,
                reconnect=True,
                on_connect=self._on_connect,
                on_close=self._on_close,
                on_error=self._on_error,
                on_message=self._on_message
            )
            
            self.websocket.connect()
            self.is_connected = True
            logger.info("WebSocket connection established")
            return True
        except Exception as e:
            logger.error(f"Failed to establish WebSocket connection: {str(e)}")
            return False
    
    def disconnect(self) -> bool:
        """Close WebSocket connection"""
        try:
            if self.websocket and self.is_connected:
                self.websocket.close()
                self.is_connected = False
                logger.info("WebSocket disconnected")
                return True
            return True
        except Exception as e:
            logger.error(f"Error disconnecting WebSocket: {str(e)}")
            return False
    
    def subscribe(self, symbols: List[str], data_type: str = "SymbolUpdate") -> bool:
        """Subscribe to symbols for specified data type"""
        try:
            if not self.websocket or not self.is_connected:
                logger.warning("WebSocket not connected, queuing subscription")
                self.subscribed_symbols[data_type].update(symbols)
                return False
            
            self.websocket.subscribe(symbols=symbols, data_type=data_type)
            self.subscribed_symbols[data_type].update(symbols)
            logger.info(f"Subscribed to {len(symbols)} symbols for {data_type}")
            return True
        except Exception as e:
            logger.error(f"Error subscribing: {str(e)}")
            return False
    
    def unsubscribe(self, symbols: List[str], data_type: str = "SymbolUpdate") -> bool:
        """Unsubscribe from symbols"""
        try:
            if self.websocket and self.is_connected:
                self.websocket.unsubscribe(symbols=symbols, data_type=data_type)
                self.subscribed_symbols[data_type].difference_update(symbols)
                logger.info(f"Unsubscribed from {len(symbols)} symbols for {data_type}")
                return True
            return False
        except Exception as e:
            logger.error(f"Error unsubscribing: {str(e)}")
            return False
    
    def get_current_data(self, data_type: str = "SymbolUpdate") -> Dict:
        """Get current stored data for data type"""
        return self.current_data.get(data_type, {})
    
    def get_symbol_data(self, symbol: str, data_type: str = "SymbolUpdate") -> Optional[Dict]:
        """Get current data for specific symbol"""
        return self.current_data[data_type].get(symbol)
    
    def register_message_callback(self, callback: Callable, data_type: str = "SymbolUpdate"):
        """Register callback for incoming messages"""
        self.message_callbacks[data_type].append(callback)
        logger.info(f"Registered message callback for {data_type}")
    
    def register_connection_callback(self, callback: Callable, event: str):
        """Register callback for connection events (on_connect, on_close, on_error)"""
        if event in self.connection_callbacks:
            self.connection_callbacks[event].append(callback)
            logger.info(f"Registered {event} callback")
    
    def get_subscribed_symbols(self, data_type: str = "SymbolUpdate") -> List[str]:
        """Get list of subscribed symbols for data type"""
        return list(self.subscribed_symbols.get(data_type, set()))
    
    def get_connection_status(self) -> Dict:
        """Get WebSocket connection status"""
        return {
            "connected": self.is_connected,
            "subscriptions": {
                data_type: list(symbols)
                for data_type, symbols in self.subscribed_symbols.items()
            },
            "data_cache": {
                data_type: len(data)
                for data_type, data in self.current_data.items()
            }
        }


# Singleton instance
fyers_websocket_service = FyersWebSocketService()
