# PC Dashboard - Copilot Instructions

## Proje Genel Bakış
Bu proje, eski bir Android telefonu PC dashboard/kiosk terminaline dönüştüren 3 bileşenli bir sistemdir:

| Bileşen | Teknoloji | Amaç |
|---------|-----------|------|
| `PCController/` | Electron + Vite + React + TypeScript | PC'de çalışan masaüstü kontrol uygulaması |
| `PCDashboard/` | React Native 0.82 | Android telefonda çalışan dashboard uygulaması |
| `PCServer/` | Node.js (eski, kullanılmıyor) | İlk versiyon sunucu - PCController bunu değiştirdi |

## Mimari & Veri Akışı
```
PCController (Electron) ──WebSocket:7700──> PCDashboard (React Native)
     │                                              │
     ├─ systeminformation lib                       ├─ useSocket.ts hook
     ├─ electron/main.ts → hardware.ts              ├─ Widget bileşenleri
     └─ src/ → Vite React UI                        └─ DynamicBackground.tsx
```

**Kritik:** Ayarlar ve donanım verisi WebSocket üzerinden JSON olarak iletilir. Mesaj tipleri: `data`, `settings`, `background`, `widget_update`, `command`

## Geliştirme Komutları
```bash
# PCController - Hot reload aktif
cd PCController && npm run dev

# PCDashboard - Metro bundler
cd PCDashboard && npm start
# Ayrı terminal:
npx react-native run-android

# ADB port forwarding (telefon USB bağlıyken)
adb reverse tcp:7700 tcp:7700
```

## Kritik Dosya Konumları

### PCController (Electron)
- `electron/main.ts` - Ana process, IPC handlers, window oluşturma
- `electron/hardware.ts` - systeminformation ile donanım verisi toplama
- `electron/server.ts` - WebSocket sunucusu
- `electron/settings.ts` - Ayar yönetimi ve tipler (SettingsManager, BackgroundConfig)
- `src/store/useStore.ts` - Zustand state management
- `src/pages/Background.tsx` - Arka plan ayarları UI

### PCDashboard (React Native)
- `src/hooks/useSocket.ts` - WebSocket bağlantısı ve state yönetimi
- `src/components/DynamicBackground.tsx` - Arka plan render (video/image/color)
- `src/components/widgets/` - CPU, GPU, RAM, Clock widget'ları
- `src/config/server.ts` - Sunucu bağlantı ayarları
- `src/types/index.ts` - Paylaşılan TypeScript tipleri

## Önemli Kalıplar

### Arka Plan Medya Aktarımı
Dosya yolları (C:\...) telefona base64 data URI olarak gönderilmeli:
```typescript
// electron/main.ts - setBackground handler'da
const base64 = fs.readFileSync(filePath).toString('base64');
const dataUri = `data:${mimeType};base64,${base64}`;
this.wsServer.broadcast('background', { ...bg, value: dataUri });
```

### Widget Stil Sistemi
Stiller: `modern`, `glass`, `neon`, `minimal`, `gradient`, `cyber`
- Global stil: `settings.globalStyle` tüm widget'lara uygulanır
- Bireysel stil: Her widget kendi `style` property'si ile override edebilir

### Electron Dev/Prod Modu
```typescript
// electron/main.ts
const isDev = process.argv.includes('--dev');
if (isDev) {
  this.mainWindow.loadURL('http://localhost:5173'); // Vite dev server
} else {
  this.mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
}
```

## Yaygın Sorunlar
1. **Hot reload çalışmıyor**: `--dev` flag'i ile başlatıldığından emin ol
2. **Telefon bağlanmıyor**: `adb reverse tcp:7700 tcp:7700` çalıştır
3. **Medya dosyaları görünmüyor**: Base64 dönüşümü ve MIME type kontrolü yap
4. **Port çakışması**: Vite 5173, WebSocket 7700 kullanır
SAKIN UYGULAMALARI TEMRİNALDEN BAŞLATMAYIN KULLAINCIYA SÖYLEYİN
## Test Etme
- React Native: Jest ile unit testler (`__tests__/`)
- Manuel test: Her iki uygulama çalışırken widget görünümü ve veri akışı kontrol et
