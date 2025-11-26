/**
 * PC Dashboard Server
 * 
 * Bu sunucu:
 * 1. Bilgisayar donanım bilgilerini toplar
 * 2. WebSocket üzerinden telefona gönderir
 * 3. Ayarları yönetir ve telefona iletir
 * 4. ADB üzerinden telefon ile iletişim kurar
 */

const HardwareMonitor = require('./src/HardwareMonitor');
const WebSocketServer = require('./src/WebSocketServer');
const SettingsManager = require('./src/SettingsManager');
const ADBManager = require('./src/ADBManager');
const readline = require('readline');
const fs = require('fs');
const path = require('path');

class PCDashboardServer {
  constructor() {
    this.hardwareMonitor = new HardwareMonitor();
    this.settingsManager = new SettingsManager();
    this.adbManager = new ADBManager();
    this.wsServer = null;
    this.updateInterval = null;
    this.isRunning = false;
  }

  async start() {
    console.log('╔════════════════════════════════════════════╗');
    console.log('║       PC Dashboard Server v1.0.0           ║');
    console.log('║   Telefon Kiosk Kontrol Sistemi            ║');
    console.log('╚════════════════════════════════════════════╝');
    console.log('');

    // Ayarları yükle
    const settings = this.settingsManager.load();
    const port = settings.server?.port || 7700;
    const refreshRate = settings.server?.refreshRate || 1000;

    // ADB kontrol
    const adbAvailable = await this.adbManager.checkAdb();
    if (adbAvailable) {
      await this.adbManager.connect();
      
      // Reverse port forwarding - telefon localhost:7700'e bağlanabilsin
      if (settings.server?.adbAutoForward) {
        await this.adbManager.reversePort(port, port);
      }

      const deviceInfo = await this.adbManager.getDeviceInfo();
      if (deviceInfo) {
        console.log(`📱 Cihaz: ${deviceInfo.brand} ${deviceInfo.model} (Android ${deviceInfo.androidVersion})`);
      }
    }

    // Hardware monitor başlat
    await this.hardwareMonitor.initialize();
    console.log('💻 Donanım izleme başlatıldı');

    // WebSocket sunucu başlat
    this.wsServer = new WebSocketServer(port);
    this.wsServer.start();

    // İstemci bağlandığında ayarları gönder
    this.wsServer.on('clientConnected', (client) => {
      // Ayarları gönder
      this.wsServer.sendToClient(client, {
        type: 'settings',
        payload: this.settingsManager.getPhoneSettings(),
        timestamp: Date.now(),
      });
    });

    // Gelen mesajları işle
    this.wsServer.on('message', (message, client) => {
      this.handleMessage(message, client);
    });

    // Periyodik güncelleme
    this.updateInterval = setInterval(async () => {
      await this.hardwareMonitor.update();
      
      if (this.wsServer.getClientCount() > 0) {
        this.wsServer.broadcast({
          type: 'data',
          payload: this.hardwareMonitor.getSystemData(),
          timestamp: Date.now(),
        });
      }
    }, refreshRate);

    this.isRunning = true;

    // Konsol komutları
    this.startConsole();
  }

  handleMessage(message, client) {
    switch (message.type) {
      case 'status':
        if (message.payload?.status === 'connected') {
          console.log('✅ Telefon bağlandı ve hazır');
        }
        break;
      
      case 'ack':
        // Onay mesajı, loglama gerekirse
        break;

      case 'error':
        console.error('❌ Telefon hatası:', message.payload);
        break;
    }
  }

  startConsole() {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    console.log('\n📝 Komutlar:');
    console.log('  status     - Bağlantı durumu');
    console.log('  settings   - Ayarları göster');
    console.log('  bg <type> <value> - Arka plan değiştir (color/image/video)');
    console.log('  widget <id> <key> <value> - Widget ayarı değiştir');
    console.log('  amoled <on/off> - AMOLED koruma aç/kapa');
    console.log('  refresh    - Ayarları yeniden gönder');
    console.log('  restart    - Telefon uygulamasını yeniden başlat');
    console.log('  quit       - Çıkış\n');

    const processCommand = (input) => {
      const args = input.trim().split(' ');
      const cmd = args[0].toLowerCase();

      switch (cmd) {
        case 'status':
          console.log(`\n📊 Durum:`);
          console.log(`  Bağlı cihaz: ${this.wsServer.getClientCount()}`);
          console.log(`  ADB: ${this.adbManager.isConnected ? 'Bağlı' : 'Bağlı değil'}`);
          console.log('');
          break;

        case 'settings':
          console.log('\n⚙️ Mevcut Ayarlar:');
          console.log(JSON.stringify(this.settingsManager.getPhoneSettings(), null, 2));
          console.log('');
          break;

        case 'bg':
          if (args.length >= 3) {
            const type = args[1];
            const value = args.slice(2).join(' ');
            
            if (['color', 'image', 'video', 'gif'].includes(type)) {
              const bgConfig = this.settingsManager.setBackground({
                ...this.settingsManager.get('background'),
                type,
                value,
              });
              
              this.wsServer.broadcast({
                type: 'background',
                payload: bgConfig,
                timestamp: Date.now(),
              });
              
              console.log(`✅ Arka plan değiştirildi: ${type} = ${value}`);
            } else {
              console.log('❌ Geçersiz arka plan tipi. (color/image/video/gif)');
            }
          } else {
            console.log('Kullanım: bg <type> <value>');
            console.log('Örnek: bg color #1a1a2e');
            console.log('Örnek: bg image C:\\wallpaper.jpg');
          }
          break;

        case 'widget':
          if (args.length >= 4) {
            const widgetId = args[1];
            const key = args[2];
            const value = args.slice(3).join(' ');
            
            let parsedValue = value;
            if (value === 'true') parsedValue = true;
            else if (value === 'false') parsedValue = false;
            else if (!isNaN(value)) parsedValue = Number(value);
            
            const updated = this.settingsManager.updateWidget(widgetId, { [key]: parsedValue });
            
            if (updated) {
              this.wsServer.broadcast({
                type: 'widget_update',
                payload: { id: widgetId, [key]: parsedValue },
                timestamp: Date.now(),
              });
              console.log(`✅ Widget güncellendi: ${widgetId}.${key} = ${parsedValue}`);
            } else {
              console.log(`❌ Widget bulunamadı: ${widgetId}`);
            }
          } else {
            console.log('Kullanım: widget <id> <key> <value>');
            console.log('Örnek: widget cpu-1 enabled false');
          }
          break;

        case 'amoled':
          if (args[1]) {
            const enabled = args[1].toLowerCase() === 'on';
            this.settingsManager.update({
              amoledProtection: {
                ...this.settingsManager.get('amoledProtection'),
                enabled,
              },
            });
            
            this.wsServer.broadcast({
              type: 'settings',
              payload: this.settingsManager.getPhoneSettings(),
              timestamp: Date.now(),
            });
            
            console.log(`✅ AMOLED koruma: ${enabled ? 'Açık' : 'Kapalı'}`);
          }
          break;

        case 'refresh':
          this.wsServer.broadcast({
            type: 'settings',
            payload: this.settingsManager.getPhoneSettings(),
            timestamp: Date.now(),
          });
          console.log('✅ Ayarlar yeniden gönderildi');
          break;

        case 'restart':
          this.adbManager.startApp();
          break;

        case 'quit':
        case 'exit':
          this.stop();
          rl.close();
          process.exit(0);
          break;

        case '':
          break;

        default:
          console.log(`❌ Bilinmeyen komut: ${cmd}`);
      }

      rl.question('> ', processCommand);
    };

    rl.question('> ', processCommand);
  }

  stop() {
    console.log('\n🛑 Sunucu durduruluyor...');
    
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    
    if (this.wsServer) {
      this.wsServer.stop();
    }
    
    this.isRunning = false;
    console.log('👋 Güle güle!');
  }
}

// Ana uygulama
const server = new PCDashboardServer();
server.start().catch(console.error);

// Graceful shutdown
process.on('SIGINT', () => {
  server.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  server.stop();
  process.exit(0);
});
