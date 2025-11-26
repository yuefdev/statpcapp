const fs = require('fs');
const path = require('path');

// Varsayılan ayarlar
const DEFAULT_SETTINGS = {
  theme: {
    mode: 'dark',
    primaryColor: '#3b82f6',
    secondaryColor: '#1e40af',
    backgroundColor: '#0f172a',
    textColor: '#ffffff',
    accentColor: '#3b82f6',
  },
  background: {
    type: 'color',
    value: '#0f172a',
    blur: 0,
    opacity: 1,
    fit: 'cover',
  },
  amoledProtection: {
    enabled: true,
    mode: 'pixelShift',
    interval: 10,
    duration: 2,
    shakeIntensity: 5,
  },
  widgets: [
    {
      id: 'cpu-1',
      type: 'cpu',
      enabled: true,
      position: { x: 0, y: 0, width: 2, height: 2 },
      style: {
        backgroundColor: 'rgba(20, 20, 30, 0.85)',
        borderColor: '#a855f7',
        borderWidth: 1,
        borderRadius: 16,
        opacity: 1,
        textColor: '#ffffff',
        titleColor: '#94a3b8',
        accentColor: '#a855f7',
        fontSize: 14,
        showTitle: true,
        showIcon: true,
        showGraph: true,
        graphColor: '#a855f7',
        graphStyle: 'area',
      },
      refreshRate: 1000,
    },
    {
      id: 'gpu-1',
      type: 'gpu',
      enabled: true,
      position: { x: 2, y: 0, width: 2, height: 2 },
      style: {
        backgroundColor: 'rgba(20, 20, 30, 0.85)',
        borderColor: '#22c55e',
        borderWidth: 1,
        borderRadius: 16,
        opacity: 1,
        textColor: '#ffffff',
        titleColor: '#94a3b8',
        accentColor: '#22c55e',
        fontSize: 14,
        showTitle: true,
        showIcon: true,
        showGraph: true,
        graphColor: '#22c55e',
        graphStyle: 'area',
      },
      refreshRate: 1000,
    },
    {
      id: 'ram-1',
      type: 'ram',
      enabled: true,
      position: { x: 0, y: 2, width: 4, height: 2 },
      style: {
        backgroundColor: 'rgba(20, 20, 30, 0.85)',
        borderColor: '#06b6d4',
        borderWidth: 1,
        borderRadius: 16,
        opacity: 1,
        textColor: '#ffffff',
        titleColor: '#94a3b8',
        accentColor: '#06b6d4',
        fontSize: 14,
        showTitle: true,
        showIcon: true,
        showGraph: true,
        graphColor: '#06b6d4',
        graphStyle: 'area',
      },
      refreshRate: 1000,
    },
    {
      id: 'clock-1',
      type: 'clock',
      enabled: true,
      position: { x: 0, y: 4, width: 4, height: 2 },
      style: {
        backgroundColor: 'rgba(20, 20, 30, 0.85)',
        borderColor: '#3b82f6',
        borderWidth: 1,
        borderRadius: 16,
        opacity: 1,
        textColor: '#ffffff',
        titleColor: '#94a3b8',
        accentColor: '#3b82f6',
        fontSize: 32,
        showTitle: true,
        showIcon: true,
        showGraph: false,
        graphColor: '#3b82f6',
        graphStyle: 'area',
      },
      refreshRate: 1000,
    },
  ],
  screenAlwaysOn: true,
  hideStatusBar: true,
  hideNavigationBar: true,
  animationsEnabled: true,
  animationSpeed: 1.0,
  server: {
    port: 7700,
    refreshRate: 1000,
    adbAutoForward: true,
  },
};

class SettingsManager {
  constructor() {
    this.settingsPath = path.join(process.cwd(), 'settings.json');
    this.settings = null;
  }

  load() {
    try {
      if (fs.existsSync(this.settingsPath)) {
        const data = fs.readFileSync(this.settingsPath, 'utf8');
        this.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
        console.log('✅ Ayarlar yüklendi');
      } else {
        this.settings = { ...DEFAULT_SETTINGS };
        this.save();
        console.log('📝 Varsayılan ayarlar oluşturuldu');
      }
    } catch (error) {
      console.error('❌ Ayar yükleme hatası:', error.message);
      this.settings = { ...DEFAULT_SETTINGS };
    }
    return this.settings;
  }

  save() {
    try {
      fs.writeFileSync(this.settingsPath, JSON.stringify(this.settings, null, 2));
      console.log('💾 Ayarlar kaydedildi');
    } catch (error) {
      console.error('❌ Ayar kaydetme hatası:', error.message);
    }
  }

  get(key) {
    return key ? this.settings[key] : this.settings;
  }

  set(key, value) {
    this.settings[key] = value;
    this.save();
    return this.settings;
  }

  update(updates) {
    this.settings = { ...this.settings, ...updates };
    this.save();
    return this.settings;
  }

  updateWidget(widgetId, updates) {
    const index = this.settings.widgets.findIndex(w => w.id === widgetId);
    if (index !== -1) {
      this.settings.widgets[index] = { ...this.settings.widgets[index], ...updates };
      this.save();
    }
    return this.settings.widgets[index];
  }

  addWidget(widget) {
    this.settings.widgets.push(widget);
    this.save();
    return widget;
  }

  removeWidget(widgetId) {
    this.settings.widgets = this.settings.widgets.filter(w => w.id !== widgetId);
    this.save();
  }

  setBackground(backgroundConfig) {
    this.settings.background = backgroundConfig;
    this.save();
    return this.settings.background;
  }

  getPhoneSettings() {
    // Telefona gönderilecek ayarlar (server ayarları hariç)
    const { server, ...phoneSettings } = this.settings;
    return phoneSettings;
  }
}

module.exports = SettingsManager;
