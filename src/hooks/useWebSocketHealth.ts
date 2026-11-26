import { useState, useEffect, useCallback } from 'react';
import { stompClient, type WsState, type NetworkType, type WsMetadata } from '../services/chat/stompClient';
import { guardSyncOrchestrator, type GuardSyncStatus } from '../services/sync/guardSyncOrchestrator';

export interface WsHealth {
  state: WsState;
  isConnected: boolean;
  isReconnecting: boolean;
  isBlocked: boolean; // rate-limited or connection-limit
  isUnauthorized: boolean;
  networkType: NetworkType;
  reconnectAttempt: number;
  lastConnectedAt: string | null;
  syncStatus: GuardSyncStatus;
  forceReconnect: () => void;
}

export function useWebSocketHealth(): WsHealth {
  const [meta, setMeta] = useState<WsMetadata>(stompClient.metadata);
  const [syncStatus, setSyncStatus] = useState<GuardSyncStatus>(guardSyncOrchestrator.getStatus());

  useEffect(() => {
    const unsubMeta = stompClient.onMetaChange(setMeta);
    const unsubSync = guardSyncOrchestrator.onStatusChange(setSyncStatus);
    return () => {
      unsubMeta();
      unsubSync();
    };
  }, []);

  const forceReconnect = useCallback(() => {
    stompClient.forceReconnect();
  }, []);

  return {
    state: meta.state,
    isConnected: meta.state === 'CONNECTED',
    isReconnecting: meta.state === 'RECONNECTING',
    isBlocked: meta.state === 'RATE_LIMITED' || meta.state === 'CONNECTION_LIMIT',
    isUnauthorized: meta.state === 'UNAUTHORIZED',
    networkType: meta.networkType,
    reconnectAttempt: meta.reconnectAttempt,
    lastConnectedAt: meta.lastConnectedAt,
    syncStatus,
    forceReconnect,
  };
}
