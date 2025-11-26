import * as fs from 'fs';
import * as path from 'path';

export type WidgetStyleType = 'modern' | 'glass' | 'neon' | 'minimal' | 'gradient' | 'cyber' | 'unified';
export type OrientationType = 'portrait' | 'landscape';

export interface WidgetConfig {
  id: string;
  type: 'cpu' | 'gpu' | 'ram' | 'clock';
  enabled: boolean;
  style: WidgetStyleType;
  color: string;
  position: string;
  size: number;
  opacity?: number; // 0.1 - 1.0, varsayılan 1
}

export interface BackgroundConfig {
  type: 'color' | 'image' | 'gif' | 'video';
  value: string;
  blur: number; // 0-100 blur yüzdesi
}

export interface TemplateConfig {
  id: string;
  name: string;
  thumbnail?: string;
  orientation: OrientationType;
  background: BackgroundConfig;
  globalStyle: WidgetStyleType;
  widgets: WidgetConfig[];
}

export interface Settings {
  background: BackgroundConfig;
  globalStyle: WidgetStyleType;
  globalOpacity: number; // 0.1 - 1.0, tüm widget'lar için genel opaklık
  orientation: OrientationType;
  widgets: WidgetConfig[];
  server: {
    port: number;
    refreshRate: number;
  };
}

const DEFAULT_SETTINGS: Settings = {
  background: { type: 'color', value: '#0a0a1a', blur: 0 },
  globalStyle: 'modern',
  globalOpacity: 1,
  orientation: 'portrait',
  widgets: [
    { id: 'clock-1', type: 'clock', enabled: true, style: 'modern', color: '#3b82f6', position: 'tl', size: 100, opacity: 1 },
    { id: 'cpu-1', type: 'cpu', enabled: true, style: 'modern', color: '#a855f7', position: 'tr', size: 100, opacity: 1 },
    { id: 'gpu-1', type: 'gpu', enabled: true, style: 'modern', color: '#22c55e', position: 'bl', size: 100, opacity: 1 },
    { id: 'ram-1', type: 'ram', enabled: true, style: 'modern', color: '#06b6d4', position: 'br', size: 100, opacity: 1 }
  ],
  server: { port: 7700, refreshRate: 1000 }
};

// Hazır Template'ler
export const TEMPLATES: TemplateConfig[] = [
  {
    id: 'minimal-dark',
    name: 'Minimal Dark',
    orientation: 'portrait',
    background: { type: 'color', value: '#0a0a1a', blur: 0 },
    globalStyle: 'minimal',
    widgets: [
      { id: 'cpu-1', type: 'cpu', enabled: true, style: 'minimal', color: '#ffffff', position: 'tl', size: 100 },
      { id: 'gpu-1', type: 'gpu', enabled: true, style: 'minimal', color: '#ffffff', position: 'tr', size: 100 },
      { id: 'ram-1', type: 'ram', enabled: true, style: 'minimal', color: '#ffffff', position: 'bl', size: 100 },
      { id: 'clock-1', type: 'clock', enabled: true, style: 'minimal', color: '#ffffff', position: 'br', size: 100 }
    ]
  },
  {
    id: 'neon-purple',
    name: 'Neon Purple',
    orientation: 'portrait',
    background: { type: 'color', value: 'linear-gradient(135deg, #1a0a2e, #16213e)', blur: 0 },
    globalStyle: 'neon',
    widgets: [
      { id: 'cpu-1', type: 'cpu', enabled: true, style: 'neon', color: '#a855f7', position: 'tl', size: 120 },
      { id: 'gpu-1', type: 'gpu', enabled: true, style: 'neon', color: '#f472b6', position: 'tr', size: 120 },
      { id: 'ram-1', type: 'ram', enabled: true, style: 'neon', color: '#818cf8', position: 'bl', size: 120 },
      { id: 'clock-1', type: 'clock', enabled: true, style: 'neon', color: '#c084fc', position: 'br', size: 120 }
    ]
  },
  {
    id: 'cyber-green',
    name: 'Cyber Green',
    orientation: 'portrait',
    background: { type: 'color', value: '#050a19', blur: 0 },
    globalStyle: 'cyber',
    widgets: [
      { id: 'cpu-1', type: 'cpu', enabled: true, style: 'cyber', color: '#22c55e', position: 'tl', size: 110 },
      { id: 'gpu-1', type: 'gpu', enabled: true, style: 'cyber', color: '#10b981', position: 'tr', size: 110 },
      { id: 'ram-1', type: 'ram', enabled: true, style: 'cyber', color: '#34d399', position: 'bl', size: 110 },
      { id: 'clock-1', type: 'clock', enabled: true, style: 'cyber', color: '#4ade80', position: 'br', size: 110 }
    ]
  },
  {
    id: 'glass-frost',
    name: 'Glass Frost',
    orientation: 'portrait',
    background: { type: 'color', value: 'linear-gradient(135deg, #667eea, #764ba2)', blur: 20 },
    globalStyle: 'glass',
    widgets: [
      { id: 'cpu-1', type: 'cpu', enabled: true, style: 'glass', color: '#f472b6', position: 'tl', size: 115 },
      { id: 'gpu-1', type: 'gpu', enabled: true, style: 'glass', color: '#a78bfa', position: 'tr', size: 115 },
      { id: 'ram-1', type: 'ram', enabled: true, style: 'glass', color: '#60a5fa', position: 'bl', size: 115 },
      { id: 'clock-1', type: 'clock', enabled: true, style: 'glass', color: '#f9a8d4', position: 'br', size: 115 }
    ]
  },
  {
    id: 'gradient-sunset',
    name: 'Gradient Sunset',
    orientation: 'portrait',
    background: { type: 'color', value: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)', blur: 0 },
    globalStyle: 'gradient',
    widgets: [
      { id: 'cpu-1', type: 'cpu', enabled: true, style: 'gradient', color: '#f97316', position: 'tl', size: 120 },
      { id: 'gpu-1', type: 'gpu', enabled: true, style: 'gradient', color: '#fb923c', position: 'tr', size: 120 },
      { id: 'ram-1', type: 'ram', enabled: true, style: 'gradient', color: '#fbbf24', position: 'bl', size: 120 },
      { id: 'clock-1', type: 'clock', enabled: true, style: 'gradient', color: '#f59e0b', position: 'br', size: 120 }
    ]
  },
  {
    id: 'modern-clean',
    name: 'Modern Clean',
    orientation: 'portrait',
    background: { type: 'color', value: '#19142d', blur: 0 },
    globalStyle: 'modern',
    widgets: [
      { id: 'cpu-1', type: 'cpu', enabled: true, style: 'modern', color: '#a855f7', position: 'tl', size: 120 },
      { id: 'gpu-1', type: 'gpu', enabled: true, style: 'modern', color: '#22c55e', position: 'tr', size: 120 },
      { id: 'ram-1', type: 'ram', enabled: true, style: 'modern', color: '#06b6d4', position: 'bl', size: 120 },
      { id: 'clock-1', type: 'clock', enabled: true, style: 'modern', color: '#3b82f6', position: 'br', size: 120 }
    ]
  },
  // Yatay (Landscape) Templateler
  {
    id: 'landscape-minimal',
    name: 'Yatay Minimal',
    orientation: 'landscape',
    background: { type: 'color', value: '#0d1117', blur: 0 },
    globalStyle: 'minimal',
    widgets: [
      { id: 'cpu-1', type: 'cpu', enabled: true, style: 'minimal', color: '#58a6ff', position: 'l', size: 95 },
      { id: 'gpu-1', type: 'gpu', enabled: true, style: 'minimal', color: '#3fb950', position: 'cl', size: 95 },
      { id: 'ram-1', type: 'ram', enabled: true, style: 'minimal', color: '#a371f7', position: 'cr', size: 95 },
      { id: 'clock-1', type: 'clock', enabled: true, style: 'minimal', color: '#f0883e', position: 'r', size: 95 }
    ]
  },
  {
    id: 'landscape-neon',
    name: 'Yatay Neon',
    orientation: 'landscape',
    background: { type: 'color', value: 'linear-gradient(90deg, #0a0a1a 0%, #1a0a2e 50%, #0a0a1a 100%)', blur: 0 },
    globalStyle: 'neon',
    widgets: [
      { id: 'cpu-1', type: 'cpu', enabled: true, style: 'neon', color: '#ff0080', position: 'l', size: 100 },
      { id: 'gpu-1', type: 'gpu', enabled: true, style: 'neon', color: '#00ff88', position: 'cl', size: 100 },
      { id: 'ram-1', type: 'ram', enabled: true, style: 'neon', color: '#00d4ff', position: 'cr', size: 100 },
      { id: 'clock-1', type: 'clock', enabled: true, style: 'neon', color: '#ffcc00', position: 'r', size: 100 }
    ]
  },
  {
    id: 'landscape-cyber',
    name: 'Yatay Cyber',
    orientation: 'landscape',
    background: { type: 'color', value: '#030712', blur: 0 },
    globalStyle: 'cyber',
    widgets: [
      { id: 'cpu-1', type: 'cpu', enabled: true, style: 'cyber', color: '#06b6d4', position: 'l', size: 95 },
      { id: 'gpu-1', type: 'gpu', enabled: true, style: 'cyber', color: '#22c55e', position: 'cl', size: 95 },
      { id: 'ram-1', type: 'ram', enabled: true, style: 'cyber', color: '#a855f7', position: 'cr', size: 95 },
      { id: 'clock-1', type: 'clock', enabled: true, style: 'cyber', color: '#f43f5e', position: 'r', size: 95 }
    ]
  },
  {
    id: 'landscape-glass',
    name: 'Yatay Glass',
    orientation: 'landscape',
    background: { type: 'color', value: 'linear-gradient(90deg, #4facfe 0%, #00f2fe 100%)', blur: 30 },
    globalStyle: 'glass',
    widgets: [
      { id: 'cpu-1', type: 'cpu', enabled: true, style: 'glass', color: '#ffffff', position: 'l', size: 95 },
      { id: 'gpu-1', type: 'gpu', enabled: true, style: 'glass', color: '#ffffff', position: 'cl', size: 95 },
      { id: 'ram-1', type: 'ram', enabled: true, style: 'glass', color: '#ffffff', position: 'cr', size: 95 },
      { id: 'clock-1', type: 'clock', enabled: true, style: 'glass', color: '#ffffff', position: 'r', size: 95 }
    ]
  },
  // Unified (Birleşik Liste) Template
  {
    id: 'unified-dark',
    name: 'Unified Dark',
    orientation: 'portrait',
    background: { type: 'color', value: '#0f0f23', blur: 0 },
    globalStyle: 'unified',
    widgets: [
      { id: 'cpu-1', type: 'cpu', enabled: true, style: 'unified', color: '#a855f7', position: 'mc', size: 100 },
      { id: 'gpu-1', type: 'gpu', enabled: true, style: 'unified', color: '#22c55e', position: 'mc', size: 100 },
      { id: 'ram-1', type: 'ram', enabled: true, style: 'unified', color: '#06b6d4', position: 'mc', size: 100 },
      { id: 'clock-1', type: 'clock', enabled: true, style: 'unified', color: '#f59e0b', position: 'mc', size: 100 }
    ]
  }
];

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
        // globalOpacity yoksa varsayılan 1 kullan
        return { 
          ...DEFAULT_SETTINGS, 
          ...data,
          globalOpacity: data.globalOpacity ?? DEFAULT_SETTINGS.globalOpacity ?? 1
        };
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

  setGlobalOpacity(opacity: number): void {
    const newOpacity = Math.max(0.1, Math.min(1, opacity));
    console.log('🔆 setGlobalOpacity:', opacity, '→', newOpacity);
    this.settings.globalOpacity = newOpacity;
    this.save();
  }

  setOrientation(orientation: OrientationType): void {
    this.settings.orientation = orientation;
    this.save();
  }

  applyTemplate(templateId: string): Settings | null {
    const template = TEMPLATES.find(t => t.id === templateId);
    if (!template) return null;
    
    this.settings.background = { ...template.background };
    this.settings.globalStyle = template.globalStyle;
    this.settings.orientation = template.orientation;
    // Widget'lara opacity yoksa 1 olarak ekle
    this.settings.widgets = template.widgets.map(w => ({ ...w, opacity: w.opacity ?? 1 }));
    this.save();
    return this.settings;
  }

  getTemplates(): TemplateConfig[] {
    return TEMPLATES;
  }
}
