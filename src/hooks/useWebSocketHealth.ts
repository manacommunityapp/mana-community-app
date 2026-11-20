import { useState, useEffect } from 'react';
import { stompClient, type WsState } from '../services/chat/stompClient';

export interface WsHealth {
  state: WsState;
  isConnected: boolean;
  isReconnecting: boolean;
  isBlocked: boolean; // rate-limited or connection-limit
  isUnauthorized: boolean;
}

export function useWebSocketHealth(): WsHealth {
  const [state, setState] = useState<WsState>(stompClient.state);

  useEffect(() => {
    return stompClient.onStateChange(setState);
  }, []);

  return {
    state,
    isConnected: state === 'CONNECTED',
    isReconnecting: state === 'RECONNECTING',
    isBlocked: state === 'RATE_LIMITED' || state === 'CONNECTION_LIMIT',
    isUnauthorized: state === 'UNAUTHORIZED',
  };
}
