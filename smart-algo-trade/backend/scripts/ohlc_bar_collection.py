# -*- coding: utf-8 -*-
"""
OHLC Bar Collection Script
Phase 14: Direct WebSocket connection for OHLC bar aggregation
Collects tick data and aggregates into OHLC bars at specified timeframes
Exports bars to CSV for backtesting and analysis

NOTE: ON RE-RUNNING THIS SCRIPT, THE OLD OHLC CSVS WILL BE OVERWRITTEN
PLEASE STORE THE OLD CSVS SOMEWHERE SAFE THEN YOU CAN PROCEED
"""

from fyers_apiv3.FyersWebsocket import data_ws
from fyers_apiv3 import fyersModel
from datetime import datetime, timedelta
import pandas as pd
import logging
import os
from csv import DictWriter

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('backend/logs/ohlc_bar_collection.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Create data directory
os.makedirs('backend/data/ohlc_bars', exist_ok=True)

# Load credentials
try:
    client_id = open("smart-algo-trade/client_id.txt", 'r').read().strip()
    access_token = open("smart-algo-trade/access_token.txt", 'r').read().strip()
    logger.info("Credentials loaded successfully")
except FileNotFoundError as e:
    logger.error(f"Credential files not found: {e}")
    exit(1)

# Configuration
TIMEFRAME_MINUTES = 1  # Set timeframe in minutes (1, 5, 15, 60, etc.)
CSV_DIR = "backend/data/ohlc_bars"

# Global state
ohlc_data = {}           # Accumulates ticks: {symbol: [ltp1, ltp2, ...]}
csv_data = {}            # In-memory storage: {symbol: [bar_dict1, bar_dict2, ...]}
timeframe_counter = 1    # Counter to track timeframe intervals
bars_created = 0         # Total bars created
last_bar_time = None     # Timestamp of last bar


def onmessage(message):
    """
    Process incoming tick and aggregate into OHLC bars.
    
    Parameters:
        message (dict): Contains symbol, ltp, exch_feed_time
    """
    global timeframe_counter, ohlc_data, csv_data, bars_created, last_bar_time
    
    try:
        symbol = message.get('symbol')
        ltp = float(message.get('ltp'))
        ms = message.get('exch_feed_time')
        
        # Convert timestamp
        curr_time = datetime.fromtimestamp(ms / 1000.0)
        
        # Initialize symbol buffer if needed
        if symbol not in ohlc_data:
            ohlc_data[symbol] = []
            logger.info(f"Started collecting ticks for {symbol}")
        
        # Accumulate tick
        ohlc_data[symbol].append(ltp)
        
        # Check if we've reached the timeframe interval
        if curr_time.second == 0 and timeframe_counter < TIMEFRAME_MINUTES:
            timeframe_counter += 1
        
        # Create OHLC bars at timeframe interval
        if timeframe_counter >= TIMEFRAME_MINUTES:
            _create_bars(curr_time)
            timeframe_counter = 1
        
        logger.debug(f"Tick: {symbol} @ {ltp}")
        
    except Exception as e:
        logger.error(f"Error processing message: {e}")


def _create_bars(curr_time: datetime):
    """
    Create OHLC bars from accumulated tick data.
    Writes to both CSV and in-memory storage.
    """
    global ohlc_data, csv_data, bars_created, last_bar_time
    
    try:
        for symbol in list(ohlc_data.keys()):
            if not ohlc_data[symbol]:
                continue
            
            ticks = ohlc_data[symbol]
            
            # Calculate OHLC
            open_price = float(ticks[0])
            close_price = float(ticks[-1])
            high_price = max(ticks)
            low_price = min(ticks)
            
            # Create bar data
            bar_data = {
                'timestamp': curr_time.strftime('%Y-%m-%d %H:%M:%S'),
                'symbol': symbol,
                'open': round(open_price, 2),
                'high': round(high_price, 2),
                'low': round(low_price, 2),
                'close': round(close_price, 2),
                'volume': len(ticks),
                'timeframe_minutes': TIMEFRAME_MINUTES
            }
            
            # Store in memory
            if symbol not in csv_data:
                csv_data[symbol] = []
            csv_data[symbol].append(bar_data)
            
            # Write to CSV
            _write_to_csv(symbol, bar_data)
            
            # Log bar creation
            bars_created += 1
            last_bar_time = curr_time.isoformat()
            
            print(f"[{curr_time.strftime('%H:%M:%S')}] {symbol}: O:{open_price:.2f} H:{high_price:.2f} L:{low_price:.2f} C:{close_price:.2f} (Ticks: {len(ticks)})")
            logger.info(f"Bar #{bars_created}: {symbol} OHLC({open_price:.2f}, {high_price:.2f}, {low_price:.2f}, {close_price:.2f})")
        
        # Clear tick buffer for next bar
        for symbol in ohlc_data:
            ohlc_data[symbol] = []
    
    except Exception as e:
        logger.error(f"Error creating OHLC bars: {e}")


def _write_to_csv(symbol: str, bar_data: dict):
    """
    Write OHLC bar to CSV file.
    Creates new file with headers if it doesn't exist, appends otherwise.
    """
    try:
        csv_filename = f"{CSV_DIR}/{symbol.replace(':', '_')}_OHLC.csv"
        
        if not os.path.isfile(csv_filename):
            # Create new file with headers
            with open(csv_filename, 'w', newline='', encoding='utf-8') as f:
                writer = DictWriter(f, fieldnames=bar_data.keys())
                writer.writeheader()
                writer.writerow(bar_data)
            logger.info(f"Created new CSV file: {csv_filename}")
        else:
            # Append to existing file
            with open(csv_filename, 'a', newline='', encoding='utf-8') as f:
                writer = DictWriter(f, fieldnames=bar_data.keys())
                writer.writerow(bar_data)
        
        logger.debug(f"Bar written to {csv_filename}")
    
    except Exception as e:
        logger.error(f"Error writing to CSV: {e}")


def onerror(message):
    """Handle WebSocket errors"""
    logger.error(f"WebSocket Error: {message}")
    print(f"ERROR: {message}")


def onclose(message):
    """Handle WebSocket connection close"""
    logger.warning(f"WebSocket Connection Closed: {message}")
    print(f"CONNECTION CLOSED: {message}")
    print_summary()


def onopen():
    """
    Subscribe to symbols when WebSocket connects.
    """
    try:
        data_type = "SymbolUpdate"
        
        # Define symbols to collect (customize as needed)
        symbols = ['MCX:CRUDEOIL24MARFUT', 'NSE:ADANIENT-EQ', 'NSE:NIFTY50-INDEX']
        
        logger.info(f"WebSocket connected. Starting OHLC collection for {len(symbols)} symbols")
        print(f"WebSocket connected. Collecting {TIMEFRAME_MINUTES}-minute OHLC bars...")
        print(f"Symbols: {symbols}")
        
        # Initialize Fyers API
        fyers_api = fyersModel.FyersModel(
            client_id=client_id,
            is_async=False,
            token=access_token,
            log_path="backend/logs/"
        )
        
        # Subscribe to symbols
        fyers_api.subscribe(symbols=symbols, data_type=data_type)
        logger.info(f"Subscribed to symbols: {symbols}")
        
        # Keep socket running
        fyers_api.keep_running()
        
    except Exception as e:
        logger.error(f"Error in onopen callback: {e}")
        print(f"ERROR during subscription: {e}")


def print_summary():
    """Print collection summary"""
    print("\n" + "=" * 60)
    print("OHLC Bar Collection Summary")
    print("=" * 60)
    print(f"Total Bars Created: {bars_created}")
    print(f"Last Bar Time: {last_bar_time}")
    print(f"Timeframe: {TIMEFRAME_MINUTES} minute(s)")
    print(f"CSV Location: {CSV_DIR}")
    print("\nBars per Symbol:")
    for symbol, bars in csv_data.items():
        print(f"  {symbol}: {len(bars)} bars")
    print("=" * 60)


# Create WebSocket instance
try:
    fyers = data_ws.FyersDataSocket(
        access_token=access_token,
        log_path="backend/logs/",
        litemode=False,
        write_to_file=False,
        reconnect=True,
        on_connect=onopen,
        on_close=onclose,
        on_error=onerror,
        on_message=onmessage
    )
    
    logger.info("FyersDataSocket instance created for OHLC collection")
    
except Exception as e:
    logger.error(f"Failed to create WebSocket instance: {e}")
    exit(1)


def main():
    """Main entry point for OHLC collection script"""
    try:
        logger.info("Starting OHLC Bar Collection...")
        print("=" * 60)
        print(f"OHLC Bar Collection - {TIMEFRAME_MINUTES} Minute Bars")
        print("=" * 60)
        print(f"Data will be saved to: {CSV_DIR}/")
        print("\nPress Ctrl+C to stop and view summary.\n")
        
        # Connect to WebSocket
        fyers.connect()
        
    except KeyboardInterrupt:
        logger.info("User interrupted. Closing collection...")
        print("\n\nStopping collection...")
        fyers.close()
        print_summary()
        logger.info("Collection stopped successfully")
        
    except Exception as e:
        logger.error(f"Unexpected error in main: {e}")
        print(f"ERROR: {e}")
        fyers.close()
        print_summary()


if __name__ == "__main__":
    main()
