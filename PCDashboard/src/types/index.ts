// Widget Tipleri
export type WidgetType = 
  | 'cpu' 
  | 'gpu' 
  | 'ram' 
  | 'disk' 
  | 'network' 
  | 'temperature' 
  | 'fan' 
  | 'clock' 
  | 'custom';

// Widget Pozisyon ve Boyut
export interface WidgetPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Widget Stil Ayarları
export interface WidgetStyle {
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
  borderRadius: number;
  opacity: number;
  textColor: string;
  titleColor: string;
  accentColor: string;
  fontSize: number;
  showTitle: boolean;
  showIcon: boolean;
  showGraph: boolean;
  graphColor: string;
  graphStyle: 'line' | 'bar' | 'area' | 'radial';
}

// Widget Yapılandırması
export interface WidgetConfig {
  id: string;
  type: WidgetType;
  enabled: boolean;
  position: WidgetPosition;
  style: WidgetStyle;
  refreshRate: number; // ms
  customTitle?: string;
  dataKey?: string; // Hangi veriyi gösterecek
}

// Arka Plan Ayarları
export interface BackgroundConfig {
  type: 'color' | 'image' | 'video' | 'gif';
  value: string; // Renk kodu veya base64/URL
  blur: number;
  opacity: number;
  fit: 'cover' | 'contain' | 'stretch' | 'center';
}

// AMOLED Koruma Ayarları
export interface AmoledProtectionConfig {
  enabled: boolean;
  mode: 'shake' | 'blackout' | 'pixelShift';
  interval: number; // dakika
  duration: number; // saniye (blackout için)
  shakeIntensity: number; // piksel
}

// Tema Ayarları
export interface ThemeConfig {
  mode: 'dark' | 'light' | 'custom';
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
}

// Widget Stil Tipi
export type WidgetStyleType = 'modern' | 'glass' | 'neon' | 'minimal' | 'gradient' | 'cyber';

// Genel Ayarlar
export interface AppSettings {
  theme: ThemeConfig;
  background: BackgroundConfig;
  amoledProtection: AmoledProtectionConfig;
  widgets: WidgetConfig[];
  globalStyle: WidgetStyleType;
  screenAlwaysOn: boolean;
  hideStatusBar: boolean;
  hideNavigationBar: boolean;
  animationsEnabled: boolean;
  animationSpeed: number; // 0.5 - 2.0
}

// PC'den Gelen Donanım Verileri
export interface CpuData {
  name: string;
  usage: number;
  temperature: number;
  frequency: number;
  cores: {
    id: number;
    usage: number;
    frequency: number;
    temperature: number;
  }[];
  power: number;
}

export interface GpuData {
  name: string;
  usage: number;
  temperature: number;
  vramUsed: number;
  vramTotal: number;
  fanSpeed: number;
  coreClock: number;
  memoryClock: number;
  power: number;
}

export interface RamData {
  used: number;
  total: number;
  usagePercent: number;
  frequency: number;
}

export interface DiskData {
  name: string;
  used: number;
  total: number;
  usagePercent: number;
  readSpeed: number;
  writeSpeed: number;
  temperature: number;
}

export interface NetworkData {
  name: string;
  downloadSpeed: number;
  uploadSpeed: number;
  totalDownload: number;
  totalUpload: number;
  ping: number;
}

export interface FanData {
  name: string;
  rpm: number;
  percentage: number;
}

// Tüm Sistem Verileri
export interface SystemData {
  timestamp: number;
  cpu: CpuData;
  gpu: GpuData;
  ram: RamData;
  disks: DiskData[];
  network: NetworkData;
  fans: FanData[];
}

// PC'den Gelen Mesaj Tipleri
export type MessageType = 
  | 'data'           // Sistem verileri
  | 'settings'       // Ayar güncellemesi
  | 'background'     // Arka plan değişikliği
  | 'widget_update'  // Tek widget güncelleme
  | 'command';       // Komut (restart, sleep vs)

export interface PCMessage {
  type: MessageType;
  payload: any;
  timestamp: number;
}

// Telefona Gönderilecek Mesaj
export interface PhoneMessage {
  type: 'status' | 'ack' | 'error';
  payload: any;
  timestamp: number;
}
