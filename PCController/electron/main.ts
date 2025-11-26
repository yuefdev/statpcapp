import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { HardwareMonitor } from './hardware';
import { WebSocketServer } from './server';
import { SettingsManager, Settings, BackgroundConfig, TEMPLATES } from './settings';
const ffmpeg = require('fluent-ffmpeg');
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');

// FFmpeg path ayarla
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

// Sıkıştırma durumu
let isCompressing = false;
let currentCompressingFile = '';

// Video önbellek - aynı dosya için tekrar sıkıştırma yapma
interface VideoCache {
  originalPath: string;
  originalSize: number;
  originalMtime: number;
  compressedPath: string; // Sıkıştırılmış video dosyası (kalıcı)
}

// Önbellek dosya yolu
const getCachePath = () => path.join(app.getPath('userData'), 'video-cache.json');
const getCompressedVideoDir = () => {
  const dir = path.join(app.getPath('userData'), 'compressed-videos');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
};

// Önbelleği dosyadan yükle
function loadVideoCache(): VideoCache | null {
  try {
    const cachePath = getCachePath();
    if (fs.existsSync(cachePath)) {
      const data = JSON.parse(fs.readFileSync(cachePath, 'utf-8'));
      // Sıkıştırılmış dosya hala var mı kontrol et
      if (data.compressedPath && fs.existsSync(data.compressedPath)) {
        console.log('📦 Video önbelleği dosyadan yüklendi');
        return data;
      }
    }
  } catch (e) {
    console.error('Önbellek yüklenemedi:', e);
  }
  return null;
}

// Önbelleği dosyaya kaydet
function saveVideoCache(cache: VideoCache): void {
  try {
    const cachePath = getCachePath();
    fs.writeFileSync(cachePath, JSON.stringify(cache, null, 2));
    console.log('💾 Video önbelleği dosyaya kaydedildi');
  } catch (e) {
    console.error('Önbellek kaydedilemedi:', e);
  }
}

let videoCache: VideoCache | null = loadVideoCache();

// Önbellekten video al - sıkıştırılmış dosyadan base64 oluştur
function getCachedVideo(filePath: string): string | null {
  if (!videoCache) return null;
  
  try {
    const stats = fs.statSync(filePath);
    // Aynı dosya, aynı boyut, aynı değişiklik zamanı
    if (
      videoCache.originalPath === filePath &&
      videoCache.originalSize === stats.size &&
      videoCache.originalMtime === stats.mtimeMs &&
      videoCache.compressedPath &&
      fs.existsSync(videoCache.compressedPath)
    ) {
      console.log('📦 Video önbellekten alınıyor...');
      const fileBuffer = fs.readFileSync(videoCache.compressedPath);
      const base64 = fileBuffer.toString('base64');
      const dataUri = `data:video/mp4;base64,${base64}`;
      console.log(`📦 Önbellekten yüklendi: ${(dataUri.length / 1024 / 1024).toFixed(2)} MB`);
      return dataUri;
    }
  } catch (e) {
    console.error('Önbellek okuma hatası:', e);
  }
  return null;
}

// Videoyu önbelleğe kaydet (sıkıştırılmış dosyayı kalıcı dizine taşı)
function cacheVideo(originalPath: string, compressedPath: string): void {
  try {
    const stats = fs.statSync(originalPath);
    
    // Sıkıştırılmış videoyu kalıcı dizine kopyala
    const fileName = `video_${Date.now()}.mp4`;
    const permanentPath = path.join(getCompressedVideoDir(), fileName);
    fs.copyFileSync(compressedPath, permanentPath);
    
    // Eski önbellekteki dosyayı sil
    if (videoCache?.compressedPath && fs.existsSync(videoCache.compressedPath)) {
      try {
        fs.unlinkSync(videoCache.compressedPath);
      } catch {}
    }
    
    videoCache = {
      originalPath,
      originalSize: stats.size,
      originalMtime: stats.mtimeMs,
      compressedPath: permanentPath
    };
    
    saveVideoCache(videoCache);
    console.log('💾 Video önbelleğe kaydedildi:', permanentPath);
  } catch (e) {
    console.error('Önbellek kaydetme hatası:', e);
  }
}

// GPU encoder'ı tespit et
async function detectGpuEncoder(): Promise<{ encoder: string; options: string[] }> {
  return new Promise((resolve) => {
    const { exec } = require('child_process');
    const ffmpegPath = ffmpegInstaller.path;
    
    exec(`"${ffmpegPath}" -encoders`, (error: any, stdout: string) => {
      // NVIDIA NVENC (en hızlı)
      if (stdout.includes('h264_nvenc')) {
        console.log('🎮 GPU: NVIDIA NVENC kullanılacak');
        resolve({
          encoder: 'h264_nvenc',
          options: ['-preset', 'p4', '-rc', 'vbr', '-cq', '28', '-b:v', '0']
        });
        return;
      }
      
      // AMD AMF
      if (stdout.includes('h264_amf')) {
        console.log('🎮 GPU: AMD AMF kullanılacak');
        resolve({
          encoder: 'h264_amf',
          options: ['-quality', 'speed', '-rc', 'vbr_latency', '-qp_i', '28', '-qp_p', '28']
        });
        return;
      }
      
      // Intel QuickSync
      if (stdout.includes('h264_qsv')) {
        console.log('🎮 GPU: Intel QuickSync kullanılacak');
        resolve({
          encoder: 'h264_qsv',
          options: ['-preset', 'faster', '-global_quality', '28']
        });
        return;
      }
      
      // CPU fallback
      console.log('💻 GPU encoder bulunamadı, CPU kullanılacak');
      resolve({
        encoder: 'libx264',
        options: ['-preset', 'fast', '-crf', '28']
      });
    });
  });
}

// Video sıkıştırma fonksiyonu - GPU hızlandırmalı, 1080p 30fps
async function compressVideo(inputPath: string): Promise<string> {
  const tempDir = app.getPath('temp');
  const outputPath = path.join(tempDir, `compressed_${Date.now()}.mp4`);
  
  // GPU encoder'ı tespit et
  const gpu = await detectGpuEncoder();
  
  return new Promise((resolve, reject) => {
    console.log(`🎬 Video sıkıştırılıyor (${gpu.encoder})...`);
    
    const command = ffmpeg(inputPath);
    command
      .outputOptions([
        '-vf', 'scale=-2:1080',      // 1080p (en-boy oranını koru)
        '-r', '30',                   // 30 fps
        '-c:v', gpu.encoder,          // GPU veya CPU encoder
        ...gpu.options,               // Encoder-specific options
        '-an',                        // Ses kaldır
        '-movflags', '+faststart',    // Hızlı başlatma
        '-y'                          // Üzerine yaz
      ])
      .output(outputPath)
      .on('start', () => {
        console.log(`🎬 FFmpeg başladı (${gpu.encoder})`);
      })
      .on('progress', (progress: { percent?: number }) => {
        if (progress.percent) {
          console.log(`🎬 Sıkıştırma: %${Math.round(progress.percent)}`);
        }
      })
      .on('end', () => {
        const stats = fs.statSync(outputPath);
        const sizeMB = stats.size / (1024 * 1024);
        console.log(`✅ Video sıkıştırıldı: ${sizeMB.toFixed(2)} MB`);
        resolve(outputPath);
      })
      .on('error', (err: Error) => {
        console.error('❌ Video sıkıştırma hatası:', err.message);
        // GPU başarısız olursa CPU ile dene
        if (gpu.encoder !== 'libx264') {
          console.log('🔄 GPU başarısız, CPU ile deneniyor...');
          compressVideoWithCpu(inputPath, outputPath).then(resolve).catch(reject);
        } else {
          reject(err);
        }
      })
      .run();
  });
}

// CPU fallback fonksiyonu
async function compressVideoWithCpu(inputPath: string, outputPath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .outputOptions([
        '-vf', 'scale=-2:1080',
        '-r', '30',
        '-c:v', 'libx264',
        '-preset', 'fast',
        '-crf', '28',
        '-an',
        '-movflags', '+faststart',
        '-y'
      ])
      .output(outputPath)
      .on('end', () => resolve(outputPath))
      .on('error', (err: Error) => reject(err))
      .run();
  });
}

class Application {
  private mainWindow: BrowserWindow | null = null;
  private hardwareMonitor: HardwareMonitor;
  private wsServer: WebSocketServer;
  private settings: SettingsManager;
  private updateInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.settings = new SettingsManager();
    this.hardwareMonitor = new HardwareMonitor();
    this.wsServer = new WebSocketServer(this.settings.get().server.port);
    
    this.setupApp();
    this.setupIPC();
  }

  private setupApp(): void {
    app.commandLine.appendSwitch('disable-renderer-backgrounding');
    app.commandLine.appendSwitch('disable-background-timer-throttling');

    app.whenReady().then(() => this.init());
    app.on('window-all-closed', () => this.cleanup());
  }

  private async init(): Promise<void> {
    this.createWindow();
    await this.hardwareMonitor.initialize();
    this.startUpdateLoop();
    
    this.wsServer.on('clientsChanged', (count: number) => {
      this.mainWindow?.webContents.send('clients', count);
    });

    this.wsServer.on('connection', async () => {
      const settings = this.settings.get();
      const bg = settings.background;
      
      // Bağlantıda da base64 gönder
      if (bg.type !== 'color' && bg.value && fs.existsSync(bg.value)) {
        try {
          // Önce önbellekten kontrol et
          if (bg.type === 'video') {
            const cachedDataUri = getCachedVideo(bg.value);
            if (cachedDataUri) {
              this.wsServer.broadcast('settings', {
                ...settings,
                background: { ...bg, value: cachedDataUri }
              });
              return;
            }
          }
          
          const stats = fs.statSync(bg.value);
          const fileSizeMB = stats.size / (1024 * 1024);
          
          let fileToSend = bg.value;
          
          // Video büyükse sıkıştır (eğer zaten sıkıştırma yoksa)
          if (bg.type === 'video' && fileSizeMB > 15 && !isCompressing) {
            console.log('🎬 Bağlantıda video sıkıştırılıyor...');
            isCompressing = true;
            try {
              fileToSend = await compressVideo(bg.value);
              isCompressing = false;
            } catch (e) {
              isCompressing = false;
              fileToSend = bg.value;
            }
          } else if (bg.type === 'video' && fileSizeMB > 15 && isCompressing) {
            console.log('⏳ Sıkıştırma zaten devam ediyor, bekleniyor...');
            this.wsServer.broadcast('settings', settings);
            return;
          }
          
          const finalStats = fs.statSync(fileToSend);
          if (finalStats.size / (1024 * 1024) > 50) {
            this.wsServer.broadcast('settings', settings);
            return;
          }
          
          const fileBuffer = fs.readFileSync(fileToSend);
          const base64 = fileBuffer.toString('base64');
          const ext = path.extname(fileToSend).toLowerCase().slice(1);
          
          const mimeTypes: Record<string, string> = {
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'gif': 'image/gif',
            'webp': 'image/webp',
            'mp4': 'video/mp4',
            'webm': 'video/webm'
          };
          const mimeType = mimeTypes[ext] || 'application/octet-stream';
          const dataUri = `data:${mimeType};base64,${base64}`;
          
          // Video ise önbelleğe kaydet
          if (bg.type === 'video') {
            cacheVideo(bg.value, fileToSend);
          }
          
          this.wsServer.broadcast('settings', {
            ...settings,
            background: { ...bg, value: dataUri }
          });
          
          // Geçici dosyayı sil
          if (fileToSend !== bg.value && fs.existsSync(fileToSend)) {
            fs.unlinkSync(fileToSend);
          }
        } catch (err) {
          this.wsServer.broadcast('settings', settings);
        }
      } else {
        this.wsServer.broadcast('settings', settings);
      }
    });
  }

  private createWindow(): void {
    this.mainWindow = new BrowserWindow({
      width: 1100,
      height: 700,
      minWidth: 900,
      minHeight: 600,
      frame: false,
      backgroundColor: '#0a0a1a',
      show: false,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
        webSecurity: false
      }
    });

    // Development modunda Vite dev server'a bağlan, production'da dist'ten yükle
    const isDev = process.env.NODE_ENV === 'development' || process.argv.includes('--dev');
    
    if (isDev) {
      this.mainWindow.loadURL('http://localhost:5173');
      // DevTools aç (opsiyonel, debug için)
      // this.mainWindow.webContents.openDevTools();
    } else {
      this.mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    }

    this.mainWindow.once('ready-to-show', () => {
      this.mainWindow?.show();
    });
  }

  private startUpdateLoop(): void {
    const update = async () => {
      if (this.mainWindow?.isMinimized()) return;
      
      const data = await this.hardwareMonitor.getData();
      
      this.mainWindow?.webContents.send('hardware-data', data);
      this.wsServer.broadcast('data', data);
    };

    update();
    this.updateInterval = setInterval(update, this.settings.get().server.refreshRate);
  }

  private setupIPC(): void {
    // Window controls
    ipcMain.on('window:minimize', () => this.mainWindow?.minimize());
    ipcMain.on('window:maximize', () => {
      if (this.mainWindow?.isMaximized()) {
        this.mainWindow.unmaximize();
      } else {
        this.mainWindow?.maximize();
      }
    });
    ipcMain.on('window:close', () => this.mainWindow?.close());

    // Settings
    ipcMain.handle('settings:get', () => this.settings.get());
    
    ipcMain.handle('settings:setBackground', async (_, bg: BackgroundConfig) => {
      // Sıkıştırma devam ediyorsa ve aynı dosya seçildiyse engelle
      if (isCompressing) {
        console.log('⏳ Sıkıştırma devam ediyor, lütfen bekleyin...');
        this.mainWindow?.webContents.send('compression-status', { 
          status: 'busy', 
          message: 'Sıkıştırma devam ediyor, lütfen bekleyin...' 
        });
        return this.settings.get();
      }
      
      this.settings.setBackground(bg);
      
      // Dosya ise base64'e çevir ve telefona gönder
      if (bg.type !== 'color' && bg.value && fs.existsSync(bg.value)) {
        try {
          // Önce önbellekten kontrol et (video için)
          if (bg.type === 'video') {
            const cachedDataUri = getCachedVideo(bg.value);
            if (cachedDataUri) {
              console.log('📦 Video önbellekten gönderiliyor');
              this.wsServer.broadcast('background', {
                ...bg,
                value: cachedDataUri
              });
              return this.settings.get();
            }
          }
          
          const stats = fs.statSync(bg.value);
          const fileSizeMB = stats.size / (1024 * 1024);
          
          console.log(`📁 Dosya: ${bg.value}, Boyut: ${fileSizeMB.toFixed(2)} MB, Tip: ${bg.type}`);
          
          let fileToSend = bg.value;
          
          // Video 15MB'dan büyükse sıkıştır
          if (bg.type === 'video' && fileSizeMB > 15) {
            console.log('🎬 Video büyük, sıkıştırılıyor (1080p 30fps)...');
            isCompressing = true;
            currentCompressingFile = bg.value;
            this.mainWindow?.webContents.send('compression-status', { status: 'compressing', progress: 0 });
            
            try {
              fileToSend = await compressVideo(bg.value);
              isCompressing = false;
              currentCompressingFile = '';
              this.mainWindow?.webContents.send('compression-status', { status: 'done' });
            } catch (compressErr) {
              console.error('Sıkıştırma başarısız:', compressErr);
              isCompressing = false;
              currentCompressingFile = '';
              this.mainWindow?.webContents.send('compression-status', { status: 'error' });
              // Sıkıştırma başarısız olursa orijinal dosyayı dene
              fileToSend = bg.value;
            }
          }
          
          // Sıkıştırılmış dosya boyutunu kontrol et
          const finalStats = fs.statSync(fileToSend);
          const finalSizeMB = finalStats.size / (1024 * 1024);
          
          if (finalSizeMB > 50) {
            console.log('⚠️ Dosya hala çok büyük (>50MB), gönderilemedi');
            this.wsServer.broadcast('background', { ...bg, value: null, error: 'Dosya çok büyük' });
            return this.settings.get();
          }
          
          const fileBuffer = fs.readFileSync(fileToSend);
          const base64 = fileBuffer.toString('base64');
          const ext = path.extname(fileToSend).toLowerCase().slice(1);
          
          // MIME type belirle
          const mimeTypes: Record<string, string> = {
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'gif': 'image/gif',
            'webp': 'image/webp',
            'mp4': 'video/mp4',
            'webm': 'video/webm'
          };
          const mimeType = mimeTypes[ext] || 'application/octet-stream';
          const dataUri = `data:${mimeType};base64,${base64}`;
          
          console.log(`✅ Base64 oluşturuldu: ${dataUri.substring(0, 50)}... (${(dataUri.length / 1024 / 1024).toFixed(2)} MB)`);
          
          // Video ise önbelleğe kaydet
          if (bg.type === 'video') {
            cacheVideo(bg.value, fileToSend);
          }
          
          // Telefona base64 olarak gönder
          this.wsServer.broadcast('background', {
            ...bg,
            value: dataUri
          });
          
          // Geçici sıkıştırılmış dosyayı sil (önbellekte base64 var artık)
          if (fileToSend !== bg.value && fs.existsSync(fileToSend)) {
            fs.unlinkSync(fileToSend);
          }
        } catch (err) {
          console.error('Failed to read background file:', err);
          this.wsServer.broadcast('background', bg);
        }
      } else {
        this.wsServer.broadcast('background', bg);
      }
      
      return this.settings.get();
    });

    ipcMain.handle('settings:updateWidget', (_, id, props) => {
      this.settings.updateWidget(id, props);
      this.wsServer.broadcast('settings', this.settings.get());
      return this.settings.get();
    });

    ipcMain.handle('settings:setGlobalStyle', (_, style) => {
      this.settings.setGlobalStyle(style);
      this.wsServer.broadcast('settings', this.settings.get());
      return this.settings.get();
    });

    ipcMain.handle('settings:setGlobalOpacity', (_, opacity) => {
      console.log('📥 IPC setGlobalOpacity:', opacity);
      this.settings.setGlobalOpacity(opacity);
      const newSettings = this.settings.get();
      console.log('📤 Yeni globalOpacity:', newSettings.globalOpacity);
      this.wsServer.broadcast('settings', newSettings);
      return newSettings;
    });

    ipcMain.handle('settings:setRefreshRate', (_, rate) => {
      this.settings.setRefreshRate(rate);
      if (this.updateInterval) {
        clearInterval(this.updateInterval);
        this.startUpdateLoop();
      }
      return this.settings.get();
    });

    // Template handlers
    ipcMain.handle('settings:getTemplates', () => {
      return TEMPLATES;
    });

    ipcMain.handle('settings:applyTemplate', (_, templateId: string) => {
      const settings = this.settings.applyTemplate(templateId);
      if (settings) {
        this.wsServer.broadcast('settings', settings);
      }
      return settings || this.settings.get();
    });

    ipcMain.handle('settings:setOrientation', (_, orientation: 'portrait' | 'landscape') => {
      this.settings.setOrientation(orientation);
      this.wsServer.broadcast('settings', this.settings.get());
      return this.settings.get();
    });

    // File dialog
    ipcMain.handle('dialog:selectFile', async () => {
      const result = await dialog.showOpenDialog(this.mainWindow!, {
        filters: [
          { name: 'Media', extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'mp4', 'webm'] }
        ]
      });
      return result.canceled ? null : result.filePaths[0];
    });

    // ADB
    ipcMain.handle('adb:setup', () => {
      const { exec } = require('child_process');
      const port = this.settings.get().server.port;
      exec(`adb reverse tcp:${port} tcp:${port}`);
      return true;
    });

    ipcMain.handle('adb:restartApp', () => {
      const { exec } = require('child_process');
      exec('adb shell am force-stop com.pcdashboard && adb shell am start -n com.pcdashboard/.MainActivity');
      return true;
    });
  }

  private cleanup(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    this.wsServer.close();
    app.quit();
  }
}

new Application();
