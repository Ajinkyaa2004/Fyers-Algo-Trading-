# -*- coding: utf-8 -*-
"""
Phase 15: Options Chain Data & Analysis
Integrates Aseem Singhal's options trading APIs and NSE data retrieval
Features:
- Fyers instrument list management and caching
- Option contracts filtering (by symbol, type, expiry)
- ATM (At-The-Money) calculation for options strategies
- NSE India API integration for live options chain data
- Option contract search and analysis
- Expiry and strike price analysis
"""

from fastapi import APIRouter, Query, HTTPException, BackgroundTasks
from pydantic import BaseModel
from datetime import datetime, timedelta
import pandas as pd
import numpy as np
import requests
import logging
import os
from typing import List, Dict, Optional, Any
from fyers_apiv3 import fyersModel
import json

router = APIRouter()
logger = logging.getLogger(__name__)

# Configuration
CACHE_DIR = "backend/data/options"
LOGS_DIR = "backend/logs"
os.makedirs(CACHE_DIR, exist_ok=True)
os.makedirs(LOGS_DIR, exist_ok=True)

# Load credentials
try:
    client_id = open("smart-algo-trade/client_id.txt", 'r').read().strip()
    access_token = open("smart-algo-trade/access_token.txt", 'r').read().strip()
except FileNotFoundError:
    client_id = ""
    access_token = ""
    logger.warning("Credentials files not found. Fyers API will not initialize.")

# Global state
fyers = None
instrument_cache = None
cache_timestamp = None
CACHE_EXPIRY_HOURS = 24


# ==================== PYDANTIC MODELS ====================

class OptionContract(BaseModel):
    """Option contract details"""
    token: str
    symbol: str
    description: str
    strike: float
    cepe: str  # CE or PE
    expiry: str
    updatedOn: str
    updatedAt: str
    ticker: str
    token_spot: Optional[str] = None
    time_to_expiry: Optional[int] = None


class StrikePrice(BaseModel):
    """Strike price with details"""
    strike: float
    symbol: str
    ce_token: Optional[str] = None
    pe_token: Optional[str] = None
    distance_from_atm: Optional[float] = None


class ATMData(BaseModel):
    """ATM option contract data"""
    strike: float
    symbol: str
    ticker: str
    ce_contracts: List[OptionContract]
    pe_contracts: List[OptionContract]
    closest_expiry: str
    distance_from_spot: float


class OptionChainRecord(BaseModel):
    """NSE Option Chain Record"""
    expiryDate: str
    strikePrice: float
    callOI: Optional[int] = None
    callVolume: Optional[int] = None
    callIV: Optional[float] = None
    callLTP: Optional[float] = None
    putOI: Optional[int] = None
    putVolume: Optional[int] = None
    putIV: Optional[float] = None
    putLTP: Optional[float] = None
    pcr: Optional[float] = None  # Put-Call Ratio


class NSEOptionChain(BaseModel):
    """NSE Option Chain data"""
    symbol: str
    expiryDate: str
    spotPrice: float
    atmStrike: Optional[float] = None
    records: List[OptionChainRecord]
    timestamp: str


# ==================== FYERS INSTRUMENT SERVICE ====================

class FyersInstrumentService:
    """Manages Fyers instrument list and caching"""
    
    @staticmethod
    def _init_fyers():
        """Initialize Fyers API"""
        global fyers
        if not fyers:
            try:
                fyers = fyersModel.FyersModel(
                    client_id=client_id,
                    is_async=False,
                    token=access_token,
                    log_path=LOGS_DIR
                )
                logger.info("Fyers API initialized")
            except Exception as e:
                logger.error(f"Failed to initialize Fyers API: {e}")
                raise
    
    @staticmethod
    def fetch_instrument_list() -> pd.DataFrame:
        """
        Fetch NSE futures and options instrument list from Fyers
        Returns DataFrame with columns: token, symbol, strike, cepe, expiry, etc.
        """
        try:
            url = "https://public.fyers.in/sym_details/NSE_FO.csv"
            logger.info(f"Fetching instrument list from {url}")
            
            # Read CSV from URL
            df = pd.read_csv(url)
            df.dropna(axis=1, how='all', inplace=True)
            
            # Set column names
            column_names = [
                "token", "description", "temp1", "temp2", "temp3", "temp4",
                "updatedOn", "updatedAt", "ticker", "temp6", "temp7",
                "token2", "symbol", "token_spot", "strike", "cepe",
                "temp8", "temp9", "temp10"
            ]
            df.columns = column_names
            
            # Drop temporary columns
            df = df.drop(columns=[
                'temp1', 'temp2', 'temp3', 'temp4', 'temp6', 'temp7',
                'temp8', 'temp9', 'temp10'
            ], errors='ignore')
            
            # Extract expiry date from description
            df['extractedDate'] = df['description'].str.extract(r'(\d{2} \w{3} \d{2})')
            df['expiry'] = pd.to_datetime(df['extractedDate'], format='%d %b %y')
            
            logger.info(f"Instrument list loaded: {len(df)} records")
            return df
        
        except Exception as e:
            logger.error(f"Failed to fetch instrument list: {e}")
            raise
    
    @staticmethod
    def get_instrument_cache(force_refresh: bool = False) -> pd.DataFrame:
        """Get cached instrument list or fetch if expired"""
        global instrument_cache, cache_timestamp
        
        # Check if cache is valid
        if instrument_cache is not None and cache_timestamp is not None and not force_refresh:
            age_hours = (datetime.now() - cache_timestamp).total_seconds() / 3600
            if age_hours < CACHE_EXPIRY_HOURS:
                logger.info(f"Using cached instrument list ({age_hours:.1f} hours old)")
                return instrument_cache
        
        # Fetch fresh data
        instrument_cache = FyersInstrumentService.fetch_instrument_list()
        cache_timestamp = datetime.now()
        
        # Save to CSV for backup
        cache_file = f"{CACHE_DIR}/instrument_list.csv"
        instrument_cache.to_csv(cache_file, index=False)
        logger.info(f"Instrument cache saved to {cache_file}")
        
        return instrument_cache


# ==================== OPTIONS CONTRACT FILTERING ====================

class OptionContractService:
    """Manages option contract filtering and analysis"""
    
    @staticmethod
    def get_option_contracts(symbol: str, option_type: str = "CE") -> pd.DataFrame:
        """
        Get all option contracts for a given symbol and type
        
        Args:
            symbol: Underlying symbol (e.g., "BANKNIFTY")
            option_type: "CE" (Call) or "PE" (Put)
        
        Returns:
            DataFrame with matching option contracts
        """
        try:
            df = FyersInstrumentService.get_instrument_cache()
            
            # Filter for options (not futures)
            filtered = df[(df['symbol'] == symbol) & (df['cepe'] == option_type)]
            
            logger.info(f"Found {len(filtered)} {option_type} contracts for {symbol}")
            return filtered.reset_index(drop=True)
        
        except Exception as e:
            logger.error(f"Error filtering contracts: {e}")
            raise
    
    @staticmethod
    def get_expiry_dates(symbol: str) -> List[str]:
        """Get all unique expiry dates for a symbol"""
        try:
            df = FyersInstrumentService.get_instrument_cache()
            
            # Get all contracts for symbol (both CE and PE)
            filtered = df[df['symbol'] == symbol]
            expiries = sorted(filtered['expiry'].unique())
            
            # Convert to ISO format strings
            expiry_strings = [pd.Timestamp(e).strftime('%Y-%m-%d') for e in expiries]
            
            logger.info(f"Found {len(expiry_strings)} expiry dates for {symbol}")
            return expiry_strings
        
        except Exception as e:
            logger.error(f"Error getting expiry dates: {e}")
            raise
    
    @staticmethod
    def get_strike_prices(symbol: str, option_type: str = "CE", days_to_expiry: int = 0) -> List[float]:
        """
        Get all unique strike prices for a symbol
        
        Args:
            symbol: Underlying symbol
            option_type: "CE" or "PE"
            days_to_expiry: 0 for closest, 1 for next, etc.
        """
        try:
            df = FyersInstrumentService.get_instrument_cache()
            
            # Filter by symbol and type
            filtered = df[(df['symbol'] == symbol) & (df['cepe'] == option_type)]
            
            # Calculate days to expiry
            filtered = filtered.copy()
            filtered['days_to_expiry'] = (pd.to_datetime(filtered['expiry']) - datetime.now()).dt.days
            
            # Get unique days to expiry
            unique_days = sorted(filtered['days_to_expiry'].unique())
            
            if not unique_days:
                raise ValueError(f"No contracts found for {symbol} {option_type}")
            
            # Select expiry by days_to_expiry parameter
            if days_to_expiry < len(unique_days):
                target_days = unique_days[days_to_expiry]
            else:
                target_days = unique_days[-1]
            
            # Get strikes for selected expiry
            expiry_contracts = filtered[filtered['days_to_expiry'] == target_days]
            strikes = sorted(expiry_contracts['strike'].unique())
            
            logger.info(f"Found {len(strikes)} strikes for {symbol} {option_type} expiring in {target_days} days")
            return list(strikes)
        
        except Exception as e:
            logger.error(f"Error getting strike prices: {e}")
            raise
    
    @staticmethod
    def get_closest_expiry_contracts(symbol: str, duration: int = 0) -> pd.DataFrame:
        """
        Get contracts for closest expiry date
        
        Args:
            symbol: Underlying symbol
            duration: 0 for closest, 1 for next closest, etc.
        
        Returns:
            DataFrame with contracts for specified expiry
        """
        try:
            df = FyersInstrumentService.get_instrument_cache()
            
            # Get all contracts for symbol
            filtered = df[df['symbol'] == symbol].copy()
            filtered['days_to_expiry'] = (pd.to_datetime(filtered['expiry']) - datetime.now()).dt.days
            
            # Get unique expiry dates sorted
            unique_days = sorted(filtered['days_to_expiry'].unique())
            
            if duration >= len(unique_days):
                logger.warning(f"Duration {duration} exceeds available expiries, using last")
                target_days = unique_days[-1]
            else:
                target_days = unique_days[duration]
            
            # Return contracts for selected expiry
            result = filtered[filtered['days_to_expiry'] == target_days].reset_index(drop=True)
            logger.info(f"Retrieved {len(result)} contracts for {symbol} expiring in {target_days} days")
            
            return result
        
        except Exception as e:
            logger.error(f"Error getting closest expiry: {e}")
            raise


# ==================== ATM CALCULATION SERVICE ====================

class ATMService:
    """Calculates At-The-Money (ATM) options"""
    
    @staticmethod
    def _init_fyers():
        """Initialize Fyers API if needed"""
        FyersInstrumentService._init_fyers()
    
    @staticmethod
    def get_spot_price(symbol: str) -> float:
        """
        Get current spot price from Fyers API
        
        Args:
            symbol: NSE index symbol (e.g., "NSE:NIFTYBANK-INDEX")
        
        Returns:
            Current LTP (Last Traded Price)
        """
        try:
            ATMService._init_fyers()
            
            data = {"symbols": symbol}
            response = fyers.quotes(data=data)
            
            if response and 'd' in response and len(response['d']) > 0:
                ltp = response['d'][0]['v']['lp']
                logger.info(f"Spot price for {symbol}: {ltp}")
                return ltp
            else:
                raise ValueError(f"No quote data for {symbol}")
        
        except Exception as e:
            logger.error(f"Failed to get spot price for {symbol}: {e}")
            raise
    
    @staticmethod
    def calculate_atm_strike(underlying_price: float, symbol: str) -> float:
        """
        Calculate ATM strike price based on strike intervals
        
        Args:
            underlying_price: Current spot price
            symbol: Option symbol to determine strike interval
        
        Returns:
            ATM strike price
        """
        try:
            df = FyersInstrumentService.get_instrument_cache()
            
            # Get strike prices for symbol
            strikes = sorted(df[df['symbol'] == symbol]['strike'].unique())
            
            if len(strikes) < 2:
                raise ValueError(f"Not enough strikes for {symbol}")
            
            # Calculate strike interval
            diffs = np.diff(strikes)
            interval = int(diffs[diffs > 0].min())
            
            logger.info(f"Strike interval for {symbol}: {interval}")
            
            # Round price to nearest multiple of interval
            atm_strike = round(underlying_price / interval) * interval
            
            logger.info(f"ATM strike for price {underlying_price}: {atm_strike}")
            return atm_strike
        
        except Exception as e:
            logger.error(f"Error calculating ATM strike: {e}")
            raise
    
    @staticmethod
    def get_atm_contracts(symbol: str, underlying_price: float, duration: int = 0) -> Dict[str, Any]:
        """
        Get ATM call and put contracts
        
        Args:
            symbol: Underlying symbol (e.g., "BANKNIFTY")
            underlying_price: Current spot price
            duration: 0 for closest expiry, 1 for next, etc.
        
        Returns:
            Dictionary with ATM call and put contracts
        """
        try:
            # Calculate ATM strike
            atm_strike = ATMService.calculate_atm_strike(underlying_price, symbol)
            
            # Get closest expiry contracts
            df_closest = OptionContractService.get_closest_expiry_contracts(symbol, duration)
            
            # Get CE contracts at ATM strike
            ce_contracts = df_closest[
                (df_closest['strike'] == atm_strike) & (df_closest['cepe'] == 'CE')
            ]
            
            # Get PE contracts at ATM strike
            pe_contracts = df_closest[
                (df_closest['strike'] == atm_strike) & (df_closest['cepe'] == 'PE')
            ]
            
            if ce_contracts.empty or pe_contracts.empty:
                logger.warning(f"No ATM contracts found at strike {atm_strike}")
            
            result = {
                "strike": atm_strike,
                "symbol": symbol,
                "underlying_price": underlying_price,
                "distance_from_spot": underlying_price - atm_strike,
                "ce_contracts": ce_contracts.to_dict('records'),
                "pe_contracts": pe_contracts.to_dict('records'),
                "expiry": df_closest['expiry'].iloc[0].strftime('%Y-%m-%d') if not df_closest.empty else None
            }
            
            logger.info(f"ATM contracts for {symbol}: {len(ce_contracts)} CE, {len(pe_contracts)} PE")
            return result
        
        except Exception as e:
            logger.error(f"Error getting ATM contracts: {e}")
            raise


# ==================== NSE OPTIONS CHAIN SERVICE ====================

class NSEOptionChainService:
    """Retrieves options chain data from NSE India API"""
    
    NSE_API_URL = "https://www.nseindia.com/api/option-chain-indices"
    
    HEADERS = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    }
    
    @staticmethod
    def get_option_chain(symbol: str, expiry_date: str) -> Dict[str, Any]:
        """
        Fetch options chain data from NSE India
        
        Args:
            symbol: Index symbol (e.g., "BANKNIFTY")
            expiry_date: Expiry in format "DD-Mmm-YYYY" (e.g., "31-Jan-2024")
        
        Returns:
            Options chain data with call and put analytics
        """
        try:
            url = f"{NSEOptionChainService.NSE_API_URL}?symbol={symbol}"
            logger.info(f"Fetching option chain from {url}")
            
            # Fetch data
            response = requests.get(url, headers=NSEOptionChainService.HEADERS, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            
            if 'records' not in data or 'data' not in data['records']:
                raise ValueError("Invalid NSE API response structure")
            
            # Get spot price if available
            spot_price = data.get('records', {}).get('underlyingValue', 0)
            
            # Filter records by expiry date
            all_records = data['records']['data']
            filtered_records = [
                record for record in all_records
                if record.get('expiryDate') == expiry_date
            ]
            
            logger.info(f"Found {len(filtered_records)} records for {symbol} expiring {expiry_date}")
            
            result = {
                "symbol": symbol,
                "expiryDate": expiry_date,
                "spotPrice": spot_price,
                "recordCount": len(filtered_records),
                "records": filtered_records,
                "timestamp": datetime.now().isoformat()
            }
            
            return result
        
        except requests.RequestException as e:
            logger.error(f"NSE API request failed: {e}")
            raise HTTPException(status_code=503, detail=f"NSE API unavailable: {e}")
        except Exception as e:
            logger.error(f"Error fetching option chain: {e}")
            raise
    
    @staticmethod
    def calculate_atm_from_chain(chain_data: Dict[str, Any]) -> float:
        """Calculate ATM strike from options chain data"""
        try:
            records = chain_data.get('records', [])
            spot_price = chain_data.get('spotPrice', 0)
            
            if not records or spot_price == 0:
                return spot_price
            
            # Find strike closest to spot price
            strikes = [r.get('strikePrice') for r in records]
            atm_strike = min(strikes, key=lambda x: abs(x - spot_price))
            
            logger.info(f"ATM strike from chain: {atm_strike} (spot: {spot_price})")
            return atm_strike
        
        except Exception as e:
            logger.error(f"Error calculating ATM from chain: {e}")
            return chain_data.get('spotPrice', 0)
    
    @staticmethod
    def save_option_chain_csv(symbol: str, expiry: str, chain_data: Dict[str, Any]):
        """Save options chain data to CSV"""
        try:
            filename = f"{CACHE_DIR}/{symbol}_{expiry.replace('-', '')}_chain.csv"
            
            if chain_data['records']:
                df = pd.DataFrame(chain_data['records'])
                df.to_csv(filename, index=False)
                logger.info(f"Options chain saved to {filename}")
                return filename
        
        except Exception as e:
            logger.error(f"Error saving CSV: {e}")
            raise


# ==================== API ENDPOINTS ====================

@router.post("/refresh-instruments")
async def refresh_instrument_list(background_tasks: BackgroundTasks):
    """Force refresh of instrument list"""
    try:
        background_tasks.add_task(FyersInstrumentService.fetch_instrument_list)
        return {
            "status": "refreshing",
            "message": "Instrument list refresh started in background"
        }
    except Exception as e:
        logger.error(f"Refresh failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/instruments/expiries")
async def get_option_expiries(symbol: str = Query(...)):
    """Get all expiry dates for an option symbol"""
    try:
        expiries = OptionContractService.get_expiry_dates(symbol)
        return {
            "symbol": symbol,
            "count": len(expiries),
            "expiries": expiries
        }
    except Exception as e:
        logger.error(f"Error getting expiries: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/instruments/strikes")
async def get_option_strikes(
    symbol: str = Query(...),
    option_type: str = Query("CE"),
    expiry_number: int = Query(0)
):
    """Get all strike prices for an option"""
    try:
        strikes = OptionContractService.get_strike_prices(symbol, option_type, expiry_number)
        return {
            "symbol": symbol,
            "type": option_type,
            "expiry_number": expiry_number,
            "count": len(strikes),
            "strikes": strikes
        }
    except Exception as e:
        logger.error(f"Error getting strikes: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/contracts")
async def get_option_contracts(
    symbol: str = Query(...),
    option_type: str = Query("CE")
):
    """Get all option contracts for symbol and type"""
    try:
        contracts = OptionContractService.get_option_contracts(symbol, option_type)
        return {
            "symbol": symbol,
            "type": option_type,
            "count": len(contracts),
            "contracts": contracts.to_dict('records')
        }
    except Exception as e:
        logger.error(f"Error getting contracts: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/contracts/closest-expiry")
async def get_closest_expiry_contracts(
    symbol: str = Query(...),
    expiry_number: int = Query(0)
):
    """Get contracts for closest expiry"""
    try:
        contracts = OptionContractService.get_closest_expiry_contracts(symbol, expiry_number)
        return {
            "symbol": symbol,
            "expiry_number": expiry_number,
            "count": len(contracts),
            "contracts": contracts.to_dict('records')
        }
    except Exception as e:
        logger.error(f"Error getting closest expiry: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/spot-price")
async def get_spot_price(symbol: str = Query("NSE:NIFTYBANK-INDEX")):
    """Get current spot price"""
    try:
        price = ATMService.get_spot_price(symbol)
        return {
            "symbol": symbol,
            "spot_price": price,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Error getting spot price: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/atm-strike")
async def get_atm_strike(
    symbol: str = Query("BANKNIFTY"),
    spot_price: float = Query(...)
):
    """Calculate ATM strike price"""
    try:
        atm = ATMService.calculate_atm_strike(spot_price, symbol)
        return {
            "symbol": symbol,
            "spot_price": spot_price,
            "atm_strike": atm,
            "distance": spot_price - atm
        }
    except Exception as e:
        logger.error(f"Error calculating ATM: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/atm-contracts")
async def get_atm_contracts(
    symbol: str = Query("BANKNIFTY"),
    spot_price: float = Query(None),
    expiry_number: int = Query(0)
):
    """Get ATM call and put contracts"""
    try:
        # Get spot price if not provided
        if spot_price is None:
            nse_index = f"NSE:{symbol.upper()}-INDEX"
            try:
                spot_price = ATMService.get_spot_price(nse_index)
            except:
                raise HTTPException(
                    status_code=400,
                    detail="Spot price required or unable to fetch from API"
                )
        
        atm_data = ATMService.get_atm_contracts(symbol, spot_price, expiry_number)
        return atm_data
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting ATM contracts: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/nse-option-chain")
async def get_nse_option_chain(
    symbol: str = Query("BANKNIFTY"),
    expiry: str = Query(...)
):
    """
    Get NSE option chain data
    
    Params:
    - symbol: Option symbol (e.g., "BANKNIFTY")
    - expiry: Expiry date in format "DD-Mmm-YYYY" (e.g., "31-Jan-2024")
    """
    try:
        chain_data = NSEOptionChainService.get_option_chain(symbol, expiry)
        atm_strike = NSEOptionChainService.calculate_atm_from_chain(chain_data)
        
        chain_data['atmStrike'] = atm_strike
        
        # Save to CSV
        NSEOptionChainService.save_option_chain_csv(symbol, expiry, chain_data)
        
        return chain_data
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching NSE option chain: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/options-info")
async def get_options_info():
    """Get options analysis system information"""
    return {
        "service": "Options Chain Data & Analysis",
        "version": "1.0.0",
        "endpoints": {
            "instruments": {
                "refresh": "POST /api/options/refresh-instruments",
                "expiries": "GET /api/options/instruments/expiries?symbol=BANKNIFTY",
                "strikes": "GET /api/options/instruments/strikes?symbol=BANKNIFTY&option_type=CE&expiry_number=0"
            },
            "contracts": {
                "all": "GET /api/options/contracts?symbol=BANKNIFTY&option_type=CE",
                "closest_expiry": "GET /api/options/contracts/closest-expiry?symbol=BANKNIFTY&expiry_number=0"
            },
            "atm": {
                "spot_price": "GET /api/options/spot-price?symbol=NSE:NIFTYBANK-INDEX",
                "atm_strike": "GET /api/options/atm-strike?symbol=BANKNIFTY&spot_price=50000",
                "atm_contracts": "GET /api/options/atm-contracts?symbol=BANKNIFTY&spot_price=50000&expiry_number=0"
            },
            "nse": {
                "option_chain": "GET /api/options/nse-option-chain?symbol=BANKNIFTY&expiry=31-Jan-2024"
            }
        },
        "features": [
            "Fyers instrument list management with caching",
            "Option contract filtering by symbol, type, and expiry",
            "ATM (At-The-Money) strike calculation",
            "Spot price retrieval from Fyers API",
            "NSE India option chain data integration",
            "Strike interval analysis",
            "Options chain CSV export",
            "Multi-expiry support"
        ],
        "data_storage": {
            "location": CACHE_DIR,
            "formats": ["CSV", "JSON"]
        },
        "usage_example": {
            "step_1": "GET /api/options/instruments/expiries?symbol=BANKNIFTY",
            "step_2": "GET /api/options/spot-price?symbol=NSE:NIFTYBANK-INDEX",
            "step_3": "GET /api/options/atm-contracts?symbol=BANKNIFTY&spot_price=50000",
            "step_4": "GET /api/options/nse-option-chain?symbol=BANKNIFTY&expiry=31-Jan-2024"
        }
    }
