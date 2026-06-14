import { useEffect, useRef, useState, useCallback } from 'react';
import { toast } from '@/components/ui/use-toast';

export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const ws = useRef(null);
  const reconnectTimeout = useRef(null);

  const connect = useCallback(() => {
    if (ws.current) return;
    
    // Connect to Vite proxy port or direct backend port
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname;
    // Default to 3000 only if no port is specified and we're in DEV, otherwise use window.location.port
    const port = window.location.port || (import.meta.env.DEV ? '3000' : '');
    const url = import.meta.env.VITE_WS_URL || `${protocol}//${host}${port ? `:${port}` : ''}/`;

    console.log('[WS] Connecting to', url);
    ws.current = new WebSocket(url);

    ws.current.onopen = () => {
      console.log('[WS] Connected');
      setIsConnected(true);
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
    };

    ws.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'CONNECTED') return;
        
        setMessages(prev => [data, ...prev].slice(0, 50)); // Keep last 50
        
        // Auto-toast removed per user request: "Bildirishnomalar hunuk kelyapti"
        // Instead, the Dashboard will show a notification bell
      } catch (err) {
        console.error('[WS] Error parsing message:', err);
      }
    };

    ws.current.onclose = () => {
      console.log('[WS] Disconnected');
      setIsConnected(false);
      ws.current = null;
      reconnectTimeout.current = setTimeout(connect, 3000); // Reconnect in 3s
    };

    ws.current.onerror = (err) => {
      console.error('[WS] Error:', err);
    };
  }, []);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
      if (ws.current) {
        ws.current.close();
        ws.current = null;
      }
    };
  }, [connect]);

  const clearMessages = () => setMessages([]);

  return { isConnected, messages, clearMessages };
}
