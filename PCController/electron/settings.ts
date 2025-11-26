import * as fs from 'fs';
import * as path from 'path';

export type WidgetStyleType = 'modern' | 'glass' | 'neon' | 'minimal' | 'gradient' | 'cyber';

export interface WidgetConfig {
  id: string;
  type: 'cpu' | 'gpu' | 'ram' | 'clock';
  enabled: boolean;
  style: WidgetStyleType;
  color: string;
  position: string;
  size: number;
}

export interface BackgroundConfig {
  type: 'color' | 'image' | 'gif' | 'video';
  value: string;
  blur: number; // 0-100 blur yüzdesi
}

export interface Settings {
  background: BackgroundConfig;
  globalStyle: WidgetStyleType;
  widgets: WidgetConfig[];
  server: {
    port: number;
    refreshRate: number;
  };
}

const DEFAULT_SETTINGS: Settings = {
  background: { type: 'color', value: '#0a0a1a', blur: 0 },
  globalStyle: 'modern',
  widgets: [
    { id: 'cpu-1', type: 'cpu', enabled: true, style: 'modern', color: '#a855f7', position: 'tl', size: 120 },
    { id: 'gpu-1', type: 'gpu', enabled: true, style: 'modern', color: '#22c55e', position: 'tr', size: 120 },
    { id: 'ram-1', type: 'ram', enabled: true, style: 'modern', color: '#06b6d4', position: 'bl', size: 120 },
    { id: 'clock-1', type: 'clock', enabled: true, style: 'modern', color: '#3b82f6', position: 'br', size: 120 }
  ],
  server: { port: 7700, refreshRate: 1000 }
};

export class SettingsManager {
  private settings: Settings;
  private filePath: string;

  constructor() {
    this.filePath = path.join(__dirname, '../settings.json');
    this.settings = this.load();
  }

  private load(): Settings {
    try {
      if (fs.existsSync(this.filePath)) {
        const data = JSON.parse(fs.readFileSync(this.filePath, 'utf8'));
        return { ...DEFAULT_SETTINGS, ...data };
      }
    } catch {}
    return { ...DEFAULT_SETTINGS };
  }

  private save(): void {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(this.settings, null, 2));
    } catch (e) {
      console.error('Failed to save settings:', e);
    }
  }

  get(): Settings {
    return this.settings;
  }

  setBackground(bg: BackgroundConfig): void {
    this.settings.background = bg;
    this.save();
  }

  updateWidget(id: string, props: Partial<WidgetConfig>): void {
    const widget = this.settings.widgets.find(w => w.id === id);
    if (widget) {
      Object.assign(widget, props);
      this.save();
    }
  }

  setRefreshRate(rate: number): void {
    this.settings.server.refreshRate = rate;
    this.save();
  }

  setGlobalStyle(style: Settings['globalStyle']): void {
    this.settings.globalStyle = style;
    // Tüm widget'ların stilini güncelle
    this.settings.widgets.forEach(w => {
      w.style = style;
    });
    this.save();
  }
}
