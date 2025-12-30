"""
Automated Trading System Module
Implements algorithmic trading strategies using technical indicators

Created By: Aseem Singhal
Fyers API V3
"""

import logging
import pandas as pd
import numpy as np
from typing import Optional, Dict, List, Any
from datetime import datetime, timedelta

from fastapi import APIRouter, Query
from pydantic import BaseModel

# Try to import Fyers API
try:
    from fyers_apiv3 import fyersModel
    FYERS_AVAILABLE = True
except ImportError:
    FYERS_AVAILABLE = False

logger = logging.getLogger(__name__)
router = APIRouter()


# ============================================================================
# Models
# ============================================================================


class TradeSignal(BaseModel):
    """Trade signal from automated system"""
    symbol: str
    signal_type: str  # BUY, SELL, EXIT, HOLD
    entry_price: Optional[float]
    stop_loss: Optional[float]
    target: Optional[float]
    quantity: Optional[int]
    confidence: float


class TradeRequest(BaseModel):
    """Trade request for order placement"""
    symbol: str
    side: str  # BUY or SELL
    quantity: int
    order_type: str = "MARKET"
    limit_price: Optional[float] = None
    stop_price: Optional[float] = None


class TradeStatus(BaseModel):
    """Status of an active trade"""
    symbol: str
    side: str  # BUY or SELL
    entry_price: float
    stop_loss: float
    current_price: float
    pnl: float
    pnl_percent: float


# ============================================================================
# Automated Trading Service
# ============================================================================


class AutomatedTradingService:
    """Service for automated trading operations"""
    
    def __init__(self):
        self.fyers = None
        self.initialized = False
        self.active_trades = {}  # Dictionary to track active trades
        self._init_fyers()
    
    def _init_fyers(self):
        """Initialize Fyers API client"""
        if not FYERS_AVAILABLE:
            logger.warning("Fyers API not available.")
            return
        
        try:
            from pathlib import Path
            
            client_id_path = Path("client_id.txt")
            access_token_path = Path("access_token.txt")
            
            if client_id_path.exists() and access_token_path.exists():
                client_id = client_id_path.read_text().strip()
                access_token = access_token_path.read_text().strip()
                
                self.fyers = fyersModel.FyersModel(
                    client_id=client_id,
                    is_async=False,
                    token=access_token,
                    log_path=""
                )
                self.initialized = True
                logger.info("Fyers client for automated trading initialized")
        
        except Exception as e:
            logger.error(f"Failed to initialize Fyers client: {e}")
    
    def fetch_ohlc(self, ticker: str, interval: str, duration: int) -> Optional[pd.DataFrame]:
        """Fetch OHLC data"""
        if not self.initialized or not self.fyers:
            return None
        
        try:
            import datetime as dt
            import pytz
            
            range_from = dt.date.today() - dt.timedelta(days=duration)
            range_to = dt.date.today()
            
            from_date_string = range_from.strftime("%Y-%m-%d")
            to_date_string = range_to.strftime("%Y-%m-%d")
            
            data = {
                "symbol": ticker,
                "resolution": interval,
                "date_format": "1",
                "range_from": from_date_string,
                "range_to": to_date_string,
                "cont_flag": "1"
            }
            
            response = self.fyers.history(data=data)
            
            if response and 'candles' in response:
                candles = response['candles']
                
                # Create DataFrame
                columns = ['Timestamp', 'Open', 'High', 'Low', 'Close', 'Volume']
                df = pd.DataFrame(candles, columns=columns)
                
                # Convert timestamp to datetime
                df['Timestamp'] = pd.to_datetime(df['Timestamp'], unit='s')
                
                logger.info(f"Fetched {len(df)} candles for {ticker}")
                return df
            
            return None
        
        except Exception as e:
            logger.error(f"Error fetching OHLC: {e}")
            return None
    
    @staticmethod
    def calculate_atr(ohlc_df: pd.DataFrame, period: int = 14) -> pd.Series:
        """Calculate Average True Range"""
        df = ohlc_df.copy()
        
        df['High-Low'] = abs(df['High'] - df['Low'])
        df['High-PrevClose'] = abs(df['High'] - df['Close'].shift(1))
        df['Low-PrevClose'] = abs(df['Low'] - df['Close'].shift(1))
        df['TR'] = df[['High-Low', 'High-PrevClose', 'Low-PrevClose']].max(axis=1, skipna=False)
        df['ATR'] = df['TR'].ewm(com=period, min_periods=period).mean()
        
        return df['ATR']
    
    @staticmethod
    def calculate_rsi(ohlc_df: pd.DataFrame, period: int = 14) -> pd.Series:
        """Calculate Relative Strength Index"""
        df = ohlc_df.copy()
        
        delta = df['Close'].diff()
        gain = delta.where(delta > 0, 0)
        loss = -delta.where(delta < 0, 0)
        avg_gain = gain.rolling(window=period, min_periods=1).mean()
        avg_loss = loss.rolling(window=period, min_periods=1).mean()
        rs = avg_gain / avg_loss
        rsi = 100 - (100 / (1 + rs))
        
        return rsi
    
    @staticmethod
    def calculate_supertrend(ohlc_df: pd.DataFrame, period: int = 7, multiplier: float = 3.0) -> pd.Series:
        """
        Calculate Supertrend indicator
        
        Returns the supertrend line which acts as dynamic support/resistance
        """
        df = ohlc_df.copy()
        
        # Calculate ATR
        df['High-Low'] = abs(df['High'] - df['Low'])
        df['High-PrevClose'] = abs(df['High'] - df['Close'].shift(1))
        df['Low-PrevClose'] = abs(df['Low'] - df['Close'].shift(1))
        df['TR'] = df[['High-Low', 'High-PrevClose', 'Low-PrevClose']].max(axis=1, skipna=False)
        df['ATR'] = df['TR'].ewm(com=period, min_periods=period).mean()
        
        # Calculate basic bands
        df["BasicUpper"] = ((df['High'] + df['Low']) / 2) + multiplier * df['ATR']
        df["BasicLower"] = ((df['High'] + df['Low']) / 2) - multiplier * df['ATR']
        
        # Calculate final bands with anti-whipsaw logic
        df["FinalUpper"] = df["BasicUpper"]
        df["FinalLower"] = df["BasicLower"]
        
        ind = df.index
        for i in range(period, len(df)):
            if df['Close'][i-1] <= df['FinalUpper'][i-1]:
                df.loc[ind[i], 'FinalUpper'] = min(df['BasicUpper'][i], df['FinalUpper'][i-1])
            else:
                df.loc[ind[i], 'FinalUpper'] = df['BasicUpper'][i]
        
        for i in range(period, len(df)):
            if df['Close'][i-1] >= df['FinalLower'][i-1]:
                df.loc[ind[i], 'FinalLower'] = max(df['BasicLower'][i], df['FinalLower'][i-1])
            else:
                df.loc[ind[i], 'FinalLower'] = df['BasicLower'][i]
        
        # Calculate supertrend
        df['Supertrend'] = np.nan
        for test in range(period, len(df)):
            if df['Close'][test-1] <= df['FinalUpper'][test-1] and df['Close'][test] > df['FinalUpper'][test]:
                df.loc[ind[test], 'Supertrend'] = df['FinalLower'][test]
                break
            if df['Close'][test-1] >= df['FinalLower'][test-1] and df['Close'][test] < df['FinalLower'][test]:
                df.loc[ind[test], 'Supertrend'] = df['FinalUpper'][test]
                break
        
        for i in range(test+1, len(df)):
            if df['Supertrend'][i-1] == df['FinalUpper'][i-1] and df['Close'][i] <= df['FinalUpper'][i]:
                df.loc[ind[i], 'Supertrend'] = df['FinalUpper'][i]
            elif df['Supertrend'][i-1] == df['FinalUpper'][i-1] and df['Close'][i] >= df['FinalUpper'][i]:
                df.loc[ind[i], 'Supertrend'] = df['FinalLower'][i]
            elif df['Supertrend'][i-1] == df['FinalLower'][i-1] and df['Close'][i] >= df['FinalLower'][i]:
                df.loc[ind[i], 'Supertrend'] = df['FinalLower'][i]
            elif df['Supertrend'][i-1] == df['FinalLower'][i-1] and df['Close'][i] <= df['FinalLower'][i]:
                df.loc[ind[i], 'Supertrend'] = df['FinalUpper'][i]
        
        return df['Supertrend']
    
    def generate_trade_signal(self, symbol: str, capital: int = 5000, 
                             st_period: int = 7, st_multiplier: float = 3.0,
                             rsi_period: int = 14) -> Dict[str, Any]:
        """
        Generate trading signal using Supertrend + RSI strategy
        
        ALGORITHM:
        1. Calculate Supertrend indicator
        2. Calculate RSI indicator
        3. BUY Signal: Supertrend is green (below close) + RSI > 20 + no existing trade
        4. SELL Signal: Supertrend is red (above close) + RSI < 70 + no existing trade
        5. EXIT Signal: Stoploss hit or Supertrend reverses
        
        Args:
            symbol: Trading symbol (e.g., 'NSE:SBIN-EQ')
            capital: Capital per trade for position sizing
            st_period: Supertrend period (default 7)
            st_multiplier: Supertrend multiplier (default 3.0)
            rsi_period: RSI period (default 14)
        
        Returns:
            Dict with signal details including:
            - signal_type: BUY, SELL, EXIT, or HOLD
            - entry_price: Entry price for new trades
            - stop_loss: Stoploss price (0.5% from entry)
            - quantity: Position size based on capital
            - confidence: Signal confidence level
        
        Example:
            >>> signal = trading_service.generate_trade_signal('NSE:SBIN-EQ', capital=5000)
            >>> if signal['signal_type'] == 'BUY':
            >>>     place_order(signal['symbol'], 'BUY', signal['quantity'])
        """
        try:
            # Fetch intraday data (5-min)
            ohlc = self.fetch_ohlc(symbol, "5", 5)
            
            if ohlc is None or len(ohlc) < st_period:
                logger.warning(f"Insufficient data for {symbol}")
                return {
                    "symbol": symbol,
                    "signal_type": "HOLD",
                    "entry_price": None,
                    "stop_loss": None,
                    "target": None,
                    "quantity": None,
                    "confidence": 0.0,
                    "reason": "Insufficient data"
                }
            
            # Calculate indicators
            st_line = self.calculate_supertrend(ohlc, period=st_period, multiplier=st_multiplier)
            rsi_line = self.calculate_rsi(ohlc, period=rsi_period)
            
            # Get current values
            current_close = float(ohlc['Close'].iloc[-1])
            current_high = float(ohlc['High'].iloc[-1])
            current_low = float(ohlc['Low'].iloc[-1])
            current_st = float(st_line.iloc[-1]) if pd.notna(st_line.iloc[-1]) else None
            current_rsi = float(rsi_line.iloc[-1]) if pd.notna(rsi_line.iloc[-1]) else 50.0
            
            # Calculate position size
            quantity = int(capital / current_close)
            quantity = max(1, quantity)  # Minimum 1 unit
            
            # Get previous values
            prev_st = float(st_line.iloc[-2]) if len(st_line) > 1 and pd.notna(st_line.iloc[-2]) else None
            
            signal_type = "HOLD"
            entry_price = None
            stop_loss = None
            target = None
            confidence = 0.5
            
            # Check if there's an active trade
            is_in_trade = symbol in self.active_trades and self.active_trades[symbol].get('status') == 'ACTIVE'
            
            if is_in_trade:
                trade = self.active_trades[symbol]
                
                # Check exit conditions
                if trade['side'] == 'BUY':
                    # Check if stoploss is hit
                    if current_low < trade['stop_loss']:
                        signal_type = "EXIT"
                        confidence = 0.9
                        logger.info(f"{symbol}: BUY stoploss hit at {current_low}")
                    # Check if supertrend reverses (turns red)
                    elif current_st is not None and current_close < current_st:
                        signal_type = "EXIT"
                        confidence = 0.8
                        logger.info(f"{symbol}: Supertrend reversed to red")
                
                elif trade['side'] == 'SELL':
                    # Check if stoploss is hit
                    if current_high > trade['stop_loss']:
                        signal_type = "EXIT"
                        confidence = 0.9
                        logger.info(f"{symbol}: SELL stoploss hit at {current_high}")
                    # Check if supertrend reverses (turns green)
                    elif current_st is not None and current_close > current_st:
                        signal_type = "EXIT"
                        confidence = 0.8
                        logger.info(f"{symbol}: Supertrend reversed to green")
            
            else:
                # Entry signals (only if no active trade)
                # BUY: Supertrend is green (below close) + RSI > 20
                if current_st is not None and current_close > current_st and current_rsi > 20:
                    signal_type = "BUY"
                    entry_price = current_close
                    stop_loss = current_close * (1 - 0.005)  # 0.5% stoploss
                    target = current_close * (1 + 0.015)  # 1.5% target
                    confidence = 0.8
                    logger.info(f"{symbol}: BUY signal - Supertrend green, RSI {current_rsi:.1f}")
                
                # SELL: Supertrend is red (above close) + RSI < 70
                elif current_st is not None and current_close < current_st and current_rsi < 70:
                    signal_type = "SELL"
                    entry_price = current_close
                    stop_loss = current_close * (1 + 0.005)  # 0.5% stoploss
                    target = current_close * (1 - 0.015)  # 1.5% target
                    confidence = 0.8
                    logger.info(f"{symbol}: SELL signal - Supertrend red, RSI {current_rsi:.1f}")
            
            result = {
                "symbol": symbol,
                "signal_type": signal_type,
                "entry_price": entry_price,
                "stop_loss": stop_loss,
                "target": target,
                "quantity": quantity,
                "confidence": confidence,
                "current_price": current_close,
                "current_rsi": current_rsi,
                "supertrend": current_st,
                "indicators": {
                    "rsi": current_rsi,
                    "supertrend": current_st,
                    "close": current_close,
                    "high": current_high,
                    "low": current_low
                }
            }
            
            return result
        
        except Exception as e:
            logger.error(f"Error generating trade signal for {symbol}: {e}")
            return {
                "symbol": symbol,
                "signal_type": "HOLD",
                "entry_price": None,
                "stop_loss": None,
                "target": None,
                "quantity": None,
                "confidence": 0.0,
                "error": str(e)
            }
    
    def update_trade_status(self, symbol: str, current_price: float) -> Dict[str, Any]:
        """
        Update status of active trade
        
        Args:
            symbol: Trading symbol
            current_price: Current market price
        
        Returns:
            Trade status with PnL information
        """
        if symbol not in self.active_trades:
            return {"status": "NO_TRADE", "symbol": symbol}
        
        trade = self.active_trades[symbol]
        
        if trade['status'] != 'ACTIVE':
            return {"status": "CLOSED", "symbol": symbol}
        
        entry_price = trade['entry_price']
        
        if trade['side'] == 'BUY':
            pnl = (current_price - entry_price) * trade['quantity']
            pnl_percent = ((current_price - entry_price) / entry_price) * 100
        else:  # SELL
            pnl = (entry_price - current_price) * trade['quantity']
            pnl_percent = ((entry_price - current_price) / entry_price) * 100
        
        result = {
            "status": "ACTIVE",
            "symbol": symbol,
            "side": trade['side'],
            "entry_price": entry_price,
            "current_price": current_price,
            "stop_loss": trade['stop_loss'],
            "pnl": round(pnl, 2),
            "pnl_percent": round(pnl_percent, 2),
            "quantity": trade['quantity']
        }
        
        logger.info(f"{symbol}: PnL = {pnl:.2f} ({pnl_percent:.2f}%)")
        return result
    
    def place_trade(self, symbol: str, side: str, quantity: int, entry_price: float, 
                   stop_loss: float) -> bool:
        """
        Register a trade in the active trades dictionary
        
        Args:
            symbol: Trading symbol
            side: BUY or SELL
            quantity: Position size
            entry_price: Entry price
            stop_loss: Stoploss price
        
        Returns:
            True if trade registered successfully
        """
        try:
            self.active_trades[symbol] = {
                "status": "ACTIVE",
                "side": side,
                "entry_price": entry_price,
                "stop_loss": stop_loss,
                "quantity": quantity,
                "entry_time": datetime.now().isoformat()
            }
            logger.info(f"Trade registered: {symbol} {side} {quantity} @ {entry_price}, SL: {stop_loss}")
            return True
        
        except Exception as e:
            logger.error(f"Error registering trade: {e}")
            return False
    
    def close_trade(self, symbol: str, exit_price: float) -> Dict[str, Any]:
        """
        Close an active trade
        
        Args:
            symbol: Trading symbol
            exit_price: Exit price
        
        Returns:
            Trade closure details with PnL
        """
        if symbol not in self.active_trades:
            return {"status": "NO_TRADE"}
        
        trade = self.active_trades[symbol]
        entry_price = trade['entry_price']
        quantity = trade['quantity']
        side = trade['side']
        
        if side == 'BUY':
            pnl = (exit_price - entry_price) * quantity
        else:
            pnl = (entry_price - exit_price) * quantity
        
        result = {
            "symbol": symbol,
            "side": side,
            "entry_price": entry_price,
            "exit_price": exit_price,
            "quantity": quantity,
            "pnl": round(pnl, 2),
            "status": "CLOSED"
        }
        
        self.active_trades[symbol]['status'] = 'CLOSED'
        logger.info(f"Trade closed: {symbol} {side} - PnL: {pnl:.2f}")
        return result


# Initialize service
trading_service = AutomatedTradingService()


# ============================================================================
# API Endpoints
# ============================================================================


@router.get("/generate-trade-signal")
async def generate_trade_signal_endpoint(
    symbol: str = Query(...),
    capital: int = Query(5000),
    st_period: int = Query(7),
    st_multiplier: float = Query(3.0),
    rsi_period: int = Query(14)
):
    """
    Generate automated trading signal using Supertrend + RSI strategy
    
    Strategy Rules:
    - BUY: Supertrend is green (below close) + RSI > 20
    - SELL: Supertrend is red (above close) + RSI < 70
    - EXIT: Stoploss hit OR Supertrend reverses
    
    Parameters:
    - capital: Capital per trade (default 5000, used for position sizing)
    - st_period: Supertrend period (default 7)
    - st_multiplier: Supertrend multiplier (default 3.0)
    - rsi_period: RSI lookback period (default 14)
    
    Example:
    /api/trading/generate-trade-signal?symbol=NSE:SBIN-EQ&capital=5000&st_period=7
    """
    try:
        signal = trading_service.generate_trade_signal(
            symbol=symbol,
            capital=capital,
            st_period=st_period,
            st_multiplier=st_multiplier,
            rsi_period=rsi_period
        )
        
        return {
            "status": "success",
            "data": signal
        }
    
    except Exception as e:
        logger.error(f"Error generating signal: {e}")
        return {"status": "error", "message": str(e)}


@router.post("/place-trade")
async def place_trade_endpoint(
    symbol: str = Query(...),
    side: str = Query(...),
    quantity: int = Query(...),
    entry_price: float = Query(...),
    stop_loss: float = Query(...)
):
    """
    Register a trade in the active trades tracking system
    
    This endpoint registers trades for monitoring and exit management.
    
    Parameters:
    - symbol: Trading symbol (e.g., 'NSE:SBIN-EQ')
    - side: 'BUY' or 'SELL'
    - quantity: Position size
    - entry_price: Entry price for the trade
    - stop_loss: Stoploss price
    
    Example:
    /api/trading/place-trade?symbol=NSE:SBIN-EQ&side=BUY&quantity=10&entry_price=500&stop_loss=497.5
    """
    try:
        success = trading_service.place_trade(
            symbol=symbol,
            side=side,
            quantity=quantity,
            entry_price=entry_price,
            stop_loss=stop_loss
        )
        
        if success:
            return {
                "status": "success",
                "message": f"Trade registered: {symbol} {side} {quantity} @ {entry_price}",
                "data": {
                    "symbol": symbol,
                    "side": side,
                    "quantity": quantity,
                    "entry_price": entry_price,
                    "stop_loss": stop_loss
                }
            }
        else:
            return {"status": "error", "message": "Failed to register trade"}
    
    except Exception as e:
        logger.error(f"Error placing trade: {e}")
        return {"status": "error", "message": str(e)}


@router.get("/trade-status")
async def get_trade_status_endpoint(
    symbol: str = Query(...),
    current_price: float = Query(...)
):
    """
    Get status of an active trade
    
    Returns current PnL and trade details
    
    Parameters:
    - symbol: Trading symbol
    - current_price: Current market price
    
    Example:
    /api/trading/trade-status?symbol=NSE:SBIN-EQ&current_price=505.50
    """
    try:
        status = trading_service.update_trade_status(symbol=symbol, current_price=current_price)
        
        return {
            "status": "success",
            "data": status
        }
    
    except Exception as e:
        logger.error(f"Error getting trade status: {e}")
        return {"status": "error", "message": str(e)}


@router.post("/close-trade")
async def close_trade_endpoint(
    symbol: str = Query(...),
    exit_price: float = Query(...)
):
    """
    Close an active trade
    
    Parameters:
    - symbol: Trading symbol
    - exit_price: Exit price for closing the trade
    
    Example:
    /api/trading/close-trade?symbol=NSE:SBIN-EQ&exit_price=507.50
    """
    try:
        result = trading_service.close_trade(symbol=symbol, exit_price=exit_price)
        
        return {
            "status": "success",
            "data": result
        }
    
    except Exception as e:
        logger.error(f"Error closing trade: {e}")
        return {"status": "error", "message": str(e)}


@router.get("/active-trades")
async def get_active_trades_endpoint():
    """
    Get all active trades
    
    Returns list of currently active trades
    
    Example:
    /api/trading/active-trades
    """
    try:
        active = {
            symbol: trade for symbol, trade in trading_service.active_trades.items()
            if trade.get('status') == 'ACTIVE'
        }
        
        return {
            "status": "success",
            "data": {
                "active_trades_count": len(active),
                "trades": active
            }
        }
    
    except Exception as e:
        logger.error(f"Error fetching active trades: {e}")
        return {"status": "error", "message": str(e)}


@router.get("/trading-info")
async def get_trading_info():
    """Get information about the automated trading system"""
    return {
        "trading_system": {
            "name": "Supertrend + RSI Automated Trading",
            "creator": "Aseem Singhal",
            "strategy": "Combine Supertrend indicator with RSI for entry/exit signals",
            "indicators": [
                {
                    "name": "Supertrend",
                    "period": 7,
                    "multiplier": 3.0,
                    "description": "Dynamic support/resistance with trend confirmation"
                },
                {
                    "name": "RSI",
                    "period": 14,
                    "description": "Momentum confirmation (>20 for buy, <70 for sell)"
                }
            ],
            "signals": {
                "buy": "Supertrend green (below close) + RSI > 20",
                "sell": "Supertrend red (above close) + RSI < 70",
                "exit": "Stoploss hit or Supertrend reversal"
            },
            "risk_management": {
                "stoploss": "0.5% from entry price",
                "target": "1.5% from entry price",
                "capital_per_trade": 5000,
                "position_sizing": "Capital / Entry Price"
            },
            "endpoints": [
                {
                    "method": "GET",
                    "path": "/generate-trade-signal",
                    "description": "Generate trading signal for a symbol"
                },
                {
                    "method": "POST",
                    "path": "/place-trade",
                    "description": "Register active trade for monitoring"
                },
                {
                    "method": "GET",
                    "path": "/trade-status",
                    "description": "Get current PnL and status of trade"
                },
                {
                    "method": "POST",
                    "path": "/close-trade",
                    "description": "Close an active trade"
                },
                {
                    "method": "GET",
                    "path": "/active-trades",
                    "description": "Get all currently active trades"
                }
            ]
        }
    }
