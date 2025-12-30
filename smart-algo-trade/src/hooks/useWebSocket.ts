import { useEffect, useRef, useCallback } from 'react';
import { showToast } from './errorHandler';

interface WebSocketOptions {
  url: string;
  onMessage?: (data: any) => void;
  onError?: (error: Error) => void;
  onClose?: () => void;
  reconnectAttempts?: number;
  reconnectDelay?: number;
}

export function useWebSocket({
  url,
  onMessage,
  onError,
  onClose,
  reconnectAttempts = 5,
  reconnectDelay = 3000,
}: WebSocketOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectCountRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    try {
      wsRef.current = new WebSocket(url);

      wsRef.current.onopen = () => {
        console.log('WebSocket connected');
        reconnectCountRef.current = 0;
        showToast.success('Connected to real-time updates');
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          onMessage?.(data);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        const wsError = new Error('WebSocket connection error');
        onError?.(wsError);
        showToast.error('Connection error - attempting to reconnect');
      };

      wsRef.current.onclose = () => {
        console.log('WebSocket disconnected');
        onClose?.();

        // Attempt to reconnect
        if (reconnectCountRef.current < reconnectAttempts) {
          reconnectCountRef.current++;
          console.log(
            `Reconnecting... (${reconnectCountRef.current}/${reconnectAttempts})`
          );

          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectDelay);
        } else {
          console.error('Max reconnection attempts reached');
          showToast.error('Connection lost - please refresh the page');
        }
      };
    } catch (error) {
      console.error('Failed to establish WebSocket connection:', error);
      const wsError = new Error('Failed to create WebSocket');
      onError?.(wsError);
      showToast.error('Failed to connect to real-time updates');
    }
  }, [url, onMessage, onError, onClose, reconnectAttempts, reconnectDelay]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  const send = useCallback((data: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    } else {
      console.warn('WebSocket is not open');
      showToast.warning('Connection is not ready');
    }
  }, []);

  return {
    ws: wsRef.current,
    send,
    isConnected: wsRef.current?.readyState === WebSocket.OPEN,
  };
}

/**
 * Middleware for WebSocket error handling in FastAPI
 */
export function createWebSocketErrorHandler(
  onError: (error: any) => void
) {
  return async (websocket: any, call_next: any) => {
    try {
      return await call_next(websocket);
    } catch (error) {
      console.error('WebSocket handler error:', error);
      onError(error);
      
      try {
        await websocket.send_json({
          status: 'error',
          message: 'WebSocket error occurred',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      } catch (sendError) {
        console.error('Failed to send error to WebSocket:', sendError);
      }
    }
  };
}
