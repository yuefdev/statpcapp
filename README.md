# PC Dashboard - Kiosk Modu Telefon Kontrol Sistemi

Eski bir Android telefonu (Samsung Note 3 gibi) USB bağlantılı PC dashboard/kiosk terminaline dönüştüren sistem.

## 📂 Proje Yapısı

```
not/
├── PCDashboard/          # React Native Mobil Uygulama
│   ├── src/
│   │   ├── components/   # UI Bileşenleri
│   │   │   ├── widgets/  # Dashboard Widget'ları
│   │   │   │   ├── CpuWidget.tsx
│   │   │   │   ├── GpuWidget.tsx
│   │   │   │   ├── RamWidget.tsx
│   │   │   │   ├── DiskWidget.tsx
│   │   │   │   ├── NetworkWidget.tsx
│   │   │   │   ├── TemperatureWidget.tsx
│   │   │   │   ├── FanWidget.tsx
│   │   │   │   └── ClockWidget.tsx
│   │   │   ├── DynamicBackground.tsx
│   │   │   ├── ConnectionStatus.tsx
│   │   │   └── WidgetGrid.tsx
│   │   ├── hooks/        # React Hooks
│   │   │   ├── useSocket.ts          # WebSocket bağlantısı
│   │   │   └── useAmoledProtection.ts # AMOLED koruma
│   │   ├── screens/      # Ekranlar
│   │   │   └── DashboardScreen.tsx
│   │   ├── config/       # Varsayılan ayarlar
│   │   └── types/        # TypeScript tipleri
│   └── android/          # Android native konfigürasyonu
│
└── PCServer/             # Node.js PC Sunucu Uygulaması
    ├── src/
    │   ├── HardwareMonitor.js   # Donanım bilgisi toplama
    │   ├── WebSocketServer.js   # WebSocket sunucusu
    │   ├── SettingsManager.js   # Ayar yönetimi
    │   └── ADBManager.js        # ADB komutları
    ├── index.js                 # Ana sunucu
    └── settings.json            # Ayar dosyası (otomatik oluşur)
```

## 🚀 Kurulum ve Kullanım

### 1. PC Sunucusu

```bash
cd PCServer
npm install
npm start
```

### 2. React Native Uygulaması

```bash
cd PCDashboard
npm install

# Android build
npx react-native run-android
```

### 3. ADB Bağlantısı

Telefonu USB ile bağladıktan sonra:

```bash
# Port forwarding (telefon localhost:7700'e bağlanabilsin)
adb reverse tcp:7700 tcp:7700

# Uygulamayı başlat
adb shell am start -n com.pcdashboard/.MainActivity
```

## ⚙️ PC'den Kontrol

Sunucu çalışırken konsol komutları:

| Komut | Açıklama |
|-------|----------|
| `status` | Bağlantı durumunu göster |
| `settings` | Mevcut ayarları göster |
| `bg color #1a1a2e` | Arka plan rengi değiştir |
| `bg image C:\wallpaper.jpg` | Arka plan resmi değiştir |
| `bg video C:\video.mp4` | Arka plan videosu değiştir |
| `widget cpu-1 enabled false` | Widget'ı devre dışı bırak |
| `amoled on/off` | AMOLED korumayı aç/kapa |
| `refresh` | Ayarları yeniden gönder |
| `restart` | Telefon uygulamasını yeniden başlat |
| `quit` | Sunucudan çık |

## 📱 Özellikler

### Widget'lar
- **CPU**: Kullanım, sıcaklık, frekans, güç
- **GPU**: Kullanım, VRAM, sıcaklık, core/memory clock
- **RAM**: Kullanım, toplam/kullanılan
- **Disk**: Her disk için kullanım, okuma/yazma hızı
- **Network**: İndirme/yükleme hızı, ping
- **Sıcaklık**: CPU ve GPU sıcaklıkları
- **Fan**: Fan RPM değerleri
- **Saat**: Tarih ve saat

### Arka Plan
- Düz renk
- Resim (JPG, PNG)
- Video (MP4)
- GIF

### AMOLED Koruma
- **Pixel Shift**: Her 10 dakikada piksel kayması
- **Shake**: Ekran titremesi
- **Blackout**: 2-3 saniye ekran karartma

### Kiosk Modu
- Fullscreen immersive mode
- Navigation bar gizli
- Status bar gizli
- Geri tuşu devre dışı
- Boot'ta otomatik başlatma
- Launcher olarak ayarlanabilir

## 🔧 LineageOS ROM Hazırlığı (İleride)

1. LineageOS 14.1 (en stabil) indir
2. APK'yı `/system/priv-app/PCDashboard/` içine koy
3. `build.prop` düzenle:
   ```
   qemu.hw.mainkeys=1
   ```
4. Gereksiz uygulamaları kaldır
5. TWRP ile flash

## 📝 Notlar

- Telefon USB ile sürekli bağlı kalacak
- Pil şişmesini önlemek için ACC modülü ile şarj limiti (%80) ayarla
- ADB debugging her zaman açık olmalı
- Ekran timeout: Sonsuz

## 🛠️ Geliştirme

```bash
# React Native Metro bundler
cd PCDashboard
npx react-native start

# PC Sunucu (watch mode)
cd PCServer
npm run dev
```

## 📜 Lisans

MIT License
