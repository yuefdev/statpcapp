import { create } from 'zustand';

interface HardwareData {
  cpu: { name: string; usage: number; temperature: number; cores: number[] };
  gpu: { name: string; usage: number; temperature: number; vramUsed: number; vramTotal: number };
  ram: { used: number; total: number; usagePercent: number };
}

interface WidgetConfig {
  id: string;
  type: 'cpu' | 'gpu' | 'ram' | 'clock';
  enabled: boolean;
  style: string;
  color: string;
  position: string;
  size: number;
  opacity?: number;
}

interface BackgroundConfig {
  type: string;
  value: string;
  blur: number;
}

type OrientationType = 'portrait' | 'landscape';

interface Settings {
  background: BackgroundConfig;
  globalStyle: string;
  globalOpacity: number;
  orientation: OrientationType;
  widgets: WidgetConfig[];
  server: { port: number; refreshRate: number };
}

interface TemplateConfig {
  id: string;
  name: string;
  thumbnail?: string;
  orientation: OrientationType;
  background: BackgroundConfig;
  globalStyle: string;
  globalOpacity?: number;
  widgets: WidgetConfig[];
}

interface AppState {
  hardwareData: HardwareData | null;
  settings: Settings | null;
  templates: TemplateConfig[];
  clientCount: number;
  selectedWidget: string | null;
  currentPage: string;
  
  setHardwareData: (data: HardwareData) => void;
  setSettings: (settings: Settings) => void;
  setTemplates: (templates: TemplateConfig[]) => void;
  setClientCount: (count: number) => void;
  setSelectedWidget: (id: string | null) => void;
  setCurrentPage: (page: string) => void;
  updateWidget: (id: string, props: Partial<WidgetConfig>) => void;
}

export const useStore = create<AppState>((set) => ({
  hardwareData: null,
  settings: null,
  templates: [],
  clientCount: 0,
  selectedWidget: null,
  currentPage: 'dashboard',

  setHardwareData: (data) => set({ hardwareData: data }),
  setSettings: (settings) => set({ settings }),
  setTemplates: (templates) => set({ templates }),
  setClientCount: (count) => set({ clientCount: count }),
  setSelectedWidget: (id) => set({ selectedWidget: id }),
  setCurrentPage: (page) => set({ currentPage: page }),
  
  updateWidget: (id, props) => set((state) => {
    if (!state.settings) return state;
    const widgets = state.settings.widgets.map(w => 
      w.id === id ? { ...w, ...props } : w
    );
    return { settings: { ...state.settings, widgets } };
  })
}));
