import { exec } from 'child_process';
import { promisify } from 'util';
import * as si from 'systeminformation';

const execAsync = promisify(exec);

export interface HardwareData {
  timestamp: number;
  cpu: {
    name: string;
    usage: number;
    temperature: number;
    cores: number[];
  };
  gpu: {
    name: string;
    usage: number;
    temperature: number;
    vramUsed: number;
    vramTotal: number;
    power: number;
  };
  ram: {
    used: number;
    total: number;
    usagePercent: number;
  };
}

export class HardwareMonitor {
  private hasNvidia = false;
  private cpuName = 'CPU';
  private gpuName = 'GPU';
  private lastData: HardwareData | null = null;
  private nvidiaCache: any = null;
  private nvidiaCacheTime = 0;

  async initialize(): Promise<void> {
    // Check NVIDIA
    try {
      const { stdout } = await execAsync('C:\\WINDOWS\\system32\\nvidia-smi.exe --query-gpu=name --format=csv,noheader');
      if (stdout && stdout.trim()) {
        this.hasNvidia = true;
        this.gpuName = stdout.trim();
        console.log('✅ NVIDIA GPU detected:', this.gpuName);
      }
    } catch (e: any) {
      console.log('ℹ️ No NVIDIA GPU, using fallback:', e?.message || 'unknown error');
    }

    // Get CPU name
    try {
      const cpu = await si.cpu();
      this.cpuName = cpu.brand || 'CPU';
    } catch {}

    // Get GPU name
    if (!this.hasNvidia) {
      try {
        const graphics = await si.graphics();
        this.gpuName = graphics.controllers[0]?.model || 'GPU';
      } catch {}
    }
  }

  async getData(): Promise<HardwareData> {
    try {
      const [load, mem, temp] = await Promise.all([
        si.currentLoad(),
        si.mem(),
        si.cpuTemperature().catch(() => ({ main: 0 }))
      ]);

      const gpu = this.hasNvidia 
        ? await this.getNvidiaData() 
        : this.getFallbackGpu();

      this.lastData = {
        timestamp: Date.now(),
        cpu: {
          name: this.cpuName,
          usage: Math.round(load.currentLoad),
          temperature: Math.round(temp.main || 0),
          cores: load.cpus?.map(c => Math.round(c.load)) || []
        },
        gpu,
        ram: {
          used: Math.round(mem.used / (1024 * 1024)),
          total: Math.round(mem.total / (1024 * 1024)),
          usagePercent: Math.round((mem.used / mem.total) * 100)
        }
      };

      return this.lastData;
    } catch (error) {
      return this.lastData || this.getEmptyData();
    }
  }

  private async getNvidiaData(): Promise<HardwareData['gpu']> {
    const now = Date.now();
    if (this.nvidiaCache && now - this.nvidiaCacheTime < 500) {
      return this.nvidiaCache;
    }

    try {
      const { stdout } = await execAsync(
        'C:\\WINDOWS\\system32\\nvidia-smi.exe --query-gpu=name,utilization.gpu,temperature.gpu,memory.used,memory.total,power.draw --format=csv,noheader,nounits',
        { timeout: 2000 }
      );

      const [name, usage, temp, vramUsed, vramTotal, power] = stdout.trim().split(', ');
      
      this.gpuName = name || 'NVIDIA GPU';
      this.nvidiaCache = {
        name: this.gpuName,
        usage: parseInt(usage) || 0,
        temperature: parseInt(temp) || 0,
        vramUsed: parseInt(vramUsed) || 0,
        vramTotal: parseInt(vramTotal) || 0,
        power: parseFloat(power) || 0
      };
      this.nvidiaCacheTime = now;

      return this.nvidiaCache;
    } catch {
      return this.nvidiaCache || this.getFallbackGpu();
    }
  }

  private getFallbackGpu(): HardwareData['gpu'] {
    return {
      name: this.gpuName,
      usage: 0,
      temperature: 0,
      vramUsed: 0,
      vramTotal: 0,
      power: 0
    };
  }

  private getEmptyData(): HardwareData {
    return {
      timestamp: Date.now(),
      cpu: { name: 'CPU', usage: 0, temperature: 0, cores: [] },
      gpu: this.getFallbackGpu(),
      ram: { used: 0, total: 0, usagePercent: 0 }
    };
  }
}
