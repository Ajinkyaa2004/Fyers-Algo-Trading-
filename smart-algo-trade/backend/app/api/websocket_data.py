# -*- coding: utf-8 -*-
"""
Phase 14: Real-Time WebSocket Data Collection & OHLC Bar Generation
Integrates Aseem Singhal's WebSocket streaming and OHLC aggregation systems
Features:
- Real-time tick data streaming with LTP updates
- OHLC bar aggregation at specified timeframes
- CSV export for historical analysis
- Multi-symbol portfolio support
- Configurable subscription management
"""

from fastapi import APIRouter, Query, HTTPException, BackgroundTasks
from pydantic import BaseModel
from datetime import datetime, timedelta
from pytz import timezone
import pandas as pd
import json
import logging
import os
from typing import List, Dict, Optional, Any
from fyers_apiv3.FyersWebsocket import data_ws
from fyers_apiv3 import fyersModel
import threading
from csv import DictWriter

router = APIRouter()
logger = logging.getLogger(__name__)

# Configuration
DATA_DIR = "backend/data/websocket"
LOGS_DIR = "backend/logs"
os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(LOGS_DIR, exist_ok=True)

# Load credentials
try:
    client_id = open("smart-algo-trade/client_id.txt", 'r').read().strip()
    access_token = open("smart-algo-trade/access_token.txt", 'r').read().strip()
except FileNotFoundError:
    client_id = ""
    access_token = ""
    logger.warning("Credentials files not found. WebSocket will not initialize.")


# ==================== PYDANTIC MODELS ====================

class TickUpdate(BaseModel):
    """Real-time tick data"""
    symbol: str
    ltp: float
    timestamp: str
    exch_feed_time: int


class OHLCBar(BaseModel):
    """Aggregated OHLC bar"""
    symbol: str
    timestamp: str
    open: float
    high: float
    low: float
    close: float
    timeframe: int


class SubscriptionRequest(BaseModel):
    """WebSocket subscription request"""
    symbols: List[str]
    data_type: str = "SymbolUpdate"


class StreamingStatus(BaseModel):
    """Real-time streaming status"""
    status: str
    active_symbols: List[str]
    message_count: int
    uptime_seconds: float
    connection_time: Optional[str]


class OHLCCollectionStatus(BaseModel):
    """OHLC collection status"""
    status: str
    active_symbols: List[str]
    timeframe_minutes: int
    bars_collected: int
    csv_files: List[str]


# ==================== REAL-TIME STREAMING SERVICE ====================

class RealtimeStreamingService:
    """Manages real-time tick data streaming from Fyers WebSocket"""
    
    def __init__(self):
        self.fyers = None
        self.is_connected = False
        self.active_symbols: List[str] = []
        self.tick_buffer: Dict[str, List[float]] = {}
        self.message_count = 0
        self.connection_time = None
        self.start_time = None
        
    def _init_fyers(self):
        """Initialize Fyers API connection"""
        try:
            self.fyers = fyersModel.FyersModel(
                client_id=client_id,
                is_async=False,
                token=access_token,
                log_path=LOGS_DIR
            )
            logger.info("Fyers API initialized for streaming")
        except Exception as e:
            logger.error(f"Failed to initialize Fyers API: {e}")
            raise
    
    def on_message(self, message: dict):
        """
        Callback for incoming tick data
        Message format: {'symbol': 'NSE:SBIN-EQ', 'ltp': 500.50, 'exch_feed_time': 1234567890}
        """
        try:
            symbol = message.get('symbol')
            ltp = message.get('ltp')
            
            if symbol not in self.tick_buffer:
                self.tick_buffer[symbol] = []
            
            self.tick_buffer[symbol].append(float(ltp))
            self.message_count += 1
            
            # Keep only last 100 ticks per symbol in memory
            if len(self.tick_buffer[symbol]) > 100:
                self.tick_buffer[symbol] = self.tick_buffer[symbol][-100:]
            
            logger.debug(f"Tick received: {symbol} @ {ltp}")
            
        except Exception as e:
            logger.error(f"Error processing message: {e}")
    
    def on_error(self, message: dict):
        """Handle WebSocket errors"""
        logger.error(f"WebSocket Error: {message}")
    
    def on_close(self, message: dict):
        """Handle WebSocket connection close"""
        logger.warning(f"WebSocket closed: {message}")
        self.is_connected = False
    
    def on_open(self):
        """Handle WebSocket connection open"""
        logger.info("WebSocket connection opened")
        self.is_connected = True
        self.connection_time = datetime.now().isoformat()
        self.start_time = datetime.now()
        
        if self.active_symbols:
            try:
                self.fyers.subscribe(
                    symbols=self.active_symbols,
                    data_type="SymbolUpdate"
                )
                self.fyers.keep_running()
                logger.info(f"Subscribed to symbols: {self.active_symbols}")
            except Exception as e:
                logger.error(f"Failed to subscribe to symbols: {e}")
    
    def connect(self, symbols: List[str]):
        """Connect to WebSocket and start streaming"""
        try:
            self.active_symbols = symbols
            self._init_fyers()
            
            # Create WebSocket instance
            ws = data_ws.FyersDataSocket(
                access_token=access_token,
                log_path=LOGS_DIR,
                litemode=False,
                write_to_file=False,
                reconnect=True,
                on_connect=self.on_open,
                on_close=self.on_close,
                on_error=self.on_error,
                on_message=self.on_message
            )
            
            self.fyers = ws
            ws.connect()
            logger.info(f"Connected to WebSocket for {len(symbols)} symbols")
            return True
            
        except Exception as e:
            logger.error(f"WebSocket connection failed: {e}")
            return False
    
    def disconnect(self):
        """Disconnect from WebSocket"""
        try:
            if self.fyers:
                self.fyers.close()
            self.is_connected = False
            logger.info("Disconnected from WebSocket")
        except Exception as e:
            logger.error(f"Error disconnecting: {e}")
    
    def get_latest_tick(self, symbol: str) -> Optional[float]:
        """Get the latest LTP for a symbol"""
        if symbol in self.tick_buffer and self.tick_buffer[symbol]:
            return self.tick_buffer[symbol][-1]
        return None
    
    def get_status(self) -> StreamingStatus:
        """Get current streaming status"""
        uptime = 0
        if self.start_time:
            uptime = (datetime.now() - self.start_time).total_seconds()
        
        return StreamingStatus(
            status="connected" if self.is_connected else "disconnected",
            active_symbols=self.active_symbols,
            message_count=self.message_count,
            uptime_seconds=uptime,
            connection_time=self.connection_time
        )


# ==================== OHLC AGGREGATION SERVICE ====================

class OHLCCollectionService:
    """Manages OHLC bar aggregation from tick data"""
    
    def __init__(self, timeframe_minutes: int = 1):
        self.timeframe_minutes = timeframe_minutes
        self.fyers = None
        self.is_collecting = False
        self.active_symbols: List[str] = []
        self.ohlc_data: Dict[str, List[float]] = {}
        self.csv_data: Dict[str, List[dict]] = {}
        self.timeframe_counter = 1
        self.bars_collected = 0
        self.last_bar_time = None
        
    def _init_fyers(self):
        """Initialize Fyers API connection"""
        try:
            self.fyers = fyersModel.FyersModel(
                client_id=client_id,
                is_async=False,
                token=access_token,
                log_path=LOGS_DIR
            )
            logger.info("Fyers API initialized for OHLC collection")
        except Exception as e:
            logger.error(f"Failed to initialize Fyers API: {e}")
            raise
    
    def on_message(self, message: dict):
        """
        Process incoming tick and aggregate into OHLC bars
        """
        try:
            symbol = message.get('symbol')
            ltp = float(message.get('ltp'))
            ms = message.get('exch_feed_time')
            
            curr_time = datetime.fromtimestamp(ms / 1000.0)
            
            # Initialize symbol if not exists
            if symbol not in self.ohlc_data:
                self.ohlc_data[symbol] = []
            
            # Check if we need to create a new bar
            if curr_time.second == 0 and self.timeframe_counter < self.timeframe_minutes:
                self.timeframe_counter += 1
            
            # Create new bar at timeframe interval
            if self.timeframe_counter >= self.timeframe_minutes:
                self._create_bars(curr_time, symbol)
                self.timeframe_counter = 1
            else:
                # Accumulate tick data
                self.ohlc_data[symbol].append(ltp)
            
            logger.debug(f"OHLC Tick: {symbol} @ {ltp}")
            
        except Exception as e:
            logger.error(f"Error processing OHLC message: {e}")
    
    def _create_bars(self, curr_time: datetime, symbol: str):
        """Create OHLC bars from accumulated tick data"""
        try:
            for sym in self.ohlc_data:
                if not self.ohlc_data[sym]:
                    continue
                
                ticks = self.ohlc_data[sym]
                
                # Calculate OHLC
                open_price = float(ticks[0])
                close_price = float(ticks[-1])
                high_price = max(ticks)
                low_price = min(ticks)
                
                # Create CSV row
                csv_dict = {
                    'timestamp': str(curr_time),
                    'symbol': sym,
                    'open': open_price,
                    'high': high_price,
                    'low': low_price,
                    'close': close_price,
                    'timeframe_minutes': self.timeframe_minutes,
                    'tick_count': len(ticks)
                }
                
                # Store in memory
                if sym not in self.csv_data:
                    self.csv_data[sym] = []
                self.csv_data[sym].append(csv_dict)
                
                # Write to CSV
                self._write_to_csv(sym, csv_dict)
                self.bars_collected += 1
                self.last_bar_time = curr_time.isoformat()
                
                logger.info(f"OHLC Bar created: {sym} OHLC({open_price}, {high_price}, {low_price}, {close_price})")
            
            # Clear tick buffer
            for sym in self.ohlc_data:
                self.ohlc_data[sym] = []
        
        except Exception as e:
            logger.error(f"Error creating OHLC bars: {e}")
    
    def _write_to_csv(self, symbol: str, data: dict):
        """Write OHLC bar to CSV file"""
        try:
            csv_filename = f"{DATA_DIR}/{symbol.replace(':', '_')}_OHLC.csv"
            
            if not os.path.isfile(csv_filename):
                # Create new file with headers
                with open(csv_filename, 'w', newline='') as f:
                    writer = DictWriter(f, fieldnames=data.keys())
                    writer.writeheader()
                    writer.writerow(data)
            else:
                # Append to existing file
                with open(csv_filename, 'a', newline='') as f:
                    writer = DictWriter(f, fieldnames=data.keys())
                    writer.writerow(data)
            
            logger.debug(f"OHLC data written to {csv_filename}")
        
        except Exception as e:
            logger.error(f"Error writing CSV: {e}")
    
    def on_error(self, message: dict):
        """Handle WebSocket errors"""
        logger.error(f"OHLC WebSocket Error: {message}")
    
    def on_close(self, message: dict):
        """Handle WebSocket connection close"""
        logger.warning(f"OHLC WebSocket closed: {message}")
        self.is_collecting = False
    
    def on_open(self):
        """Handle WebSocket connection open"""
        logger.info("OHLC WebSocket connection opened")
        self.is_collecting = True
        
        if self.active_symbols:
            try:
                self.fyers.subscribe(
                    symbols=self.active_symbols,
                    data_type="SymbolUpdate"
                )
                self.fyers.keep_running()
                logger.info(f"OHLC collection started for: {self.active_symbols}")
            except Exception as e:
                logger.error(f"Failed to start OHLC collection: {e}")
    
    def start_collection(self, symbols: List[str], timeframe: int = 1):
        """Start OHLC collection from WebSocket"""
        try:
            self.active_symbols = symbols
            self.timeframe_minutes = timeframe
            self._init_fyers()
            
            # Create WebSocket instance
            ws = data_ws.FyersDataSocket(
                access_token=access_token,
                log_path=LOGS_DIR,
                litemode=False,
                write_to_file=False,
                reconnect=True,
                on_connect=self.on_open,
                on_close=self.on_close,
                on_error=self.on_error,
                on_message=self.on_message
            )
            
            self.fyers = ws
            ws.connect()
            logger.info(f"OHLC collection started for {len(symbols)} symbols at {timeframe}min bars")
            return True
        
        except Exception as e:
            logger.error(f"Failed to start OHLC collection: {e}")
            return False
    
    def stop_collection(self):
        """Stop OHLC collection"""
        try:
            if self.fyers:
                self.fyers.close()
            self.is_collecting = False
            logger.info("OHLC collection stopped")
        except Exception as e:
            logger.error(f"Error stopping OHLC collection: {e}")
    
    def get_status(self) -> OHLCCollectionStatus:
        """Get current OHLC collection status"""
        csv_files = []
        for symbol in self.active_symbols:
            csv_file = f"{symbol.replace(':', '_')}_OHLC.csv"
            if os.path.exists(f"{DATA_DIR}/{csv_file}"):
                csv_files.append(csv_file)
        
        return OHLCCollectionStatus(
            status="collecting" if self.is_collecting else "stopped",
            active_symbols=self.active_symbols,
            timeframe_minutes=self.timeframe_minutes,
            bars_collected=self.bars_collected,
            csv_files=csv_files
        )


# ==================== GLOBAL INSTANCES ====================

streaming_service = RealtimeStreamingService()
ohlc_service = OHLCCollectionService()


# ==================== API ENDPOINTS ====================

@router.post("/stream/connect")
async def start_streaming(request: SubscriptionRequest, background_tasks: BackgroundTasks):
    """
    Start real-time streaming of tick data
    
    Params:
    - symbols: List of symbols to stream (e.g., ["NSE:SBIN-EQ", "NSE:ADANIENT-EQ"])
    - data_type: Type of data (default: "SymbolUpdate")
    
    Returns:
    - Connection status and active symbols
    """
    try:
        background_tasks.add_task(streaming_service.connect, request.symbols)
        return {
            "status": "connecting",
            "symbols": request.symbols,
            "message": f"Starting real-time stream for {len(request.symbols)} symbols"
        }
    except Exception as e:
        logger.error(f"Streaming connection failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/stream/disconnect")
async def stop_streaming():
    """Stop real-time streaming"""
    try:
        streaming_service.disconnect()
        return {"status": "disconnected", "message": "Real-time streaming stopped"}
    except Exception as e:
        logger.error(f"Streaming disconnection failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stream/status")
async def get_streaming_status() -> StreamingStatus:
    """Get current streaming status"""
    return streaming_service.get_status()


@router.get("/stream/latest-tick")
async def get_latest_tick(symbol: str = Query(...)):
    """Get latest tick (LTP) for a symbol"""
    try:
        ltp = streaming_service.get_latest_tick(symbol)
        if ltp is None:
            raise HTTPException(status_code=404, detail=f"No data for symbol {symbol}")
        return {"symbol": symbol, "ltp": ltp, "timestamp": datetime.now().isoformat()}
    except Exception as e:
        logger.error(f"Error retrieving tick: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/ohlc/start")
async def start_ohlc_collection(
    symbols: List[str] = Query(...),
    timeframe: int = Query(1),
    background_tasks: BackgroundTasks = None
):
    """
    Start OHLC bar collection and aggregation
    
    Params:
    - symbols: List of symbols to collect (e.g., ["NSE:SBIN-EQ", "MCX:CRUDEOIL24MARFUT"])
    - timeframe: Bar timeframe in minutes (default: 1)
    
    Returns:
    - OHLC collection status
    """
    try:
        if background_tasks:
            background_tasks.add_task(ohlc_service.start_collection, symbols, timeframe)
        else:
            ohlc_service.start_collection(symbols, timeframe)
        
        return {
            "status": "starting",
            "symbols": symbols,
            "timeframe_minutes": timeframe,
            "message": f"Starting OHLC collection at {timeframe}min bars"
        }
    except Exception as e:
        logger.error(f"OHLC collection start failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/ohlc/stop")
async def stop_ohlc_collection():
    """Stop OHLC collection"""
    try:
        ohlc_service.stop_collection()
        return {
            "status": "stopped",
            "bars_collected": ohlc_service.bars_collected,
            "message": "OHLC collection stopped"
        }
    except Exception as e:
        logger.error(f"OHLC collection stop failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/ohlc/status")
async def get_ohlc_status() -> OHLCCollectionStatus:
    """Get current OHLC collection status"""
    return ohlc_service.get_status()


@router.get("/ohlc/data")
async def get_ohlc_data(symbol: str = Query(...)):
    """Get collected OHLC data for a symbol"""
    try:
        if symbol not in ohlc_service.csv_data:
            raise HTTPException(status_code=404, detail=f"No OHLC data for {symbol}")
        
        data = ohlc_service.csv_data[symbol]
        return {
            "symbol": symbol,
            "bars_count": len(data),
            "latest_bar": data[-1] if data else None,
            "data": data[-20:] if data else []  # Last 20 bars
        }
    except Exception as e:
        logger.error(f"Error retrieving OHLC data: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/websocket-data/info")
async def get_websocket_info():
    """Get WebSocket data collection system information"""
    return {
        "service": "Real-Time WebSocket Data Collection & OHLC Aggregation",
        "version": "1.0.0",
        "endpoints": {
            "streaming": {
                "connect": "POST /api/websocket/stream/connect",
                "disconnect": "POST /api/websocket/stream/disconnect",
                "status": "GET /api/websocket/stream/status",
                "latest_tick": "GET /api/websocket/stream/latest-tick?symbol=NSE:SBIN-EQ"
            },
            "ohlc": {
                "start": "POST /api/websocket/ohlc/start?symbols=NSE:SBIN-EQ&timeframe=1",
                "stop": "POST /api/websocket/ohlc/stop",
                "status": "GET /api/websocket/ohlc/status",
                "data": "GET /api/websocket/ohlc/data?symbol=NSE:SBIN-EQ"
            }
        },
        "features": [
            "Real-time tick data streaming (LTP updates)",
            "OHLC bar aggregation at configurable timeframes",
            "CSV export for historical analysis",
            "Multi-symbol portfolio support",
            "Automatic reconnection on disconnection",
            "In-memory tick buffering (last 100 ticks per symbol)"
        ],
        "data_storage": {
            "location": DATA_DIR,
            "format": "CSV",
            "naming": "SYMBOL_OHLC.csv (e.g., NSE_SBIN-EQ_OHLC.csv)"
        },
        "usage_example": {
            "step_1": "POST /api/websocket/ohlc/start?symbols=NSE:SBIN-EQ,NSE:ADANIENT-EQ&timeframe=5",
            "step_2": "Monitor with GET /api/websocket/ohlc/status",
            "step_3": "Retrieve bars with GET /api/websocket/ohlc/data?symbol=NSE:SBIN-EQ",
            "step_4": "CSV files created in backend/data/websocket/"
        }
    }
