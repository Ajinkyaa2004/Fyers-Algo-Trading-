"""
Price Action Pattern Detection API
Identifies candlestick patterns for technical analysis

Created By: Aseem Singhal
Fyers API V3
"""

import logging
import pandas as pd
from typing import Optional, List, Dict, Any
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


class PatternDetectionRequest(BaseModel):
    """Pattern detection request"""
    symbol: str
    resolution: str
    duration: int = 5  # days


class PatternResponse(BaseModel):
    """Pattern detection response"""
    symbol: str
    total_candles: int
    patterns_found: Dict[str, int]
    candles_with_patterns: List[Dict[str, Any]]


# ============================================================================
# Price Action Pattern Detection Service
# ============================================================================


class PriceActionService:
    """Service for detecting candlestick patterns"""
    
    def __init__(self):
        self.fyers = None
        self.initialized = False
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
                logger.info("Fyers client for patterns initialized")
        
        except Exception as e:
            logger.error(f"Failed to initialize Fyers client: {e}")
    
    def fetch_ohlc(self, ticker: str, interval: str, duration: int) -> Optional[pd.DataFrame]:
        """Fetch OHLC data for pattern analysis"""
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
                
                # Convert Timestamp to datetime in UTC
                df['Timestamp'] = pd.to_datetime(df['Timestamp'], unit='s').dt.tz_localize(pytz.utc)
                
                # Convert to IST
                ist = pytz.timezone('Asia/Kolkata')
                df['Timestamp'] = df['Timestamp'].dt.tz_convert(ist)
                
                logger.info(f"Fetched {len(df)} candles for {ticker}")
                return df
            
            return None
        
        except Exception as e:
            logger.error(f"Error fetching OHLC: {e}")
            return None
    
    @staticmethod
    def detect_doji(ohlc_df: pd.DataFrame, threshold: float = 0.1) -> pd.DataFrame:
        """
        Detect DOJI candlestick patterns
        
        DOJI: A candle where the open and close prices are nearly equal
        Formula: abs(Open - Close) <= threshold * (High - Low)
        
        Args:
            ohlc_df: DataFrame with OHLC data
            threshold: Sensitivity threshold (default 0.1 = 10%)
        
        Returns:
            DataFrame with 'Doji' column added
        """
        df = ohlc_df.copy()
        doji_values = []
        
        for index, row in df.iterrows():
            oc_diff = abs(row["Open"] - row["Close"])
            hl_range = row['High'] - row['Low']
            
            # DOJI condition
            if oc_diff <= threshold * hl_range:
                doji_values.append(True)
            else:
                doji_values.append(False)
        
        df["Doji"] = doji_values
        
        logger.info(f"Detected {sum(doji_values)} DOJI patterns out of {len(df)} candles")
        return df
    
    @staticmethod
    def detect_hammer(ohlc_df: pd.DataFrame) -> pd.DataFrame:
        """
        Detect HAMMER candlestick patterns
        
        HAMMER: Small body at the top, long lower wick (reversal pattern)
        
        Conditions:
        1. Red Candle (Open > Close): Open - Low >= 2 * (High - Close)
        2. Green Candle (Close > Open): Close - Low >= 2 * (High - Open)
        
        The lower wick must be at least 2x the upper wick
        
        Args:
            ohlc_df: DataFrame with OHLC data
        
        Returns:
            DataFrame with 'Hammer' column added
        """
        df = ohlc_df.copy()
        hammer_values = []
        
        for index, row in df.iterrows():
            # Red candle (Open > Close)
            if (row["Open"] - row["Close"] > 0) and \
               (row["Open"] - row["Low"] >= 2 * (row["High"] - row["Close"])):
                hammer_values.append(True)
            # Green candle (Close > Open)
            elif (row["Close"] - row["Open"] > 0) and \
                 (row["Close"] - row["Low"] >= 2 * (row["High"] - row["Open"])):
                hammer_values.append(True)
            else:
                hammer_values.append(False)
        
        df["Hammer"] = hammer_values
        logger.info(f"Detected {sum(hammer_values)} HAMMER patterns")
        return df
    
    @staticmethod
    def detect_bullish_engulfing(ohlc_df: pd.DataFrame) -> pd.DataFrame:
        """
        Detect BULLISH ENGULFING candlestick patterns
        
        Bullish Engulfing:
        - Previous candle: Bearish (Open > Close)
        - Current candle: Bullish (Close > Open)
        - Current Open <= Previous Close AND Current Close >= Previous Open
        
        Args:
            ohlc_df: DataFrame with OHLC data
        
        Returns:
            DataFrame with 'BullishEngulfing' column added
        """
        df = ohlc_df.copy()
        bullish_engulfing_values = [False]  # First candle cannot have pattern
        
        for i in range(1, len(df)):
            previous_row = df.iloc[i - 1]
            current_row = df.iloc[i]
            
            # Previous candle bearish, current bullish, and current engulfs
            if (previous_row["Open"] > previous_row["Close"]) and \
               (current_row["Close"] > current_row["Open"]) and \
               (current_row["Open"] <= previous_row["Close"]) and \
               (current_row["Close"] >= previous_row["Open"]):
                bullish_engulfing_values.append(True)
            else:
                bullish_engulfing_values.append(False)
        
        df["BullishEngulfing"] = bullish_engulfing_values
        logger.info(f"Detected {sum(bullish_engulfing_values)} BULLISH ENGULFING patterns")
        return df
    
    @staticmethod
    def detect_bearish_engulfing(ohlc_df: pd.DataFrame) -> pd.DataFrame:
        """
        Detect BEARISH ENGULFING candlestick patterns
        
        Bearish Engulfing:
        - Previous candle: Bullish (Open < Close)
        - Current candle: Bearish (Open > Close)
        - Current Open >= Previous Close AND Current Close <= Previous Open
        
        Args:
            ohlc_df: DataFrame with OHLC data
        
        Returns:
            DataFrame with 'BearishEngulfing' column added
        """
        df = ohlc_df.copy()
        bearish_engulfing_values = [False]  # First candle cannot have pattern
        
        for i in range(1, len(df)):
            previous_row = df.iloc[i - 1]
            current_row = df.iloc[i]
            
            # Previous candle bullish, current bearish, and current engulfs
            if (previous_row["Open"] < previous_row["Close"]) and \
               (current_row["Open"] > current_row["Close"]) and \
               (current_row["Open"] >= previous_row["Close"]) and \
               (current_row["Close"] <= previous_row["Open"]):
                bearish_engulfing_values.append(True)
            else:
                bearish_engulfing_values.append(False)
        
        df["BearishEngulfing"] = bearish_engulfing_values
        logger.info(f"Detected {sum(bearish_engulfing_values)} BEARISH ENGULFING patterns")
        return df
    
    @staticmethod
    def detect_engulfing(ohlc_df: pd.DataFrame) -> pd.DataFrame:
        """
        Detect ENGULFING candlestick patterns (both bullish and bearish)
        
        Returns DataFrame with both BullishEngulfing and BearishEngulfing columns
        """
        df = PriceActionService.detect_bullish_engulfing(ohlc_df)
        df = PriceActionService.detect_bearish_engulfing(df)
        
        # Add combined Engulfing column
        df["Engulfing"] = df["BullishEngulfing"] | df["BearishEngulfing"]
        
        return df
    
    @staticmethod
    def detect_bullish_marubozu(ohlc_df: pd.DataFrame, buffer: float = 0.25) -> pd.DataFrame:
        """
        Detect BULLISH MARUBOZU candlestick patterns
        
        Bullish Marubozu: Green candle with no lower wick (strong bullish)
        Conditions:
        - Close > Open
        - abs(High - Close) <= buffer (minimal upper wick)
        - abs(Low - Open) <= buffer (minimal lower wick)
        
        Args:
            ohlc_df: DataFrame with OHLC data
            buffer: Tolerance for wick size (default 0.25)
        
        Returns:
            DataFrame with 'BullishMarubozu' column added
        """
        df = ohlc_df.copy()
        bullish_marubozu_values = []
        
        for index, row in df.iterrows():
            if (row["Close"] > row["Open"] and 
                abs(row["High"] - row["Close"]) <= buffer and 
                abs(row["Low"] - row["Open"]) <= buffer):
                bullish_marubozu_values.append(True)
            else:
                bullish_marubozu_values.append(False)
        
        df["BullishMarubozu"] = bullish_marubozu_values
        logger.info(f"Detected {sum(bullish_marubozu_values)} BULLISH MARUBOZU patterns")
        return df
    
    @staticmethod
    def detect_bearish_marubozu(ohlc_df: pd.DataFrame, buffer: float = 0.25) -> pd.DataFrame:
        """
        Detect BEARISH MARUBOZU candlestick patterns
        
        Bearish Marubozu: Red candle with no upper wick (strong bearish)
        Conditions:
        - Open > Close
        - abs(High - Open) <= buffer (minimal upper wick)
        - abs(Low - Close) <= buffer (minimal lower wick)
        
        Args:
            ohlc_df: DataFrame with OHLC data
            buffer: Tolerance for wick size (default 0.25)
        
        Returns:
            DataFrame with 'BearishMarubozu' column added
        """
        df = ohlc_df.copy()
        bearish_marubozu_values = []
        
        for index, row in df.iterrows():
            if (row["Open"] > row["Close"] and 
                abs(row["High"] - row["Open"]) <= buffer and 
                abs(row["Low"] - row["Close"]) <= buffer):
                bearish_marubozu_values.append(True)
            else:
                bearish_marubozu_values.append(False)
        
        df["BearishMarubozu"] = bearish_marubozu_values
        logger.info(f"Detected {sum(bearish_marubozu_values)} BEARISH MARUBOZU patterns")
        return df
    
    @staticmethod
    def detect_shooting_star(ohlc_df: pd.DataFrame) -> pd.DataFrame:
        """
        Detect SHOOTING STAR candlestick patterns
        
        Shooting Star: Long upper wick with small body at bottom (reversal pattern)
        Opposite of hammer - found at top of trends
        
        Conditions:
        - Red candle: High - Open >= 2 * (Close - Low)
        - Green candle: High - Close >= 2 * (Open - Low)
        
        Args:
            ohlc_df: DataFrame with OHLC data
        
        Returns:
            DataFrame with 'ShootingStar' column added
        """
        df = ohlc_df.copy()
        shooting_star_values = []
        
        for index, row in df.iterrows():
            # Red candle (Open > Close)
            if (row["Open"] - row["Close"] > 0) and \
               (row["High"] - row["Open"] >= 2 * (row["Close"] - row["Low"])):
                shooting_star_values.append(True)
            # Green candle (Close > Open)
            elif (row["Close"] - row["Open"] > 0) and \
                 (row["High"] - row["Close"] >= 2 * (row["Open"] - row["Low"])):
                shooting_star_values.append(True)
            else:
                shooting_star_values.append(False)
        
        df["ShootingStar"] = shooting_star_values
        logger.info(f"Detected {sum(shooting_star_values)} SHOOTING STAR patterns")
        return df
    
    @staticmethod
    def calculate_pivot_points(ohlc_df: pd.DataFrame) -> Dict[str, float]:
        """
        Calculate Pivot Points and Support/Resistance Levels
        
        Used for daily levels to predict price movements
        
        Formulas:
        - Pivot = (High + Low + Close) / 3
        - R1 = (2 * Pivot) - Low
        - R2 = Pivot + (High - Low)
        - R3 = High + 2 * (Pivot - Low)
        - S1 = (2 * Pivot) - High
        - S2 = Pivot - (High - Low)
        - S3 = Low - 2 * (High - Pivot)
        
        Args:
            ohlc_df: DataFrame with daily OHLC data
        
        Returns:
            Dictionary with pivot point levels
        """
        if len(ohlc_df) == 0:
            logger.warning("Empty DataFrame provided for pivot calculation")
            return {}
        
        # Get the most recent (last) day's values
        last_row = ohlc_df.iloc[-1]
        
        high = round(float(last_row["High"]), 2)
        low = round(float(last_row["Low"]), 2)
        close = round(float(last_row["Close"]), 2)
        
        # Calculate pivot and levels
        pivot = round((high + low + close) / 3, 2)
        r1 = round((2 * pivot) - low, 2)
        r2 = round(pivot + (high - low), 2)
        r3 = round(high + 2 * (pivot - low), 2)
        s1 = round((2 * pivot) - high, 2)
        s2 = round(pivot - (high - low), 2)
        s3 = round(low - 2 * (high - pivot), 2)
        
        result = {
            "high": high,
            "low": low,
            "close": close,
            "pivot": pivot,
            "resistance_1": r1,
            "resistance_2": r2,
            "resistance_3": r3,
            "support_1": s1,
            "support_2": s2,
            "support_3": s3
        }
        
        logger.info(f"Pivot Points Calculated: Pivot={pivot}, R1={r1}, S1={s1}")
        return result
    
    def detect_inside_bar(ohlc_df: pd.DataFrame) -> pd.DataFrame:
        """
        Detect INSIDE BAR patterns (mother bar + inside bar)
        
        Inside Bar: High < Previous High AND Low > Previous Low
        
        Args:
            ohlc_df: DataFrame with OHLC data
        
        Returns:
            DataFrame with 'InsideBar' column added
        """
        df = ohlc_df.copy()
        inside_bar_values = []
        
        for index in range(len(df)):
            if index == 0:
                inside_bar_values.append(False)
                continue
            
            prev_row = df.iloc[index - 1]
            curr_row = df.iloc[index]
            
            # Current bar is inside previous bar
            is_inside = (curr_row["High"] < prev_row["High"] and 
                        curr_row["Low"] > prev_row["Low"])
            
            inside_bar_values.append(is_inside)
        
        df["InsideBar"] = inside_bar_values
        logger.info(f"Detected {sum(inside_bar_values)} INSIDE BAR patterns")
        return df
    
    @staticmethod
    def detect_breakout(ohlc_df: pd.DataFrame, lookback: int = 5) -> pd.DataFrame:
        """
        Detect BREAKOUT patterns
        
        Breakout: Current High > Previous N candles High (or Low < Previous N candles Low)
        
        Args:
            ohlc_df: DataFrame with OHLC data
            lookback: Number of candles to look back
        
        Returns:
            DataFrame with 'Breakout' column added
        """
        df = ohlc_df.copy()
        breakout_values = []
        
        for index in range(len(df)):
            if index < lookback:
                breakout_values.append(False)
                continue
            
            curr_row = df.iloc[index]
            prev_rows = df.iloc[index - lookback:index]
            
            prev_high = prev_rows["High"].max()
            prev_low = prev_rows["Low"].min()
            
            # Breakout: high or low breakout
            is_breakout = (curr_row["High"] > prev_high or 
                          curr_row["Low"] < prev_low)
            
            breakout_values.append(is_breakout)
        
        df["Breakout"] = breakout_values
        logger.info(f"Detected {sum(breakout_values)} BREAKOUT patterns")
        return df
    
    def analyze_patterns(self, symbol: str, resolution: str, duration: int) -> Optional[Dict]:
        """
        Comprehensive pattern analysis
        
        Detects all patterns and returns summary
        """
        try:
            # Fetch OHLC data
            df = self.fetch_ohlc(symbol, resolution, duration)
            
            if df is None or len(df) == 0:
                logger.warning(f"No data fetched for {symbol}")
                return None
            
            # Detect all patterns
            df = self.detect_doji(df)
            df = self.detect_hammer(df)
            df = self.detect_engulfing(df)
            df = self.detect_bullish_marubozu(df)
            df = self.detect_bearish_marubozu(df)
            df = self.detect_shooting_star(df)
            df = self.detect_inside_bar(df)
            df = self.detect_breakout(df)
            
            # Count patterns
            patterns_found = {
                "Doji": int(df["Doji"].sum()),
                "Hammer": int(df["Hammer"].sum()),
                "BullishEngulfing": int(df["BullishEngulfing"].sum()),
                "BearishEngulfing": int(df["BearishEngulfing"].sum()),
                "Engulfing": int(df["Engulfing"].sum()),
                "BullishMarubozu": int(df["BullishMarubozu"].sum()),
                "BearishMarubozu": int(df["BearishMarubozu"].sum()),
                "ShootingStar": int(df["ShootingStar"].sum()),
                "InsideBar": int(df["InsideBar"].sum()),
                "Breakout": int(df["Breakout"].sum()),
            }
            
            # Get candles with patterns
            candles_with_patterns = []
            for idx, row in df.iterrows():
                patterns = []
                if row["Doji"]:
                    patterns.append("Doji")
                if row["Hammer"]:
                    patterns.append("Hammer")
                if row["BullishEngulfing"]:
                    patterns.append("BullishEngulfing")
                if row["BearishEngulfing"]:
                    patterns.append("BearishEngulfing")
                if row["BullishMarubozu"]:
                    patterns.append("BullishMarubozu")
                if row["BearishMarubozu"]:
                    patterns.append("BearishMarubozu")
                if row["ShootingStar"]:
                    patterns.append("ShootingStar")
                if row["InsideBar"]:
                    patterns.append("InsideBar")
                if row["Breakout"]:
                    patterns.append("Breakout")
                
                if patterns:
                    candles_with_patterns.append({
                        "timestamp": row["Timestamp"].isoformat() if pd.notna(row["Timestamp"]) else None,
                        "open": float(row["Open"]),
                        "high": float(row["High"]),
                        "low": float(row["Low"]),
                        "close": float(row["Close"]),
                        "volume": int(row["Volume"]),
                        "patterns": patterns
                    })
            
            result = {
                "symbol": symbol,
                "resolution": resolution,
                "total_candles": len(df),
                "patterns_found": patterns_found,
                "candles_with_patterns": candles_with_patterns
            }
            
            logger.info(f"Pattern analysis complete for {symbol}: {patterns_found}")
            return result
        
        except Exception as e:
            logger.error(f"Error analyzing patterns: {e}")
            return None


# Initialize service
price_action_service = PriceActionService()


# ============================================================================
# API Endpoints
# ============================================================================


@router.post("/analyze-patterns")
async def analyze_patterns(request: PatternDetectionRequest):
    """
    Analyze price action patterns for a symbol
    
    Detects:
    - DOJI: Open ≈ Close
    - HAMMER: Small body with long lower wick
    - ENGULFING: Current candle engulfs previous
    - INSIDE BAR: Current bar inside previous bar
    - BREAKOUT: New high or low over lookback period
    
    Example request:
    {
        "symbol": "NSE:SBIN-EQ",
        "resolution": "30",
        "duration": 5
    }
    """
    try:
        result = price_action_service.analyze_patterns(
            symbol=request.symbol,
            resolution=request.resolution,
            duration=request.duration
        )
        
        if result:
            return {"status": "success", "data": result}
        else:
            return {"status": "error", "message": "Failed to analyze patterns"}
    
    except Exception as e:
        logger.error(f"Error in analyze patterns endpoint: {e}")
        return {"status": "error", "message": str(e)}


@router.get("/detect-doji")
async def detect_doji_endpoint(
    symbol: str = Query(...),
    resolution: str = Query("30"),
    duration: int = Query(5)
):
    """
    Detect DOJI patterns for a symbol
    
    DOJI: Candle where Open ≈ Close (indecision pattern)
    """
    try:
        df = price_action_service.fetch_ohlc(symbol, resolution, duration)
        
        if df is None:
            return {"status": "error", "message": "Failed to fetch data"}
        
        df = price_action_service.detect_doji(df)
        
        doji_candles = df[df["Doji"]].to_dict('records')
        
        return {
            "status": "success",
            "data": {
                "symbol": symbol,
                "pattern": "Doji",
                "total_candles": len(df),
                "doji_count": len(doji_candles),
                "candles": doji_candles
            }
        }
    
    except Exception as e:
        logger.error(f"Error detecting DOJI: {e}")
        return {"status": "error", "message": str(e)}


@router.get("/detect-hammer")
async def detect_hammer_endpoint(
    symbol: str = Query(...),
    resolution: str = Query("30"),
    duration: int = Query(5)
):
    """
    Detect HAMMER patterns for a symbol
    
    HAMMER: Small body at top, long lower wick (reversal pattern)
    """
    try:
        df = price_action_service.fetch_ohlc(symbol, resolution, duration)
        
        if df is None:
            return {"status": "error", "message": "Failed to fetch data"}
        
        df = price_action_service.detect_hammer(df)
        
        hammer_candles = df[df["Hammer"]].to_dict('records')
        
        return {
            "status": "success",
            "data": {
                "symbol": symbol,
                "pattern": "Hammer",
                "total_candles": len(df),
                "hammer_count": len(hammer_candles),
                "candles": hammer_candles
            }
        }
    
    except Exception as e:
        logger.error(f"Error detecting HAMMER: {e}")
        return {"status": "error", "message": str(e)}


@router.get("/detect-engulfing")
async def detect_engulfing_endpoint(
    symbol: str = Query(...),
    resolution: str = Query("30"),
    duration: int = Query(5)
):
    """
    Detect ENGULFING patterns for a symbol (both bullish and bearish)
    
    ENGULFING: Current candle fully engulfs previous (reversal pattern)
    """
    try:
        df = price_action_service.fetch_ohlc(symbol, resolution, duration)
        
        if df is None:
            return {"status": "error", "message": "Failed to fetch data"}
        
        df = price_action_service.detect_engulfing(df)
        
        engulfing_candles = df[df["Engulfing"]].to_dict('records')
        bullish_count = df["BullishEngulfing"].sum()
        bearish_count = df["BearishEngulfing"].sum()
        
        return {
            "status": "success",
            "data": {
                "symbol": symbol,
                "pattern": "Engulfing",
                "total_candles": len(df),
                "bullish_engulfing_count": int(bullish_count),
                "bearish_engulfing_count": int(bearish_count),
                "total_engulfing_count": len(engulfing_candles),
                "candles": engulfing_candles
            }
        }
    
    except Exception as e:
        logger.error(f"Error detecting ENGULFING: {e}")
        return {"status": "error", "message": str(e)}


@router.get("/detect-bullish-engulfing")
async def detect_bullish_engulfing_endpoint(
    symbol: str = Query(...),
    resolution: str = Query("30"),
    duration: int = Query(5)
):
    """
    Detect BULLISH ENGULFING patterns for a symbol
    
    Bullish Engulfing: Bearish candle followed by larger bullish candle (reversal pattern)
    """
    try:
        df = price_action_service.fetch_ohlc(symbol, resolution, duration)
        
        if df is None:
            return {"status": "error", "message": "Failed to fetch data"}
        
        df = price_action_service.detect_bullish_engulfing(df)
        
        bullish_engulfing_candles = df[df["BullishEngulfing"]].to_dict('records')
        
        return {
            "status": "success",
            "data": {
                "symbol": symbol,
                "pattern": "Bullish Engulfing",
                "total_candles": len(df),
                "bullish_engulfing_count": len(bullish_engulfing_candles),
                "candles": bullish_engulfing_candles
            }
        }
    
    except Exception as e:
        logger.error(f"Error detecting BULLISH ENGULFING: {e}")
        return {"status": "error", "message": str(e)}


@router.get("/detect-bearish-engulfing")
async def detect_bearish_engulfing_endpoint(
    symbol: str = Query(...),
    resolution: str = Query("30"),
    duration: int = Query(5)
):
    """
    Detect BEARISH ENGULFING patterns for a symbol
    
    Bearish Engulfing: Bullish candle followed by larger bearish candle (reversal pattern)
    """
    try:
        df = price_action_service.fetch_ohlc(symbol, resolution, duration)
        
        if df is None:
            return {"status": "error", "message": "Failed to fetch data"}
        
        df = price_action_service.detect_bearish_engulfing(df)
        
        bearish_engulfing_candles = df[df["BearishEngulfing"]].to_dict('records')
        
        return {
            "status": "success",
            "data": {
                "symbol": symbol,
                "pattern": "Bearish Engulfing",
                "total_candles": len(df),
                "bearish_engulfing_count": len(bearish_engulfing_candles),
                "candles": bearish_engulfing_candles
            }
        }
    
    except Exception as e:
        logger.error(f"Error detecting BEARISH ENGULFING: {e}")
        return {"status": "error", "message": str(e)}


@router.get("/detect-bullish-marubozu")
async def detect_bullish_marubozu_endpoint(
    symbol: str = Query(...),
    resolution: str = Query("30"),
    duration: int = Query(5),
    buffer: float = Query(0.25)
):
    """
    Detect BULLISH MARUBOZU patterns for a symbol
    
    Bullish Marubozu: Green candle with minimal wicks (strong bullish)
    Conditions: Close > Open, abs(High-Close) <= buffer, abs(Low-Open) <= buffer
    """
    try:
        df = price_action_service.fetch_ohlc(symbol, resolution, duration)
        
        if df is None:
            return {"status": "error", "message": "Failed to fetch data"}
        
        df = price_action_service.detect_bullish_marubozu(df, buffer=buffer)
        
        marubozu_candles = df[df["BullishMarubozu"]].to_dict('records')
        
        return {
            "status": "success",
            "data": {
                "symbol": symbol,
                "pattern": "Bullish Marubozu",
                "total_candles": len(df),
                "marubozu_count": len(marubozu_candles),
                "candles": marubozu_candles
            }
        }
    
    except Exception as e:
        logger.error(f"Error detecting BULLISH MARUBOZU: {e}")
        return {"status": "error", "message": str(e)}


@router.get("/detect-bearish-marubozu")
async def detect_bearish_marubozu_endpoint(
    symbol: str = Query(...),
    resolution: str = Query("30"),
    duration: int = Query(5),
    buffer: float = Query(0.25)
):
    """
    Detect BEARISH MARUBOZU patterns for a symbol
    
    Bearish Marubozu: Red candle with minimal wicks (strong bearish)
    Conditions: Open > Close, abs(High-Open) <= buffer, abs(Low-Close) <= buffer
    """
    try:
        df = price_action_service.fetch_ohlc(symbol, resolution, duration)
        
        if df is None:
            return {"status": "error", "message": "Failed to fetch data"}
        
        df = price_action_service.detect_bearish_marubozu(df, buffer=buffer)
        
        marubozu_candles = df[df["BearishMarubozu"]].to_dict('records')
        
        return {
            "status": "success",
            "data": {
                "symbol": symbol,
                "pattern": "Bearish Marubozu",
                "total_candles": len(df),
                "marubozu_count": len(marubozu_candles),
                "candles": marubozu_candles
            }
        }
    
    except Exception as e:
        logger.error(f"Error detecting BEARISH MARUBOZU: {e}")
        return {"status": "error", "message": str(e)}


@router.get("/detect-shooting-star")
async def detect_shooting_star_endpoint(
    symbol: str = Query(...),
    resolution: str = Query("30"),
    duration: int = Query(5)
):
    """
    Detect SHOOTING STAR patterns for a symbol
    
    Shooting Star: Long upper wick with small body at bottom (reversal pattern)
    Conditions:
    - Red candle: High-Open >= 2*(Close-Low)
    - Green candle: High-Close >= 2*(Open-Low)
    """
    try:
        df = price_action_service.fetch_ohlc(symbol, resolution, duration)
        
        if df is None:
            return {"status": "error", "message": "Failed to fetch data"}
        
        df = price_action_service.detect_shooting_star(df)
        
        shooting_star_candles = df[df["ShootingStar"]].to_dict('records')
        
        return {
            "status": "success",
            "data": {
                "symbol": symbol,
                "pattern": "Shooting Star",
                "total_candles": len(df),
                "shooting_star_count": len(shooting_star_candles),
                "candles": shooting_star_candles
            }
        }
    
    except Exception as e:
        logger.error(f"Error detecting SHOOTING STAR: {e}")
        return {"status": "error", "message": str(e)}


@router.get("/pivot-points")
async def get_pivot_points_endpoint(
    symbol: str = Query(...),
    resolution: str = Query("D"),
    duration: int = Query(100)
):
    """
    Calculate Pivot Points and Support/Resistance levels
    
    Uses daily OHLC data to calculate:
    - Pivot point
    - 3 Resistance levels (R1, R2, R3)
    - 3 Support levels (S1, S2, S3)
    
    Formulas:
    - Pivot = (High + Low + Close) / 3
    - R1 = (2 * Pivot) - Low
    - R2 = Pivot + (High - Low)
    - R3 = High + 2 * (Pivot - Low)
    - S1 = (2 * Pivot) - High
    - S2 = Pivot - (High - Low)
    - S3 = Low - 2 * (High - Pivot)
    """
    try:
        df = price_action_service.fetch_ohlc(symbol, resolution, duration)
        
        if df is None:
            return {"status": "error", "message": "Failed to fetch data"}
        
        # Calculate pivot points
        pivot_data = price_action_service.calculate_pivot_points(df)
        
        if not pivot_data:
            return {"status": "error", "message": "Unable to calculate pivot points"}
        
        return {
            "status": "success",
            "data": {
                "symbol": symbol,
                "pivot_points": pivot_data
            }
        }
    
    except Exception as e:
        logger.error(f"Error calculating PIVOT POINTS: {e}")
        return {"status": "error", "message": str(e)}


@router.get("/pattern-info")
async def get_pattern_info():
    """Get information about supported patterns"""
    return {
        "patterns": [
            {
                "name": "Doji",
                "description": "Open ≈ Close with long wicks",
                "type": "Indecision",
                "significance": "Market uncertainty"
            },
            {
                "name": "Hammer",
                "description": "Small body at top with long lower wick",
                "type": "Reversal",
                "significance": "Potential reversal after downtrend",
                "condition": "Open-Low >= 2*(High-Close) or Close-Low >= 2*(High-Open)"
            },
            {
                "name": "Bullish Engulfing",
                "description": "Bearish candle followed by larger bullish candle",
                "type": "Reversal",
                "significance": "Potential uptrend reversal",
                "condition": "Prev: Open>Close, Curr: Close>Open, Curr engulfs Prev"
            },
            {
                "name": "Bearish Engulfing",
                "description": "Bullish candle followed by larger bearish candle",
                "type": "Reversal",
                "significance": "Potential downtrend reversal",
                "condition": "Prev: Open<Close, Curr: Open>Close, Curr engulfs Prev"
            },
            {
                "name": "Bullish Marubozu",
                "description": "Green candle with minimal wicks (strong bullish)",
                "type": "Continuation",
                "significance": "Strong uptrend continuation",
                "condition": "Close>Open, abs(High-Close)<=buffer, abs(Low-Open)<=buffer"
            },
            {
                "name": "Bearish Marubozu",
                "description": "Red candle with minimal wicks (strong bearish)",
                "type": "Continuation",
                "significance": "Strong downtrend continuation",
                "condition": "Open>Close, abs(High-Open)<=buffer, abs(Low-Close)<=buffer"
            },
            {
                "name": "Shooting Star",
                "description": "Long upper wick with small body at bottom",
                "type": "Reversal",
                "significance": "Potential reversal after uptrend",
                "condition": "High-Open>=2*(Close-Low) or High-Close>=2*(Open-Low)"
            },
            {
                "name": "Inside Bar",
                "description": "High < Previous High, Low > Previous Low",
                "type": "Consolidation",
                "significance": "Price consolidation"
            },
            {
                "name": "Breakout",
                "description": "New high or low over lookback period",
                "type": "Continuation",
                "significance": "Price breaks resistance/support"
            },
            {
                "name": "Pivot Points",
                "description": "Support and Resistance levels (S3-S1, R1-R3)",
                "type": "Technical Level",
                "significance": "Key price levels for daily trading"
            }
        ]
    }
