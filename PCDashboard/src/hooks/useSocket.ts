import { useEffect, useRef, useCallback, useState } from 'react';
import { AppSettings, SystemData, PCMessage, PhoneMessage, BackgroundConfig } from '../types';
import { DEFAULT_SETTINGS, DEFAULT_SYSTEM_DATA } from '../config/defaults';
import { getServerUrl } from '../config/server';

const RECONNECT_INTERVAL = 3000; // 3 saniye
const HEARTBEAT_INTERVAL = 5000; // 5 saniye

const isValidBackgroundValue = (type: BackgroundConfig['type'], value: unknown) => {
  if (typeof value !== 'string') {
    return false;
  }

  if (type === 'color') {
    return true;
  }

  const normalized = value.trim();
  if (normalized.startsWith('data:')) {
    return true;
  }

  if (/^(file|content|https?):\/\//i.test(normalized)) {
    return true;
  }

  return false;
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
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const heartbeatIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const [lastError, setLastError] = useState<string | null>(null);
  const [systemData, setSystemData] = useState<SystemData>(DEFAULT_SYSTEM_DATA);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  const sendMessage = useCallback((message: PhoneMessage) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(message));
    }
  }, []);

  const handleMessage = useCallback((event: WebSocketMessageEvent) => {
    try {
      const message: PCMessage = JSON.parse(event.data);

      switch (message.type) {
        case 'data':
          setSystemData(message.payload as SystemData);
          break;
        case 'settings':
          // PC'den gelen tüm ayarları kabul et - widget'lar ve globalStyle dahil
          if (message.payload) {
            setSettings(prev => {
              const incomingBg = message.payload.background;
              let nextBackground = prev.background;

              if (incomingBg) {
                const targetType = incomingBg.type || prev.background.type;
                const shouldUseIncomingValue = isValidBackgroundValue(targetType, incomingBg.value);

                if (!shouldUseIncomingValue && typeof incomingBg.value !== 'undefined') {
                  console.warn('⚠️ Geçersiz background değeri (data URI değil), mevcut medya korunuyor.');
                }

                nextBackground = {
                  ...prev.background,
                  ...incomingBg,
                  type: targetType,
                  blur: incomingBg.blur ?? prev.background.blur,
                  value: shouldUseIncomingValue && typeof incomingBg.value === 'string'
                    ? incomingBg.value
                    : prev.background.value,
                };
              }

              return {
                ...prev,
                widgets: message.payload.widgets || prev.widgets,
                background: nextBackground,
                globalStyle: message.payload.globalStyle || prev.globalStyle,
              };
            });
          }
          break;
        case 'background':
          console.log('📦 Background mesajı alındı:', {
            type: message.payload.type,
            valueLength: message.payload.value?.length,
            valueStart: message.payload.value?.substring(0, 50),
            blur: message.payload.blur
          });
          setSettings(prev => ({ 
            ...prev, 
            background: {
              ...prev.background,
              ...message.payload,
              blur: message.payload.blur ?? prev.background.blur,
            }
          }));
          break;
        case 'widget_update':
          setSettings(prev => ({
            ...prev,
            widgets: prev.widgets.map(w => 
              w.id === message.payload.id ? { ...w, ...message.payload } : w
            ),
          }));
          break;
        case 'command':
          handleCommand(message.payload);
          break;
      }

      // ACK gönder
      sendMessage({
        type: 'ack',
        payload: { messageTimestamp: message.timestamp },
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error('Mesaj işleme hatası:', error);
    }
  }, [sendMessage]);

  const handleCommand = (command: any) => {
    // Komutları işle (ileride genişletilebilir)
    console.log('Komut alındı:', command);
  };

  const connect = useCallback(() => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    setConnectionStatus('connecting');
    setLastError(null);

    try {
      // WebSocket bağlantısı
      const ws = new WebSocket(serverUrl);

      ws.onopen = () => {
        console.log('WebSocket bağlantısı kuruldu');
        setIsConnected(true);
        setConnectionStatus('connected');
        setLastError(null);

        // Durum gönder
        sendMessage({
          type: 'status',
          payload: { status: 'connected', device: 'Note3-Dashboard' },
          timestamp: Date.now(),
        });

        // Heartbeat başlat
        heartbeatIntervalRef.current = setInterval(() => {
          sendMessage({
            type: 'status',
            payload: { status: 'heartbeat' },
            timestamp: Date.now(),
          });
        }, HEARTBEAT_INTERVAL);
      };

      ws.onmessage = handleMessage;

      ws.onerror = (error) => {
        console.error('WebSocket hatası:', error);
        setLastError('Bağlantı hatası');
        setConnectionStatus('error');
      };

      ws.onclose = () => {
        console.log('WebSocket bağlantısı kapandı');
        setIsConnected(false);
        setConnectionStatus('disconnected');
        socketRef.current = null;

        // Heartbeat durdur
        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current);
        }

        // Otomatik yeniden bağlan
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, RECONNECT_INTERVAL);
      };

      socketRef.current = ws;
    } catch (error) {
      console.error('Bağlantı oluşturma hatası:', error);
      setLastError('Bağlantı oluşturulamadı');
      setConnectionStatus('error');

      // Yeniden dene
      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, RECONNECT_INTERVAL);
    }
  }, [serverUrl, handleMessage, sendMessage]);

  const reconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (socketRef.current) {
      socketRef.current.close();
    }
    connect();
  }, [connect]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [connect]);

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
