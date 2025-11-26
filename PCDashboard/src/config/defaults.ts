import { AppSettings, WidgetConfig, BackgroundConfig, ThemeConfig, AmoledProtectionConfig } from '../types';

// Varsayılan Widget Stili
export const DEFAULT_WIDGET_STYLE = {
  backgroundColor: 'rgba(20, 20, 30, 0.85)',
  borderColor: '#3b82f6',
  borderWidth: 1,
  borderRadius: 16,
  opacity: 1,
  textColor: '#ffffff',
  titleColor: '#94a3b8',
  accentColor: '#3b82f6',
  fontSize: 14,
  showTitle: true,
  showIcon: true,
  showGraph: true,
  graphColor: '#3b82f6',
  graphStyle: 'area' as const,
};

// Varsayılan Widget Pozisyonları (4x6 grid üzerinde)
// Sadece CPU, GPU, RAM ve Clock
export const DEFAULT_WIDGETS: WidgetConfig[] = [
  {
    id: 'cpu-1',
    type: 'cpu',
    enabled: true,
    position: 'tl' as any,
    style: { ...DEFAULT_WIDGET_STYLE, accentColor: '#a855f7', graphColor: '#a855f7' },
    refreshRate: 1000,
    color: '#a855f7',
    size: 120,
  } as any,
  {
    id: 'gpu-1',
    type: 'gpu',
    enabled: true,
    position: 'tr' as any,
    style: { ...DEFAULT_WIDGET_STYLE, accentColor: '#22c55e', graphColor: '#22c55e' },
    refreshRate: 1000,
    color: '#22c55e',
    size: 120,
  } as any,
  {
    id: 'ram-1',
    type: 'ram',
    enabled: true,
    position: 'bl' as any,
    style: { ...DEFAULT_WIDGET_STYLE, accentColor: '#06b6d4', graphColor: '#06b6d4' },
    refreshRate: 1000,
    color: '#06b6d4',
    size: 120,
  } as any,
  {
    id: 'clock-1',
    type: 'clock',
    enabled: true,
    position: 'br' as any,
    style: { ...DEFAULT_WIDGET_STYLE, fontSize: 32 },
    refreshRate: 1000,
    color: '#3b82f6',
    size: 120,
  } as any,
];

// Varsayılan Tema
export const DEFAULT_THEME: ThemeConfig = {
  mode: 'dark',
  primaryColor: '#3b82f6',
  secondaryColor: '#1e40af',
  backgroundColor: '#0f172a',
  textColor: '#ffffff',
  accentColor: '#3b82f6',
};

// Varsayılan Arka Plan
export const DEFAULT_BACKGROUND: BackgroundConfig = {
  type: 'color',
  value: '#0a0a1a',
  blur: 0,
  opacity: 1,
  fit: 'cover',
};

// Varsayılan AMOLED Koruma
export const DEFAULT_AMOLED_PROTECTION: AmoledProtectionConfig = {
  enabled: true,
  mode: 'pixelShift',
  interval: 10, // 10 dakika
  duration: 2,  // 2 saniye blackout
  shakeIntensity: 5, // 5 piksel kayma
};

// Varsayılan Uygulama Ayarları
export const DEFAULT_SETTINGS: AppSettings = {
  theme: DEFAULT_THEME,
  background: DEFAULT_BACKGROUND,
  amoledProtection: DEFAULT_AMOLED_PROTECTION,
  widgets: DEFAULT_WIDGETS,
  globalStyle: 'modern',
  screenAlwaysOn: true,
  hideStatusBar: true,
  hideNavigationBar: true,
  animationsEnabled: true,
  animationSpeed: 1.0,
};

// Varsayılan Sistem Verileri (Bağlantı yok iken)
export const DEFAULT_SYSTEM_DATA = {
  timestamp: 0,
  cpu: {
    name: 'Bağlantı Bekleniyor...',
    usage: 0,
    temperature: 0,
    frequency: 0,
    cores: [],
    power: 0,
  },
  gpu: {
    name: 'Bağlantı Bekleniyor...',
    usage: 0,
    temperature: 0,
    vramUsed: 0,
    vramTotal: 0,
    fanSpeed: 0,
    coreClock: 0,
    memoryClock: 0,
    power: 0,
  },
  ram: {
    used: 0,
    total: 0,
    usagePercent: 0,
    frequency: 0,
  },
  disks: [],
  network: {
    name: 'Bağlantı Yok',
    downloadSpeed: 0,
    uploadSpeed: 0,
    totalDownload: 0,
    totalUpload: 0,
    ping: 0,
  },
  fans: [],
};
