from fastapi import WebSocket, WebSocketDisconnect
from typing import List, Dict, Callable, Any
import json
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

class WebSocketConnectionManager:
    """Manage WebSocket connections with error handling and reconnection support."""
    
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.user_connections: Dict[str, List[WebSocket]] = {}
    
    async def connect(self, websocket: WebSocket, user_id: str = None):
        """Register a new WebSocket connection."""
        await websocket.accept()
        self.active_connections.append(websocket)
        
        if user_id:
            if user_id not in self.user_connections:
                self.user_connections[user_id] = []
            self.user_connections[user_id].append(websocket)
        
        logger.info(f"WebSocket connected: {user_id or 'anonymous'}")
    
    async def disconnect(self, websocket: WebSocket, user_id: str = None):
        """Unregister a WebSocket connection."""
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        
        if user_id and user_id in self.user_connections:
            if websocket in self.user_connections[user_id]:
                self.user_connections[user_id].remove(websocket)
        
        logger.info(f"WebSocket disconnected: {user_id or 'anonymous'}")
    
    async def broadcast(self, message: Dict[str, Any]):
        """Broadcast message to all connected clients."""
        disconnected = []
        
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.error(f"Error broadcasting to connection: {str(e)}")
                disconnected.append(connection)
        
        # Clean up disconnected connections
        for connection in disconnected:
            await self.disconnect(connection)
    
    async def send_personal(self, websocket: WebSocket, message: Dict[str, Any]):
        """Send message to specific connection."""
        try:
            await websocket.send_json(message)
        except Exception as e:
            logger.error(f"Error sending personal message: {str(e)}")
            if websocket in self.active_connections:
                await self.disconnect(websocket)
    
    async def send_to_user(self, user_id: str, message: Dict[str, Any]):
        """Send message to all connections of a specific user."""
        if user_id not in self.user_connections:
            return
        
        disconnected = []
        
        for connection in self.user_connections[user_id]:
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.error(f"Error sending to user {user_id}: {str(e)}")
                disconnected.append(connection)
        
        # Clean up disconnected connections
        for connection in disconnected:
            await self.disconnect(connection, user_id)
    
    async def handle_connection(
        self,
        websocket: WebSocket,
        user_id: str,
        message_handler: Callable[[Dict[str, Any]], Any]
    ):
        """Handle WebSocket connection lifecycle with error handling."""
        await self.connect(websocket, user_id)
        
        try:
            while True:
                data = await websocket.receive_json()
                
                try:
                    await message_handler(data)
                except Exception as e:
                    logger.error(f"Error handling message: {str(e)}")
                    await self.send_personal(websocket, {
                        "status": "error",
                        "message": "Error processing message",
                        "error": str(e) if logger.level == logging.DEBUG else None,
                        "timestamp": datetime.utcnow().isoformat()
                    })
        
        except WebSocketDisconnect:
            await self.disconnect(websocket, user_id)
            logger.info(f"Client {user_id} disconnected")
        
        except Exception as e:
            logger.error(f"WebSocket error for user {user_id}: {str(e)}", exc_info=True)
            await self.disconnect(websocket, user_id)
            
            try:
                await websocket.send_json({
                    "status": "error",
                    "message": "Connection error occurred",
                    "timestamp": datetime.utcnow().isoformat()
                })
            except:
                pass

# Global connection manager
connection_manager = WebSocketConnectionManager()
