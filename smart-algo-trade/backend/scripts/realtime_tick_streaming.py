# -*- coding: utf-8 -*-
"""
Real-Time Tick Streaming Script
Phase 14: Direct WebSocket connection for live LTP updates
Streams real-time price data without OHLC aggregation
Useful for: Live price monitoring, order placement, risk management
"""

from fyers_apiv3.FyersWebsocket import data_ws
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('backend/logs/realtime_tick_streaming.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Load credentials
try:
    client_id = open("smart-algo-trade/client_id.txt", 'r').read().strip()
    access_token = open("smart-algo-trade/access_token.txt", 'r').read().strip()
    logger.info("Credentials loaded successfully")
except FileNotFoundError as e:
    logger.error(f"Credential files not found: {e}")
    exit(1)


def onmessage(message):
    """
    Callback function to handle incoming messages from the FyersDataSocket WebSocket.
    Prints real-time LTP updates.
    
    Parameters:
        message (dict): The received message from the WebSocket.
        Format: {
            'symbol': 'NSE:SBIN-EQ',
            'ltp': 500.50,
            'exch_feed_time': 1234567890,
            ... additional market data fields ...
        }
    """
    try:
        symbol = message.get('symbol', 'N/A')
        ltp = message.get('ltp', 'N/A')
        timestamp = datetime.now().isoformat()
        
        print(f"[{timestamp}] {symbol}: ₹{ltp}")
        logger.debug(f"Tick: {symbol} @ {ltp}")
        
    except Exception as e:
        logger.error(f"Error processing message: {e}")


def onerror(message):
    """
    Callback function to handle WebSocket errors.
    
    Parameters:
        message (dict): The error message received from the WebSocket.
    """
    logger.error(f"WebSocket Error: {message}")
    print(f"ERROR: {message}")


def onclose(message):
    """
    Callback function to handle WebSocket connection close events.
    """
    logger.warning(f"WebSocket Connection Closed: {message}")
    print(f"CONNECTION CLOSED: {message}")


def onopen():
    """
    Callback function to subscribe to data type and symbols upon WebSocket connection.
    Called automatically when the WebSocket connection is established.
    """
    try:
        data_type = "SymbolUpdate"
        
        # Define symbols to stream (customize as needed)
        symbols = ['NSE:SBIN-EQ', 'NSE:ADANIENT-EQ']
        
        logger.info(f"WebSocket connected. Subscribing to {len(symbols)} symbols: {symbols}")
        print(f"WebSocket connected. Subscribing to {len(symbols)} symbols...")
        
        # Subscribe to the specified symbols and data type
        fyers.subscribe(symbols=symbols, data_type=data_type)
        
        # Keep the socket running to receive real-time data
        logger.info("Starting to receive real-time tick data...")
        print("Real-time streaming started. Press Ctrl+C to stop.")
        fyers.keep_running()
        
    except Exception as e:
        logger.error(f"Error in onopen callback: {e}")
        print(f"ERROR during subscription: {e}")


# Create a FyersDataSocket instance with the provided parameters
try:
    fyers = data_ws.FyersDataSocket(
        access_token=access_token,       # Access token in the format "appid:accesstoken"
        log_path="backend/logs/",        # Path to save logs
        litemode=False,                  # Lite mode disabled - receive full market data
        write_to_file=False,             # Don't save response to file
        reconnect=True,                  # Enable auto-reconnection on disconnection
        on_connect=onopen,               # Callback when connected
        on_close=onclose,                # Callback when closed
        on_error=onerror,                # Callback on error
        on_message=onmessage             # Callback for each tick
    )
    
    logger.info("FyersDataSocket instance created")
    
except Exception as e:
    logger.error(f"Failed to create WebSocket instance: {e}")
    exit(1)


def main():
    """Main entry point for the streaming script"""
    try:
        logger.info("Starting Real-Time Tick Streaming...")
        print("=" * 60)
        print("Real-Time Tick Streaming - Fyers API V3")
        print("=" * 60)
        
        # Establish connection to the Fyers WebSocket
        fyers.connect()
        
    except KeyboardInterrupt:
        logger.info("User interrupted. Closing connection...")
        print("\nClosing connection...")
        fyers.close()
        logger.info("Connection closed successfully")
        
    except Exception as e:
        logger.error(f"Unexpected error in main: {e}")
        print(f"ERROR: {e}")
        fyers.close()


if __name__ == "__main__":
    main()
