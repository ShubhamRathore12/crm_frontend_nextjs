"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface WebSocketMessage {
  type: "notification" | "lead_update" | "deal_update" | "interaction_update" | "workflow_execution" | "dashboard_update" | "system_status" | "heartbeat";
  timestamp?: string;
  [key: string]: any;
}

interface UseWebSocketOptions {
  autoConnect?: boolean;
  reconnectAttempts?: number;
  reconnectInterval?: number;
  onMessage?: (message: WebSocketMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const {
    autoConnect = true,
    reconnectAttempts = 5,
    reconnectInterval = 3000,
    onMessage,
    onConnect,
    onDisconnect,
    onError,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [error, setError] = useState<Event | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectCountRef = useRef(0);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      wsRef.current = new WebSocket(wsUrl);
      setConnectionStatus('connecting');
      setError(null);

      wsRef.current.onopen = () => {
        setIsConnected(true);
        setConnectionStatus('connected');
        reconnectCountRef.current = 0;
        onConnect?.();
        
        // Start heartbeat
        startHeartbeat();
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          setLastMessage(message);
          
          // Handle different message types
          switch (message.type) {
            case 'notification':
              handleNotification(message);
              break;
            case 'lead_update':
              handleLeadUpdate(message);
              break;
            case 'deal_update':
              handleDealUpdate(message);
              break;
            case 'interaction_update':
              handleInteractionUpdate(message);
              break;
            case 'workflow_execution':
              handleWorkflowExecution(message);
              break;
            case 'dashboard_update':
              handleDashboardUpdate(message);
              break;
            case 'system_status':
              handleSystemStatus(message);
              break;
            case 'heartbeat':
              // Handle heartbeat response
              break;
          }
          
          onMessage?.(message);
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
        }
      };

      wsRef.current.onclose = (event) => {
        setIsConnected(false);
        setConnectionStatus('disconnected');
        onDisconnect?.();
        
        // Attempt to reconnect if not a normal closure
        if (!event.wasClean && reconnectCountRef.current < reconnectAttempts) {
          reconnectCountRef.current++;
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        }
      };

      wsRef.current.onerror = (event) => {
        setConnectionStatus('error');
        setError(event);
        onError?.(event);
      };

    } catch (err) {
      setConnectionStatus('error');
      console.error('Failed to create WebSocket connection:', err);
    }
  }, [reconnectAttempts, reconnectInterval, onConnect, onDisconnect, onError, onMessage]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    stopHeartbeat();
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    setIsConnected(false);
    setConnectionStatus('disconnected');
  }, []);

  const send = useCallback((message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
      return true;
    }
    return false;
  }, []);

  const startHeartbeat = useCallback(() => {
    const heartbeatInterval = setInterval(() => {
      send({ type: 'heartbeat', timestamp: new Date().toISOString() });
    }, 30000); // Send heartbeat every 30 seconds

    // Store interval ID for cleanup
    (window as any).heartbeatInterval = heartbeatInterval;
  }, [send]);

  const stopHeartbeat = useCallback(() => {
    if ((window as any).heartbeatInterval) {
      clearInterval((window as any).heartbeatInterval);
      delete (window as any).heartbeatInterval;
    }
  }, []);

  // Simple notification function (can be replaced with a proper toast system)
  const showNotification = useCallback((title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    // Create a simple notification (you can replace this with your preferred toast library)
    console.log(`[${type.toUpperCase()}] ${title}: ${message}`);
    
    // You could also dispatch a custom event for UI components to listen to
    window.dispatchEvent(new CustomEvent('notification', {
      detail: { title, message, type }
    }));
  }, []);

  // Message handlers
  const handleNotification = useCallback((message: WebSocketMessage) => {
    const { title, message: notificationMessage, level } = message;
    showNotification(title, notificationMessage, level as any);
  }, [showNotification]);

  const handleLeadUpdate = useCallback((message: WebSocketMessage) => {
    // Trigger lead update events
    window.dispatchEvent(new CustomEvent('lead_update', { detail: message }));
  }, []);

  const handleDealUpdate = useCallback((message: WebSocketMessage) => {
    // Trigger deal update events
    window.dispatchEvent(new CustomEvent('deal_update', { detail: message }));
  }, []);

  const handleInteractionUpdate = useCallback((message: WebSocketMessage) => {
    // Trigger interaction update events
    window.dispatchEvent(new CustomEvent('interaction_update', { detail: message }));
  }, []);

  const handleWorkflowExecution = useCallback((message: WebSocketMessage) => {
    // Trigger workflow execution events
    window.dispatchEvent(new CustomEvent('workflow_execution', { detail: message }));
    
    // Show notification for workflow completion
    if (message.status === 'completed') {
      showNotification('Workflow Completed', `Workflow ${message.workflow_id} completed successfully`, 'success');
    } else if (message.status === 'failed') {
      showNotification('Workflow Failed', `Workflow ${message.workflow_id} failed to execute`, 'error');
    }
  }, [showNotification]);

  const handleDashboardUpdate = useCallback((message: WebSocketMessage) => {
    // Trigger dashboard update events
    window.dispatchEvent(new CustomEvent('dashboard_update', { detail: message }));
  }, []);

  const handleSystemStatus = useCallback((message: WebSocketMessage) => {
    if (message.status === 'connected') {
      showNotification('Connected', 'Real-time connection established', 'success');
    }
  }, [showNotification]);

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  return {
    isConnected,
    connectionStatus,
    lastMessage,
    error,
    connect,
    disconnect,
    send,
  };
}

// Hook for listening to specific WebSocket events
export function useWebSocketEvent<T = any>(
  eventType: string,
  handler: (data: T) => void,
  deps: React.DependencyList = []
) {
  useEffect(() => {
    const eventHandler = (event: CustomEvent<T>) => {
      handler(event.detail);
    };

    window.addEventListener(eventType, eventHandler as EventListener);

    return () => {
      window.removeEventListener(eventType, eventHandler as EventListener);
    };
  }, deps);
}
