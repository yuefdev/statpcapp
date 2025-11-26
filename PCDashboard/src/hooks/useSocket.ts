import { useEffect, useRef, useCallback, useState } from 'react';
import { AppSettings, SystemData, PCMessage, PhoneMessage, BackgroundConfig } from '../types';
import { DEFAULT_SETTINGS, DEFAULT_SYSTEM_DATA } from '../config/defaults';
import { getServerUrl } from '../config/server';

// Bağlantı ayarları
const RECONNECT_INTERVAL = 3000;
const HEARTBEAT_INTERVAL = 15000; // 15 saniye - daha seyrek
const MAX_RECONNECT_ATTEMPTS = 15;
const RECONNECT_BACKOFF = 1.3;

// Debug modu - sadece geliştirme modunda log
const DEBUG = typeof __DEV__ !== 'undefined' ? __DEV__ : false;
const log = (...args: any[]) => { if (DEBUG) console.log(...args); };

const isValidBackgroundValue = (type: BackgroundConfig['type'], value: unknown): boolean => {
  if (typeof value !== 'string' || !value) return false;
  if (type === 'color') return true;
  const normalized = value.trim();
  return normalized.startsWith('data:') || /^(file|content|https?):\/\//i.test(normalized);
};

interface UseSocketReturn {
  isConnected: boolean;
  systemData: SystemData;
  settings: AppSettings;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  lastError: string | null;
  reconnect: () => void;
}

export const useSocket = (url?: string): UseSocketReturn => {
  const serverUrl = url || getServerUrl();

  // Refs
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const heartbeatIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const isConnectingRef = useRef(false);
  const isMountedRef = useRef(true);

  // State
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const [lastError, setLastError] = useState<string | null>(null);
  const [systemData, setSystemData] = useState<SystemData>(DEFAULT_SYSTEM_DATA);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  // Timer temizleme
  const clearTimers = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
  }, []);

  const sendMessage = useCallback((message: PhoneMessage) => {
    const ws = socketRef.current;
    if (ws?.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify(message));
      } catch {
        // Sessiz hata - bağlantı kapanıyor olabilir
      }
    }
  }, []);

  const handleMessage = useCallback((event: WebSocketMessageEvent) => {
    if (!isMountedRef.current) return;

    try {
      const message: PCMessage = JSON.parse(event.data);
      const { type, payload, timestamp } = message;

      switch (type) {
        case 'data':
          setSystemData(payload as SystemData);
          break;

        case 'settings':
          if (payload) {
            setSettings(prev => {
              const incomingBg = payload.background;
              let nextBackground = prev.background;

              if (incomingBg) {
                const targetType = incomingBg.type || prev.background.type;
                const isValid = isValidBackgroundValue(targetType, incomingBg.value);
                nextBackground = {
                  ...prev.background,
                  ...incomingBg,
                  type: targetType,
                  blur: incomingBg.blur ?? prev.background.blur,
                  value: isValid ? incomingBg.value : prev.background.value,
                };
              }

              return {
                ...prev,
                widgets: payload.widgets || prev.widgets,
                background: nextBackground,
                globalStyle: payload.globalStyle || prev.globalStyle,
                globalOpacity: payload.globalOpacity ?? prev.globalOpacity,
                orientation: payload.orientation || prev.orientation,
              };
            });
          }
          break;

        case 'background':
          log('📦 Background:', payload.type);
          setSettings(prev => ({
            ...prev,
            background: {
              ...prev.background,
              ...payload,
              blur: payload.blur ?? prev.background.blur,
            },
          }));
          break;

        case 'widget_update':
          setSettings(prev => ({
            ...prev,
            widgets: prev.widgets.map(w =>
              w.id === payload.id ? { ...w, ...payload } : w
            ),
          }));
          break;

        case 'command':
          log('📨 Command:', payload);
          break;
      }

      // Sadece data mesajları için ACK
      if (type === 'data' && timestamp) {
        sendMessage({
          type: 'ack',
          payload: { messageTimestamp: timestamp },
          timestamp: Date.now(),
        });
      }
    } catch {
      // JSON parse hatası - sessiz geç
    }
  }, [sendMessage]);

  const scheduleReconnect = useCallback(() => {
    if (!isMountedRef.current) return;

    const attempts = reconnectAttemptsRef.current;
    if (attempts >= MAX_RECONNECT_ATTEMPTS) {
      setLastError('Bağlantı kurulamadı');
      setConnectionStatus('error');
      return;
    }

    const delay = Math.min(RECONNECT_INTERVAL * Math.pow(RECONNECT_BACKOFF, attempts), 30000);
    log(`🔄 Reconnect: ${Math.round(delay / 1000)}s (${attempts + 1}/${MAX_RECONNECT_ATTEMPTS})`);

    reconnectTimeoutRef.current = setTimeout(() => {
      if (isMountedRef.current) {
        reconnectAttemptsRef.current++;
        connectInternal();
      }
    }, delay);
  }, []);

  const connectInternal = useCallback(() => {
    // Çift bağlantı engelle
    if (isConnectingRef.current) return;
    if (socketRef.current?.readyState === WebSocket.OPEN) return;
    if (socketRef.current?.readyState === WebSocket.CONNECTING) return;

    // Eski bağlantıyı temiz kapat
    if (socketRef.current) {
      const oldWs = socketRef.current;
      oldWs.onopen = null;
      oldWs.onmessage = null;
      oldWs.onerror = null;
      oldWs.onclose = null;
      try { oldWs.close(); } catch {}
      socketRef.current = null;
    }

    clearTimers();
    isConnectingRef.current = true;
    
    if (isMountedRef.current) {
      setConnectionStatus('connecting');
      setLastError(null);
    }

    try {
      const ws = new WebSocket(serverUrl);

      ws.onopen = () => {
        if (!isMountedRef.current) {
          ws.close();
          return;
        }

        log('✅ Bağlandı');
        isConnectingRef.current = false;
        reconnectAttemptsRef.current = 0;

        setIsConnected(true);
        setConnectionStatus('connected');
        setLastError(null);

        // Durum mesajı
        sendMessage({
          type: 'status',
          payload: { status: 'connected', device: 'PCDashboard' },
          timestamp: Date.now(),
        });

        // Heartbeat
        heartbeatIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            sendMessage({
              type: 'status',
              payload: { status: 'heartbeat' },
              timestamp: Date.now(),
            });
          }
        }, HEARTBEAT_INTERVAL);
      };

      ws.onmessage = handleMessage;

      ws.onerror = () => {
        // Sadece flag güncelle, state onclose'da
        isConnectingRef.current = false;
      };

      ws.onclose = (event) => {
        isConnectingRef.current = false;
        socketRef.current = null;
        clearTimers();

        if (!isMountedRef.current) return;

        log('🔌 Bağlantı kapandı:', event.code);
        setIsConnected(false);
        setConnectionStatus('disconnected');

        // Normal kapanma değilse yeniden bağlan
        if (event.code !== 1000) {
          scheduleReconnect();
        }
      };

      socketRef.current = ws;
    } catch {
      isConnectingRef.current = false;
      if (isMountedRef.current) {
        setLastError('Bağlantı hatası');
        setConnectionStatus('error');
        scheduleReconnect();
      }
    }
  }, [serverUrl, handleMessage, sendMessage, clearTimers, scheduleReconnect]);

  const reconnect = useCallback(() => {
    reconnectAttemptsRef.current = 0;
    clearTimers();

    if (socketRef.current) {
      socketRef.current.onclose = null;
      try { socketRef.current.close(); } catch {}
      socketRef.current = null;
    }

    isConnectingRef.current = false;
    connectInternal();
  }, [connectInternal, clearTimers]);

  // Mount/Unmount
  useEffect(() => {
    isMountedRef.current = true;
    connectInternal();

    return () => {
      isMountedRef.current = false;
      clearTimers();

      if (socketRef.current) {
        socketRef.current.onopen = null;
        socketRef.current.onmessage = null;
        socketRef.current.onerror = null;
        socketRef.current.onclose = null;
        try { socketRef.current.close(); } catch {}
        socketRef.current = null;
      }
    };
  }, []);

  return {
    isConnected,
    systemData,
    settings,
    connectionStatus,
    lastError,
    reconnect,
  };
};

export default useSocket;
