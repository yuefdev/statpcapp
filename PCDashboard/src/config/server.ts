// Bağlantı Ayarları
// Cloudflare Tunnel URL'sini buraya yaz (wss:// ile)
export const SERVER_CONFIG = {
  // Cloudflare Tunnel (dış erişim)
  TUNNEL_URL: 'wss://london-commercial-reported-wild.trycloudflare.com',
  
  // Lokal bağlantı (USB/ADB üzerinden)
  LOCAL_URL: 'ws://127.0.0.1:7700',
  
  // Wi-Fi üzerinden (aynı ağda)
  WIFI_URL: 'ws://10.10.34.126:7700',
  
  // Emulator için (10.0.2.2 = host makinesi)
  EMULATOR_URL: 'ws://10.0.2.2:7700',
  
  // Aktif bağlantı modu: 'tunnel' | 'local' | 'wifi' | 'emulator'
  MODE: 'local',
};

export const getServerUrl = () => {
  switch (SERVER_CONFIG.MODE) {
    case 'tunnel':
      return SERVER_CONFIG.TUNNEL_URL;
    case 'wifi':
      return SERVER_CONFIG.WIFI_URL;
    case 'emulator':
      return SERVER_CONFIG.EMULATOR_URL;
    case 'local':
    default:
      return SERVER_CONFIG.LOCAL_URL;
  }
};
