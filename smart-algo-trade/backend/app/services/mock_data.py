"""
Mock Data Provider for Demo/Testing
Provides realistic market data when live API is unavailable
"""

import random
from datetime import datetime, timedelta
from typing import List, Dict, Any

class MockDataProvider:
    """Provides realistic mock data for testing and demo purposes"""
    
    # Real NSE symbols with sample data
    SYMBOLS_DB = {
        "NSE:SBIN-EQ": {
            "name": "State Bank of India",
            "exchange": "NSE",
            "base_price": 550.0,
            "volatility": 2.5,
        },
        "NSE:RELIANCE-EQ": {
            "name": "Reliance Industries",
            "exchange": "NSE",
            "base_price": 3150.0,
            "volatility": 2.0,
        },
        "NSE:INFY-EQ": {
            "name": "Infosys",
            "exchange": "NSE",
            "base_price": 1780.0,
            "volatility": 2.2,
        },
        "NSE:TCS-EQ": {
            "name": "Tata Consultancy Services",
            "exchange": "NSE",
            "base_price": 3850.0,
            "volatility": 2.1,
        },
        "NSE:HDFCBANK-EQ": {
            "name": "HDFC Bank",
            "exchange": "NSE",
            "base_price": 1650.0,
            "volatility": 2.3,
        },
        "NSE:NIFTY50-INDEX": {
            "name": "NIFTY 50 Index",
            "exchange": "NSE",
            "base_price": 20500.0,
            "volatility": 1.5,
        },
        "NSE:NIFTYADIANENT-EQ": {
            "name": "NIFTY MIDCAP Bank",
            "exchange": "NSE",
            "base_price": 44000.0,
            "volatility": 2.0,
        },
    }
    
    @staticmethod
    def get_quote(symbol: str) -> Dict[str, Any]:
        """Get a realistic quote for a symbol"""
        if symbol not in MockDataProvider.SYMBOLS_DB:
            symbol = list(MockDataProvider.SYMBOLS_DB.keys())[0]
        
        info = MockDataProvider.SYMBOLS_DB[symbol]
        base_price = info["base_price"]
        volatility = info["volatility"]
        
        # Generate realistic price movements
        price_change = random.uniform(-volatility, volatility)
        ltp = base_price * (1 + price_change / 100)
        
        return {
            "symbol": symbol,
            "stockname": info["name"],
            "exchange": info["exchange"],
            "ltp": round(ltp, 2),
            "open_price": round(base_price * 0.99, 2),
            "high_price": round(ltp * 1.02, 2),
            "low_price": round(ltp * 0.98, 2),
            "prev_close_price": round(base_price, 2),
            "volume": random.randint(1000000, 50000000),
            "bid": round(ltp - 0.5, 2),
            "ask": round(ltp + 0.5, 2),
            "bid_size": random.randint(10000, 100000),
            "ask_size": random.randint(10000, 100000),
            "change": round(price_change, 2),
            "change_percent": round((price_change / base_price) * 100, 2),
        }
    
    @staticmethod
    def get_quotes(symbols: List[str]) -> List[Dict[str, Any]]:
        """Get quotes for multiple symbols"""
        return [MockDataProvider.get_quote(sym) for sym in symbols]
    
    @staticmethod
    def get_historical_data(
        symbol: str,
        resolution: str = "D",
        days: int = 30
    ) -> List[Dict[str, Any]]:
        """
        Generate realistic historical OHLC data
        resolution: D=daily, 1=1min, 5=5min, 15=15min, 60=1hour, W=weekly, M=monthly
        """
        if symbol not in MockDataProvider.SYMBOLS_DB:
            symbol = list(MockDataProvider.SYMBOLS_DB.keys())[0]
        
        info = MockDataProvider.SYMBOLS_DB[symbol]
        base_price = info["base_price"]
        volatility = info["volatility"]
        
        # Calculate time delta based on resolution
        if resolution == "1":
            delta = timedelta(minutes=1)
        elif resolution == "5":
            delta = timedelta(minutes=5)
        elif resolution == "15":
            delta = timedelta(minutes=15)
        elif resolution == "60":
            delta = timedelta(hours=1)
        elif resolution == "W":
            delta = timedelta(weeks=1)
            days = 52
        elif resolution == "M":
            delta = timedelta(days=30)
            days = 24
        else:  # Daily
            delta = timedelta(days=1)
        
        candles = []
        current_price = base_price
        now = datetime.now()
        
        for i in range(days, 0, -1):
            timestamp = (now - delta * i).timestamp()
            
            # Generate realistic OHLC
            open_price = current_price
            
            # Random walk with mean reversion
            daily_change = random.uniform(-volatility, volatility)
            close_price = current_price * (1 + daily_change / 100)
            
            high_price = max(open_price, close_price) * random.uniform(1.0, 1.01)
            low_price = min(open_price, close_price) * random.uniform(0.99, 1.0)
            
            volume = random.randint(100000, 10000000)
            
            candles.append({
                "timestamp": int(timestamp),
                "open": round(open_price, 2),
                "high": round(high_price, 2),
                "low": round(low_price, 2),
                "close": round(close_price, 2),
                "volume": volume,
            })
            
            current_price = close_price
        
        return candles
    
    @staticmethod
    def get_holdings() -> List[Dict[str, Any]]:
        """Get mock holdings data"""
        return [
            {
                "symbol": "NSE:SBIN-EQ",
                "stockname": "State Bank of India",
                "quantity": 100,
                "average_price": 540.00,
                "last_price": 550.25,
                "pnl": 1025.00,
                "pnl_percent": 1.90,
                "day_change": 5.25,
                "day_change_percentage": 0.96,
            },
            {
                "symbol": "NSE:RELIANCE-EQ",
                "stockname": "Reliance Industries",
                "quantity": 25,
                "average_price": 3100.00,
                "last_price": 3150.50,
                "pnl": 1262.50,
                "pnl_percent": 1.63,
                "day_change": 15.50,
                "day_change_percentage": 0.49,
            },
            {
                "symbol": "NSE:INFY-EQ",
                "stockname": "Infosys",
                "quantity": 50,
                "average_price": 1750.00,
                "last_price": 1780.75,
                "pnl": 1537.50,
                "pnl_percent": 1.76,
                "day_change": 12.75,
                "day_change_percentage": 0.72,
            },
        ]
    
    @staticmethod
    def get_positions() -> List[Dict[str, Any]]:
        """Get mock positions data"""
        return [
            {
                "symbol": "NSE:SBIN-EQ",
                "stockname": "State Bank of India",
                "quantity": 50,
                "average_price": 545.00,
                "last_price": 550.25,
                "pnl": 262.50,
                "pnl_percent": 0.96,
                "product": "MIS",
                "side": "BUY",
            },
            {
                "symbol": "NSE:RELIANCE-EQ",
                "stockname": "Reliance Industries",
                "quantity": -10,
                "average_price": 3160.00,
                "last_price": 3150.50,
                "pnl": 95.00,
                "pnl_percent": 0.30,
                "product": "MIS",
                "side": "SELL",
            },
        ]
    
    @staticmethod
    def get_orders() -> List[Dict[str, Any]]:
        """Get mock orders data"""
        return [
            {
                "id": "1001",
                "symbol": "NSE:SBIN-EQ",
                "quantity": 100,
                "price": 548.50,
                "status": "COMPLETE",
                "side": "BUY",
                "type": "LIMIT",
                "product": "CNC",
                "exchange": "NSE",
                "timestamp": (datetime.now() - timedelta(hours=2)).timestamp(),
            },
            {
                "id": "1002",
                "symbol": "NSE:INFY-EQ",
                "quantity": 50,
                "price": 1775.00,
                "status": "COMPLETE",
                "side": "BUY",
                "type": "MARKET",
                "product": "CNC",
                "exchange": "NSE",
                "timestamp": (datetime.now() - timedelta(hours=5)).timestamp(),
            },
            {
                "id": "1003",
                "symbol": "NSE:HDFCBANK-EQ",
                "quantity": 75,
                "price": 1645.00,
                "status": "OPEN",
                "side": "BUY",
                "type": "LIMIT",
                "product": "CNC",
                "exchange": "NSE",
                "timestamp": datetime.now().timestamp(),
            },
        ]
    
    @staticmethod
    def get_profile() -> Dict[str, Any]:
        """Get mock user profile"""
        return {
            "id": "USER123",
            "name": "Demo User",
            "email": "demo@example.com",
            "phone": "9999999999",
            "pan": "AAAPA1234A",
            "accountType": "equity",
            "status": "ACTIVE",
        }
    
    @staticmethod
    def get_funds() -> Dict[str, Any]:
        """Get mock account funds"""
        return {
            "availableMargin": 500000.00,
            "usedMargin": 250000.00,
            "totalMargin": 750000.00,
            "cash": 250000.00,
            "equity": 500000.00,
        }
    
    @staticmethod
    def get_depth(symbol: str) -> Dict[str, Any]:
        """Get mock market depth (bid/ask)"""
        quote = MockDataProvider.get_quote(symbol)
        ltp = quote["ltp"]
        
        return {
            "symbol": symbol,
            "bid": [
                {"price": round(ltp - 1, 2), "volume": random.randint(10000, 50000)},
                {"price": round(ltp - 2, 2), "volume": random.randint(10000, 50000)},
                {"price": round(ltp - 3, 2), "volume": random.randint(10000, 50000)},
                {"price": round(ltp - 4, 2), "volume": random.randint(10000, 50000)},
                {"price": round(ltp - 5, 2), "volume": random.randint(10000, 50000)},
            ],
            "ask": [
                {"price": round(ltp + 1, 2), "volume": random.randint(10000, 50000)},
                {"price": round(ltp + 2, 2), "volume": random.randint(10000, 50000)},
                {"price": round(ltp + 3, 2), "volume": random.randint(10000, 50000)},
                {"price": round(ltp + 4, 2), "volume": random.randint(10000, 50000)},
                {"price": round(ltp + 5, 2), "volume": random.randint(10000, 50000)},
            ],
        }
