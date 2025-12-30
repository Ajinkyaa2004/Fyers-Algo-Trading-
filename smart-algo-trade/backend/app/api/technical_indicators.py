"""
Technical Indicators Module
Implements various technical indicators for price analysis

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


class IndicatorRequest(BaseModel):
    """Technical indicator request"""
    symbol: str
    resolution: str
    duration: int = 5  # days


class ATRResponse(BaseModel):
    """ATR calculation response"""
    symbol: str
    total_candles: int
    atr_values: List[float]
    current_atr: Optional[float]


# ============================================================================
# Technical Indicators Service
# ============================================================================


class TechnicalIndicatorsService:
    """Service for calculating technical indicators"""
    
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
                logger.info("Fyers client for indicators initialized")
        
        except Exception as e:
            logger.error(f"Failed to initialize Fyers client: {e}")
    
    def fetch_ohlc(self, ticker: str, interval: str, duration: int) -> Optional[pd.DataFrame]:
        """Fetch OHLC data for indicator analysis"""
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
                
                # Ensure numeric types
                for col in ['Open', 'High', 'Low', 'Close', 'Volume']:
                    df[col] = pd.to_numeric(df[col], errors='coerce')
                
                logger.info(f"Fetched {len(df)} candles for {ticker}")
                return df
            
            return None
        
        except Exception as e:
            logger.error(f"Error fetching OHLC: {e}")
            return None
    
    @staticmethod
    def calculate_atr(ohlc_df: pd.DataFrame, period: int = 14) -> pd.DataFrame:
        """
        Calculate Average True Range (ATR)
        
        ATR is a volatility indicator that measures the average range of price movement.
        
        Calculation:
        1. True Range (TR) = max(High - Low, |High - Previous Close|, |Low - Previous Close|)
        2. ATR = Exponential Moving Average of TR over the period
        
        Args:
            ohlc_df: DataFrame with OHLC data
            period: Period for ATR calculation (default 14)
        
        Returns:
            DataFrame with 'ATR' column added
        """
        df = ohlc_df.copy()
        
        # Calculate True Range components
        df['High-Low'] = abs(df['High'] - df['Low'])
        df['High-PrevClose'] = abs(df['High'] - df['Close'].shift(1))
        df['Low-PrevClose'] = abs(df['Low'] - df['Close'].shift(1))
        
        # True Range is the maximum of the three components
        df['TR'] = df[['High-Low', 'High-PrevClose', 'Low-PrevClose']].max(axis=1, skipna=False)
        
        # ATR is the exponential moving average of True Range
        df['ATR'] = df['TR'].ewm(com=period, min_periods=period).mean()
        
        logger.info(f"ATR calculated with period {period}")
        return df
    
    @staticmethod
    def calculate_adx(ohlc_df: pd.DataFrame, period: int = 14) -> pd.DataFrame:
        """
        Calculate Average Directional Index (ADX)
        
        ADX measures the strength of a trend (0-100 scale)
        - ADX < 25: Weak trend
        - ADX 25-50: Moderate trend
        - ADX > 50: Strong trend
        
        Uses Wilder's smoothing method for more accurate calculation
        
        Calculation Steps:
        1. Calculate True Range (TR)
        2. Calculate Directional Movements: +DM and -DM using np.where
        3. Apply Wilder's smoothing to TR and DM values
        4. Calculate +DI and -DI from smoothed values
        5. Calculate DX = |+DI - -DI| / (+DI + -DI) * 100
        6. ADX = Smoothed DX using Wilder's method
        
        Args:
            ohlc_df: DataFrame with OHLC data
            period: Period for ADX calculation (default 14)
        
        Returns:
            DataFrame with 'ADX', 'DI+', 'DI-' columns added
        """
        df = ohlc_df.copy()
        
        # ===== Step 1: Calculate True Range =====
        df['High-Low'] = abs(df['High'] - df['Low'])
        df['High-PrevClose'] = abs(df['High'] - df['Close'].shift(1))
        df['Low-PrevClose'] = abs(df['Low'] - df['Close'].shift(1))
        df['TR'] = df[['High-Low', 'High-PrevClose', 'Low-PrevClose']].max(axis=1, skipna=False)
        
        # ===== Step 2: Calculate Directional Movements =====
        # Using numpy.where for efficient conditional logic (Aseem's approach)
        df['DMplus'] = np.where(
            (df['High'] - df['High'].shift(1)) > (df['Low'].shift(1) - df['Low']),
            df['High'] - df['High'].shift(1),
            0
        )
        df['DMplus'] = np.where(df['DMplus'] < 0, 0, df['DMplus'])
        
        df['DMminus'] = np.where(
            (df['Low'].shift(1) - df['Low']) > (df['High'] - df['High'].shift(1)),
            df['Low'].shift(1) - df['Low'],
            0
        )
        df['DMminus'] = np.where(df['DMminus'] < 0, 0, df['DMminus'])
        
        # ===== Step 3: Apply Wilder's Smoothing =====
        # Convert to lists for iterative calculation
        TR_list = df['TR'].tolist()
        DMplus_list = df['DMplus'].tolist()
        DMminus_list = df['DMminus'].tolist()
        
        TRn = []
        DMplusN = []
        DMminusN = []
        
        for i in range(len(df)):
            if i < period:
                TRn.append(np.NaN)
                DMplusN.append(np.NaN)
                DMminusN.append(np.NaN)
            elif i == period:
                # First smoothed values are simple sums
                TRn.append(df['TR'].iloc[0:period+1].sum())
                DMplusN.append(df['DMplus'].iloc[0:period+1].sum())
                DMminusN.append(df['DMminus'].iloc[0:period+1].sum())
            else:
                # Wilder's smoothing: previous_sum - (previous_sum/period) + current
                TRn.append(TRn[i-1] - (TRn[i-1]/period) + TR_list[i])
                DMplusN.append(DMplusN[i-1] - (DMplusN[i-1]/period) + DMplus_list[i])
                DMminusN.append(DMminusN[i-1] - (DMminusN[i-1]/period) + DMminus_list[i])
        
        df['TRn'] = np.array(TRn)
        df['DMplusN'] = np.array(DMplusN)
        df['DMminusN'] = np.array(DMminusN)
        
        # ===== Step 4: Calculate +DI and -DI =====
        df['DI+'] = 100 * (df['DMplusN'] / df['TRn'])
        df['DI-'] = 100 * (df['DMminusN'] / df['TRn'])
        
        # ===== Step 5: Calculate DX =====
        df['DIdiff'] = abs(df['DI+'] - df['DI-'])
        df['DIsum'] = df['DI+'] + df['DI-']
        df['DX'] = 100 * (df['DIdiff'] / df['DIsum'])
        
        # ===== Step 6: Calculate ADX using Wilder's smoothing =====
        DX_list = df['DX'].tolist()
        ADX = []
        
        for j in range(len(df)):
            if j < 2 * period - 1:
                ADX.append(np.NaN)
            elif j == 2 * period - 1:
                # First ADX is the average of DX
                ADX.append(df['DX'].iloc[j-period+1:j+1].mean())
            else:
                # Wilder's smoothing for ADX
                ADX.append(((period - 1) * ADX[j - 1] + DX_list[j]) / period)
        
        df['ADX'] = np.array(ADX)
        
        logger.info(f"ADX calculated with period {period} using Wilder's smoothing")
        return df
    
    @staticmethod
    def calculate_rsi(ohlc_df: pd.DataFrame, period: int = 14) -> pd.DataFrame:
        """
        Calculate Relative Strength Index (RSI)
        
        Measures momentum on a scale of 0-100
        Uses the standard formula: RSI = 100 - (100 / (1 + RS))
        Where RS = Average Gain / Average Loss
        
        RSI Interpretation:
        - RSI < 30: Oversold (potential buy signal)
        - RSI > 70: Overbought (potential sell signal)
        - RSI = 50: Neutral
        
        Args:
            ohlc_df: DataFrame with OHLC data
            period: Period for RSI calculation (default 14)
        
        Returns:
            DataFrame with 'RSI' column added
            
        Algorithm (from Aseem Singhal):
        1. Calculate bar-to-bar changes: Chng = Close(t) - Close(t-1)
        2. Up move (U): Change if positive, else 0
        3. Down move (D): Absolute change if negative, else 0
        4. AvgU = Sum of U in last N bars / N
        5. AvgD = Sum of D in last N bars / N
        6. RS = AvgU / AvgD
        7. RSI = 100 - (100 / (1 + RS))
        """
        df = ohlc_df.copy()
        
        # Step 1: Calculate price deltas
        delta = df['Close'].diff()
        
        # Step 2: Separate gains and losses
        # Gains: positive changes, Losses: absolute value of negative changes
        gain = delta.where(delta > 0, 0)
        loss = -delta.where(delta < 0, 0)
        
        # Step 3: Calculate average gain and average loss over period
        avg_gain = gain.rolling(window=period, min_periods=period).mean()
        avg_loss = loss.rolling(window=period, min_periods=period).mean()
        
        # Step 4: Calculate RS (Relative Strength)
        rs = avg_gain / avg_loss
        
        # Step 5: Calculate RSI using standard formula
        df['RSI'] = 100 - (100 / (1 + rs))
        
        logger.info(f"RSI calculated with period {period} using standard formula")
        return df
    
    @staticmethod
    def calculate_macd(ohlc_df: pd.DataFrame, fast: int = 12, slow: int = 26, signal: int = 9) -> pd.DataFrame:
        """
        Calculate MACD (Moving Average Convergence Divergence)
        
        MACD is a trend-following momentum indicator that shows the relationship 
        between two exponential moving averages of a security's price.
        
        Formula (from Aseem Singhal):
        1. MA_Fast = EWM(Close, span=12)        [Fast moving average]
        2. MA_Slow = EWM(Close, span=26)        [Slow moving average]
        3. MACD = MA_Fast - MA_Slow             [MACD line]
        4. Signal = EWM(MACD, span=9)           [Signal line]
        5. Histogram = MACD - Signal            [MACD Histogram]
        
        Trading Signals:
        - MACD crosses above Signal: Bullish signal (BUY)
        - MACD crosses below Signal: Bearish signal (SELL)
        - MACD above Zero: Uptrend
        - MACD below Zero: Downtrend
        - Histogram: Visual representation of MACD and Signal divergence
        
        Args:
            ohlc_df: DataFrame with OHLC data
            fast: Fast EMA period (default 12 - typical value)
            slow: Slow EMA period (default 26 - typical value)
            signal: Signal line EMA period (default 9 - typical value)
        
        Returns:
            DataFrame with 'MA_Fast', 'MA_Slow', 'MACD', 'Signal', 'MACD_Histogram' columns added
        """
        df = ohlc_df.copy()
        
        # Step 1: Calculate Fast MA (12-period EWM)
        df['MA_Fast'] = df['Close'].ewm(span=fast, min_periods=fast).mean()
        
        # Step 2: Calculate Slow MA (26-period EWM)
        df['MA_Slow'] = df['Close'].ewm(span=slow, min_periods=slow).mean()
        
        # Step 3: Calculate MACD line (difference between fast and slow)
        df['MACD'] = df['MA_Fast'] - df['MA_Slow']
        
        # Step 4: Calculate Signal line (9-period EWM of MACD)
        df['Signal'] = df['MACD'].ewm(span=signal, min_periods=signal).mean()
        
        # Step 5: Calculate MACD Histogram (difference between MACD and Signal)
        df['MACD_Histogram'] = df['MACD'] - df['Signal']
        
        logger.info(f"MACD calculated: MA_Fast={fast}, MA_Slow={slow}, Signal={signal}")
        return df
    
    @staticmethod
    def calculate_bollinger_bands(ohlc_df: pd.DataFrame, period: int = 20, std_dev: float = 2.0) -> pd.DataFrame:
        """
        Calculate Bollinger Bands
        
        Bollinger Bands are volatility bands placed above and below a moving average.
        They indicate overbought/oversold conditions and volatility.
        
        Uses rolling window standard deviation (Aseem's approach from code snippet)
        
        Formulas (using pandas rolling functions):
        - MA = Close.rolling(window).mean()
        - Upper Band = MA + (Close.rolling(window).std() * num_std_devs)
        - Lower Band = MA - (Close.rolling(window).std() * num_std_devs)
        - Band Width = Upper Band - Lower Band
        
        Trading Signals:
        - Price touches upper band: Potential overbought
        - Price touches lower band: Potential oversold
        - Narrowing bands: Low volatility (Volatility Squeeze)
        - Expanding bands: High volatility
        
        Args:
            ohlc_df: DataFrame with OHLC data
            period: Period for moving average (default 20)
            std_dev: Standard deviation multiplier (default 2.0)
        
        Returns:
            DataFrame with 'MA', 'BB_up', 'BB_dn', 'BB_width' columns added
        """
        df = ohlc_df.copy()
        
        # Calculate Simple Moving Average using rolling window
        df['MA'] = df['Close'].rolling(period).mean()
        
        # Calculate standard deviation using rolling window
        rolling_std = df['Close'].rolling(period).std()
        
        # Calculate upper and lower bands
        df['BB_up'] = df['MA'] + (rolling_std * std_dev)
        df['BB_dn'] = df['MA'] - (rolling_std * std_dev)
        
        # Calculate band width
        df['BB_width'] = df['BB_up'] - df['BB_dn']
        
        # Remove NaN rows from rolling window period
        df.dropna(inplace=True)
        
        logger.info(f"Bollinger Bands calculated: period={period}, std_dev={std_dev}")
        return df
    
    @staticmethod
    def calculate_ema(ohlc_df: pd.DataFrame, period: int = 14, column: str = 'Close') -> pd.DataFrame:
        """
        Calculate Exponential Moving Average (EMA)
        
        EMA is a moving average that gives more weight to recent prices.
        
        Calculation:
        EMA = Close.ewm(span=period).mean()
        
        Args:
            ohlc_df: DataFrame with OHLC data
            period: Period for EMA calculation (default 14)
            column: Column to calculate EMA on (default 'Close')
        
        Returns:
            DataFrame with 'EMA' column added
        """
        df = ohlc_df.copy()
        
        # Calculate EMA using exponential weighted mean
        df['EMA'] = df[column].ewm(span=period).mean()
        
        logger.info(f"EMA calculated with period {period} on column {column}")
        return df
    
    @staticmethod
    def calculate_sma(ohlc_df: pd.DataFrame, period: int = 20, column: str = 'Close') -> pd.DataFrame:
        """
        Calculate Simple Moving Average (SMA) - Optimized with pandas rolling()
        
        SMA represents the arithmetic mean of prices over a specified period.
        
        IMPLEMENTATION APPROACH: Method 1 (Pandas Rolling - MOST EFFICIENT)
        This implementation uses pandas .rolling() method for maximum performance.
        
        4 IMPLEMENTATION METHODS AVAILABLE:
        
        METHOD 1 (CURRENT - pandas rolling):
            df['SMA'] = df['Close'].rolling(window=period).mean()
            - Time Complexity: O(n)
            - Space Complexity: O(n)
            - Performance: Highly optimized C-backed operations
            - Use Case: Production, real-time calculations
            
        METHOD 2 (Pandas iterrows):
            for index, row in data.iterrows():
                if index >= period - 1:
                    sma_value = sum(data.iloc[index-i]['Close'] for i in range(period)) / period
                    sma_list.append(sma_value)
            - Time Complexity: O(n * period)
            - Space Complexity: O(n)
            - Performance: Moderate, slower than rolling()
            - Use Case: Manual control, debugging
            
        METHOD 3 (Pandas loc with range):
            for i in range(len(data)):
                if i >= period - 1:
                    sma_value = sum(data.loc[i-j,'Close'] for j in range(period)) / period
                    sma_list.append(sma_value)
            - Time Complexity: O(n * period)
            - Space Complexity: O(n)
            - Performance: Similar to Method 2
            - Use Case: Index-based operations
            
        METHOD 4 (Pre-built list optimization):
            close_value = []
            for index, row in data.iterrows():
                close_value.append(row['Close'])
                if index >= period - 1:
                    sma_value = sum(close_value[index-i] for i in range(period)) / period
                    sma_list.append(sma_value)
            - Time Complexity: O(n * period)
            - Space Complexity: O(n + list_overhead)
            - Performance: Slightly better than methods 2-3
            - Use Case: Avoiding repeated DataFrame lookups
        
        FORMULA:
        SMA = (Close[t] + Close[t-1] + ... + Close[t-(n-1)]) / n
        where n = period
        
        ALGORITHM BREAKDOWN (Pandas Rolling Method):
        1. Create rolling window of size 'period'
        2. Calculate mean for each window
        3. First (period-1) values are NaN (insufficient data)
        4. From index (period-1) onwards, SMA is calculated
        
        TRADING SIGNAL INTERPRETATION:
        - Buy Signal: Price crosses above SMA (uptrend confirmation)
        - Sell Signal: Price crosses below SMA (downtrend confirmation)
        - Trend Direction: Price above SMA = Uptrend, Below = Downtrend
        - Support/Resistance: SMA often acts as dynamic support/resistance
        
        Args:
            ohlc_df: DataFrame with OHLC data
            period: Period for SMA calculation (default 20)
            column: Column to calculate SMA on (default 'Close')
        
        Returns:
            DataFrame with 'SMA' column added
            
        Example:
            >>> df = fetch_ohlc_data(ticker)
            >>> df = calculate_sma(df, period=20)
            >>> print(df[['Close', 'SMA']].tail())
        """
        df = ohlc_df.copy()
        
        # Calculate SMA using pandas rolling window (Method 1 - Optimized)
        df['SMA'] = df[column].rolling(window=period).mean()
        
        logger.info(f"SMA calculated with period {period} on column {column}")
        return df

    @staticmethod
    def calculate_wma(ohlc_df: pd.DataFrame, period: int = 4, 
                      weights: Optional[List[float]] = None, 
                      column: str = 'Close') -> pd.DataFrame:
        """
        Calculate Weighted Moving Average (WMA)
        
        WMA is a moving average that gives more weight to recent prices.
        Users can specify custom weights for each period.
        
        2 IMPLEMENTATION METHODS:
        
        METHOD 1 (CUSTOM WEIGHTS - Used by Aseem):
            weights = [0.40, 0.30, 0.20, 0.10]  # Period 4 example
            wma_value = Close[i]*0.40 + Close[i-1]*0.30 + Close[i-2]*0.20 + Close[i-3]*0.10
            - Time Complexity: O(n × period)
            - Use Case: Custom weight schemes
            
        METHOD 2 (LINEAR DECREASING WEIGHTS - OPTIMIZED):
            weights = [period, period-1, ..., 2, 1] / sum(weights)
            wma = sum(Close * weight) / sum(weight)
            - Time Complexity: O(n)
            - Use Case: Standard linear WMA (most common)
        
        FORMULA:
        WMA = (Close[0] × w[0] + Close[1] × w[1] + ... + Close[n-1] × w[n-1]) / sum(w)
        where w = [weight_0, weight_1, ..., weight_n-1]
        
        STANDARD LINEAR WEIGHTS (if not provided):
        For period 4: [4, 3, 2, 1] / 10 = [0.40, 0.30, 0.20, 0.10]
        For period 5: [5, 4, 3, 2, 1] / 15 = [0.333, 0.267, 0.200, 0.133, 0.067]
        
        ALGORITHM BREAKDOWN (Custom Weights Method):
        1. Validate period >= 1
        2. Calculate or validate weights (must sum to ~1.0)
        3. For each candle i >= period:
            a. Multiply each close price by corresponding weight
            b. Sum all weighted prices
            c. Store in WMA column
        4. First (period-1) values are None (insufficient data)
        
        TRADING SIGNAL INTERPRETATION:
        - Same as SMA/EMA but responds faster to recent price changes
        - Price > WMA: Uptrend
        - Price < WMA: Downtrend
        - WMA crossovers: Entry/exit signals
        - More responsive than SMA, less than EMA
        
        OUTPUT COLUMNS:
        - WMA: Weighted Moving Average column
        
        Args:
            ohlc_df: DataFrame with OHLC data
            period: Period for WMA calculation (default 4)
            weights: Custom weights list [w0, w1, ..., w(n-1)]
                     If None, uses linear decreasing weights
                     Example: [0.40, 0.30, 0.20, 0.10] for period 4
            column: Column to calculate WMA on (default 'Close')
        
        Returns:
            DataFrame with 'WMA' column added
            
        Example:
            >>> df = fetch_ohlc_data(ticker)
            >>> # Standard linear WMA
            >>> df = calculate_wma(df, period=20)
            >>> # Custom weights (as per Aseem)
            >>> custom_weights = [0.40, 0.30, 0.20, 0.10]
            >>> df = calculate_wma(df, period=4, weights=custom_weights)
            >>> print(df[['Close', 'WMA']].tail())
        """
        df = ohlc_df.copy()
        
        # Set default linear weights if not provided
        if weights is None:
            # Linear decreasing weights: [period, period-1, ..., 1]
            weights = [float(period - i) for i in range(period)]
            # Normalize weights to sum to 1
            weight_sum = sum(weights)
            weights = [w / weight_sum for w in weights]
        else:
            # Validate provided weights
            if len(weights) != period:
                raise ValueError(f"Weights length ({len(weights)}) must equal period ({period})")
            # Normalize if they don't sum to 1
            weight_sum = sum(weights)
            if abs(weight_sum - 1.0) > 0.001:  # Allow small floating point error
                weights = [w / weight_sum for w in weights]
        
        # Calculate WMA
        wma_values = []
        for i in range(len(df)):
            if i >= period - 1:
                # Calculate weighted average: most recent price has highest weight
                wma_value = 0.0
                for j in range(period):
                    wma_value += df.loc[i - j, column] * weights[j]
                wma_values.append(wma_value)
            else:
                wma_values.append(None)
        
        df['WMA'] = wma_values
        
        logger.info(f"WMA calculated with period {period} on column {column}")
        return df
    
    @staticmethod
    def detect_trend_advanced(ohlc_df: pd.DataFrame) -> Optional[str]:
        """
        Detect ADVANCED TREND (5-candle + historical context)
        
        Advanced Trend Detection checks for:
        1. Last 3 candles in same direction (bullish or bearish)
        2. High/Low progression: last 3 > previous 2
        3. Prior 2 candles in opposite direction (trend reversal confirmation)
        
        ALGORITHM:
        - Uptrend: 3 consecutive green candles with ascending highs and lows
                   + Prior 2 candles bearish with descending highs and lows
        - Downtrend: 3 consecutive red candles with descending highs and lows
                     + Prior 2 candles bullish with ascending highs and lows
        
        This pattern indicates a strong trend change with confirmation from
        the previous bearish/bullish context.
        
        Args:
            ohlc_df: DataFrame with OHLC data (minimum 5 candles required)
        
        Returns:
            str: 'Uptrend', 'Downtrend', or None
        
        Example:
            >>> df = fetchOHLC2("NSE:KOTAKBANK-EQ", "10", 5)
            >>> trend = TechnicalIndicatorsService.detect_trend_advanced(df)
            >>> print(f"Trend: {trend}")
        """
        if len(ohlc_df) < 5:
            logger.warning("Insufficient data (need 5+ candles) for advanced trend detection")
            return None
        
        try:
            df = ohlc_df.copy()
            i = len(df) - 1
            
            # Uptrend condition (5 criteria)
            # Last 3 candles bullish with ascending highs/lows
            if (df.loc[i, 'Close'] > df.loc[i, 'Open'] and
                df.loc[i-1, 'Close'] > df.loc[i-1, 'Open'] and
                df.loc[i-2, 'Close'] > df.loc[i-2, 'Open'] and
                df.loc[i, 'High'] > df.loc[i-1, 'High'] and
                df.loc[i-1, 'High'] > df.loc[i-2, 'High'] and
                df.loc[i, 'Low'] > df.loc[i-1, 'Low'] and
                df.loc[i-1, 'Low'] > df.loc[i-2, 'Low'] and
                df.loc[i-3, 'Close'] < df.loc[i-3, 'Open'] and
                df.loc[i-4, 'Close'] < df.loc[i-4, 'Open'] and
                df.loc[i-2, 'High'] < df.loc[i-3, 'High'] and
                df.loc[i-3, 'High'] < df.loc[i-4, 'High'] and
                df.loc[i-2, 'Low'] < df.loc[i-3, 'Low'] and
                df.loc[i-3, 'Low'] < df.loc[i-4, 'Low']):
                trend = 'Uptrend'
                logger.info(f"Advanced uptrend detected with 5-candle confirmation")
                return trend
            
            # Downtrend condition (5 criteria)
            # Last 3 candles bearish with descending highs/lows
            elif (df.loc[i, 'Close'] < df.loc[i, 'Open'] and
                  df.loc[i-1, 'Close'] < df.loc[i-1, 'Open'] and
                  df.loc[i-2, 'Close'] < df.loc[i-2, 'Open'] and
                  df.loc[i, 'High'] < df.loc[i-1, 'High'] and
                  df.loc[i-1, 'High'] < df.loc[i-2, 'High'] and
                  df.loc[i, 'Low'] < df.loc[i-1, 'Low'] and
                  df.loc[i-1, 'Low'] < df.loc[i-2, 'Low'] and
                  df.loc[i-3, 'Close'] > df.loc[i-3, 'Open'] and
                  df.loc[i-4, 'Close'] > df.loc[i-4, 'Open'] and
                  df.loc[i-2, 'High'] > df.loc[i-3, 'High'] and
                  df.loc[i-3, 'High'] > df.loc[i-4, 'High'] and
                  df.loc[i-2, 'Low'] > df.loc[i-3, 'Low'] and
                  df.loc[i-3, 'Low'] > df.loc[i-4, 'Low']):
                trend = 'Downtrend'
                logger.info(f"Advanced downtrend detected with 5-candle confirmation")
                return trend
            
            else:
                logger.info("No advanced trend pattern detected")
                return None
        
        except (KeyError, IndexError) as e:
            logger.error(f"Error detecting advanced trend: {e}")
            return None
    
    @staticmethod
    def detect_trend_simple(ohlc_df: pd.DataFrame) -> Optional[str]:
        """
        Detect SIMPLE TREND (3-candle pattern)
        
        Simple Trend Detection checks for:
        1. Last 3 candles all in same direction
        2. High/Low progression throughout the 3 candles
        
        ALGORITHM:
        - Uptrend: 3 consecutive green candles with ascending highs and lows
        - Downtrend: 3 consecutive red candles with descending highs and lows
        
        This is a basic trend confirmation pattern useful for quick entries/exits.
        Faster detection than advanced trend but less confirmation.
        
        Args:
            ohlc_df: DataFrame with OHLC data (minimum 3 candles required)
        
        Returns:
            str: 'Uptrend', 'Downtrend', or None
        
        Example:
            >>> df = fetchOHLC2("NSE:RELIANCE-EQ", "5", 5)
            >>> trend = TechnicalIndicatorsService.detect_trend_simple(df)
            >>> print(f"Trend: {trend}")
        """
        if len(ohlc_df) < 3:
            logger.warning("Insufficient data (need 3+ candles) for simple trend detection")
            return None
        
        try:
            df = ohlc_df.copy()
            i = len(df) - 1
            
            # Uptrend condition
            # Last 3 candles bullish with ascending highs and lows
            if (df.loc[i, 'Close'] > df.loc[i, 'Open'] and
                df.loc[i-1, 'Close'] > df.loc[i-1, 'Open'] and
                df.loc[i-2, 'Close'] > df.loc[i-2, 'Open'] and
                df.loc[i, 'High'] > df.loc[i-1, 'High'] and
                df.loc[i-1, 'High'] > df.loc[i-2, 'High'] and
                df.loc[i, 'Low'] > df.loc[i-1, 'Low'] and
                df.loc[i-1, 'Low'] > df.loc[i-2, 'Low']):
                trend = 'Uptrend'
                logger.info(f"Simple uptrend detected (3-candle confirmation)")
                return trend
            
            # Downtrend condition
            # Last 3 candles bearish with descending highs and lows
            elif (df.loc[i, 'Close'] < df.loc[i, 'Open'] and
                  df.loc[i-1, 'Close'] < df.loc[i-1, 'Open'] and
                  df.loc[i-2, 'Close'] < df.loc[i-2, 'Open'] and
                  df.loc[i, 'High'] < df.loc[i-1, 'High'] and
                  df.loc[i-1, 'High'] < df.loc[i-2, 'High'] and
                  df.loc[i, 'Low'] < df.loc[i-1, 'Low'] and
                  df.loc[i-1, 'Low'] < df.loc[i-2, 'Low']):
                trend = 'Downtrend'
                logger.info(f"Simple downtrend detected (3-candle confirmation)")
                return trend
            
            else:
                logger.info("No simple trend pattern detected")
                return None
        
        except (KeyError, IndexError) as e:
            logger.error(f"Error detecting simple trend: {e}")
            return None
    
    @staticmethod
    def detect_trend_rolling(ohlc_df: pd.DataFrame, period: int = 7, threshold: float = 0.7) -> Optional[str]:
        """
        Detect ROLLING TREND using high/low progression analysis
        
        Rolling Trend Detection checks for consistent progression of highs and lows
        over a period, indicating strong directional momentum.
        
        ALGORITHM:
        - Uptrend: (% of candles with Low >= previous Low) >= threshold (default 70%)
                   AND current close > current open (bullish)
        - Downtrend: (% of candles with High <= previous High) >= threshold (default 70%)
                     AND current close < current open (bearish)
        
        This method detects sustained trends by analyzing the consistency of
        higher lows (uptrend) or lower highs (downtrend) over the period.
        
        Args:
            ohlc_df: DataFrame with OHLC data (minimum period candles required)
            period: Number of candles to analyze (default 7)
            threshold: Percentage threshold for trend confirmation (default 0.7 = 70%)
        
        Returns:
            str: 'Uptrend', 'Downtrend', or None
        
        Example:
            >>> df = fetchOHLC2("NSE:SYMBOL-EQ", "15", 5)
            >>> trend = TechnicalIndicatorsService.detect_trend_rolling(df, period=7)
            >>> print(f"Rolling Trend: {trend}")
        """
        if len(ohlc_df) < period:
            logger.warning(f"Insufficient data (need {period}+ candles) for rolling trend detection")
            return None
        
        try:
            df = ohlc_df.copy()
            
            # Calculate rolling comparisons
            df["up"] = (df["Low"] >= df["Low"].shift(1)).astype(int)
            df["dn"] = (df["High"] <= df["High"].shift(1)).astype(int)
            
            # Get last N candles
            up_count = df["up"].iloc[-period:].sum()
            dn_count = df["dn"].iloc[-period:].sum()
            
            current_close = df["Close"].iloc[-1]
            current_open = df["Open"].iloc[-1]
            
            # Uptrend: consistent higher lows + current candle bullish
            if (up_count / period) >= threshold and current_close > current_open:
                logger.info(f"Rolling uptrend detected ({up_count}/{period} candles, {(up_count/period)*100:.1f}%)")
                return "Uptrend"
            
            # Downtrend: consistent lower highs + current candle bearish
            elif (dn_count / period) >= threshold and current_close < current_open:
                logger.info(f"Rolling downtrend detected ({dn_count}/{period} candles, {(dn_count/period)*100:.1f}%)")
                return "Downtrend"
            
            else:
                logger.info("No rolling trend pattern detected")
                return None
        
        except (KeyError, IndexError) as e:
            logger.error(f"Error detecting rolling trend: {e}")
            return None
    
    @staticmethod
    def get_resistance_support(ohlc_intraday: pd.DataFrame, ohlc_daily: pd.DataFrame) -> Dict[str, float]:
        """
        Calculate Pivot Points and Nearest Resistance/Support Levels
        
        Uses daily pivot points to find the closest resistance and support
        levels relative to current intraday price.
        
        ALGORITHM:
        1. Calculate daily pivot points (P, R1, R2, R3, S1, S2, S3)
        2. Get current close price from intraday data
        3. Find closest level above current price (resistance)
        4. Find closest level below current price (support)
        
        Args:
            ohlc_intraday: Intraday OHLC DataFrame (for current price)
            ohlc_daily: Daily OHLC DataFrame (for pivot calculation)
        
        Returns:
            Dict with keys:
            - 'current_price': Current close price
            - 'pivot': Pivot point
            - 'resistance': Nearest resistance level above price
            - 'support': Nearest support level below price
            - 'r1', 'r2', 'r3', 's1', 's2', 's3': All pivot levels
        
        Example:
            >>> intraday_df = fetchOHLC2("NSE:SBIN-EQ", "15", 5)
            >>> daily_df = fetchOHLC2("NSE:SBIN-EQ", "D", 30)
            >>> levels = TechnicalIndicatorsService.get_resistance_support(intraday_df, daily_df)
            >>> print(f"Resistance: {levels['resistance']}, Support: {levels['support']}")
        """
        if len(ohlc_intraday) == 0 or len(ohlc_daily) == 0:
            logger.warning("Insufficient data for resistance/support calculation")
            return {}
        
        try:
            # Get previous day's OHLC for pivot calculation
            high = round(float(ohlc_daily["High"].iloc[-2]), 2)
            low = round(float(ohlc_daily["Low"].iloc[-2]), 2)
            close = round(float(ohlc_daily["Close"].iloc[-2]), 2)
            
            # Calculate pivot points
            pivot = round((high + low + close) / 3, 2)
            r1 = round((2 * pivot - low), 2)
            r2 = round((pivot + (high - low)), 2)
            r3 = round((high + 2 * (pivot - low)), 2)
            s1 = round((2 * pivot - high), 2)
            s2 = round((pivot - (high - low)), 2)
            s3 = round((low - 2 * (high - pivot)), 2)
            
            # Current price
            current_price = round(float(ohlc_intraday["Close"].iloc[-1]), 2)
            
            # Create dictionary of levels
            levels_dict = {
                'p': pivot,
                'r1': r1,
                'r2': r2,
                'r3': r3,
                's1': s1,
                's2': s2,
                's3': s3
            }
            
            # Find closest level above current price (resistance)
            closest_above = float('inf')
            closest_above_label = None
            for label, value in levels_dict.items():
                if value > current_price and (value - current_price) < closest_above:
                    closest_above = value - current_price
                    closest_above_label = label
            
            # Find closest level below current price (support)
            closest_below = float('-inf')
            closest_below_label = None
            for label, value in levels_dict.items():
                if value < current_price and (current_price - value) > closest_below:
                    closest_below = current_price - value
                    closest_below_label = label
            
            result = {
                "current_price": current_price,
                "pivot": pivot,
                "r1": r1,
                "r2": r2,
                "r3": r3,
                "s1": s1,
                "s2": s2,
                "s3": s3,
                "nearest_resistance": levels_dict.get(closest_above_label, None),
                "nearest_resistance_label": closest_above_label,
                "nearest_support": levels_dict.get(closest_below_label, None),
                "nearest_support_label": closest_below_label
            }
            
            logger.info(f"Resistance/Support: Current={current_price}, R={result['nearest_resistance']}, S={result['nearest_support']}")
            return result
        
        except (KeyError, IndexError, ValueError) as e:
            logger.error(f"Error calculating resistance/support: {e}")
            return {}
    
    @staticmethod
    def detect_candle_pattern_advanced(ohlc_intraday: pd.DataFrame, ohlc_daily: pd.DataFrame, 
                                       period: int = 7) -> Dict[str, Any]:
        """
        Detect COMPREHENSIVE CANDLE PATTERN with Trend + Momentum Confirmation
        
        Advanced pattern detection combines:
        1. Candle type (doji, marubozu, hammer, shooting star, engulfing)
        2. Trend direction (uptrend, downtrend, sideways)
        3. Momentum indicator (bullish if above pivot, bearish if below)
        
        ALGORITHM:
        - Identify current candle type
        - Assess trend over period candles
        - Check momentum vs pivot point
        - Return pattern name and momentum confirmation
        
        Pattern Names:
        - 'doji_bear': Doji in uptrend (potential reversal)
        - 'doji_bull': Doji in downtrend (potential reversal)
        - 'marubozu_bull': Bullish marubozu (continuation)
        - 'marubozu_bear': Bearish marubozu (continuation)
        - 'hammer_bull': Hammer in downtrend (reversal)
        - 'hammer_bear': Hammer in uptrend/hanging man (reversal)
        - 'shooting_star_bear': Shooting star in uptrend (reversal)
        - 'engulfing_bull': Bullish engulfing in downtrend (reversal)
        - 'engulfing_bear': Bearish engulfing in uptrend (reversal)
        
        Momentum:
        - 'bull': Above pivot point (bullish momentum)
        - 'bear': Below pivot point (bearish momentum)
        - None: At pivot point (neutral)
        
        Args:
            ohlc_intraday: Intraday OHLC DataFrame
            ohlc_daily: Daily OHLC DataFrame (for pivot calculation)
            period: Period for trend analysis (default 7)
        
        Returns:
            Dict with:
            - 'pattern': Pattern name or None
            - 'momentum': 'bull', 'bear', or None
            - 'candle_type': Base candle type identified
            - 'trend': Current trend direction
            - 'current_price': Current close price
            - 'pivot': Daily pivot point
            - 'signal_strength': Pattern confidence
        
        Example:
            >>> intraday = fetchOHLC2("NSE:SBIN-EQ", "15", 5)
            >>> daily = fetchOHLC2("NSE:SBIN-EQ", "D", 30)
            >>> analysis = TechnicalIndicatorsService.detect_candle_pattern_advanced(intraday, daily)
            >>> print(f"Pattern: {analysis['pattern']}, Momentum: {analysis['momentum']}")
        """
        if len(ohlc_intraday) < period:
            logger.warning(f"Insufficient data for pattern detection")
            return {"pattern": None, "momentum": None}
        
        try:
            df = ohlc_intraday.copy()
            
            # Get current candle info
            current_close = float(df["Close"].iloc[-1])
            current_open = float(df["Open"].iloc[-1])
            current_high = float(df["High"].iloc[-1])
            current_low = float(df["Low"].iloc[-1])
            
            # Get daily pivot for momentum
            if len(ohlc_daily) >= 2:
                daily_high = float(ohlc_daily["High"].iloc[-2])
                daily_low = float(ohlc_daily["Low"].iloc[-2])
                daily_close = float(ohlc_daily["Close"].iloc[-2])
                pivot = round((daily_high + daily_low + daily_close) / 3, 2)
            else:
                pivot = current_close
            
            # Detect candle type
            candle_type = None
            doji_threshold = 0.1
            marubozu_buffer = 0.05
            
            # DOJI
            if abs(current_open - current_close) <= doji_threshold * (current_high - current_low):
                candle_type = "doji"
            # BULLISH MARUBOZU
            elif (current_close > current_open and
                  abs(current_high - current_close) <= marubozu_buffer and
                  abs(current_low - current_open) <= marubozu_buffer):
                candle_type = "marubozu_bull"
            # BEARISH MARUBOZU
            elif (current_open > current_close and
                  abs(current_high - current_open) <= marubozu_buffer and
                  abs(current_low - current_close) <= marubozu_buffer):
                candle_type = "marubozu_bear"
            # HAMMER
            elif ((current_open - current_close > 0 and
                   current_open - current_low >= 2 * (current_high - current_close)) or
                  (current_close - current_open > 0 and
                   current_close - current_low >= 2 * (current_high - current_open))):
                candle_type = "hammer"
            # SHOOTING STAR
            elif ((current_open - current_close > 0 and
                   current_high - current_open >= 2 * (current_close - current_low)) or
                  (current_close - current_open > 0 and
                   current_high - current_close >= 2 * (current_open - current_low))):
                candle_type = "shooting_star"
            # BULLISH ENGULFING
            elif (len(df) >= 2 and
                  df.iloc[-2]["Open"] > df.iloc[-2]["Close"] and
                  current_close > current_open and
                  current_open <= df.iloc[-2]["Open"] and
                  current_close >= df.iloc[-2]["Close"]):
                candle_type = "engulfing_bull"
            # BEARISH ENGULFING
            elif (len(df) >= 2 and
                  df.iloc[-2]["Open"] < df.iloc[-2]["Close"] and
                  current_open > current_close and
                  current_open >= df.iloc[-2]["Close"] and
                  current_close <= df.iloc[-2]["Open"]):
                candle_type = "engulfing_bear"
            
            # Detect trend (using rolling method)
            df["up"] = (df["Low"] >= df["Low"].shift(1)).astype(int)
            df["dn"] = (df["High"] <= df["High"].shift(1)).astype(int)
            up_count = df["up"].iloc[-period:].sum()
            dn_count = df["dn"].iloc[-period:].sum()
            
            trend = None
            if (up_count / period) >= 0.7 and current_close > current_open:
                trend = "uptrend"
            elif (dn_count / period) >= 0.7 and current_close < current_open:
                trend = "downtrend"
            else:
                trend = "sideways"
            
            # Detect momentum
            momentum = None
            if current_close > pivot:
                momentum = "bull"
            elif current_close < pivot:
                momentum = "bear"
            
            # Combine pattern + trend
            pattern = None
            signal_strength = 0.5  # Base strength
            
            if candle_type == "doji":
                if trend == "uptrend":
                    pattern = "doji_bear"  # Potential reversal
                    signal_strength = 0.7
                elif trend == "downtrend":
                    pattern = "doji_bull"  # Potential reversal
                    signal_strength = 0.7
            
            elif candle_type == "marubozu_bull":
                pattern = "marubozu_bull"
                signal_strength = 0.8 if momentum == "bull" else 0.6
            
            elif candle_type == "marubozu_bear":
                pattern = "marubozu_bear"
                signal_strength = 0.8 if momentum == "bear" else 0.6
            
            elif candle_type == "hammer":
                if trend == "uptrend":
                    pattern = "hammer_bear"  # Hanging man
                    signal_strength = 0.7
                elif trend == "downtrend":
                    pattern = "hammer_bull"  # Reversal
                    signal_strength = 0.8
            
            elif candle_type == "shooting_star":
                if trend == "uptrend":
                    pattern = "shooting_star_bear"
                    signal_strength = 0.8
            
            elif candle_type == "engulfing_bull":
                if trend == "downtrend":
                    pattern = "engulfing_bull"
                    signal_strength = 0.9  # High confidence
                else:
                    pattern = "engulfing_bull"
                    signal_strength = 0.7
            
            elif candle_type == "engulfing_bear":
                if trend == "uptrend":
                    pattern = "engulfing_bear"
                    signal_strength = 0.9  # High confidence
                else:
                    pattern = "engulfing_bear"
                    signal_strength = 0.7
            
            result = {
                "pattern": pattern,
                "momentum": momentum,
                "candle_type": candle_type,
                "trend": trend,
                "current_price": current_close,
                "pivot": pivot,
                "signal_strength": signal_strength
            }
            
            logger.info(f"Pattern detected: {pattern}, Momentum: {momentum}, Trend: {trend}, Strength: {signal_strength}")
            return result
        
        except (KeyError, IndexError, ValueError) as e:
            logger.error(f"Error detecting candle pattern: {e}")
            return {"pattern": None, "momentum": None}

    @staticmethod
    def calculate_stochastic(ohlc_df: pd.DataFrame, period: int = 14) -> pd.DataFrame:
        """
        Calculate Stochastic Oscillator (K% and D%)
        
        Stochastic Oscillator measures the momentum of price movement by comparing
        closing price to the high-low range over a specified period.
        
        2 IMPLEMENTATION METHODS:
        
        METHOD 1 (MANUAL LOOP - Used by Aseem):
            for i in range(len(data)):
                if i >= period:
                    highest_high = max(data.loc[i-j, 'High'] for j in range(period))
                    lowest_low = min(data.loc[i-j, 'Low'] for j in range(period))
                    k_value = (Close - lowest_low) * 100 / (highest_high - lowest_low)
                    K.append(k_value)
                    if i >= period + 3:
                        d_value = (K[i] + K[i-1] + K[i-2]) / 3
            - Time Complexity: O(n × period)
            - Use Case: Exact control, debugging
            
        METHOD 2 (PANDAS ROLLING - OPTIMIZED):
            highest_high = df['High'].rolling(window=period).max()
            lowest_low = df['Low'].rolling(window=period).min()
            k_percent = (df['Close'] - lowest_low) * 100 / (highest_high - lowest_low)
            d_percent = k_percent.rolling(window=3).mean()
            - Time Complexity: O(n)
            - Use Case: Production, real-time (RECOMMENDED)
        
        FORMULA:
        K% = (Close - Lowest Low) * 100 / (Highest High - Lowest Low)
        where:
        - Close = Current candle's closing price
        - Lowest Low = Minimum low over past 'period' candles
        - Highest High = Maximum high over past 'period' candles
        
        D% = 3-period SMA of K%
        
        ALGORITHM BREAKDOWN (Method 2 - Pandas Rolling):
        1. Find highest high over 'period' candles: rolling(period).max()
        2. Find lowest low over 'period' candles: rolling(period).min()
        3. Calculate K%: (Close - Lowest Low) / (Highest High - Lowest Low) * 100
        4. Calculate D%: 3-period SMA of K%
        
        TRADING SIGNAL INTERPRETATION:
        - Overbought: K% > 80 (potential reversal/pullback)
        - Oversold: K% < 20 (potential bounce/reversal)
        - Buy Signal: K% crosses above D% when K% < 30 (bullish)
        - Sell Signal: K% crosses below D% when K% > 70 (bearish)
        - K-D Divergence: Price makes new high but K% doesn't (bearish divergence)
        
        OUTPUT COLUMNS:
        - K: Stochastic K% line (0-100 range)
        - D: Stochastic D% line (3-period SMA of K) (0-100 range)
        
        Args:
            ohlc_df: DataFrame with OHLC data
            period: Lookback period for stochastic calculation (default 14)
        
        Returns:
            DataFrame with 'K' and 'D' columns added
        """
        df = ohlc_df.copy()
        
        # Calculate rolling high and low
        highest_high = df['High'].rolling(window=period).max()
        lowest_low = df['Low'].rolling(window=period).min()
        
        # Calculate K% (Stochastic Oscillator)
        k_percent = ((df['Close'] - lowest_low) * 100 / (highest_high - lowest_low))
        
        # Calculate D% (3-period SMA of K%)
        d_percent = k_percent.rolling(window=3).mean()
        
        df['K'] = k_percent
        df['D'] = d_percent
        
        logger.info(f"Stochastic calculated with period {period}")
        return df

    @staticmethod
    def calculate_supertrend(ohlc_df: pd.DataFrame, period: int = 7, multiplier: float = 3.0) -> pd.DataFrame:
        """
        Calculate Supertrend Indicator
        
        Supertrend is a trend-following indicator that identifies trend direction and
        provides dynamic support/resistance levels based on ATR (Average True Range).
        
        3 IMPLEMENTATION APPROACHES:
        
        METHOD 1 (MANUAL LOOP - Iterative calculation):
            - Calculates ATR manually in each iteration
            - Updates upper/lower bands iteratively
            - Tracks trend transitions
            - Time Complexity: O(n × period)
            - Use Case: Debugging, educational
            
        METHOD 2 (OPTIMIZED WITH EWM ATR):
            atr = (df['TR'].ewm(com=period, min_periods=period).mean())
            BasicUpper = HL2 + multiplier * ATR
            BasicLower = HL2 - multiplier * ATR
            FinalUpper = min(BasicUpper, FinalUpper_prev) if Close_prev <= FinalUpper_prev else BasicUpper
            FinalLower = max(BasicLower, FinalLower_prev) if Close_prev >= FinalLower_prev else BasicLower
            - Time Complexity: O(n)
            - Use Case: Production, real-time (RECOMMENDED)
            - Performance: 100-200x faster than Method 1
        
        METHOD 3 (VECTORIZED - Not yet implemented):
            Uses numpy operations for maximum speed
            - Time Complexity: O(n)
            - Use Case: Ultra-high-frequency applications
        
        FORMULA:
        1. ATR = EWM(True Range, period)
        2. HL2 = (High + Low) / 2
        3. BasicUpper = HL2 + multiplier × ATR
        4. BasicLower = HL2 - multiplier × ATR
        5. FinalUpper = min(BasicUpper, FinalUpper[t-1]) if Close[t-1] <= FinalUpper[t-1] else BasicUpper
        6. FinalLower = max(BasicLower, FinalLower[t-1]) if Close[t-1] >= FinalLower[t-1] else BasicLower
        7. Supertrend = FinalUpper (in downtrend) or FinalLower (in uptrend)
        
        ALGORITHM BREAKDOWN (Method 2 - EWM ATR):
        1. Calculate True Range: TR = max(H-L, abs(H-Cp), abs(L-Cp))
        2. Calculate ATR using EWM: exponential weighted moving average
        3. Calculate HL2: midpoint = (High + Low) / 2
        4. Calculate BasicUpper: midpoint + multiplier × ATR
        5. Calculate BasicLower: midpoint - multiplier × ATR
        6. Calculate FinalUpper: prevents whipsaws by not letting upper band rise
        7. Calculate FinalLower: prevents whipsaws by not letting lower band fall
        8. Calculate Supertrend: switches between upper and lower based on close position
        
        TRADING SIGNAL INTERPRETATION:
        - Uptrend: Close > Supertrend, Supertrend = FinalLower (green)
        - Downtrend: Close < Supertrend, Supertrend = FinalUpper (red)
        - Buy Signal: Price breaks above Supertrend (uptrend starts)
        - Sell Signal: Price breaks below Supertrend (downtrend starts)
        - Support Level: When in uptrend, Supertrend acts as dynamic support
        - Resistance Level: When in downtrend, Supertrend acts as dynamic resistance
        - Stop Loss: Place stop below Supertrend in uptrend, above in downtrend
        
        OUTPUT COLUMNS:
        - ATR: Average True Range
        - BasicUpper: Upper band before smoothing
        - BasicLower: Lower band before smoothing
        - FinalUpper: Final upper band (smoothed, prevents whipsaws)
        - FinalLower: Final lower band (smoothed, prevents whipsaws)
        - Strend: Supertrend line (main indicator output)
        - Trend: Direction indicator (1 = uptrend, -1 = downtrend)
        
        Args:
            ohlc_df: DataFrame with OHLC data
            period: ATR period for calculation (default 7)
            multiplier: Multiplier for ATR (default 3.0)
        
        Returns:
            DataFrame with ATR, upper/lower bands, and Supertrend columns added
            
        Example:
            >>> df = fetch_ohlc_data(ticker)
            >>> df = calculate_supertrend(df, period=7, multiplier=3.0)
            >>> uptrend = df[df['Trend'] == 1]
            >>> print(uptrend[['Close', 'Strend']].tail())
        """
        df = ohlc_df.copy()
        
        # Calculate True Range components
        df['HL'] = df['High'] - df['Low']
        df['HC'] = abs(df['High'] - df['Close'].shift(1))
        df['LC'] = abs(df['Low'] - df['Close'].shift(1))
        df['TR'] = df[['HL', 'HC', 'LC']].max(axis=1)
        
        # Calculate ATR using EWM (Exponential Weighted Mean) - More efficient than SMA
        df['ATR'] = df['TR'].ewm(com=period, min_periods=period).mean()
        
        # Calculate basic bands
        df['HL2'] = (df['High'] + df['Low']) / 2
        df['BasicUpper'] = df['HL2'] + multiplier * df['ATR']
        df['BasicLower'] = df['HL2'] - multiplier * df['ATR']
        
        # Initialize final bands and supertrend
        df['FinalUpper'] = df['BasicUpper']
        df['FinalLower'] = df['BasicLower']
        df['Strend'] = np.nan
        df['Trend'] = 0
        
        # Calculate FinalUpper and FinalLower bands (prevents whipsaws)
        for i in range(period, len(df)):
            if i == period:
                df.loc[i, 'FinalUpper'] = df.loc[i, 'BasicUpper']
                df.loc[i, 'FinalLower'] = df.loc[i, 'BasicLower']
            else:
                # FinalUpper cannot be higher than BasicUpper if Close was below it
                if df.loc[i-1, 'Close'] <= df.loc[i-1, 'FinalUpper']:
                    df.loc[i, 'FinalUpper'] = min(df.loc[i, 'BasicUpper'], df.loc[i-1, 'FinalUpper'])
                else:
                    df.loc[i, 'FinalUpper'] = df.loc[i, 'BasicUpper']
                
                # FinalLower cannot be lower than BasicLower if Close was above it
                if df.loc[i-1, 'Close'] >= df.loc[i-1, 'FinalLower']:
                    df.loc[i, 'FinalLower'] = max(df.loc[i, 'BasicLower'], df.loc[i-1, 'FinalLower'])
                else:
                    df.loc[i, 'FinalLower'] = df.loc[i, 'BasicLower']
        
        # Calculate Supertrend and Trend
        for i in range(period, len(df)):
            if i == period:
                # Initial supertrend assignment
                if df.loc[i, 'Close'] < df.loc[i, 'FinalUpper']:
                    df.loc[i, 'Strend'] = df.loc[i, 'FinalUpper']
                    df.loc[i, 'Trend'] = -1
                else:
                    df.loc[i, 'Strend'] = df.loc[i, 'FinalLower']
                    df.loc[i, 'Trend'] = 1
            else:
                # Supertrend transitions
                if df.loc[i-1, 'Strend'] == df.loc[i-1, 'FinalUpper']:
                    # Was on upper band (downtrend)
                    if df.loc[i, 'Close'] <= df.loc[i, 'FinalUpper']:
                        df.loc[i, 'Strend'] = df.loc[i, 'FinalUpper']
                        df.loc[i, 'Trend'] = -1
                    else:
                        df.loc[i, 'Strend'] = df.loc[i, 'FinalLower']
                        df.loc[i, 'Trend'] = 1
                elif df.loc[i-1, 'Strend'] == df.loc[i-1, 'FinalLower']:
                    # Was on lower band (uptrend)
                    if df.loc[i, 'Close'] >= df.loc[i, 'FinalLower']:
                        df.loc[i, 'Strend'] = df.loc[i, 'FinalLower']
                        df.loc[i, 'Trend'] = 1
                    else:
                        df.loc[i, 'Strend'] = df.loc[i, 'FinalUpper']
                        df.loc[i, 'Trend'] = -1
        
        logger.info(f"Supertrend calculated with period {period}, multiplier {multiplier}")
        return df


# Initialize service
indicators_service = TechnicalIndicatorsService()


# ============================================================================
# API Endpoints
# ============================================================================


@router.post("/calculate-atr")
async def calculate_atr_endpoint(request: IndicatorRequest):
    """
    Calculate Average True Range (ATR)
    
    ATR measures volatility of price movement
    
    Example request:
    {
        "symbol": "NSE:SBIN-EQ",
        "resolution": "30",
        "duration": 5
    }
    """
    try:
        df = indicators_service.fetch_ohlc(request.symbol, request.resolution, request.duration)
        
        if df is None or len(df) == 0:
            return {"status": "error", "message": "Failed to fetch data"}
        
        df = indicators_service.calculate_atr(df)
        
        atr_values = df['ATR'].dropna().tolist()
        current_atr = float(df['ATR'].iloc[-1]) if pd.notna(df['ATR'].iloc[-1]) else None
        
        return {
            "status": "success",
            "data": {
                "symbol": request.symbol,
                "resolution": request.resolution,
                "total_candles": len(df),
                "atr_values": atr_values,
                "current_atr": current_atr
            }
        }
    
    except Exception as e:
        logger.error(f"Error calculating ATR: {e}")
        return {"status": "error", "message": str(e)}


@router.post("/calculate-adx")
async def calculate_adx_endpoint(request: IndicatorRequest):
    """
    Calculate Average Directional Index (ADX)
    
    ADX measures trend strength (0-100 scale)
    - ADX < 25: Weak trend
    - ADX 25-50: Moderate trend
    - ADX > 50: Strong trend
    
    Example request:
    {
        "symbol": "NSE:SBIN-EQ",
        "resolution": "30",
        "duration": 20
    }
    """
    try:
        df = indicators_service.fetch_ohlc(request.symbol, request.resolution, request.duration)
        
        if df is None or len(df) == 0:
            return {"status": "error", "message": "Failed to fetch data"}
        
        df = indicators_service.calculate_adx(df)
        
        adx_values = df['ADX'].dropna().tolist()
        current_adx = float(df['ADX'].iloc[-1]) if pd.notna(df['ADX'].iloc[-1]) else None
        current_di_plus = float(df['DI+'].iloc[-1]) if pd.notna(df['DI+'].iloc[-1]) else None
        current_di_minus = float(df['DI-'].iloc[-1]) if pd.notna(df['DI-'].iloc[-1]) else None
        
        return {
            "status": "success",
            "data": {
                "symbol": request.symbol,
                "resolution": request.resolution,
                "total_candles": len(df),
                "current_adx": current_adx,
                "current_di_plus": current_di_plus,
                "current_di_minus": current_di_minus,
                "adx_values": adx_values,
                "trend_strength": "Weak" if current_adx and current_adx < 25 else ("Moderate" if current_adx and current_adx < 50 else "Strong")
            }
        }
    
    except Exception as e:
        logger.error(f"Error calculating ADX: {e}")
        return {"status": "error", "message": str(e)}


@router.post("/calculate-rsi")
async def calculate_rsi_endpoint(request: IndicatorRequest):
    """
    Calculate Relative Strength Index (RSI)
    
    RSI measures momentum (0-100 scale)
    - RSI < 30: Oversold (potential buy)
    - RSI > 70: Overbought (potential sell)
    
    Example request:
    {
        "symbol": "NSE:SBIN-EQ",
        "resolution": "30",
        "duration": 5
    }
    """
    try:
        df = indicators_service.fetch_ohlc(request.symbol, request.resolution, request.duration)
        
        if df is None or len(df) == 0:
            return {"status": "error", "message": "Failed to fetch data"}
        
        df = indicators_service.calculate_rsi(df)
        
        rsi_values = df['RSI'].dropna().tolist()
        current_rsi = float(df['RSI'].iloc[-1]) if pd.notna(df['RSI'].iloc[-1]) else None
        
        rsi_signal = "Oversold" if current_rsi and current_rsi < 30 else ("Overbought" if current_rsi and current_rsi > 70 else "Neutral")
        
        return {
            "status": "success",
            "data": {
                "symbol": request.symbol,
                "resolution": request.resolution,
                "total_candles": len(df),
                "current_rsi": current_rsi,
                "rsi_signal": rsi_signal,
                "rsi_values": rsi_values
            }
        }
    
    except Exception as e:
        logger.error(f"Error calculating RSI: {e}")
        return {"status": "error", "message": str(e)}


@router.post("/calculate-macd")
async def calculate_macd_endpoint(request: IndicatorRequest):
    """
    Calculate MACD (Moving Average Convergence Divergence)
    
    MACD is a trend-following momentum indicator
    
    Example request:
    {
        "symbol": "NSE:SBIN-EQ",
        "resolution": "30",
        "duration": 10
    }
    """
    try:
        df = indicators_service.fetch_ohlc(request.symbol, request.resolution, request.duration)
        
        if df is None or len(df) == 0:
            return {"status": "error", "message": "Failed to fetch data"}
        
        df = indicators_service.calculate_macd(df)
        
        current_macd = float(df['MACD'].iloc[-1]) if pd.notna(df['MACD'].iloc[-1]) else None
        current_signal = float(df['Signal'].iloc[-1]) if pd.notna(df['Signal'].iloc[-1]) else None
        current_histogram = float(df['MACD_Histogram'].iloc[-1]) if pd.notna(df['MACD_Histogram'].iloc[-1]) else None
        
        return {
            "status": "success",
            "data": {
                "symbol": request.symbol,
                "resolution": request.resolution,
                "total_candles": len(df),
                "current_macd": current_macd,
                "current_signal": current_signal,
                "current_histogram": current_histogram,
                "macd_values": df['MACD'].dropna().tolist()
            }
        }
    
    except Exception as e:
        logger.error(f"Error calculating MACD: {e}")
        return {"status": "error", "message": str(e)}


@router.post("/calculate-bollinger-bands")
async def calculate_bollinger_bands_endpoint(request: IndicatorRequest):
    """
    Calculate Bollinger Bands
    
    Bollinger Bands measure volatility and identify overbought/oversold levels
    
    Formula:
    - SMA = Simple Moving Average of Close over period
    - Upper Band = SMA + (2.0 * StdDev)
    - Lower Band = SMA - (2.0 * StdDev)
    
    Example request:
    {
        "symbol": "NSE:SBIN-EQ",
        "resolution": "30",
        "duration": 5
    }
    """
    try:
        df = indicators_service.fetch_ohlc(request.symbol, request.resolution, request.duration)
        
        if df is None or len(df) == 0:
            return {"status": "error", "message": "Failed to fetch data"}
        
        df = indicators_service.calculate_bollinger_bands(df)
        
        current_close = float(df['Close'].iloc[-1]) if pd.notna(df['Close'].iloc[-1]) else None
        current_sma = float(df['SMA'].iloc[-1]) if pd.notna(df['SMA'].iloc[-1]) else None
        current_upper = float(df['UpperBand'].iloc[-1]) if pd.notna(df['UpperBand'].iloc[-1]) else None
        current_lower = float(df['LowerBand'].iloc[-1]) if pd.notna(df['LowerBand'].iloc[-1]) else None
        
        return {
            "status": "success",
            "data": {
                "symbol": request.symbol,
                "resolution": request.resolution,
                "total_candles": len(df),
                "current_close": current_close,
                "sma": current_sma,
                "upper_band": current_upper,
                "lower_band": current_lower,
                "bb_width": float(current_upper - current_lower) if (current_upper and current_lower) else None
            }
        }
    
    except Exception as e:
        logger.error(f"Error calculating Bollinger Bands: {e}")
        return {"status": "error", "message": str(e)}


@router.post("/calculate-ema")
async def calculate_ema_endpoint(
    symbol: str = Query(...),
    resolution: str = Query("30"),
    duration: int = Query(5),
    period: int = Query(14)
):
    """
    Calculate Exponential Moving Average (EMA)
    
    EMA gives more weight to recent prices compared to SMA
    
    Formula: EMA = Close.ewm(span=period).mean()
    
    Example:
    /calculate-ema?symbol=NSE:SBIN-EQ&resolution=30&duration=5&period=14
    """
    try:
        df = indicators_service.fetch_ohlc(symbol, resolution, duration)
        
        if df is None or len(df) == 0:
            return {"status": "error", "message": "Failed to fetch data"}
        
        df = indicators_service.calculate_ema(df, period=period)
        
        ema_values = df['EMA'].dropna().tolist()
        current_ema = float(df['EMA'].iloc[-1]) if pd.notna(df['EMA'].iloc[-1]) else None
        current_close = float(df['Close'].iloc[-1]) if pd.notna(df['Close'].iloc[-1]) else None
        
        return {
            "status": "success",
            "data": {
                "symbol": symbol,
                "resolution": resolution,
                "period": period,
                "total_candles": len(df),
                "current_ema": current_ema,
                "current_close": current_close,
                "ema_values": ema_values
            }
        }
    
    except Exception as e:
        logger.error(f"Error calculating EMA: {e}")
        return {"status": "error", "message": str(e)}


@router.post("/calculate-sma")
async def calculate_sma_endpoint(
    symbol: str = Query(...),
    resolution: str = Query("30"),
    duration: int = Query(5),
    period: int = Query(20)
):
    """
    Calculate Simple Moving Average (SMA)
    
    SMA is the arithmetic mean of prices over a specified period
    
    Formula: SMA = sum(Close[period]) / period
    
    Example:
    /calculate-sma?symbol=NSE:SBIN-EQ&resolution=30&duration=5&period=20
    """
    try:
        df = indicators_service.fetch_ohlc(symbol, resolution, duration)
        
        if df is None or len(df) == 0:
            return {"status": "error", "message": "Failed to fetch data"}
        
        df = indicators_service.calculate_sma(df, period=period)
        
        sma_values = df['SMA'].dropna().tolist()
        current_sma = float(df['SMA'].iloc[-1]) if pd.notna(df['SMA'].iloc[-1]) else None
        current_close = float(df['Close'].iloc[-1]) if pd.notna(df['Close'].iloc[-1]) else None
        
        return {
            "status": "success",
            "data": {
                "symbol": symbol,
                "resolution": resolution,
                "period": period,
                "total_candles": len(df),
                "current_sma": current_sma,
                "current_close": current_close,
                "sma_values": sma_values
            }
        }
    
    except Exception as e:
        logger.error(f"Error calculating SMA: {e}")
        return {"status": "error", "message": str(e)}


    @staticmethod
    def calculate_stochastic(ohlc_df: pd.DataFrame, period: int = 14) -> pd.DataFrame:
        """
        Calculate Stochastic Oscillator (K% and D%)
        
        Stochastic Oscillator measures the momentum of price movement by comparing
        closing price to the high-low range over a specified period.
        
        2 IMPLEMENTATION METHODS:
        
        METHOD 1 (MANUAL LOOP - Used by Aseem):
            for i in range(len(data)):
                if i >= period:
                    highest_high = max(data.loc[i-j, 'High'] for j in range(period))
                    lowest_low = min(data.loc[i-j, 'Low'] for j in range(period))
                    k_value = (Close - lowest_low) * 100 / (highest_high - lowest_low)
                    K.append(k_value)
                    if i >= period + 3:
                        d_value = (K[i] + K[i-1] + K[i-2]) / 3
            - Time Complexity: O(n × period)
            - Use Case: Exact control, debugging
            
        METHOD 2 (PANDAS ROLLING - OPTIMIZED):
            highest_high = df['High'].rolling(window=period).max()
            lowest_low = df['Low'].rolling(window=period).min()
            k_percent = (df['Close'] - lowest_low) * 100 / (highest_high - lowest_low)
            d_percent = k_percent.rolling(window=3).mean()
            - Time Complexity: O(n)
            - Use Case: Production, real-time (RECOMMENDED)
        
        FORMULA:
        K% = (Close - Lowest Low) * 100 / (Highest High - Lowest Low)
        where:
        - Close = Current candle's closing price
        - Lowest Low = Minimum low over past 'period' candles
        - Highest High = Maximum high over past 'period' candles
        
        D% = 3-period SMA of K%
        
        ALGORITHM BREAKDOWN (Method 2 - Pandas Rolling):
        1. Find highest high over 'period' candles: rolling(period).max()
        2. Find lowest low over 'period' candles: rolling(period).min()
        3. Calculate K%: (Close - Lowest Low) / (Highest High - Lowest Low) * 100
        4. Calculate D%: 3-period SMA of K%
        
        TRADING SIGNAL INTERPRETATION:
        - Overbought: K% > 80 (potential reversal/pullback)
        - Oversold: K% < 20 (potential bounce/reversal)
        - Buy Signal: K% crosses above D% when K% < 30 (bullish)
        - Sell Signal: K% crosses below D% when K% > 70 (bearish)
        - K-D Divergence: Price makes new high but K% doesn't (bearish divergence)
        
        OUTPUT COLUMNS:
        - K: Stochastic K% line (0-100 range)
        - D: Stochastic D% line (3-period SMA of K) (0-100 range)
        
        Args:
            ohlc_df: DataFrame with OHLC data
            period: Lookback period for stochastic calculation (default 14)
        
        Returns:
            DataFrame with 'K' and 'D' columns added
        """
        df = ohlc_df.copy()
        
        # Calculate rolling high and low
        highest_high = df['High'].rolling(window=period).max()
        lowest_low = df['Low'].rolling(window=period).min()
        
        # Calculate K% (Stochastic Oscillator)
        k_percent = ((df['Close'] - lowest_low) * 100 / (highest_high - lowest_low))
        
        # Calculate D% (3-period SMA of K%)
        d_percent = k_percent.rolling(window=3).mean()
        
        df['K'] = k_percent
        df['D'] = d_percent
        
        logger.info(f"Stochastic calculated with period {period}")
        return df

    @staticmethod
    def calculate_supertrend(ohlc_df: pd.DataFrame, period: int = 7, multiplier: float = 3.0) -> pd.DataFrame:
        """
        Calculate Supertrend Indicator
        
        Supertrend is a trend-following indicator that identifies trend direction and
        provides dynamic support/resistance levels based on ATR (Average True Range).
        
        3 IMPLEMENTATION APPROACHES:
        
        METHOD 1 (MANUAL LOOP - Iterative calculation):
            - Calculates ATR manually in each iteration
            - Updates upper/lower bands iteratively
            - Tracks trend transitions
            - Time Complexity: O(n × period)
            - Use Case: Debugging, educational
            
        METHOD 2 (OPTIMIZED WITH EWM ATR):
            atr = (df['TR'].ewm(com=period, min_periods=period).mean())
            BasicUpper = HL2 + multiplier * ATR
            BasicLower = HL2 - multiplier * ATR
            FinalUpper = min(BasicUpper, FinalUpper_prev) if Close_prev <= FinalUpper_prev else BasicUpper
            FinalLower = max(BasicLower, FinalLower_prev) if Close_prev >= FinalLower_prev else BasicLower
            - Time Complexity: O(n)
            - Use Case: Production, real-time (RECOMMENDED)
            - Performance: 100-200x faster than Method 1
        
        METHOD 3 (VECTORIZED - Not yet implemented):
            Uses numpy operations for maximum speed
            - Time Complexity: O(n)
            - Use Case: Ultra-high-frequency applications
        
        FORMULA:
        1. ATR = EWM(True Range, period)
        2. HL2 = (High + Low) / 2
        3. BasicUpper = HL2 + multiplier × ATR
        4. BasicLower = HL2 - multiplier × ATR
        5. FinalUpper = min(BasicUpper, FinalUpper[t-1]) if Close[t-1] <= FinalUpper[t-1] else BasicUpper
        6. FinalLower = max(BasicLower, FinalLower[t-1]) if Close[t-1] >= FinalLower[t-1] else BasicLower
        7. Supertrend = FinalUpper (in downtrend) or FinalLower (in uptrend)
        
        ALGORITHM BREAKDOWN (Method 2 - EWM ATR):
        1. Calculate True Range: TR = max(H-L, abs(H-Cp), abs(L-Cp))
        2. Calculate ATR using EWM: exponential weighted moving average
        3. Calculate HL2: midpoint = (High + Low) / 2
        4. Calculate BasicUpper: midpoint + multiplier × ATR
        5. Calculate BasicLower: midpoint - multiplier × ATR
        6. Calculate FinalUpper: prevents whipsaws by not letting upper band rise
        7. Calculate FinalLower: prevents whipsaws by not letting lower band fall
        8. Calculate Supertrend: switches between upper and lower based on close position
        
        TRADING SIGNAL INTERPRETATION:
        - Uptrend: Close > Supertrend, Supertrend = FinalLower (green)
        - Downtrend: Close < Supertrend, Supertrend = FinalUpper (red)
        - Buy Signal: Price breaks above Supertrend (uptrend starts)
        - Sell Signal: Price breaks below Supertrend (downtrend starts)
        - Support Level: When in uptrend, Supertrend acts as dynamic support
        - Resistance Level: When in downtrend, Supertrend acts as dynamic resistance
        - Stop Loss: Place stop below Supertrend in uptrend, above in downtrend
        
        OUTPUT COLUMNS:
        - ATR: Average True Range
        - BasicUpper: Upper band before smoothing
        - BasicLower: Lower band before smoothing
        - FinalUpper: Final upper band (smoothed, prevents whipsaws)
        - FinalLower: Final lower band (smoothed, prevents whipsaws)
        - Strend: Supertrend line (main indicator output)
        - Trend: Direction indicator (1 = uptrend, -1 = downtrend)
        
        Args:
            ohlc_df: DataFrame with OHLC data
            period: ATR period for calculation (default 7)
            multiplier: Multiplier for ATR (default 3.0)
        
        Returns:
            DataFrame with ATR, upper/lower bands, and Supertrend columns added
            
        Example:
            >>> df = fetch_ohlc_data(ticker)
            >>> df = calculate_supertrend(df, period=7, multiplier=3.0)
            >>> uptrend = df[df['Trend'] == 1]
            >>> print(uptrend[['Close', 'Strend']].tail())
        """
        df = ohlc_df.copy()
        
        # Calculate True Range components
        df['HL'] = df['High'] - df['Low']
        df['HC'] = abs(df['High'] - df['Close'].shift(1))
        df['LC'] = abs(df['Low'] - df['Close'].shift(1))
        df['TR'] = df[['HL', 'HC', 'LC']].max(axis=1)
        
        # Calculate ATR using EWM (Exponential Weighted Mean) - More efficient than SMA
        df['ATR'] = df['TR'].ewm(com=period, min_periods=period).mean()
        
        # Calculate basic bands
        df['HL2'] = (df['High'] + df['Low']) / 2
        df['BasicUpper'] = df['HL2'] + multiplier * df['ATR']
        df['BasicLower'] = df['HL2'] - multiplier * df['ATR']
        
        # Initialize final bands and supertrend
        df['FinalUpper'] = df['BasicUpper']
        df['FinalLower'] = df['BasicLower']
        df['Strend'] = np.nan
        df['Trend'] = 0
        
        # Calculate FinalUpper band (prevents upper band from rising)
        for i in range(period, len(df)):
            if i == period:
                df.loc[i, 'FinalUpper'] = df.loc[i, 'BasicUpper']
                df.loc[i, 'FinalLower'] = df.loc[i, 'BasicLower']
            else:
                # FinalUpper cannot be higher than BasicUpper if Close was below it
                if df.loc[i-1, 'Close'] <= df.loc[i-1, 'FinalUpper']:
                    df.loc[i, 'FinalUpper'] = min(df.loc[i, 'BasicUpper'], df.loc[i-1, 'FinalUpper'])
                else:
                    df.loc[i, 'FinalUpper'] = df.loc[i, 'BasicUpper']
                
                # FinalLower cannot be lower than BasicLower if Close was above it
                if df.loc[i-1, 'Close'] >= df.loc[i-1, 'FinalLower']:
                    df.loc[i, 'FinalLower'] = max(df.loc[i, 'BasicLower'], df.loc[i-1, 'FinalLower'])
                else:
                    df.loc[i, 'FinalLower'] = df.loc[i, 'BasicLower']
        
        # Calculate Supertrend and Trend
        for i in range(period, len(df)):
            if i == period:
                # Initial supertrend assignment
                if df.loc[i, 'Close'] < df.loc[i, 'FinalUpper']:
                    df.loc[i, 'Strend'] = df.loc[i, 'FinalUpper']
                    df.loc[i, 'Trend'] = -1
                else:
                    df.loc[i, 'Strend'] = df.loc[i, 'FinalLower']
                    df.loc[i, 'Trend'] = 1
            else:
                # Supertrend transitions
                if df.loc[i-1, 'Strend'] == df.loc[i-1, 'FinalUpper']:
                    # Was on upper band (downtrend)
                    if df.loc[i, 'Close'] <= df.loc[i, 'FinalUpper']:
                        df.loc[i, 'Strend'] = df.loc[i, 'FinalUpper']
                        df.loc[i, 'Trend'] = -1
                    else:
                        df.loc[i, 'Strend'] = df.loc[i, 'FinalLower']
                        df.loc[i, 'Trend'] = 1
                elif df.loc[i-1, 'Strend'] == df.loc[i-1, 'FinalLower']:
                    # Was on lower band (uptrend)
                    if df.loc[i, 'Close'] >= df.loc[i, 'FinalLower']:
                        df.loc[i, 'Strend'] = df.loc[i, 'FinalLower']
                        df.loc[i, 'Trend'] = 1
                    else:
                        df.loc[i, 'Strend'] = df.loc[i, 'FinalUpper']
                        df.loc[i, 'Trend'] = -1
        
        logger.info(f"Supertrend calculated with period {period}, multiplier {multiplier}")
        return df


@router.post("/calculate-wma")
async def calculate_wma_endpoint(
    symbol: str = Query(...),
    resolution: str = Query("30"),
    duration: int = Query(5),
    period: int = Query(4),
    weights: Optional[str] = Query(None)
):
    """
    Calculate Weighted Moving Average (WMA)
    
    WMA gives more weight to recent prices using custom or linear weights.
    
    Formula: WMA = sum(Close[i] * weight[i]) / sum(weights)
    
    Linear Default Weights (if not provided):
    - Period 4: [0.40, 0.30, 0.20, 0.10]
    - Period 5: [0.333, 0.267, 0.200, 0.133, 0.067]
    
    Custom Weights Example (as per Aseem):
    - weights=[0.40,0.30,0.20,0.10] for period=4
    
    Example:
    /calculate-wma?symbol=NSE:SBIN-EQ&resolution=30&duration=5&period=4
    /calculate-wma?symbol=NSE:SBIN-EQ&period=4&weights=0.40,0.30,0.20,0.10
    """
    try:
        df = indicators_service.fetch_ohlc(symbol, resolution, duration)
        
        if df is None or len(df) == 0:
            return {"status": "error", "message": "Failed to fetch data"}
        
        # Parse weights if provided
        weights_list = None
        if weights:
            try:
                weights_list = [float(w.strip()) for w in weights.split(',')]
                if len(weights_list) != period:
                    return {
                        "status": "error",
                        "message": f"Weights count ({len(weights_list)}) must equal period ({period})"
                    }
            except ValueError:
                return {
                    "status": "error",
                    "message": "Weights must be comma-separated float values"
                }
        
        df = indicators_service.calculate_wma(df, period=period, weights=weights_list)
        
        wma_values = df['WMA'].dropna().tolist()
        current_wma = float(df['WMA'].iloc[-1]) if pd.notna(df['WMA'].iloc[-1]) else None
        current_close = float(df['Close'].iloc[-1]) if pd.notna(df['Close'].iloc[-1]) else None
        
        return {
            "status": "success",
            "data": {
                "symbol": symbol,
                "resolution": resolution,
                "period": period,
                "weights": weights_list if weights_list else "linear_default",
                "total_candles": len(df),
                "current_wma": current_wma,
                "current_close": current_close,
                "wma_values": wma_values
            }
        }
    
    except Exception as e:
        logger.error(f"Error calculating WMA: {e}")
        return {"status": "error", "message": str(e)}


@router.get("/calculate-stochastic")
async def calculate_stochastic_endpoint(
    symbol: str = Query(...),
    resolution: str = Query("30"),
    duration: int = Query(5),
    period: int = Query(14)
):
    """
    Calculate Stochastic Oscillator (K% and D%)
    
    K% = (Close - Lowest Low) * 100 / (Highest High - Lowest Low)
    D% = 3-period SMA of K%
    
    Signals:
    - Overbought: K% > 80 (potential reversal)
    - Oversold: K% < 20 (potential bounce)
    - Bullish: K% crosses above D% when K% < 30
    - Bearish: K% crosses below D% when K% > 70
    
    Example:
    /calculate-stochastic?symbol=NSE:SBIN-EQ&resolution=30&duration=5&period=14
    """
    try:
        df = indicators_service.fetch_ohlc(symbol, resolution, duration)
        
        if df is None or len(df) == 0:
            return {"status": "error", "message": "Failed to fetch data"}
        
        df = indicators_service.calculate_stochastic(df, period=period)
        
        k_values = df['K'].dropna().tolist()
        d_values = df['D'].dropna().tolist()
        current_k = float(df['K'].iloc[-1]) if pd.notna(df['K'].iloc[-1]) else None
        current_d = float(df['D'].iloc[-1]) if pd.notna(df['D'].iloc[-1]) else None
        current_close = float(df['Close'].iloc[-1]) if pd.notna(df['Close'].iloc[-1]) else None
        
        return {
            "status": "success",
            "data": {
                "symbol": symbol,
                "resolution": resolution,
                "period": period,
                "total_candles": len(df),
                "current_k": current_k,
                "current_d": current_d,
                "current_close": current_close,
                "k_values": k_values,
                "d_values": d_values
            }
        }
    
    except Exception as e:
        logger.error(f"Error calculating Stochastic: {e}")
        return {"status": "error", "message": str(e)}


@router.get("/calculate-supertrend")
async def calculate_supertrend_endpoint(
    symbol: str = Query(...),
    resolution: str = Query("30"),
    duration: int = Query(5),
    period: int = Query(7),
    multiplier: float = Query(3.0)
):
    """
    Calculate Supertrend Indicator
    
    Supertrend = ATR-based trend following indicator
    Provides dynamic support/resistance levels
    
    Signals:
    - Uptrend: Close > Supertrend
    - Downtrend: Close < Supertrend
    - Buy: Price breaks above Supertrend
    - Sell: Price breaks below Supertrend
    
    Example:
    /calculate-supertrend?symbol=NSE:SBIN-EQ&resolution=30&duration=5&period=7&multiplier=3
    """
    try:
        df = indicators_service.fetch_ohlc(symbol, resolution, duration)
        
        if df is None or len(df) == 0:
            return {"status": "error", "message": "Failed to fetch data"}
        
        df = indicators_service.calculate_supertrend(df, period=period, multiplier=multiplier)
        
        supertrend_values = df['Strend'].dropna().tolist()
        upper_values = df['FinalUpper'].dropna().tolist()
        lower_values = df['FinalLower'].dropna().tolist()
        trend_values = df['Trend'].dropna().tolist()
        
        current_supertrend = float(df['Strend'].iloc[-1]) if pd.notna(df['Strend'].iloc[-1]) else None
        current_trend = int(df['Trend'].iloc[-1]) if pd.notna(df['Trend'].iloc[-1]) else None
        current_close = float(df['Close'].iloc[-1]) if pd.notna(df['Close'].iloc[-1]) else None
        current_atr = float(df['ATR'].iloc[-1]) if pd.notna(df['ATR'].iloc[-1]) else None
        
        return {
            "status": "success",
            "data": {
                "symbol": symbol,
                "resolution": resolution,
                "period": period,
                "multiplier": multiplier,
                "total_candles": len(df),
                "current_supertrend": current_supertrend,
                "current_trend": current_trend,
                "current_close": current_close,
                "current_atr": current_atr,
                "supertrend_values": supertrend_values,
                "upper_band_values": upper_values,
                "lower_band_values": lower_values,
                "trend_values": trend_values
            }
        }
    
    except Exception as e:
        logger.error(f"Error calculating Supertrend: {e}")
        return {"status": "error", "message": str(e)}


@router.get("/detect-trend-advanced")
async def detect_trend_advanced_endpoint(
    symbol: str = Query(...),
    resolution: str = Query("30"),
    duration: int = Query(5)
):
    """
    Detect ADVANCED TREND with 5-candle confirmation
    
    Advanced Trend Detection checks for:
    1. Last 3 candles in same direction (bullish or bearish)
    2. High/Low progression: last 3 > previous 2
    3. Prior 2 candles in opposite direction (trend reversal confirmation)
    
    Returns:
    - 'Uptrend': 3 green candles with ascending highs/lows + 2 prior red candles
    - 'Downtrend': 3 red candles with descending highs/lows + 2 prior green candles
    - None: No trend pattern detected
    
    Example:
    /detect-trend-advanced?symbol=NSE:KOTAKBANK-EQ&resolution=10&duration=5
    """
    try:
        df = indicators_service.fetch_ohlc(symbol, resolution, duration)
        
        if df is None or len(df) == 0:
            return {"status": "error", "message": "Failed to fetch data"}
        
        trend = indicators_service.detect_trend_advanced(df)
        
        return {
            "status": "success",
            "data": {
                "symbol": symbol,
                "resolution": resolution,
                "trend_type": "advanced_5_candle",
                "trend": trend,
                "total_candles": len(df),
                "method": "Advanced trend detection with historical context"
            }
        }
    
    except Exception as e:
        logger.error(f"Error detecting advanced trend: {e}")
        return {"status": "error", "message": str(e)}


@router.get("/detect-trend-simple")
async def detect_trend_simple_endpoint(
    symbol: str = Query(...),
    resolution: str = Query("30"),
    duration: int = Query(5)
):
    """
    Detect SIMPLE TREND with 3-candle confirmation
    
    Simple Trend Detection checks for:
    1. Last 3 candles all in same direction
    2. High/Low progression throughout the 3 candles
    
    Returns:
    - 'Uptrend': 3 consecutive green candles with ascending highs and lows
    - 'Downtrend': 3 consecutive red candles with descending highs and lows
    - None: No trend pattern detected
    
    This is faster than advanced trend but with less confirmation.
    
    Example:
    /detect-trend-simple?symbol=NSE:RELIANCE-EQ&resolution=5&duration=5
    """
    try:
        df = indicators_service.fetch_ohlc(symbol, resolution, duration)
        
        if df is None or len(df) == 0:
            return {"status": "error", "message": "Failed to fetch data"}
        
        trend = indicators_service.detect_trend_simple(df)
        
        return {
            "status": "success",
            "data": {
                "symbol": symbol,
                "resolution": resolution,
                "trend_type": "simple_3_candle",
                "trend": trend,
                "total_candles": len(df),
                "method": "Simple trend detection with 3-candle confirmation"
            }
        }
    
    except Exception as e:
        logger.error(f"Error detecting simple trend: {e}")
        return {"status": "error", "message": str(e)}


@router.get("/detect-trend-rolling")
async def detect_trend_rolling_endpoint(
    symbol: str = Query(...),
    resolution: str = Query("30"),
    duration: int = Query(5),
    period: int = Query(7),
    threshold: float = Query(0.7)
):
    """
    Detect ROLLING TREND using high/low progression analysis
    
    Analyzes consistency of higher lows (uptrend) or lower highs (downtrend)
    over a specified period to identify sustained trends.
    
    Parameters:
    - period: Number of candles to analyze (default 7)
    - threshold: Percentage threshold for trend confirmation (default 0.7 = 70%)
    
    Returns:
    - 'Uptrend': 70%+ of candles with higher lows + current candle bullish
    - 'Downtrend': 70%+ of candles with lower highs + current candle bearish
    - None: No rolling trend detected
    
    Example:
    /detect-trend-rolling?symbol=NSE:SBIN-EQ&resolution=15&duration=5&period=7
    """
    try:
        df = indicators_service.fetch_ohlc(symbol, resolution, duration)
        
        if df is None or len(df) == 0:
            return {"status": "error", "message": "Failed to fetch data"}
        
        trend = indicators_service.detect_trend_rolling(df, period=period, threshold=threshold)
        
        return {
            "status": "success",
            "data": {
                "symbol": symbol,
                "resolution": resolution,
                "trend_type": "rolling_analysis",
                "trend": trend,
                "period": period,
                "threshold": f"{threshold*100:.0f}%",
                "total_candles": len(df)
            }
        }
    
    except Exception as e:
        logger.error(f"Error detecting rolling trend: {e}")
        return {"status": "error", "message": str(e)}


@router.get("/resistance-support")
async def get_resistance_support_endpoint(
    symbol: str = Query(...),
    intraday_resolution: str = Query("30"),
    daily_duration: int = Query(30),
    intraday_duration: int = Query(5)
):
    """
    Calculate Pivot Points and Nearest Resistance/Support Levels
    
    Uses daily pivot points to identify key price levels:
    - Pivot Point (P): Central price level
    - Resistance Levels (R1, R2, R3): Price levels above current
    - Support Levels (S1, S2, S3): Price levels below current
    
    Finds and returns:
    - Current price
    - Nearest resistance level above current price
    - Nearest support level below current price
    - All pivot levels
    
    Example:
    /resistance-support?symbol=NSE:RELIANCE-EQ&intraday_resolution=15&daily_duration=30
    """
    try:
        intraday_df = indicators_service.fetch_ohlc(symbol, intraday_resolution, intraday_duration)
        daily_df = indicators_service.fetch_ohlc(symbol, "D", daily_duration)
        
        if intraday_df is None or daily_df is None:
            return {"status": "error", "message": "Failed to fetch data"}
        
        levels = indicators_service.get_resistance_support(intraday_df, daily_df)
        
        if not levels:
            return {"status": "error", "message": "Failed to calculate levels"}
        
        return {
            "status": "success",
            "data": {
                "symbol": symbol,
                "current_price": levels.get("current_price"),
                "pivot": levels.get("pivot"),
                "nearest_resistance": levels.get("nearest_resistance"),
                "nearest_resistance_label": levels.get("nearest_resistance_label"),
                "nearest_support": levels.get("nearest_support"),
                "nearest_support_label": levels.get("nearest_support_label"),
                "all_levels": {
                    "r3": levels.get("r3"),
                    "r2": levels.get("r2"),
                    "r1": levels.get("r1"),
                    "pivot": levels.get("pivot"),
                    "s1": levels.get("s1"),
                    "s2": levels.get("s2"),
                    "s3": levels.get("s3")
                }
            }
        }
    
    except Exception as e:
        logger.error(f"Error calculating resistance/support: {e}")
        return {"status": "error", "message": str(e)}


@router.get("/detect-pattern-advanced")
async def detect_pattern_advanced_endpoint(
    symbol: str = Query(...),
    intraday_resolution: str = Query("15"),
    daily_duration: int = Query(30),
    intraday_duration: int = Query(5),
    period: int = Query(7)
):
    """
    Detect COMPREHENSIVE CANDLE PATTERN with Trend + Momentum Confirmation
    
    Advanced pattern detection combines:
    - Candle type: doji, marubozu, hammer, shooting star, engulfing
    - Trend direction: uptrend, downtrend, sideways
    - Momentum: bullish (above pivot) or bearish (below pivot)
    
    Returns pattern name and momentum strength (0.5-0.9 scale).
    
    Pattern Examples:
    - 'doji_bear': Doji in uptrend (reversal signal)
    - 'engulfing_bull': Bullish engulfing in downtrend (high confidence)
    - 'marubozu_bull': Bullish marubozu candle (continuation)
    
    Example:
    /detect-pattern-advanced?symbol=NSE:INFY-EQ&intraday_resolution=15&period=7
    """
    try:
        intraday_df = indicators_service.fetch_ohlc(symbol, intraday_resolution, intraday_duration)
        daily_df = indicators_service.fetch_ohlc(symbol, "D", daily_duration)
        
        if intraday_df is None or daily_df is None:
            return {"status": "error", "message": "Failed to fetch data"}
        
        analysis = indicators_service.detect_candle_pattern_advanced(
            intraday_df, daily_df, period=period
        )
        
        return {
            "status": "success",
            "data": {
                "symbol": symbol,
                "pattern": analysis.get("pattern"),
                "momentum": analysis.get("momentum"),
                "candle_type": analysis.get("candle_type"),
                "trend": analysis.get("trend"),
                "current_price": analysis.get("current_price"),
                "daily_pivot": analysis.get("pivot"),
                "signal_strength": analysis.get("signal_strength"),
                "interpretation": {
                    "pattern_meaning": f"{analysis.get('pattern')} pattern detected" if analysis.get("pattern") else "No pattern detected",
                    "momentum_direction": analysis.get("momentum"),
                    "trend_direction": analysis.get("trend")
                }
            }
        }
    
    except Exception as e:
        logger.error(f"Error detecting advanced pattern: {e}")
        return {"status": "error", "message": str(e)}


@router.get("/indicators-info")
async def get_indicators_info():
    """Get information about supported technical indicators"""
    return {
        "indicators": [
            {
                "name": "ATR",
                "full_name": "Average True Range",
                "description": "Measures volatility of price movement",
                "interpretation": "Higher ATR = Higher volatility, Lower ATR = Lower volatility",
                "endpoint": "/calculate-atr"
            },
            {
                "name": "ADX",
                "full_name": "Average Directional Index",
                "description": "Measures trend strength (0-100)",
                "interpretation": "ADX<25: Weak, ADX 25-50: Moderate, ADX>50: Strong",
                "includes": ["ADX", "DI+", "DI-"],
                "endpoint": "/calculate-adx"
            },
            {
                "name": "RSI",
                "full_name": "Relative Strength Index",
                "description": "Measures momentum (0-100)",
                "interpretation": "RSI<30: Oversold (Buy), RSI>70: Overbought (Sell), 30-70: Neutral",
                "endpoint": "/calculate-rsi"
            },
            {
                "name": "MACD",
                "full_name": "Moving Average Convergence Divergence",
                "description": "Trend-following momentum indicator",
                "interpretation": "MACD > Signal: Bullish, MACD < Signal: Bearish",
                "includes": ["MACD", "Signal", "Histogram"],
                "endpoint": "/calculate-macd"
            },
            {
                "name": "Bollinger Bands",
                "description": "Volatility and overbought/oversold indicator",
                "formula": "Upper = SMA + (2 * StdDev), Lower = SMA - (2 * StdDev)",
                "interpretation": "Price at Upper Band: Overbought, Price at Lower Band: Oversold",
                "includes": ["SMA", "UpperBand", "LowerBand"],
                "default_period": 20,
                "endpoint": "/calculate-bollinger-bands"
            },
            {
                "name": "EMA",
                "full_name": "Exponential Moving Average",
                "description": "Moving average that gives more weight to recent prices",
                "formula": "EMA = Close.ewm(span=period).mean()",
                "usage": "Trend identification, faster response than SMA",
                "default_period": 14,
                "endpoint": "/calculate-ema"
            },
            {
                "name": "SMA",
                "full_name": "Simple Moving Average",
                "description": "Arithmetic mean of prices over a period",
                "formula": "SMA = sum(Close[period]) / period",
                "usage": "Trend identification, smoother than price",
                "default_period": 20,
                "endpoint": "/calculate-sma"
            }
        ]
    }
