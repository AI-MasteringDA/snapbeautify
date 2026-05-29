import {
  app,
  BrowserWindow,
  Tray,
  Menu,
  globalShortcut,
  ipcMain,
  clipboard,
  nativeImage,
  screen,
  desktopCapturer,
  dialog,
} from 'electron';
import path from 'node:path';
import fs from 'node:fs';
import started from 'electron-squirrel-startup';
import { updateElectronApp } from 'update-electron-app';

if (started) app.quit();

// Auto-update from GitHub Releases (only runs in packaged/production builds).
// Checks every hour; downloads in background; installs on next launch.
updateElectronApp({
  updateInterval: '1 hour',
  notifyUser: true,
});

let mainWindow: BrowserWindow | null = null;
let overlayWindow: BrowserWindow | null = null;
let tray: Tray | null = null;

// Stored full screenshot for overlay to retrieve
let pendingScreenshotDataURL: string | null = null;

// Promise resolver for region selection
let regionResolve: ((bounds: { x: number; y: number; w: number; h: number } | null) => void) | null = null;

// ─── Main Window ────────────────────────────────────────────────────────────

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 750,
    minWidth: 900,
    minHeight: 600,
    frame: false,
    titleBarStyle: 'hidden',
    titleBarOverlay: false,
    backgroundColor: '#0f0f23',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
    );
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.on('close', (e) => {
    // Hide to tray instead of closing
    e.preventDefault();
    mainWindow?.hide();
  });
};

// ─── Overlay Window ──────────────────────────────────────────────────────────

const createOverlayWindow = () => {
  const { bounds } = screen.getPrimaryDisplay();

  overlayWindow = new BrowserWindow({
    x: bounds.x,
    y: bounds.y,
    width: bounds.width,
    height: bounds.height,
    frame: false,
    transparent: false,
    backgroundColor: '#000000',
    alwaysOnTop: true,
    fullscreen: true,
    skipTaskbar: true,
    resizable: false,
    movable: false,
    webPreferences: {
      preload: path.join(__dirname, 'overlay-preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (OVERLAY_WINDOW_VITE_DEV_SERVER_URL) {
    // Must load /overlay.html explicitly — the root serves index.html (main window)
    overlayWindow.loadURL(`${OVERLAY_WINDOW_VITE_DEV_SERVER_URL}/overlay.html`);
  } else {
    overlayWindow.loadFile(
      path.join(__dirname, `../renderer/${OVERLAY_WINDOW_VITE_NAME}/overlay.html`),
    );
  }

  overlayWindow.on('closed', () => {
    overlayWindow = null;
  });
};

// ─── Tray ────────────────────────────────────────────────────────────────────

const createTray = () => {
  const iconPath = path.join(__dirname, '../../resources/tray-icon.png');
  const icon = fs.existsSync(iconPath)
    ? nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 })
    : nativeImage.createEmpty();

  tray = new Tray(icon);
  tray.setToolTip('SnapBeautify');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Open SnapBeautify',
      click: () => {
        mainWindow?.show();
        mainWindow?.focus();
      },
    },
    {
      label: 'Capture Region (Ctrl+Shift+4)',
      click: () => triggerCaptureRegion(),
    },
    {
      label: 'Capture Screen (Ctrl+Shift+6)',
      click: () => triggerCaptureScreen(),
    },
    { type: 'separator' },
    { label: 'Quit', click: () => app.exit(0) },
  ]);

  tray.setContextMenu(contextMenu);
  tray.on('double-click', () => {
    mainWindow?.show();
    mainWindow?.focus();
  });
};

// ─── Screenshot helpers ───────────────────────────────────────────────────────

const takeFullScreenshot = async (): Promise<string | null> => {
  const { size } = screen.getPrimaryDisplay();
  const sources = await desktopCapturer.getSources({
    types: ['screen'],
    thumbnailSize: { width: size.width, height: size.height },
  });
  return sources.length > 0 ? sources[0].thumbnail.toDataURL() : null;
};

const cropImage = (
  dataURL: string,
  bounds: { x: number; y: number; w: number; h: number },
): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      const img = nativeImage.createFromDataURL(dataURL);
      const cropped = img.crop({ x: bounds.x, y: bounds.y, width: bounds.w, height: bounds.h });
      resolve(cropped.toDataURL());
    } catch (err) {
      reject(err);
    }
  });
};

// ─── Trigger helpers (used by global shortcuts & tray) ───────────────────────

const triggerCaptureRegion = async () => {
  if (!mainWindow) return;

  mainWindow.hide();
  await new Promise((r) => setTimeout(r, 300));

  try {
    // Take full screenshot FIRST (main window is now hidden)
    const dataURL = await takeFullScreenshot();
    if (!dataURL) {
      mainWindow.show();
      return;
    }
    pendingScreenshotDataURL = dataURL;

    // Create overlay if needed
    if (!overlayWindow || overlayWindow.isDestroyed()) {
      createOverlayWindow();
    }

    // Wait for overlay to load
    if (overlayWindow!.webContents.isLoading()) {
      await new Promise<void>((resolve) => {
        overlayWindow!.webContents.once('did-finish-load', resolve);
      });
    }

    // Show overlay — OverlayApp will fetch the screenshot via IPC and show it as background
    overlayWindow!.show();
    overlayWindow!.focus();

    // Wait for user to drag-select a region (or ESC to cancel)
    const bounds = await new Promise<{ x: number; y: number; w: number; h: number } | null>((resolve) => {
      regionResolve = resolve;
    });

    if (overlayWindow && !overlayWindow.isDestroyed()) {
      overlayWindow.hide();
    }

    mainWindow.show();
    mainWindow.focus();

    if (bounds && bounds.w > 5 && bounds.h > 5) {
      const cropped = await cropImage(dataURL, bounds);
      mainWindow.webContents.send('screenshot-ready', cropped);
    }
  } catch (err) {
    console.error('Capture region failed:', err);
    mainWindow.show();
  }
};

const triggerCaptureScreen = async () => {
  if (!mainWindow) return;

  mainWindow.hide();
  await new Promise((r) => setTimeout(r, 300));

  try {
    const dataURL = await takeFullScreenshot();
    mainWindow.show();
    mainWindow.focus();
    if (dataURL) {
      mainWindow.webContents.send('screenshot-ready', dataURL);
    }
  } catch (err) {
    console.error('Capture screen failed:', err);
    mainWindow.show();
  }
};

const triggerCaptureWindow = async () => {
  // Treat same as capture-region for now
  await triggerCaptureRegion();
};

// ─── IPC Handlers ─────────────────────────────────────────────────────────────

ipcMain.handle('capture-region', async () => {
  await triggerCaptureRegion();
  return null;
});

ipcMain.handle('capture-window', async () => {
  await triggerCaptureWindow();
  return null;
});

ipcMain.handle('capture-screen', async () => {
  await triggerCaptureScreen();
  return null;
});

ipcMain.handle('overlay-get-screenshot', () => {
  return pendingScreenshotDataURL;
});

ipcMain.handle('overlay-region-selected', async (_event, bounds: { x: number; y: number; w: number; h: number }) => {
  if (regionResolve) {
    regionResolve(bounds);
    regionResolve = null;
  }
  return null;
});

ipcMain.handle('overlay-cancel', () => {
  if (regionResolve) {
    regionResolve(null);
    regionResolve = null;
  }
  if (overlayWindow && !overlayWindow.isDestroyed()) {
    overlayWindow.hide();
  }
  mainWindow?.show();
  mainWindow?.focus();
  return null;
});

ipcMain.handle('browse-file', async () => {
  if (!mainWindow) return null;

  const { filePaths, canceled } = await dialog.showOpenDialog(mainWindow, {
    title: 'Open Screenshot',
    filters: [
      { name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp'] },
    ],
    properties: ['openFile'],
  });

  if (canceled || filePaths.length === 0) return null;

  const filePath = filePaths[0];
  const data = fs.readFileSync(filePath);
  const ext = path.extname(filePath).toLowerCase().replace('.', '');
  const mimeType = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : `image/${ext}`;
  return `data:${mimeType};base64,${data.toString('base64')}`;
});

ipcMain.handle('save-image', async (_event, dataURL: string) => {
  if (!mainWindow) return false;

  const { filePath, canceled } = await dialog.showSaveDialog(mainWindow, {
    defaultPath: `snapbeautify-${Date.now()}.png`,
    filters: [{ name: 'PNG Image', extensions: ['png'] }],
  });

  if (canceled || !filePath) return false;

  const base64 = dataURL.replace(/^data:image\/\w+;base64,/, '');
  fs.writeFileSync(filePath, Buffer.from(base64, 'base64'));
  return true;
});

ipcMain.handle('copy-to-clipboard', (_event, dataURL: string) => {
  const img = nativeImage.createFromDataURL(dataURL);
  clipboard.writeImage(img);
  return true;
});

ipcMain.on('window-minimize', () => mainWindow?.minimize());

ipcMain.on('window-maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow?.maximize();
  }
});

ipcMain.on('window-close', () => mainWindow?.hide());

// ─── App lifecycle ─────────────────────────────────────────────────────────────

app.on('ready', () => {
  createWindow();
  createTray();

  globalShortcut.register('Ctrl+Shift+4', () => triggerCaptureRegion());
  globalShortcut.register('Ctrl+Shift+5', () => triggerCaptureWindow());
  globalShortcut.register('Ctrl+Shift+6', () => triggerCaptureScreen());
});

app.on('window-all-closed', () => {
  // Keep running in tray — do not quit
});

app.on('activate', () => {
  if (!mainWindow) createWindow();
  else {
    mainWindow.show();
    mainWindow.focus();
  }
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

// Allow app to quit properly from tray menu
app.on('before-quit', () => {
  if (mainWindow) {
    mainWindow.removeAllListeners('close');
  }
});
