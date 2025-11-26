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
}

interface BackgroundConfig {
  type: string;
  value: string;
  blur: number;
}

interface Settings {
  background: BackgroundConfig;
  globalStyle: string;
  widgets: WidgetConfig[];
  server: { port: number; refreshRate: number };
}

interface AppState {
  hardwareData: HardwareData | null;
  settings: Settings | null;
  clientCount: number;
  selectedWidget: string | null;
  currentPage: string;
  
  setHardwareData: (data: HardwareData) => void;
  setSettings: (settings: Settings) => void;
  setClientCount: (count: number) => void;
  setSelectedWidget: (id: string | null) => void;
  setCurrentPage: (page: string) => void;
  updateWidget: (id: string, props: Partial<WidgetConfig>) => void;
}

export const useStore = create<AppState>((set) => ({
  hardwareData: null,
  settings: null,
  clientCount: 0,
  selectedWidget: null,
  currentPage: 'dashboard',

  setHardwareData: (data) => set({ hardwareData: data }),
  setSettings: (settings) => set({ settings }),
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
