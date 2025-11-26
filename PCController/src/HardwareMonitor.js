const si = require('systeminformation');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

class HardwareMonitor {
  constructor() {
    this.cpuData = null;
    this.gpuData = null;
    this.memData = null;
    this.diskData = null;
    this.networkData = null;
    this.networkStats = null;
    this.lastNetworkStats = null;
    this.fanData = null;
    this.hasNvidia = false;
    this.nvidiaCache = null;
    this.nvidiaCacheTime = 0;
    this.nvidiaCacheDuration = 500; // 500ms cache
  }

  async initialize() {
    // NVIDIA GPU var mı kontrol et
    try {
      await execPromise('C:\\WINDOWS\\system32\\nvidia-smi.exe');
      this.hasNvidia = true;
      console.log('✅ NVIDIA GPU algılandı');
    } catch {
      this.hasNvidia = false;
      console.log('ℹ️ NVIDIA GPU bulunamadı, systeminformation kullanılacak');
    }
    
    // İlk veriyi al
    await this.update();
  }

  async getNvidiaGpuData() {
    // Cache kontrolü - çok sık sorgu yapmayı engelle
    const now = Date.now();
    if (this.nvidiaCache && (now - this.nvidiaCacheTime) < this.nvidiaCacheDuration) {
      return this.nvidiaCache;
    }
    
    try {
      const { stdout } = await execPromise(
        'C:\\WINDOWS\\system32\\nvidia-smi.exe --query-gpu=name,utilization.gpu,utilization.memory,temperature.gpu,memory.used,memory.total,power.draw,clocks.gr,clocks.mem --format=csv,noheader,nounits',
        { timeout: 2000 } // 2 saniye timeout
      );
      
      const values = stdout.trim().split(', ');
      
      this.nvidiaCache = {
        name: values[0] || 'NVIDIA GPU',
        usage: parseInt(values[1]) || 0,
        memoryUsage: parseInt(values[2]) || 0,
        temperature: parseInt(values[3]) || 0,
        vramUsed: parseInt(values[4]) || 0,
        vramTotal: parseInt(values[5]) || 0,
        power: parseFloat(values[6]) || 0,
        coreClock: parseInt(values[7]) || 0,
        memoryClock: parseInt(values[8]) || 0,
        fanSpeed: 0,
      };
      this.nvidiaCacheTime = now;
      
      return this.nvidiaCache;
    } catch (error) {
      // Hata durumunda eski cache'i döndür
      return this.nvidiaCache || null;
    }
  }

  async update() {
    try {
      // Sadece gerekli verileri al - paralel
      const [currentLoad, mem, cpuTemp] = await Promise.all([
        si.currentLoad(),
        si.mem(),
        si.cpuTemperature().catch(() => ({ main: 0 })),
      ]);

      // CPU verileri (basitleştirilmiş)
      this.cpuData = {
        name: this.cpuData?.name || 'CPU',
        usage: currentLoad.currentLoad || 0,
        temperature: cpuTemp.main || 0,
        frequency: 0,
        cores: [],
        power: 0,
      };
      
      // İlk seferde CPU adını al
      if (!this.cpuData.name || this.cpuData.name === 'CPU') {
        si.cpu().then(cpu => {
          this.cpuData.name = cpu.brand || 'CPU';
        }).catch(() => {});
      }

      // GPU verileri - NVIDIA varsa nvidia-smi kullan
      if (this.hasNvidia) {
        const nvidiaData = await this.getNvidiaGpuData();
        if (nvidiaData) {
          this.gpuData = nvidiaData;
        }
      } else if (!this.gpuData) {
        // Sadece ilk seferde GPU bilgisini al
        try {
          const graphics = await si.graphics();
          const primaryGpu = graphics.controllers?.[0] || {};
          this.gpuData = {
            name: primaryGpu.model || 'GPU',
            usage: 0,
            temperature: 0,
            vramUsed: 0,
            vramTotal: primaryGpu.vram || 0,
            fanSpeed: 0,
            coreClock: 0,
            memoryClock: 0,
            power: 0,
          };
        } catch {
          this.gpuData = this.getEmptyGpuData();
        }
      }

      // RAM verileri
      this.memData = {
        used: Math.round(mem.used / (1024 * 1024)),
        total: Math.round(mem.total / (1024 * 1024)),
        usagePercent: (mem.used / mem.total) * 100,
        frequency: 0,
      };

    } catch (error) {
      console.error('Hardware update error:', error.message);
    }
  }

  getSystemData() {
    return {
      timestamp: Date.now(),
      cpu: this.cpuData || this.getEmptyCpuData(),
      gpu: this.gpuData || this.getEmptyGpuData(),
      ram: this.memData || this.getEmptyRamData(),
      disks: this.diskData || [],
      network: this.networkData || this.getEmptyNetworkData(),
      fans: this.fanData || [],
    };
  }

  getEmptyCpuData() {
    return {
      name: 'Bilinmiyor',
      usage: 0,
      temperature: 0,
      frequency: 0,
      cores: [],
      power: 0,
    };
  }

  getEmptyGpuData() {
    return {
      name: 'Bilinmiyor',
      usage: 0,
      temperature: 0,
      vramUsed: 0,
      vramTotal: 0,
      fanSpeed: 0,
      coreClock: 0,
      memoryClock: 0,
      power: 0,
    };
  }

  getEmptyRamData() {
    return {
      used: 0,
      total: 0,
      usagePercent: 0,
      frequency: 0,
    };
  }

  getEmptyNetworkData() {
    return {
      name: 'Bilinmiyor',
      downloadSpeed: 0,
      uploadSpeed: 0,
      totalDownload: 0,
      totalUpload: 0,
      ping: 0,
    };
  }
}

module.exports = HardwareMonitor;
