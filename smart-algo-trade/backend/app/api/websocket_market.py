"""
WebSocket Market Data Endpoint
Real-time candlestick and market data streaming via WebSocket
"""

import asyncio
import json
import logging
from datetime import datetime, timedelta
from typing import Set, Dict
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from fastapi.websockets import WebSocketState

logger = logging.getLogger(__name__)

router = APIRouter()


class MarketDataManager:
    """Manage WebSocket connections and market data broadcasting"""

    def __init__(self):
        self.active_connections: Set[WebSocket] = set()
        self.subscription_map: Dict[str, Set[WebSocket]] = {}
        self.price_cache: Dict[str, dict] = {}

    async def connect(self, websocket: WebSocket):
        """Register new WebSocket connection"""
        await websocket.accept()
        self.active_connections.add(websocket)
        logger.info(f"Client connected. Total connections: {len(self.active_connections)}")

    async def disconnect(self, websocket: WebSocket):
        """Remove WebSocket connection"""
        self.active_connections.discard(websocket)

        # Remove from all subscriptions
        for subscribers in self.subscription_map.values():
            subscribers.discard(websocket)

        logger.info(f"Client disconnected. Total connections: {len(self.active_connections)}")

    async def subscribe(self, websocket: WebSocket, channel: str, **kwargs):
        """Subscribe to market data"""
        key = self._create_subscription_key(channel, **kwargs)

        if key not in self.subscription_map:
            self.subscription_map[key] = set()

        self.subscription_map[key].add(websocket)
        logger.info(f"Subscribed to {key}")

    async def unsubscribe(self, websocket: WebSocket, channel: str, **kwargs):
        """Unsubscribe from market data"""
        key = self._create_subscription_key(channel, **kwargs)

        if key in self.subscription_map:
            self.subscription_map[key].discard(websocket)
            if not self.subscription_map[key]:
                del self.subscription_map[key]

        logger.info(f"Unsubscribed from {key}")

    async def broadcast_market_data(self, symbol: str, data: dict):
        """Broadcast market quote data"""
        key = f"quote:{symbol}"
        if key in self.subscription_map:
            message = {
                "type": "quote",
                "symbol": symbol,
                "data": data,
                "timestamp": datetime.now().isoformat(),
            }

            for websocket in self.subscription_map[key]:
                try:
                    await websocket.send_json(message)
                except Exception as e:
                    logger.error(f"Failed to send market data: {e}")

    async def broadcast_candle_update(self, symbol: str, timeframe: str, candle: dict, is_new: bool = False):
        """Broadcast candlestick update"""
        key = f"candle:{symbol}:{timeframe}"
        if key in self.subscription_map:
            message = {
                "type": "candle",
                "symbol": symbol,
                "timeframe": timeframe,
                "candle": candle,
                "isNewCandle": is_new,
                "timestamp": datetime.now().isoformat(),
            }

            for websocket in self.subscription_map[key]:
                try:
                    await websocket.send_json(message)
                except Exception as e:
                    logger.error(f"Failed to send candle update: {e}")

    @staticmethod
    def _create_subscription_key(channel: str, **kwargs) -> str:
        """Create subscription key from channel and parameters"""
        if channel == "quote":
            return f"quote:{kwargs.get('symbol')}"
        elif channel == "candle":
            return f"candle:{kwargs.get('symbol')}:{kwargs.get('timeframe')}"
        return f"{channel}:{':'.join(str(v) for v in kwargs.values())}"


# Singleton manager
market_data_manager = MarketDataManager()


@router.websocket("/ws/market-data")
async def websocket_market_data(websocket: WebSocket):
    """WebSocket endpoint for real-time market data"""
    await market_data_manager.connect(websocket)

    try:
        while True:
            # Receive message from client
            data = await websocket.receive_text()
            message = json.loads(data)

            message_type = message.get("type")

            if message_type == "subscribe":
                channel = message.get("channel")
                symbol = message.get("symbol")
                timeframe = message.get("timeframe")

                await market_data_manager.subscribe(
                    websocket, channel, symbol=symbol, timeframe=timeframe
                )

            elif message_type == "unsubscribe":
                channel = message.get("channel")
                symbol = message.get("symbol")
                timeframe = message.get("timeframe")

                await market_data_manager.unsubscribe(
                    websocket, channel, symbol=symbol, timeframe=timeframe
                )

            elif message_type == "ping":
                await websocket.send_json({"type": "pong"})

    except WebSocketDisconnect:
        await market_data_manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        await market_data_manager.disconnect(websocket)


# ============================================================================
# Helper functions to broadcast market data (call from other services)
# ============================================================================


async def broadcast_market_quote(symbol: str, price: float, bid: float, ask: float, volume: int = 0):
    """Broadcast market quote data"""
    data = {
        "symbol": symbol,
        "price": price,
        "bid": bid,
        "ask": ask,
        "timestamp": datetime.now().timestamp() * 1000,
        "volume": volume,
    }
    await market_data_manager.broadcast_market_data(symbol, data)


async def broadcast_candle_update(
    symbol: str, timeframe: str, candle: dict, is_new_candle: bool = False
):
    """Broadcast candlestick update"""
    await market_data_manager.broadcast_candle_update(symbol, timeframe, candle, is_new_candle)


# ============================================================================
# Background task to simulate real-time market data (for testing)
# ============================================================================


import random


async def simulate_market_data():
    """Simulate real-time market data updates"""
    symbols = ["NSE:SBIN-EQ", "NSE:INFY-EQ", "NSE:TCS-EQ"]
    prices = {symbol: 500 + random.random() * 100 for symbol in symbols}
    candle_data = {symbol: {"open": p, "close": p, "high": p, "low": p} for symbol, p in prices.items()}

    while True:
        try:
            # Update market quotes
            for symbol in symbols:
                price_change = (random.random() - 0.5) * 5
                prices[symbol] += price_change

                await broadcast_market_quote(
                    symbol,
                    price=prices[symbol],
                    bid=prices[symbol] - 0.5,
                    ask=prices[symbol] + 0.5,
                    volume=random.randint(1000, 100000),
                )

            # Update candles every 5 seconds
            if random.random() > 0.7:
                for symbol in symbols:
                    current_price = prices[symbol]
                    candle = {
                        "time": int(datetime.now().timestamp() * 1000),
                        "open": candle_data[symbol]["open"],
                        "close": current_price,
                        "high": max(candle_data[symbol]["high"], current_price),
                        "low": min(candle_data[symbol]["low"], current_price),
                        "volume": random.randint(10000, 1000000),
                    }

                    await broadcast_candle_update(symbol, "1M", candle, is_new_candle=True)
                    candle_data[symbol] = candle

            await asyncio.sleep(0.5)

        except Exception as e:
            logger.error(f"Error in market data simulation: {e}")
            await asyncio.sleep(1)


# ============================================================================
# Optional: Add startup/shutdown events to main app
# ============================================================================
# In your main.py, add these events:
#
# @app.on_event("startup")
# async def startup_event():
#     asyncio.create_task(simulate_market_data())
#
# This will start the market data simulation when the app starts.
