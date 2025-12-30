"""
Historical Market Data Endpoint
Fetch historical OHLCV candle data for chart analysis
Created By: Aseem Singhal
Fyers API V3
"""

import logging
from datetime import datetime, timedelta
from typing import List, Optional
import random
import pandas as pd
import pytz
from pathlib import Path

from fastapi import APIRouter, Query
from pydantic import BaseModel

# Try to import Fyers API - will fall back to mock if not available
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


class Candle(BaseModel):
    """Candlestick data"""

    time: int  # Unix timestamp in milliseconds
    open: float
    high: float
    low: float
    close: float
    volume: int


class HistoricalDataRequest(BaseModel):
    """Request for historical data"""

    symbol: str
    resolution: str  # "1m", "5m", "15m", "1h", "4h", "1d", "1w", "1m"
    from_time: Optional[int] = None  # Unix timestamp
    to_time: Optional[int] = None  # Unix timestamp


# ============================================================================
# Fyers API Integration
# ============================================================================


class FyersAPIClient:
    """Fyers API Client for real historical data"""
    
    def __init__(self):
        self.fyers = None
        self.client_id = None
        self.access_token = None
        self.initialized = False
        self._init_fyers()
    
    def _init_fyers(self):
        """Initialize Fyers API client"""
        if not FYERS_AVAILABLE:
            logger.warning("Fyers API not available. Will use mock data.")
            return
        
        try:
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
                    log_path=str(Path.cwd() / "logs")
                )
                self.initialized = True
                logger.info("Fyers API client initialized successfully")
            else:
                logger.warning("Fyers credentials not found. Will use mock data.")
        
        except Exception as e:
            logger.error(f"Failed to initialize Fyers API: {e}")
    
    def fetch_ohlc(self, ticker: str, interval: str, duration: int = 250) -> Optional[pd.DataFrame]:
        """
        Fetch OHLC data from Fyers API
        
        Args:
            ticker: Trading symbol (e.g., 'NSE:RELIANCE-EQ')
            interval: Interval string (e.g., '5', '1' for 5min, 1min)
            duration: Number of days of historical data to fetch
        
        Returns:
            DataFrame with OHLC data or None if API fails
        """
        if not self.initialized or not self.fyers:
            return None
        
        try:
            # Calculate date range
            range_from = datetime.now().date() - timedelta(days=duration)
            range_to = datetime.now().date()
            
            from_date_string = range_from.strftime("%Y-%m-%d")
            to_date_string = range_to.strftime("%Y-%m-%d")
            
            # Prepare request data
            data = {
                "symbol": ticker,
                "resolution": interval,
                "date_format": "1",
                "range_from": from_date_string,
                "range_to": to_date_string,
                "cont_flag": "1"
            }
            
            # Fetch history
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
                
                logger.info(f"Fetched {len(df)} candles for {ticker} from Fyers API")
                return df
            else:
                logger.warning(f"No candles in Fyers response for {ticker}")
                return None
        
        except Exception as e:
            logger.error(f"Error fetching OHLC from Fyers API: {e}")
            return None
    
    def fetch_ohlc_full(self, ticker: str, interval: str, inception_date: str) -> Optional[pd.DataFrame]:
        """
        Fetch full historical OHLC data from inception date to today
        Handles pagination in 50-day chunks to avoid API limits
        
        Args:
            ticker: Trading symbol (e.g., 'NSE:NIFTY50-INDEX')
            interval: Interval string (e.g., '5', '1' for 5min, 1min)
            inception_date: Start date as string (format: 'YYYY-MM-DD')
        
        Returns:
            DataFrame with full OHLC data or None if API fails
        """
        if not self.initialized or not self.fyers:
            return None
        
        try:
            # Parse inception date
            from_date = datetime.strptime(inception_date, '%Y-%m-%d')
            
            # Initialize DataFrame with columns
            columns = ['Timestamp', 'Open', 'High', 'Low', 'Close', 'Volume']
            df = pd.DataFrame(columns=columns)
            
            # Fetch data in 50-day chunks
            while True:
                from_date_string = from_date.strftime("%Y-%m-%d")
                today = datetime.now().date()
                to_date_string = today.strftime("%Y-%m-%d")
                
                # Check if we're within last 50 days - if so, fetch remaining data
                if from_date.date() >= (today - timedelta(days=50)):
                    data = {
                        "symbol": ticker,
                        "resolution": interval,
                        "date_format": "1",
                        "range_from": from_date_string,
                        "range_to": to_date_string,
                        "cont_flag": "1"
                    }
                    
                    resp = self.fyers.history(data=data)
                    if resp and 'candles' in resp:
                        df1 = pd.DataFrame(resp['candles'], columns=columns)
                        df = pd.concat([df, df1], ignore_index=True)
                    break
                else:
                    # Fetch 50-day chunk
                    to_date = from_date + timedelta(days=50)
                    to_date_string = to_date.strftime("%Y-%m-%d")
                    
                    data = {
                        "symbol": ticker,
                        "resolution": interval,
                        "date_format": "1",
                        "range_from": from_date_string,
                        "range_to": to_date_string,
                        "cont_flag": "1"
                    }
                    
                    resp = self.fyers.history(data=data)
                    if resp and 'candles' in resp:
                        df1 = pd.DataFrame(resp['candles'], columns=columns)
                        df = pd.concat([df, df1], ignore_index=True)
                    
                    # Move to next chunk
                    from_date = to_date + timedelta(days=1)
            
            if len(df) == 0:
                logger.warning(f"No data fetched for {ticker}")
                return None
            
            # Convert Timestamp to datetime in UTC
            df['Timestamp'] = pd.to_datetime(df['Timestamp'], unit='s').dt.tz_localize(pytz.utc)
            
            # Convert to IST
            ist = pytz.timezone('Asia/Kolkata')
            df['Timestamp'] = df['Timestamp'].dt.tz_convert(ist)
            
            logger.info(f"Fetched {len(df)} candles for {ticker} from {inception_date} to today")
            return df
        
        except Exception as e:
            logger.error(f"Error fetching full OHLC from Fyers API: {e}")
            return None
    
    def fetch_ohlc_range(self, ticker: str, interval: str, range_from: str, range_to: str) -> Optional[pd.DataFrame]:
        """
        Fetch OHLC data for a specific date range
        
        Args:
            ticker: Trading symbol (e.g., 'NSE:NIFTY23SEP20000CE')
            interval: Interval string in minutes:
                - "1" = 1 minute
                - "5" = 5 minutes
                - "15" = 15 minutes
                - "30" = 30 minutes
                - "60" = 60 minutes (1 hour)
                - "120" = 120 minutes (2 hours)
                - "240" = 240 minutes (4 hours)
                - "D" = Daily
            range_from: Start date string (format: 'YYYY-MM-DD', e.g., '2023-08-18')
            range_to: End date string (format: 'YYYY-MM-DD', e.g., '2023-08-29')
        
        Returns:
            DataFrame with OHLC data for the specified range or None if API fails
        """
        if not self.initialized or not self.fyers:
            return None
        
        try:
            # Prepare request data
            data = {
                "symbol": ticker,
                "resolution": interval,
                "date_format": "1",
                "range_from": range_from,
                "range_to": range_to,
                "cont_flag": "1"
            }
            
            # Fetch history
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
                
                logger.info(f"Fetched {len(df)} candles for {ticker} from {range_from} to {range_to}")
                return df
            else:
                logger.warning(f"No candles in Fyers response for {ticker}")
                return None
        
        except Exception as e:
            logger.error(f"Error fetching OHLC range from Fyers API: {e}")
            return None


# Initialize Fyers API client
fyers_client = FyersAPIClient()


# ============================================================================
# Timeframe Resampling Utilities
# ============================================================================


def resample_to_timeframe(df: pd.DataFrame, timeframe: str = '15T') -> pd.DataFrame:
    """
    Resample OHLCV data to a different timeframe
    
    Args:
        df: DataFrame with 'Timestamp' index and OHLCV columns
        timeframe: Resampling period:
            - '15T' = 15 minutes
            - 'H' = 1 hour
            - 'D' = 1 day
            - etc. (any valid pandas offset alias)
    
    Returns:
        Resampled DataFrame with proper OHLCV aggregation
    """
    try:
        # Ensure Timestamp is set as index and is datetime
        if 'Timestamp' in df.columns:
            df = df.copy()
            df['Timestamp'] = pd.to_datetime(df['Timestamp'])
            df.set_index('Timestamp', inplace=True)
        
        # Resample with OHLCV aggregation rules
        resampled = df.resample(timeframe).agg({
            'Open': 'first',
            'High': 'max',
            'Low': 'min',
            'Close': 'last',
            'Volume': 'sum'
        })
        
        # Drop NaN rows
        resampled.dropna(inplace=True)
        
        logger.info(f"Resampled {len(df)} candles to {timeframe}: {len(resampled)} bars")
        return resampled
    
    except Exception as e:
        logger.error(f"Error resampling timeframe: {e}")
        return None


def get_multiple_timeframes(df: pd.DataFrame) -> dict:
    """
    Generate multiple timeframe aggregations from 1-minute data
    
    Args:
        df: DataFrame with 'Timestamp' as index and OHLCV columns
    
    Returns:
        Dictionary with keys: '15m', 'hourly', 'daily', and resampled DataFrames
    """
    try:
        result = {}
        
        # 15-minute timeframe
        result['15m'] = resample_to_timeframe(df, '15T')
        logger.info("Generated 15-minute timeframe")
        
        # Hourly timeframe
        result['hourly'] = resample_to_timeframe(df, 'H')
        logger.info("Generated hourly timeframe")
        
        # Daily timeframe
        result['daily'] = resample_to_timeframe(df, 'D')
        logger.info("Generated daily timeframe")
        
        return result
    
    except Exception as e:
        logger.error(f"Error generating multiple timeframes: {e}")
        return {}


def get_hourly_with_market_session(df: pd.DataFrame, market_open_time: str = '09:15') -> Optional[pd.DataFrame]:
    """
    Generate hourly bars aligned with market session (9:15 AM - 3:30 PM for NSE)
    
    This function:
    1. Filters data to market hours (until 3:30 PM)
    2. Adjusts timestamps by subtracting market_open_time offset
    3. Resamples to hourly bars
    4. Restores original timestamp offset
    
    Args:
        df: DataFrame with 'Timestamp' as index and OHLCV columns
        market_open_time: Market opening time (format: 'HH:MM'), default '09:15' for NSE
    
    Returns:
        Resampled hourly DataFrame with market session alignment
    """
    try:
        df_copy = df.copy()
        
        # Ensure Timestamp is index
        if 'Timestamp' not in df_copy.index.name:
            if 'Timestamp' in df_copy.columns:
                df_copy.set_index('Timestamp', inplace=True)
        
        # Convert index to datetime if not already
        df_copy.index = pd.to_datetime(df_copy.index)
        
        # Filter to market hours (until 3:30 PM / 15:30)
        df_market = df_copy[df_copy.index.time <= pd.Timestamp('15:30').time()]
        
        # Parse market open time
        open_hour, open_minute = map(int, market_open_time.split(':'))
        time_offset = pd.Timedelta(hours=open_hour, minutes=open_minute)
        
        # Adjust timestamps by subtracting offset
        df_market.index = df_market.index - time_offset
        
        # Resample to hourly with OHLCV aggregation
        hourly_df = df_market.resample('H').agg({
            'Open': 'first',
            'High': 'max',
            'Low': 'min',
            'Close': 'last',
            'Volume': 'sum'
        })
        
        # Drop NaN rows
        hourly_df.dropna(inplace=True)
        
        # Restore original timestamp offset
        hourly_df.index = hourly_df.index + time_offset
        
        logger.info(f"Generated market session hourly bars: {len(hourly_df)} bars")
        return hourly_df
    
    except Exception as e:
        logger.error(f"Error generating market session hourly bars: {e}")
        return None





class HistoricalDataService:
    """Service to fetch and cache historical market data"""

    def __init__(self):
        self.cache: dict = {}

    def get_candles(
        self,
        symbol: str,
        resolution: str,
        from_time: Optional[int] = None,
        to_time: Optional[int] = None,
        limit: int = 500,
        use_real_api: bool = True,
    ) -> List[Candle]:
        """
        Fetch historical candles - tries real API first, falls back to mock

        Args:
            symbol: Trading symbol (e.g., 'NSE:INFY-EQ')
            resolution: Candle resolution ('1m', '5m', '15m', '1h', '1d', etc.)
            from_time: Start timestamp (ms)
            to_time: End timestamp (ms)
            limit: Maximum candles to return
            use_real_api: Whether to attempt real API first

        Returns:
            List of Candle objects
        """
        cache_key = f"{symbol}:{resolution}"

        # Try to fetch from real Fyers API first
        if use_real_api and fyers_client.initialized:
            try:
                # Map resolution to Fyers format
                resolution_map = {
                    "1m": "1",
                    "5m": "5",
                    "15m": "15",
                    "30m": "30",
                    "1h": "60",
                    "4h": "240",
                    "1d": "1440",
                    "1w": "weekly",
                }
                
                fyers_resolution = resolution_map.get(resolution, "1440")
                
                # Fetch from Fyers
                df = fyers_client.fetch_ohlc(symbol, fyers_resolution, duration=250)
                
                if df is not None and len(df) > 0:
                    candles = self._dataframe_to_candles(df)
                    self.cache[cache_key] = candles
                    filtered = self._filter_by_time(candles, from_time, to_time)
                    return filtered[-limit:] if len(filtered) > limit else filtered
            
            except Exception as e:
                logger.warning(f"Failed to fetch from real API, using mock data: {e}")

        # Try to get from cache
        if cache_key in self.cache:
            cached_candles = self.cache[cache_key]
            filtered = self._filter_by_time(cached_candles, from_time, to_time)
            return filtered[-limit:] if len(filtered) > limit else filtered

        # Generate synthetic/mock data as fallback
        candles = self._generate_mock_candles(symbol, resolution, limit)
        self.cache[cache_key] = candles

        return candles

    @staticmethod
    def _dataframe_to_candles(df: pd.DataFrame) -> List[Candle]:
        """Convert DataFrame from Fyers API to Candle objects"""
        candles = []
        try:
            for _, row in df.iterrows():
                # Convert IST timestamp to milliseconds
                timestamp = int(pd.Timestamp(row['Timestamp']).timestamp() * 1000)
                
                candle = Candle(
                    time=timestamp,
                    open=round(float(row['Open']), 2),
                    high=round(float(row['High']), 2),
                    low=round(float(row['Low']), 2),
                    close=round(float(row['Close']), 2),
                    volume=int(row['Volume'])
                )
                candles.append(candle)
        
        except Exception as e:
            logger.error(f"Error converting DataFrame to candles: {e}")
        
        return candles

    @staticmethod
    def _generate_mock_candles(symbol: str, resolution: str, count: int = 500) -> List[Candle]:
        """
        Generate realistic mock candlestick data with proper OHLC relationships
        
        Key features:
        - Realistic price movements (no invalid candles)
        - High >= Max(Open, Close)
        - Low <= Min(Open, Close)
        - Volume variation
        - Trending with retracements
        """
        candles = []
        
        # Symbol-based starting prices (more realistic)
        symbol_prices = {
            'NIFTY50': 25000,
            'BANKNIFTY': 50000,
            'FINNIFTY': 23000,
            'SENSEX': 75000,
            'NSE:SBIN-EQ': 550,
            'NSE:INFY-EQ': 1500,
            'NSE:TCS-EQ': 3800,
            'NSE:RELIANCE-EQ': 2800,
            'NSE:WIPRO-EQ': 450,
        }
        
        base_price = symbol_prices.get(symbol, 1000)
        interval_minutes = HistoricalDataService._resolution_to_minutes(resolution)
        current_time = int((datetime.now() - timedelta(days=60)).timestamp() * 1000)
        
        # Trend direction (1 = up, -1 = down, 0 = sideways)
        trend = 1 if random.random() > 0.5 else -1
        trend_strength = random.uniform(0.3, 0.7)
        
        for i in range(count):
            # Apply trend with noise
            trend_signal = trend * trend_strength * random.uniform(0.5, 1.5)
            
            # Open price (carry forward last close or use current + trend)
            if i == 0:
                open_price = base_price
            else:
                open_price = candles[-1]['close'] + random.gauss(0, base_price * 0.0005)
            
            # Close price (trend + random walk)
            close_price = open_price + trend_signal + random.gauss(0, base_price * 0.008)
            close_price = max(close_price, base_price * 0.5)  # Prevent unrealistic drops
            
            # High and Low (must respect OHLC rules)
            oc_max = max(open_price, close_price)
            oc_min = min(open_price, close_price)
            
            high_price = oc_max + abs(random.gauss(0, base_price * 0.01))
            low_price = oc_min - abs(random.gauss(0, base_price * 0.01))
            
            # Volume (realistic, varies with volatility)
            volatility = abs(close_price - open_price) / open_price
            volume = int(random.gauss(500000, 200000) * (1 + volatility * 5))
            volume = max(volume, 50000)
            
            candle = {
                'time': current_time + (i * interval_minutes * 60 * 1000),
                'open': round(open_price, 2),
                'high': round(high_price, 2),
                'low': round(low_price, 2),
                'close': round(close_price, 2),
                'volume': volume,
            }
            
            # Validate candle before adding
            if (candle['high'] >= max(candle['open'], candle['close']) and
                candle['low'] <= min(candle['open'], candle['close']) and
                candle['close'] > 0):
                candles.append(candle)
            
            base_price = close_price
            
            # Change trend occasionally (mean reversion)
            if random.random() < 0.05:  # 5% chance each candle
                trend = trend * -1
                trend_strength = random.uniform(0.3, 0.7)
        
        # Convert dicts to Candle objects
        return [Candle(**c) for c in candles]

    @staticmethod
    def _resolution_to_minutes(resolution: str) -> int:
        """Convert resolution string to minutes"""
        mapping = {
            "1m": 1,
            "5m": 5,
            "15m": 15,
            "30m": 30,
            "1h": 60,
            "4h": 240,
            "1d": 1440,
            "1w": 10080,
            "1M": 43200,  # Approximate
        }
        return mapping.get(resolution, 60)

    @staticmethod
    def _filter_by_time(candles: List[Candle], from_time: Optional[int], to_time: Optional[int]):
        """Filter candles by time range"""
        if from_time is None and to_time is None:
            return candles

        filtered = candles
        if from_time:
            filtered = [c for c in filtered if c.time >= from_time]
        if to_time:
            filtered = [c for c in filtered if c.time <= to_time]

        return filtered


# Singleton instance
historical_service = HistoricalDataService()


# ============================================================================
# Endpoints
# ============================================================================


@router.get("/history", response_model=List[Candle])
async def get_historical_data(
    symbol: str = Query(..., description="Trading symbol (e.g., NSE:INFY-EQ)"),
    resolution: str = Query("1d", description="Candle resolution (1m, 5m, 15m, 1h, 4h, 1d, 1w, 1M)"),
    from_time: Optional[int] = Query(None, description="Start time (Unix timestamp in ms)"),
    to_time: Optional[int] = Query(None, description="End time (Unix timestamp in ms)"),
    limit: int = Query(500, description="Maximum candles to return"),
):
    """
    Get historical candlestick data

    Example:
        GET /api/portfolio/history?symbol=NSE:INFY-EQ&resolution=1d&limit=100
    """
    try:
        candles = historical_service.get_candles(
            symbol=symbol,
            resolution=resolution,
            from_time=from_time,
            to_time=to_time,
            limit=limit,
        )

        logger.info(f"Returned {len(candles)} candles for {symbol} @ {resolution}")
        return candles

    except Exception as e:
        logger.error(f"Error fetching historical data: {e}")
        return []


@router.post("/history", response_model=List[Candle])
async def get_historical_data_post(request: HistoricalDataRequest):
    """
    Get historical candlestick data (POST version)

    Request body example:
    {
        "symbol": "NSE:INFY-EQ",
        "resolution": "1d",
        "from_time": 1704067200000,
        "to_time": 1704153600000
    }
    """
    return await get_historical_data(
        symbol=request.symbol,
        resolution=request.resolution,
        from_time=request.from_time,
        to_time=request.to_time,
    )


@router.get("/symbols")
async def get_available_symbols():
    """Get list of available trading symbols"""
    symbols = [
        {"symbol": "NSE:SBIN-EQ", "name": "State Bank of India", "exchange": "NSE"},
        {"symbol": "NSE:INFY-EQ", "name": "Infosys", "exchange": "NSE"},
        {"symbol": "NSE:TCS-EQ", "name": "Tata Consultancy Services", "exchange": "NSE"},
        {"symbol": "NSE:RELIANCE-EQ", "name": "Reliance Industries", "exchange": "NSE"},
        {"symbol": "NSE:WIPRO-EQ", "name": "Wipro", "exchange": "NSE"},
    ]
    return symbols


@router.get("/resolutions")
async def get_available_resolutions():
    """Get supported chart resolutions"""
    return {
        "resolutions": ["1m", "5m", "15m", "30m", "1h", "4h", "1d", "1w", "1M"],
        "descriptions": {
            "1m": "1 Minute",
            "5m": "5 Minutes",
            "15m": "15 Minutes",
            "30m": "30 Minutes",
            "1h": "1 Hour",
            "4h": "4 Hours",
            "1d": "1 Day",
            "1w": "1 Week",
            "1M": "1 Month",
        },
    }


# ============================================================================
# Timeframe Resampling Endpoints
# ============================================================================


@router.get("/resample")
async def resample_historical_data(
    symbol: str = Query(..., description="Trading symbol (e.g., NSE:INFY-EQ)"),
    from_resolution: str = Query("1m", description="Source resolution (1m, 5m, etc.)"),
    to_resolution: str = Query("15m", description="Target resolution (15m, H, D, etc.)"),
    duration: int = Query(20, description="Duration in days for historical data"),
):
    """
    Fetch historical data and resample to target timeframe
    
    Example:
        GET /api/portfolio/resample?symbol=NSE:SBIN-EQ&from_resolution=1m&to_resolution=15m&duration=20
    """
    try:
        # Map resolution to Fyers format
        resolution_map = {
            "1m": "1",
            "5m": "5",
            "15m": "15",
            "30m": "30",
            "1h": "60",
            "4h": "240",
            "1d": "1440",
        }
        
        fyers_resolution = resolution_map.get(from_resolution, "1")
        
        # Fetch data from Fyers API
        df = fyers_client.fetch_ohlc(symbol, fyers_resolution, duration=duration)
        
        if df is None or len(df) == 0:
            logger.warning(f"No data fetched for {symbol}")
            return {"error": "No data available", "symbol": symbol}
        
        # Prepare DataFrame for resampling
        df['Timestamp'] = pd.to_datetime(df['Timestamp'])
        df.set_index('Timestamp', inplace=True)
        
        # Resample to target timeframe
        resampled_df = resample_to_timeframe(df, to_resolution)
        
        if resampled_df is None or len(resampled_df) == 0:
            return {"error": "Failed to resample data", "symbol": symbol}
        
        # Convert to JSON-serializable format
        result = {
            "symbol": symbol,
            "from_resolution": from_resolution,
            "to_resolution": to_resolution,
            "bars_count": len(resampled_df),
            "data": resampled_df.reset_index().to_dict('records')
        }
        
        logger.info(f"Resampled {symbol} from {from_resolution} to {to_resolution}")
        return result
    
    except Exception as e:
        logger.error(f"Error resampling data: {e}")
        return {"error": str(e), "symbol": symbol}


@router.get("/multi-timeframe")
async def get_multiple_timeframes_endpoint(
    symbol: str = Query(..., description="Trading symbol (e.g., NSE:INFY-EQ)"),
    duration: int = Query(20, description="Duration in days for historical data"),
):
    """
    Fetch historical data and generate multiple timeframes (15m, 1h, 1d)
    
    Example:
        GET /api/portfolio/multi-timeframe?symbol=NSE:SBIN-EQ&duration=20
    """
    try:
        # Fetch 1-minute data
        df = fyers_client.fetch_ohlc(symbol, "1", duration=duration)
        
        if df is None or len(df) == 0:
            logger.warning(f"No data fetched for {symbol}")
            return {"error": "No data available", "symbol": symbol}
        
        # Prepare DataFrame
        df['Timestamp'] = pd.to_datetime(df['Timestamp'])
        df.set_index('Timestamp', inplace=True)
        
        # Generate multiple timeframes
        timeframes_dict = get_multiple_timeframes(df)
        
        # Convert to JSON-serializable format
        result = {
            "symbol": symbol,
            "duration_days": duration,
            "timeframes": {}
        }
        
        for tf_name, tf_df in timeframes_dict.items():
            if tf_df is not None and len(tf_df) > 0:
                result["timeframes"][tf_name] = {
                    "bars_count": len(tf_df),
                    "data": tf_df.reset_index().to_dict('records')
                }
        
        logger.info(f"Generated multiple timeframes for {symbol}")
        return result
    
    except Exception as e:
        logger.error(f"Error generating multiple timeframes: {e}")
        return {"error": str(e), "symbol": symbol}


@router.get("/market-session-hourly")
async def get_market_session_hourly(
    symbol: str = Query(..., description="Trading symbol (e.g., NSE:SBIN-EQ)"),
    duration: int = Query(20, description="Duration in days for historical data"),
    market_open_time: str = Query("09:15", description="Market open time (HH:MM format, default 09:15 for NSE)"),
):
    """
    Fetch historical data and generate hourly bars aligned with market session
    
    For NSE: Filters to 9:15 AM - 3:30 PM and aligns hourly bars accordingly
    
    Example:
        GET /api/portfolio/market-session-hourly?symbol=NSE:SBIN-EQ&duration=20&market_open_time=09:15
    """
    try:
        # Fetch 1-minute data
        df = fyers_client.fetch_ohlc(symbol, "1", duration=duration)
        
        if df is None or len(df) == 0:
            logger.warning(f"No data fetched for {symbol}")
            return {"error": "No data available", "symbol": symbol}
        
        # Prepare DataFrame
        df['Timestamp'] = pd.to_datetime(df['Timestamp'])
        df.set_index('Timestamp', inplace=True)
        
        # Generate market session hourly bars
        hourly_df = get_hourly_with_market_session(df, market_open_time=market_open_time)
        
        if hourly_df is None or len(hourly_df) == 0:
            return {"error": "Failed to generate market session hourly bars", "symbol": symbol}
        
        # Convert to JSON-serializable format
        result = {
            "symbol": symbol,
            "market_open_time": market_open_time,
            "market_close_time": "15:30",
            "bars_count": len(hourly_df),
            "data": hourly_df.reset_index().to_dict('records')
        }
        
        logger.info(f"Generated market session hourly bars for {symbol}")
        return result
    
    except Exception as e:
        logger.error(f"Error generating market session hourly bars: {e}")
        return {"error": str(e), "symbol": symbol}
