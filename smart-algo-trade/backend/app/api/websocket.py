"""
WebSocket API Endpoints for Real-time Data Streaming
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from typing import List
from app.services.fyers_websocket import fyers_websocket_service
from app.services.fyers_auth import fyers_auth_service
import json
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/websocket", tags=["websocket"])


@router.post("/connect")
async def connect_websocket():
    """Initialize WebSocket connection"""
    try:
        session_data = fyers_auth_service.get_session()
        if not session_data or "access_token" not in session_data:
            return {"status": "error", "detail": "Not authenticated"}
        
        access_token = session_data["access_token"]
        success = fyers_websocket_service.initialize(access_token)
        
        if success:
            fyers_websocket_service.connect()
            status = fyers_websocket_service.get_connection_status()
            return {"status": "success", "data": status}
        else:
            return {"status": "error", "detail": "Failed to initialize WebSocket"}
    except Exception as e:
        logger.error(f"Error connecting WebSocket: {str(e)}")
        return {"status": "error", "detail": str(e)}


@router.post("/disconnect")
async def disconnect_websocket():
    """Close WebSocket connection"""
    try:
        fyers_websocket_service.disconnect()
        return {"status": "success", "message": "Disconnected"}
    except Exception as e:
        logger.error(f"Error disconnecting WebSocket: {str(e)}")
        return {"status": "error", "detail": str(e)}


@router.post("/subscribe")
async def subscribe_symbols(symbols: List[str] = Query(...), data_type: str = Query("SymbolUpdate")):
    """Subscribe to symbols for real-time updates"""
    try:
        if not symbols:
            return {"status": "error", "detail": "No symbols provided"}
        
        success = fyers_websocket_service.subscribe(symbols, data_type)
        
        return {
            "status": "success" if success else "pending",
            "message": f"Subscribed to {len(symbols)} symbols",
            "data_type": data_type,
            "symbols": symbols
        }
    except Exception as e:
        logger.error(f"Error subscribing: {str(e)}")
        return {"status": "error", "detail": str(e)}


@router.post("/unsubscribe")
async def unsubscribe_symbols(symbols: List[str] = Query(...), data_type: str = Query("SymbolUpdate")):
    """Unsubscribe from symbols"""
    try:
        if not symbols:
            return {"status": "error", "detail": "No symbols provided"}
        
        success = fyers_websocket_service.unsubscribe(symbols, data_type)
        
        return {
            "status": "success" if success else "error",
            "message": f"Unsubscribed from {len(symbols)} symbols",
            "data_type": data_type,
            "symbols": symbols
        }
    except Exception as e:
        logger.error(f"Error unsubscribing: {str(e)}")
        return {"status": "error", "detail": str(e)}


@router.get("/status")
async def get_websocket_status():
    """Get WebSocket connection status and subscriptions"""
    try:
        status = fyers_websocket_service.get_connection_status()
        return {"status": "success", "data": status}
    except Exception as e:
        logger.error(f"Error getting status: {str(e)}")
        return {"status": "error", "detail": str(e)}


@router.get("/data/{data_type}")
async def get_current_data(data_type: str = "SymbolUpdate"):
    """Get current cached data for data type"""
    try:
        data = fyers_websocket_service.get_current_data(data_type)
        return {"status": "success", "data_type": data_type, "data": data}
    except Exception as e:
        logger.error(f"Error getting data: {str(e)}")
        return {"status": "error", "detail": str(e)}


@router.get("/symbol/{symbol}")
async def get_symbol_data(symbol: str, data_type: str = Query("SymbolUpdate")):
    """Get current data for specific symbol"""
    try:
        data = fyers_websocket_service.get_symbol_data(symbol, data_type)
        
        if data is None:
            return {"status": "error", "detail": f"No data for symbol {symbol}"}
        
        return {"status": "success", "symbol": symbol, "data": data}
    except Exception as e:
        logger.error(f"Error getting symbol data: {str(e)}")
        return {"status": "error", "detail": str(e)}


@router.websocket("/stream")
async def websocket_stream(websocket: WebSocket):
    """
    WebSocket endpoint for real-time data streaming
    Client can send: {"action": "subscribe", "symbols": [...], "data_type": "SymbolUpdate"}
                    {"action": "unsubscribe", "symbols": [...], "data_type": "SymbolUpdate"}
    """
    await websocket.accept()
    
    try:
        # Register callback to send data to this client
        def send_message(message, data_type):
            try:
                # Send to client
                import asyncio
                asyncio.create_task(websocket.send_json({
                    "type": data_type,
                    "data": message
                }))
            except Exception as e:
                logger.error(f"Error sending message to client: {str(e)}")
        
        # Register callbacks for all data types
        fyers_websocket_service.register_message_callback(send_message, "SymbolUpdate")
        fyers_websocket_service.register_message_callback(send_message, "DepthUpdate")
        fyers_websocket_service.register_message_callback(send_message, "IndexUpdate")
        
        # Keep connection alive and process client messages
        while True:
            try:
                data = await websocket.receive_json()
                action = data.get("action")
                symbols = data.get("symbols", [])
                data_type = data.get("data_type", "SymbolUpdate")
                
                if action == "subscribe":
                    fyers_websocket_service.subscribe(symbols, data_type)
                    await websocket.send_json({
                        "type": "subscription",
                        "status": "subscribed",
                        "symbols": symbols,
                        "data_type": data_type
                    })
                elif action == "unsubscribe":
                    fyers_websocket_service.unsubscribe(symbols, data_type)
                    await websocket.send_json({
                        "type": "subscription",
                        "status": "unsubscribed",
                        "symbols": symbols,
                        "data_type": data_type
                    })
                elif action == "get_status":
                    status = fyers_websocket_service.get_connection_status()
                    await websocket.send_json({
                        "type": "status",
                        "data": status
                    })
                    
            except Exception as e:
                logger.error(f"Error processing client message: {str(e)}")
                await websocket.send_json({
                    "type": "error",
                    "detail": str(e)
                })
    
    except WebSocketDisconnect:
        logger.info("WebSocket client disconnected")
    except Exception as e:
        logger.error(f"WebSocket error: {str(e)}")
        try:
            await websocket.close(code=1000, reason=str(e))
        except:
            pass
