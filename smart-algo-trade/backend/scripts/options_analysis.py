# -*- coding: utf-8 -*-
"""
Options Chain Analysis Tool - Standalone Script
Phase 15: Options trading analysis using Fyers API
Supports: Instrument list, option contracts, ATM calculation, NSE data
"""

from fyers_apiv3 import fyersModel
import pandas as pd
import datetime as dt
import numpy as np
import requests
import logging
import os
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('backend/logs/options_analysis.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Create data directory
os.makedirs('backend/data/options', exist_ok=True)

# Load credentials
try:
    client_id = open("smart-algo-trade/client_id.txt", 'r').read().strip()
    access_token = open("smart-algo-trade/access_token.txt", 'r').read().strip()
    logger.info("Credentials loaded")
except FileNotFoundError as e:
    logger.error(f"Credential files not found: {e}")
    exit(1)

# Initialize Fyers
fyers = fyersModel.FyersModel(
    client_id=client_id,
    is_async=False,
    token=access_token,
    log_path="backend/logs/"
)


# ==================== INSTRUMENT LIST ====================

def get_instrument_list() -> pd.DataFrame:
    """Fetch and parse NSE FO instrument list"""
    try:
        url = "https://public.fyers.in/sym_details/NSE_FO.csv"
        logger.info(f"Fetching instrument list from {url}")
        
        df = pd.read_csv(url)
        df.dropna(axis=1, how='all', inplace=True)
        
        # Parse columns
        column_names = [
            "token", "description", "temp1", "temp2", "temp3", "temp4",
            "updatedOn", "updatedAt", "ticker", "temp6", "temp7",
            "token2", "symbol", "token_spot", "strike", "cepe",
            "temp8", "temp9", "temp10"
        ]
        df.columns = column_names
        
        # Clean up
        df = df.drop(columns=[
            'temp1', 'temp2', 'temp3', 'temp4', 'temp6', 'temp7',
            'temp8', 'temp9', 'temp10'
        ], errors='ignore')
        
        # Extract expiry
        df['extractedDate'] = df['description'].str.extract(r'(\d{2} \w{3} \d{2})')
        df['expiry'] = pd.to_datetime(df['extractedDate'], format='%d %b %y')
        
        # Save cache
        df.to_csv("backend/data/options/instrument_list.csv", index=False)
        logger.info(f"Loaded {len(df)} instruments")
        
        return df
    except Exception as e:
        logger.error(f"Error loading instruments: {e}")
        raise


# ==================== OPTIONS CONTRACTS ====================

def get_option_contracts(df_instruments: pd.DataFrame, symbol: str, option_type: str = "CE") -> pd.DataFrame:
    """Filter option contracts by symbol and type"""
    try:
        filtered = df_instruments[(df_instruments['symbol'] == symbol) & (df_instruments['cepe'] == option_type)]
        logger.info(f"Found {len(filtered)} {option_type} contracts for {symbol}")
        return filtered.reset_index(drop=True)
    except Exception as e:
        logger.error(f"Error filtering contracts: {e}")
        raise


def get_closest_expiry_contracts(df_instruments: pd.DataFrame, symbol: str, duration: int = 0) -> pd.DataFrame:
    """Get contracts for closest expiry"""
    try:
        df = df_instruments[df_instruments['symbol'] == symbol].copy()
        df['days_to_expiry'] = (pd.to_datetime(df['expiry']) - datetime.now()).dt.days
        
        unique_days = sorted(df['days_to_expiry'].unique())
        target_days = unique_days[min(duration, len(unique_days) - 1)]
        
        result = df[df['days_to_expiry'] == target_days].reset_index(drop=True)
        logger.info(f"Retrieved {len(result)} contracts for {symbol} expiring in {target_days} days")
        
        return result
    except Exception as e:
        logger.error(f"Error getting closest expiry: {e}")
        raise


# ==================== ATM CALCULATION ====================

def get_spot_price(symbol: str) -> float:
    """Fetch spot price from Fyers API"""
    try:
        data = {"symbols": symbol}
        response = fyers.quotes(data=data)
        
        ltp = response['d'][0]['v']['lp']
        logger.info(f"Spot price {symbol}: ₹{ltp}")
        return ltp
    except Exception as e:
        logger.error(f"Error fetching spot price: {e}")
        raise


def calculate_atm_strike(df_instruments: pd.DataFrame, underlying_price: float, symbol: str) -> float:
    """Calculate ATM strike price"""
    try:
        strikes = sorted(df_instruments[df_instruments['symbol'] == symbol]['strike'].unique())
        
        if len(strikes) < 2:
            raise ValueError(f"Insufficient strikes for {symbol}")
        
        diffs = np.diff(strikes)
        interval = int(diffs[diffs > 0].min())
        
        atm_strike = round(underlying_price / interval) * interval
        logger.info(f"ATM strike: {atm_strike} (interval: {interval})")
        
        return atm_strike
    except Exception as e:
        logger.error(f"Error calculating ATM: {e}")
        raise


def get_atm_contracts(df_instruments: pd.DataFrame, symbol: str, underlying_price: float, duration: int = 0):
    """Get ATM call and put contracts"""
    try:
        atm_strike = calculate_atm_strike(df_instruments, underlying_price, symbol)
        
        df_closest = get_closest_expiry_contracts(df_instruments, symbol, duration)
        
        ce_contracts = df_closest[(df_closest['strike'] == atm_strike) & (df_closest['cepe'] == 'CE')]
        pe_contracts = df_closest[(df_closest['strike'] == atm_strike) & (df_closest['cepe'] == 'PE')]
        
        print(f"\n{'='*60}")
        print(f"ATM Contracts for {symbol}")
        print(f"{'='*60}")
        print(f"Spot Price: ₹{underlying_price}")
        print(f"ATM Strike: ₹{atm_strike}")
        print(f"Expiry: {df_closest['expiry'].iloc[0].strftime('%Y-%m-%d') if len(df_closest) > 0 else 'N/A'}")
        
        if not ce_contracts.empty:
            print(f"\nCall Contracts (CE):")
            print(ce_contracts[['symbol', 'strike', 'token', 'updatedAt']].to_string(index=False))
        
        if not pe_contracts.empty:
            print(f"\nPut Contracts (PE):")
            print(pe_contracts[['symbol', 'strike', 'token', 'updatedAt']].to_string(index=False))
        
        print(f"{'='*60}\n")
        
        return {"ce": ce_contracts, "pe": pe_contracts, "atm_strike": atm_strike}
    
    except Exception as e:
        logger.error(f"Error getting ATM contracts: {e}")
        raise


# ==================== NSE OPTION CHAIN ====================

def get_nse_option_chain(symbol: str, expiry: str) -> dict:
    """Fetch NSE option chain data"""
    try:
        url = f"https://www.nseindia.com/api/option-chain-indices?symbol={symbol}"
        headers = {"User-Agent": "Mozilla/5.0"}
        
        logger.info(f"Fetching option chain: {symbol} expiring {expiry}")
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        all_records = data['records']['data']
        
        # Filter by expiry
        filtered = [r for r in all_records if r.get('expiryDate') == expiry]
        
        logger.info(f"Found {len(filtered)} records")
        
        # Save to CSV
        if filtered:
            df = pd.DataFrame(filtered)
            filename = f"backend/data/options/{symbol}_{expiry.replace('-', '')}_chain.csv"
            df.to_csv(filename, index=False)
            logger.info(f"Saved to {filename}")
        
        return {
            "symbol": symbol,
            "expiry": expiry,
            "spot_price": data.get('records', {}).get('underlyingValue', 0),
            "record_count": len(filtered),
            "records": filtered
        }
    
    except Exception as e:
        logger.error(f"Error fetching NSE chain: {e}")
        raise


# ==================== MAIN ====================

def main():
    """Demo: Run options analysis"""
    print("="*60)
    print("Options Chain Analysis Tool - Fyers API V3")
    print("="*60)
    
    # Load instruments
    print("\n[1] Loading instrument list...")
    df_instruments = get_instrument_list()
    print(f"✓ Loaded {len(df_instruments)} instruments")
    
    # Get BANKNIFTY contracts
    print("\n[2] Fetching BANKNIFTY option contracts...")
    banknifty_ce = get_option_contracts(df_instruments, "BANKNIFTY", "CE")
    print(f"✓ Found {len(banknifty_ce)} CE contracts")
    
    # Get spot price
    print("\n[3] Fetching BANKNIFTY spot price...")
    spot_price = get_spot_price("NSE:NIFTYBANK-INDEX")
    
    # Get ATM contracts
    print("\n[4] Calculating ATM contracts...")
    atm_data = get_atm_contracts(df_instruments, "BANKNIFTY", spot_price)
    
    # Get NSE option chain
    print("\n[5] Fetching NSE option chain...")
    try:
        # Use upcoming Friday's date
        today = datetime.now()
        days_until_friday = (4 - today.weekday()) % 7
        if days_until_friday == 0:
            days_until_friday = 7
        next_friday = today + dt.timedelta(days=days_until_friday)
        expiry_str = next_friday.strftime('%d-%b-%Y').upper()
        
        chain = get_nse_option_chain("BANKNIFTY", expiry_str)
        print(f"✓ Retrieved {chain['record_count']} option chain records")
    except Exception as e:
        print(f"⚠ NSE chain fetch failed: {e}")
    
    print("\n" + "="*60)
    print("Analysis Complete!")
    print("="*60)


if __name__ == "__main__":
    main()
