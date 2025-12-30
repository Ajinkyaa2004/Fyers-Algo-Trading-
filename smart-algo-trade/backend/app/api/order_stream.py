"""
Order WebSocket API Endpoints for Real-time Order/Trade/Position Updates
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from typing import List
from app.services.fyers_order_websocket import fyers_order_websocket_service
from app.services.fyers_auth import fyers_auth_service
import json
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/order-stream", tags=["order-stream"])


@router.post("/connect")
async def connect_order_websocket():
    """Initialize Order WebSocket connection"""
    try:
        session_data = fyers_auth_service.get_session()
        if not session_data or "access_token" not in session_data:
            return {"status": "error", "detail": "Not authenticated"}
        
        access_token = session_data["access_token"]
        success = fyers_order_websocket_service.initialize(access_token)
        
        if success:
            fyers_order_websocket_service.connect()
            status = fyers_order_websocket_service.get_connection_status()
            return {"status": "success", "data": status}
        else:
            return {"status": "error", "detail": "Failed to initialize Order WebSocket"}
    except Exception as e:
        logger.error(f"Error connecting Order WebSocket: {str(e)}")
        return {"status": "error", "detail": str(e)}


@router.post("/disconnect")
async def disconnect_order_websocket():
    """Close Order WebSocket connection"""
    try:
        fyers_order_websocket_service.disconnect()
        return {"status": "success", "message": "Disconnected"}
    except Exception as e:
        logger.error(f"Error disconnecting Order WebSocket: {str(e)}")
        return {"status": "error", "detail": str(e)}


@router.post("/subscribe")
async def subscribe_order_events(event_types: List[str] = Query(...)):
    """Subscribe to order/trade/position events"""
    try:
        if not event_types:
            return {"status": "error", "detail": "No event types provided"}
        
        # Validate event types
        valid_types = {"OnOrders", "OnTrades", "OnPositions", "OnGeneral"}
        invalid = set(event_types) - valid_types
        if invalid:
            return {"status": "error", "detail": f"Invalid event types: {invalid}"}
        
        success = fyers_order_websocket_service.subscribe(event_types)
        
        return {
            "status": "success" if success else "pending",
            "message": f"Subscribed to {len(event_types)} event types",
            "event_types": event_types
        }
    except Exception as e:
        logger.error(f"Error subscribing: {str(e)}")
        return {"status": "error", "detail": str(e)}


@router.post("/unsubscribe")
async def unsubscribe_order_events(event_types: List[str] = Query(...)):
    """Unsubscribe from event types"""
    try:
        if not event_types:
            return {"status": "error", "detail": "No event types provided"}
        
        success = fyers_order_websocket_service.unsubscribe(event_types)
        
        return {
            "status": "success" if success else "error",
            "message": f"Unsubscribed from {len(event_types)} event types",
            "event_types": event_types
        }
    except Exception as e:
        logger.error(f"Error unsubscribing: {str(e)}")
        return {"status": "error", "detail": str(e)}


@router.get("/status")
async def get_order_websocket_status():
    """Get Order WebSocket connection status"""
    try:
        status = fyers_order_websocket_service.get_connection_status()
        return {"status": "success", "data": status}
    except Exception as e:
        logger.error(f"Error getting status: {str(e)}")
        return {"status": "error", "detail": str(e)}


@router.get("/orders")
async def get_orders():
    """Get all stored orders"""
    try:
        orders = fyers_order_websocket_service.get_orders()
        return {"status": "success", "count": len(orders), "data": orders}
    except Exception as e:
        logger.error(f"Error getting orders: {str(e)}")
        return {"status": "error", "detail": str(e)}


@router.get("/trades")
async def get_trades():
    """Get all stored trades"""
    try:
        trades = fyers_order_websocket_service.get_trades()
        return {"status": "success", "count": len(trades), "data": trades}
    except Exception as e:
        logger.error(f"Error getting trades: {str(e)}")
        return {"status": "error", "detail": str(e)}


@router.get("/positions")
async def get_positions_stream():
    """Get all stored positions from order stream"""
    try:
        positions = fyers_order_websocket_service.get_positions()
        return {"status": "success", "count": len(positions), "data": positions}
    except Exception as e:
        logger.error(f"Error getting positions: {str(e)}")
        return {"status": "error", "detail": str(e)}


@router.get("/general")
async def get_general_messages():
    """Get all general messages"""
    try:
        messages = fyers_order_websocket_service.get_general_messages()
        return {"status": "success", "count": len(messages), "data": messages}
    except Exception as e:
        logger.error(f"Error getting general messages: {str(e)}")
        return {"status": "error", "detail": str(e)}


@router.websocket("/stream")
async def websocket_order_stream(websocket: WebSocket):
    """
    WebSocket endpoint for real-time order/trade/position updates
    Client can send: {"action": "subscribe", "event_types": ["OnOrders", "OnTrades", "OnPositions", "OnGeneral"]}
                    {"action": "unsubscribe", "event_types": ["OnOrders"]}
                    {"action": "get_status"}
    """
    await websocket.accept()
    
    try:
        # Register callback to send data to this client
        def send_message(message, event_type):
            try:
                # Send to client
                import asyncio
                asyncio.create_task(websocket.send_json({
                    "type": event_type,
                    "data": message
                }))
            except Exception as e:
                logger.error(f"Error sending message to client: {str(e)}")
        
        # Register callbacks for all event types
        fyers_order_websocket_service.register_message_callback(send_message, "OnOrders")
        fyers_order_websocket_service.register_message_callback(send_message, "OnTrades")
        fyers_order_websocket_service.register_message_callback(send_message, "OnPositions")
        fyers_order_websocket_service.register_message_callback(send_message, "OnGeneral")
        
        # Keep connection alive and process client messages
        while True:
            try:
                data = await websocket.receive_json()
                action = data.get("action")
                event_types = data.get("event_types", [])
                
                if action == "subscribe":
                    fyers_order_websocket_service.subscribe(event_types)
                    await websocket.send_json({
                        "type": "subscription",
                        "status": "subscribed",
                        "event_types": event_types
                    })
                elif action == "unsubscribe":
                    fyers_order_websocket_service.unsubscribe(event_types)
                    await websocket.send_json({
                        "type": "subscription",
                        "status": "unsubscribed",
                        "event_types": event_types
                    })
                elif action == "get_status":
                    status = fyers_order_websocket_service.get_connection_status()
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
        logger.info("Order WebSocket client disconnected")
    except Exception as e:
        logger.error(f"Order WebSocket error: {str(e)}")
        try:
            await websocket.close(code=1000, reason=str(e))
        except:
            pass
