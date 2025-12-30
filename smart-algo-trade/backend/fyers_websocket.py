# Fyers WebSocket Integration for Live Price Streaming
# Connects to Fyers API WebSocket for real-time market data
# Feeds price updates to the trading engine

import asyncio
import json
import logging
from typing import Dict, List, Callable, Optional
from decimal import Decimal
from datetime import datetime
import websockets
from websockets.client import WebSocketClientProtocol

logger = logging.getLogger(__name__)


class FyersWebSocketManager:
    """
    Manages WebSocket connection to Fyers for real-time price data.
    
    Flow:
    1. Connect to Fyers WebSocket with auth token
    2. Subscribe to symbols (NSE:SBIN-EQ, NIFTY50, etc.)
    3. Receive price ticks in real-time
    4. Distribute to trading engine via callback
    
    Production settings:
    - Fyers WebSocket URL: wss://ws.fyers.in/v2/api/
    - Auto-reconnect on disconnect
    - Handle partial/corrupted data gracefully
    """
    
    FYERS_WEBSOCKET_URL = "wss://ws.fyers.in/v2/api/"
    MAX_RETRIES = 5
    RETRY_DELAY = 5  # seconds
    
    def __init__(self, auth_token: str, user_id: str):
        """
        Initialize WebSocket manager.
        
        Args:
            auth_token: Fyers API authentication token
            user_id: Fyers user ID
        """
        self.auth_token = auth_token
        self.user_id = user_id
        self.websocket: Optional[WebSocketClientProtocol] = None
        self.is_connected = False
        self.subscribed_symbols: Dict[str, List[Callable]] = {}
        self.price_callbacks: List[Callable] = []
        self._retry_count = 0
    
    async def connect(self) -> bool:
        """
        Connect to Fyers WebSocket and authenticate.
        
        Returns:
            True if connection successful, False otherwise
        """
        try:
            logger.info("Connecting to Fyers WebSocket...")
            
            self.websocket = await websockets.connect(
                self.FYERS_WEBSOCKET_URL,
                ping_interval=30,
                ping_timeout=10
            )
            
            # Send authentication
            auth_message = {
                "T": "OP",
                "uid": self.user_id,
                "actid": self.user_id,
                "token": self.auth_token,
                "connection_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"
            }
            
            await self.websocket.send(json.dumps(auth_message))
            
            # Wait for confirmation
            response = await asyncio.wait_for(self.websocket.recv(), timeout=5.0)
            auth_response = json.loads(response)
            
            if auth_response.get("s") == "OK":
                self.is_connected = True
                self._retry_count = 0
                logger.info("✅ Fyers WebSocket connected and authenticated")
                return True
            else:
                logger.error(f"Authentication failed: {auth_response}")
                self.is_connected = False
                return False
        
        except Exception as e:
            logger.error(f"WebSocket connection error: {e}")
            self.is_connected = False
            return False
    
    async def subscribe_to_symbol(
        self,
        symbol: str,
        callback: Optional[Callable] = None
    ) -> bool:
        """
        Subscribe to real-time price updates for a symbol.
        
        Args:
            symbol: Trading symbol (e.g., 'NSE:SBIN-EQ')
            callback: Optional callback function on price update
        
        Returns:
            True if subscription successful
        """
        if not self.is_connected:
            logger.warning("Not connected to WebSocket")
            return False
        
        try:
            # Convert symbol to Fyers format
            fyers_symbol = self._convert_to_fyers_format(symbol)
            
            # Send subscription message
            subscribe_message = {
                "T": "SUB",
                "K": fyers_symbol
            }
            
            await self.websocket.send(json.dumps(subscribe_message))
            
            # Track subscription and callback
            if symbol not in self.subscribed_symbols:
                self.subscribed_symbols[symbol] = []
            
            if callback:
                self.subscribed_symbols[symbol].append(callback)
            
            logger.info(f"Subscribed to {symbol} price updates")
            return True
        
        except Exception as e:
            logger.error(f"Subscription error for {symbol}: {e}")
            return False
    
    async def unsubscribe_from_symbol(self, symbol: str) -> bool:
        """Unsubscribe from symbol price updates"""
        if not self.is_connected:
            return False
        
        try:
            fyers_symbol = self._convert_to_fyers_format(symbol)
            
            unsubscribe_message = {
                "T": "UNSUB",
                "K": fyers_symbol
            }
            
            await self.websocket.send(json.dumps(unsubscribe_message))
            
            if symbol in self.subscribed_symbols:
                del self.subscribed_symbols[symbol]
            
            logger.info(f"Unsubscribed from {symbol}")
            return True
        
        except Exception as e:
            logger.error(f"Unsubscription error for {symbol}: {e}")
            return False
    
    async def start_price_stream(self) -> None:
        """
        Start listening to price updates from WebSocket.
        
        This runs indefinitely, receiving and processing price ticks.
        Implements auto-reconnect logic if connection drops.
        """
        while True:
            try:
                if not self.is_connected:
                    logger.info("Attempting to reconnect...")
                    if not await self.connect():
                        self._retry_count += 1
                        if self._retry_count >= self.MAX_RETRIES:
                            logger.error("Max reconnection attempts reached")
                            break
                        await asyncio.sleep(self.RETRY_DELAY)
                        continue
                
                # Receive price updates from WebSocket
                while self.websocket and self.is_connected:
                    try:
                        message = await asyncio.wait_for(
                            self.websocket.recv(),
                            timeout=30.0
                        )
                        
                        # Parse and process price update
                        await self._process_price_message(message)
                    
                    except asyncio.TimeoutError:
                        # Ping timeout - connection likely dead
                        logger.warning("WebSocket ping timeout")
                        self.is_connected = False
                        break
                    
                    except Exception as e:
                        logger.error(f"Error processing message: {e}")
                        continue
            
            except Exception as e:
                logger.error(f"Stream error: {e}")
                self.is_connected = False
                await asyncio.sleep(self.RETRY_DELAY)
    
    async def _process_price_message(self, message: str) -> None:
        """
        Process incoming price message from Fyers.
        
        Fyers message format (quote mode):
        {
            "T": 0,
            "K": "NSE:SBIN-EQ",
            "LTT": 1234567890,
            "LTP": 549.75,
            "BID": 549.50,
            "ASK": 550.00,
            "VOL": 100000
        }
        """
        try:
            data = json.loads(message)
            
            # Handle different message types
            if data.get("T") == "OP":
                # Operation confirmation (subscribed/unsubscribed)
                logger.debug(f"Operation response: {data.get('K')}")
                return
            
            # Price update (quote data)
            if "K" in data and "LTP" in data:
                symbol = data["K"]
                
                # Parse price data
                try:
                    last_price = Decimal(str(data.get("LTP", 0)))
                    bid_price = Decimal(str(data.get("BID", 0)))
                    ask_price = Decimal(str(data.get("ASK", 0)))
                    volume = int(data.get("VOL", 0))
                    
                    # Convert Fyers symbol back to our format
                    our_symbol = self._convert_from_fyers_format(symbol)
                    
                    # Create price update data
                    price_update = {
                        'symbol': our_symbol,
                        'last_price': float(last_price),
                        'bid_price': float(bid_price) if bid_price > 0 else float(last_price),
                        'ask_price': float(ask_price) if ask_price > 0 else float(last_price),
                        'volume': volume,
                        'timestamp': datetime.now().isoformat()
                    }
                    
                    # Call registered callbacks
                    await self._trigger_callbacks(price_update)
                
                except (ValueError, TypeError) as e:
                    logger.warning(f"Price parsing error: {e}, data: {data}")
        
        except json.JSONDecodeError as e:
            logger.warning(f"JSON decode error: {e}")
        except Exception as e:
            logger.error(f"Error processing price message: {e}")
    
    async def _trigger_callbacks(self, price_update: Dict) -> None:
        """
        Trigger all registered callbacks with price update.
        
        Callbacks are called asynchronously without blocking price stream.
        """
        # Call global callbacks first
        for callback in self.price_callbacks:
            try:
                if asyncio.iscoroutinefunction(callback):
                    asyncio.create_task(callback(price_update))
                else:
                    callback(price_update)
            except Exception as e:
                logger.error(f"Callback error: {e}")
        
        # Call symbol-specific callbacks
        symbol = price_update['symbol']
        if symbol in self.subscribed_symbols:
            for callback in self.subscribed_symbols[symbol]:
                try:
                    if asyncio.iscoroutinefunction(callback):
                        asyncio.create_task(callback(price_update))
                    else:
                        callback(price_update)
                except Exception as e:
                    logger.error(f"Symbol callback error for {symbol}: {e}")
    
    def register_callback(self, callback: Callable) -> None:
        """
        Register a global callback for all price updates.
        
        Callback signature: callback(price_update: Dict)
        price_update contains: symbol, last_price, bid_price, ask_price, volume, timestamp
        """
        self.price_callbacks.append(callback)
        logger.info("Registered price update callback")
    
    async def disconnect(self) -> None:
        """Disconnect from WebSocket"""
        if self.websocket:
            try:
                await self.websocket.close()
                self.is_connected = False
                logger.info("Disconnected from Fyers WebSocket")
            except Exception as e:
                logger.error(f"Disconnect error: {e}")
    
    @staticmethod
    def _convert_to_fyers_format(symbol: str) -> str:
        """Convert our symbol format to Fyers format"""
        # NSE:SBIN-EQ → NSE:SBIN-EQ (usually same)
        # But we handle special cases
        return symbol
    
    @staticmethod
    def _convert_from_fyers_format(symbol: str) -> str:
        """Convert Fyers symbol format to our format"""
        return symbol


# ============================================================================
# PRICE UPDATE HANDLER FOR TRADING ENGINE
# ============================================================================

async def on_fyers_price_update(
    trading_engine,
    live_trading_api,
    price_update: Dict
) -> None:
    """
    Callback when price updates from Fyers WebSocket.
    
    This is the integration point that feeds price data to the trading engine.
    
    Args:
        trading_engine: LiveTradingEngine instance
        live_trading_api: Reference to API module for price_stream
        price_update: Price data from Fyers
    """
    try:
        from live_market_trading import PriceQuote
        
        symbol = price_update['symbol']
        
        # Create price quote
        quote = PriceQuote(
            symbol=symbol,
            bid_price=Decimal(str(price_update['bid_price'])),
            ask_price=Decimal(str(price_update['ask_price'])),
            last_price=Decimal(str(price_update['last_price'])),
            volume=price_update['volume'],
            timestamp=datetime.now()
        )
        
        # Update price stream (notifies all subscribers)
        await live_trading_api.price_stream.update_price(symbol, quote)
        
        # Check risk orders (stop-loss, take-profit)
        await trading_engine.check_risk_orders(symbol, quote.last_price)
    
    except Exception as e:
        logger.error(f"Error in price update handler: {e}")


# ============================================================================
# EXAMPLE USAGE
# ============================================================================

async def example_websocket_stream():
    """
    Example: Connect to Fyers WebSocket and stream prices.
    
    Production setup:
    1. Get auth token from /get_fyers_token.py endpoint
    2. Initialize FyersWebSocketManager with token
    3. Connect and subscribe to symbols
    4. Register callback that feeds prices to trading engine
    5. Start listening to price stream
    """
    
    # Get auth token (from Fyers session)
    auth_token = "YOUR_FYERS_AUTH_TOKEN"
    user_id = "YOUR_FYERS_USER_ID"
    
    # Initialize WebSocket manager
    ws_manager = FyersWebSocketManager(auth_token, user_id)
    
    # Connect to Fyers
    if await ws_manager.connect():
        print("✅ Connected to Fyers")
        
        # Subscribe to symbols
        symbols = ["NSE:SBIN-EQ", "NSE:INFY-EQ", "NIFTY50-INDEX"]
        for symbol in symbols:
            await ws_manager.subscribe_to_symbol(symbol)
        
        # Register callback (would be trading engine callback in production)
        def price_callback(update):
            print(f"Price Update: {update['symbol']} @ ₹{update['last_price']}")
        
        ws_manager.register_callback(price_callback)
        
        # Start streaming
        await ws_manager.start_price_stream()
    else:
        print("❌ Failed to connect")


if __name__ == "__main__":
    asyncio.run(example_websocket_stream())
