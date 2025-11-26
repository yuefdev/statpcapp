const { exec, spawn } = require('child_process');
const path = require('path');

class ADBManager {
  constructor() {
    this.adbPath = 'adb'; // PATH'te olduğunu varsayıyoruz
    this.isConnected = false;
    this.deviceId = null;
  }

  async checkAdb() {
    return new Promise((resolve) => {
      exec(`${this.adbPath} version`, (error, stdout) => {
        if (error) {
          console.log('⚠️ ADB bulunamadı. Lütfen Android SDK kurulu olduğundan emin olun.');
          resolve(false);
        } else {
          console.log('✅ ADB bulundu');
          resolve(true);
        }
      });
    });
  }

  async getDevices() {
    return new Promise((resolve) => {
      exec(`${this.adbPath} devices`, (error, stdout) => {
        if (error) {
          resolve([]);
          return;
        }

        const lines = stdout.split('\n').slice(1);
        const devices = lines
          .filter(line => line.trim() && line.includes('device'))
          .map(line => {
            const parts = line.split('\t');
            return {
              id: parts[0].trim(),
              status: parts[1]?.trim() || 'unknown',
            };
          });

        resolve(devices);
      });
    });
  }

  async connect(deviceId = null) {
    const devices = await this.getDevices();
    
    if (devices.length === 0) {
      console.log('⚠️ Bağlı Android cihaz bulunamadı');
      return false;
    }

    this.deviceId = deviceId || devices[0].id;
    this.isConnected = true;
    console.log(`📱 Cihaz bağlandı: ${this.deviceId}`);
    return true;
  }

  async forwardPort(localPort = 7700, remotePort = 7700) {
    if (!this.isConnected) {
      console.log('⚠️ Önce cihaza bağlanın');
      return false;
    }

    return new Promise((resolve) => {
      const cmd = this.deviceId 
        ? `${this.adbPath} -s ${this.deviceId} forward tcp:${localPort} tcp:${remotePort}`
        : `${this.adbPath} forward tcp:${localPort} tcp:${remotePort}`;

      exec(cmd, (error) => {
        if (error) {
          console.error(`❌ Port forwarding hatası: ${error.message}`);
          resolve(false);
        } else {
          console.log(`🔗 Port forwarding aktif: localhost:${localPort} → device:${remotePort}`);
          resolve(true);
        }
      });
    });
  }

  async reversePort(localPort = 7700, remotePort = 7700) {
    // Telefon PC'ye bağlanacak şekilde reverse proxy
    if (!this.isConnected) {
      console.log('⚠️ Önce cihaza bağlanın');
      return false;
    }

    return new Promise((resolve) => {
      const cmd = this.deviceId 
        ? `${this.adbPath} -s ${this.deviceId} reverse tcp:${remotePort} tcp:${localPort}`
        : `${this.adbPath} reverse tcp:${remotePort} tcp:${localPort}`;

      exec(cmd, (error) => {
        if (error) {
          console.error(`❌ Reverse port hatası: ${error.message}`);
          resolve(false);
        } else {
          console.log(`🔗 Reverse port aktif: device:${remotePort} → localhost:${localPort}`);
          resolve(true);
        }
      });
    });
  }

  async startApp(packageName = 'com.pcdashboard', activityName = '.MainActivity') {
    if (!this.isConnected) {
      return false;
    }

    return new Promise((resolve) => {
      const cmd = this.deviceId 
        ? `${this.adbPath} -s ${this.deviceId} shell am start -n ${packageName}/${activityName}`
        : `${this.adbPath} shell am start -n ${packageName}/${activityName}`;

      exec(cmd, (error) => {
        if (error) {
          console.error(`❌ Uygulama başlatma hatası: ${error.message}`);
          resolve(false);
        } else {
          console.log(`🚀 Uygulama başlatıldı: ${packageName}`);
          resolve(true);
        }
      });
    });
  }

  async installApk(apkPath) {
    if (!this.isConnected) {
      return false;
    }

    return new Promise((resolve) => {
      const cmd = this.deviceId 
        ? `${this.adbPath} -s ${this.deviceId} install -r "${apkPath}"`
        : `${this.adbPath} install -r "${apkPath}"`;

      console.log(`📦 APK yükleniyor: ${apkPath}`);
      
      exec(cmd, (error, stdout) => {
        if (error) {
          console.error(`❌ APK yükleme hatası: ${error.message}`);
          resolve(false);
        } else {
          console.log('✅ APK başarıyla yüklendi');
          resolve(true);
        }
      });
    });
  }

  async pushFile(localPath, remotePath) {
    if (!this.isConnected) {
      return false;
    }

    return new Promise((resolve) => {
      const cmd = this.deviceId 
        ? `${this.adbPath} -s ${this.deviceId} push "${localPath}" "${remotePath}"`
        : `${this.adbPath} push "${localPath}" "${remotePath}"`;

      exec(cmd, (error) => {
        if (error) {
          console.error(`❌ Dosya gönderme hatası: ${error.message}`);
          resolve(false);
        } else {
          console.log(`📤 Dosya gönderildi: ${remotePath}`);
          resolve(true);
        }
      });
    });
  }

  async getDeviceInfo() {
    if (!this.isConnected) {
      return null;
    }

    return new Promise((resolve) => {
      const cmd = this.deviceId 
        ? `${this.adbPath} -s ${this.deviceId} shell getprop`
        : `${this.adbPath} shell getprop`;

      exec(cmd, (error, stdout) => {
        if (error) {
          resolve(null);
          return;
        }

        const props = {};
        stdout.split('\n').forEach(line => {
          const match = line.match(/\[(.+?)\]: \[(.+?)\]/);
          if (match) {
            props[match[1]] = match[2];
          }
        });

        resolve({
          model: props['ro.product.model'] || 'Bilinmiyor',
          brand: props['ro.product.brand'] || 'Bilinmiyor',
          androidVersion: props['ro.build.version.release'] || 'Bilinmiyor',
          sdk: props['ro.build.version.sdk'] || 'Bilinmiyor',
        });
      });
    });
  }
}

module.exports = ADBManager;
