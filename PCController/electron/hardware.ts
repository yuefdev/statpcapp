import { exec } from 'child_process';
import { promisify } from 'util';
import * as si from 'systeminformation';
import * as os from 'os';

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
  private hasAmdGpu = false;
  private isLinux = os.platform() === 'linux';
  private cpuName = 'CPU';
  private gpuName = 'GPU';
  private lastData: HardwareData | null = null;
  private nvidiaCache: any = null;
  private nvidiaCacheTime = 0;

  async initialize(): Promise<void> {
    // Check NVIDIA (Linux & Windows)
    try {
      const nvidiaSmiPath = this.isLinux ? 'nvidia-smi' : 'C:\\WINDOWS\\system32\\nvidia-smi.exe';
      const { stdout } = await execAsync(`${nvidiaSmiPath} --query-gpu=name --format=csv,noheader`);
      if (stdout && stdout.trim()) {
        this.hasNvidia = true;
        this.gpuName = stdout.trim();
        console.log('✅ NVIDIA GPU detected:', this.gpuName);
      }
    } catch (e: any) {
      console.log('ℹ️ No NVIDIA GPU, checking AMD...', e?.message || 'unknown error');
    }

    // Check AMD GPU on Linux
    if (this.isLinux && !this.hasNvidia) {
      try {
        // Check for AMD GPU via /sys/class/drm
        const { stdout } = await execAsync('ls /sys/class/drm/card0/device/hwmon/*/temp1_input 2>/dev/null | head -1');
        if (stdout.trim()) {
          this.hasAmdGpu = true;
          console.log('✅ AMD GPU detected');
        }
      } catch {}

      // Try to get AMD GPU name
      if (this.hasAmdGpu) {
        try {
          const { stdout } = await execAsync('cat /sys/class/drm/card0/device/product_name 2>/dev/null || lspci | grep -i vga | head -1 | cut -d: -f3');
          this.gpuName = stdout.trim() || 'AMD GPU';
        } catch {}
      }
    }

    // Get CPU name
    try {
      const cpu = await si.cpu();
      this.cpuName = cpu.brand || 'CPU';
    } catch {}

    // Get GPU name from systeminformation as fallback
    if (!this.hasNvidia && !this.hasAmdGpu) {
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
        this.getCpuTemperature()
      ]);

      let gpu: HardwareData['gpu'];
      if (this.hasNvidia) {
        gpu = await this.getNvidiaData();
      } else if (this.hasAmdGpu && this.isLinux) {
        gpu = await this.getAmdGpuData();
      } else {
        gpu = await this.getSystemInfoGpu();
      }

      this.lastData = {
        timestamp: Date.now(),
        cpu: {
          name: this.cpuName,
          usage: Math.round(load.currentLoad),
          temperature: Math.round(temp),
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
      console.error('Hardware data error:', error);
      return this.lastData || this.getEmptyData();
    }
  }

  private async getCpuTemperature(): Promise<number> {
    try {
      const temp = await si.cpuTemperature();
      if (temp.main && temp.main > 0) {
        return temp.main;
      }

      // Linux fallback: read from sensors
      if (this.isLinux) {
        try {
          // Try hwmon
          const { stdout } = await execAsync('cat /sys/class/hwmon/hwmon*/temp1_input 2>/dev/null | head -1');
          if (stdout.trim()) {
            return parseInt(stdout.trim()) / 1000;
          }
        } catch {}

        try {
          // Try thermal zones
          const { stdout } = await execAsync('cat /sys/class/thermal/thermal_zone*/temp 2>/dev/null | head -1');
          if (stdout.trim()) {
            return parseInt(stdout.trim()) / 1000;
          }
        } catch {}
      }

      return 0;
    } catch {
      return 0;
    }
  }

  private async getNvidiaData(): Promise<HardwareData['gpu']> {
    const now = Date.now();
    if (this.nvidiaCache && now - this.nvidiaCacheTime < 500) {
      return this.nvidiaCache;
    }

    try {
      const nvidiaSmiPath = this.isLinux ? 'nvidia-smi' : 'C:\\WINDOWS\\system32\\nvidia-smi.exe';
      const { stdout } = await execAsync(
        `${nvidiaSmiPath} --query-gpu=name,utilization.gpu,temperature.gpu,memory.used,memory.total,power.draw --format=csv,noheader,nounits`,
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

  private async getAmdGpuData(): Promise<HardwareData['gpu']> {
    let usage = 0;
    let temperature = 0;
    let vramUsed = 0;
    let vramTotal = 0;
    let power = 0;

    try {
      // GPU Usage - try gpu_busy_percent
      try {
        const { stdout } = await execAsync('cat /sys/class/drm/card0/device/gpu_busy_percent 2>/dev/null');
        usage = parseInt(stdout.trim()) || 0;
      } catch {}

      // Temperature
      try {
        const { stdout } = await execAsync('cat /sys/class/drm/card0/device/hwmon/hwmon*/temp1_input 2>/dev/null | head -1');
        temperature = Math.round(parseInt(stdout.trim()) / 1000) || 0;
      } catch {}

      // VRAM Used
      try {
        const { stdout } = await execAsync('cat /sys/class/drm/card0/device/mem_info_vram_used 2>/dev/null');
        vramUsed = Math.round(parseInt(stdout.trim()) / (1024 * 1024)) || 0;
      } catch {}

      // VRAM Total
      try {
        const { stdout } = await execAsync('cat /sys/class/drm/card0/device/mem_info_vram_total 2>/dev/null');
        vramTotal = Math.round(parseInt(stdout.trim()) / (1024 * 1024)) || 0;
      } catch {}

      // Power
      try {
        const { stdout } = await execAsync('cat /sys/class/drm/card0/device/hwmon/hwmon*/power1_average 2>/dev/null | head -1');
        power = Math.round(parseInt(stdout.trim()) / 1000000) || 0; // microwatts to watts
      } catch {}

    } catch (e) {
      console.error('AMD GPU data error:', e);
    }

    return {
      name: this.gpuName,
      usage,
      temperature,
      vramUsed,
      vramTotal,
      power
    };
  }

  private async getSystemInfoGpu(): Promise<HardwareData['gpu']> {
    try {
      const graphics = await si.graphics();
      const controller = graphics.controllers[0];
      
      if (controller) {
        return {
          name: controller.model || this.gpuName,
          usage: controller.utilizationGpu || 0,
          temperature: controller.temperatureGpu || 0,
          vramUsed: controller.memoryUsed || 0,
          vramTotal: controller.vram || 0,
          power: 0
        };
      }
    } catch {}
    
    return this.getFallbackGpu();
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
