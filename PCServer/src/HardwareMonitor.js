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
    try {
      const { stdout } = await execPromise(
        'C:\\WINDOWS\\system32\\nvidia-smi.exe --query-gpu=name,utilization.gpu,utilization.memory,temperature.gpu,memory.used,memory.total,power.draw,clocks.gr,clocks.mem --format=csv,noheader,nounits'
      );
      
      const values = stdout.trim().split(', ');
      
      return {
        name: values[0] || 'NVIDIA GPU',
        usage: parseInt(values[1]) || 0,
        memoryUsage: parseInt(values[2]) || 0,
        temperature: parseInt(values[3]) || 0,
        vramUsed: parseInt(values[4]) || 0,
        vramTotal: parseInt(values[5]) || 0,
        power: parseFloat(values[6]) || 0,
        coreClock: parseInt(values[7]) || 0,
        memoryClock: parseInt(values[8]) || 0,
        fanSpeed: 0, // Ayrı sorgu gerekiyor
      };
    } catch (error) {
      console.error('NVIDIA GPU verisi alınamadı:', error.message);
      return null;
    }
  }

  async update() {
    try {
      // Paralel olarak tüm verileri al
      const [
        cpu,
        cpuTemp,
        currentLoad,
        mem,
        graphics,
        diskLayout,
        fsSize,
        networkInterfaces,
        networkStats,
      ] = await Promise.all([
        si.cpu(),
        si.cpuTemperature(),
        si.currentLoad(),
        si.mem(),
        si.graphics(),
        si.diskLayout(),
        si.fsSize(),
        si.networkInterfaces(),
        si.networkStats(),
      ]);

      // CPU verileri
      this.cpuData = {
        name: cpu.brand || `${cpu.manufacturer} ${cpu.brand}`,
        usage: currentLoad.currentLoad || 0,
        temperature: cpuTemp.main || 0,
        frequency: cpu.speed * 1000, // MHz
        cores: currentLoad.cpus.map((core, index) => ({
          id: index,
          usage: core.load || 0,
          frequency: cpu.speed * 1000,
          temperature: cpuTemp.cores?.[index] || cpuTemp.main || 0,
        })),
        power: cpuTemp.max || 0, // Tahmini
      };

      // GPU verileri - NVIDIA varsa nvidia-smi kullan
      if (this.hasNvidia) {
        const nvidiaData = await this.getNvidiaGpuData();
        if (nvidiaData) {
          this.gpuData = nvidiaData;
        }
      } else {
        // Fallback: systeminformation
        const primaryGpu = graphics.controllers?.[0] || {};
        this.gpuData = {
          name: primaryGpu.model || 'Bilinmiyor',
          usage: primaryGpu.utilizationGpu || 0,
          temperature: primaryGpu.temperatureGpu || 0,
          vramUsed: primaryGpu.memoryUsed || 0,
          vramTotal: primaryGpu.memoryTotal || primaryGpu.vram || 0,
          fanSpeed: primaryGpu.fanSpeed || 0,
          coreClock: primaryGpu.clockCore || 0,
          memoryClock: primaryGpu.clockMemory || 0,
          power: primaryGpu.powerDraw || 0,
        };
      }

      // RAM verileri
      this.memData = {
        used: Math.round(mem.used / (1024 * 1024)), // MB
        total: Math.round(mem.total / (1024 * 1024)), // MB
        usagePercent: (mem.used / mem.total) * 100,
        frequency: 0, // systeminformation ile alınamıyor
      };

      // Disk verileri
      this.diskData = fsSize.map((disk, index) => ({
        name: disk.mount || disk.fs || `Disk ${index}`,
        used: Math.round(disk.used / (1024 * 1024)), // MB
        total: Math.round(disk.size / (1024 * 1024)), // MB
        usagePercent: disk.use || 0,
        readSpeed: 0,
        writeSpeed: 0,
        temperature: diskLayout[index]?.temperature || 0,
      }));

      // Network verileri
      const stats = networkStats[0] || {};
      const downloadSpeed = this.lastNetworkStats 
        ? (stats.rx_bytes - this.lastNetworkStats.rx_bytes) / 1024 // KB/s
        : 0;
      const uploadSpeed = this.lastNetworkStats
        ? (stats.tx_bytes - this.lastNetworkStats.tx_bytes) / 1024 // KB/s
        : 0;

      this.networkData = {
        name: stats.iface || 'Network',
        downloadSpeed: Math.max(0, downloadSpeed),
        uploadSpeed: Math.max(0, uploadSpeed),
        totalDownload: Math.round(stats.rx_bytes / 1024), // KB
        totalUpload: Math.round(stats.tx_bytes / 1024), // KB
        ping: 0, // Ayrıca ölçülmeli
      };

      this.lastNetworkStats = { ...stats };

      // Fan verileri (sistem bağımlı)
      this.fanData = [];

    } catch (error) {
      console.error('Hardware bilgisi alınırken hata:', error.message);
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
