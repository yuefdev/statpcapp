const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const WebSocket = require('ws');
const HardwareMonitor = require('./src/HardwareMonitor');
const { exec } = require('child_process');

// Performans optimizasyonları
app.commandLine.appendSwitch('disable-renderer-backgrounding');
app.commandLine.appendSwitch('disable-background-timer-throttling');

let mainWindow, wss, hardwareMonitor;
let connectedClients = new Set();
let settings = null;
let updateInterval = null;
let lastData = null;
let isUpdating = false;

const SETTINGS_PATH = path.join(__dirname, 'settings.json');

const DEFAULT_SETTINGS = {
  background: { type: 'color', value: '#0a0a1a' },
  widgets: [
    { id: 'cpu-1', type: 'cpu', enabled: true, style: 'modern' },
    { id: 'gpu-1', type: 'gpu', enabled: true, style: 'modern' },
    { id: 'ram-1', type: 'ram', enabled: true, style: 'modern' },
    { id: 'clock-1', type: 'clock', enabled: true, style: 'modern' },
  ],
  server: { port: 7700, refreshRate: 1000 },
};

function loadSettings() {
  try {
    if (fs.existsSync(SETTINGS_PATH)) {
      settings = { ...DEFAULT_SETTINGS, ...JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf8')) };
    } else {
      settings = { ...DEFAULT_SETTINGS };
      fs.writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2));
    }
  } catch {
    settings = { ...DEFAULT_SETTINGS };
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 650,
    minWidth: 700,
    minHeight: 500,
    frame: false,
    backgroundColor: '#0a0a1a',
    show: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  mainWindow.loadFile('index.html');
  mainWindow.once('ready-to-show', () => mainWindow.show());
}

async function startServer() {
  hardwareMonitor = new HardwareMonitor();
  await hardwareMonitor.initialize();

  wss = new WebSocket.Server({ port: settings.server.port });
  console.log(`Server running on port ${settings.server.port}`);

  wss.on('connection', (ws) => {
    connectedClients.add(ws);
    ws.send(JSON.stringify({ type: 'settings', payload: settings, timestamp: Date.now() }));
    mainWindow?.webContents.send('clients', connectedClients.size);

    ws.on('close', () => {
      connectedClients.delete(ws);
      mainWindow?.webContents.send('clients', connectedClients.size);
    });
  });

  // Async hardware update - non-blocking
  const updateHardware = async () => {
    if (isUpdating) return;
    isUpdating = true;
    
    try {
      await hardwareMonitor.update();
      lastData = hardwareMonitor.getSystemData();
      
      // UI update only if window exists and is not minimized
      if (mainWindow && !mainWindow.isMinimized() && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('data', lastData);
      }
      
      // Send to connected clients
      if (connectedClients.size > 0) {
        const msg = JSON.stringify({ type: 'data', payload: lastData, timestamp: Date.now() });
        connectedClients.forEach(c => {
          if (c.readyState === 1) c.send(msg);
        });
      }
    } catch (e) {
      console.error('Update error:', e.message);
    }
    
    isUpdating = false;
  };

  // Initial update
  await updateHardware();
  
  // Periodic updates with setInterval (won't stack)
  updateInterval = setInterval(updateHardware, settings.server.refreshRate);
}

// IPC
ipcMain.handle('get-settings', () => settings);
ipcMain.handle('get-clients', () => connectedClients.size);

ipcMain.handle('set-bg', (_, bg) => {
  settings.background = bg;
  fs.writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2));
  const msg = JSON.stringify({ type: 'background', payload: bg, timestamp: Date.now() });
  connectedClients.forEach(c => c.readyState === 1 && c.send(msg));
  return bg;
});

ipcMain.handle('toggle-widget', (_, id, enabled) => {
  const w = settings.widgets.find(x => x.id === id);
  if (w) {
    w.enabled = enabled;
    fs.writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2));
    const msg = JSON.stringify({ type: 'settings', payload: settings, timestamp: Date.now() });
    connectedClients.forEach(c => c.readyState === 1 && c.send(msg));
  }
  return settings.widgets;
});

ipcMain.handle('set-style', (_, id, style) => {
  const w = settings.widgets.find(x => x.id === id);
  if (w) {
    w.style = style;
    fs.writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2));
    const msg = JSON.stringify({ type: 'settings', payload: settings, timestamp: Date.now() });
    connectedClients.forEach(c => c.readyState === 1 && c.send(msg));
  }
  return settings.widgets;
});

ipcMain.handle('select-file', async () => {
  const r = await dialog.showOpenDialog(mainWindow, {
    filters: [{ name: 'Media', extensions: ['jpg', 'png', 'gif', 'mp4', 'webm'] }]
  });
  return r.canceled ? null : r.filePaths[0];
});

ipcMain.handle('adb-setup', () => {
  exec(`adb reverse tcp:${settings.server.port} tcp:${settings.server.port}`);
  return true;
});

ipcMain.on('win-min', () => mainWindow?.minimize());
ipcMain.on('win-max', () => mainWindow?.isMaximized() ? mainWindow.unmaximize() : mainWindow.maximize());
ipcMain.on('win-close', () => mainWindow?.close());

app.whenReady().then(async () => {
  loadSettings();
  createWindow();
  await startServer();
  exec(`adb reverse tcp:${settings.server.port} tcp:${settings.server.port}`);
});

app.on('window-all-closed', () => {
  clearInterval(updateInterval);
  wss?.close();
  app.quit();
});
