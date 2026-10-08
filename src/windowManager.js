const { BrowserWindow, screen, ipcMain, app } = require('electron');
const path = require('path');
const qrcode = require('qrcode');

let qrWindow;
let overlayWindow;

function createWindows(port, url) {
    const displays = screen.getAllDisplays();
    const primaryDisplay = screen.getPrimaryDisplay();
    
    // 1. Setup Overlay Window
    overlayWindow = new BrowserWindow({
        x: primaryDisplay.bounds.x,
        y: primaryDisplay.bounds.y,
        width: primaryDisplay.bounds.width,
        height: primaryDisplay.bounds.height,
        transparent: true,
        frame: false,
        alwaysOnTop: true,
        hasShadow: false,
        focusable: false,
        skipTaskbar: true,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    overlayWindow.setAlwaysOnTop(true, 'screen-saver');
    overlayWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    overlayWindow.setIgnoreMouseEvents(true, { forward: true });
    overlayWindow.loadFile(path.join(__dirname, 'overlay.html'));

    // 2. Setup QR / Settings Window
    qrWindow = new BrowserWindow({
        width: 400,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });
    
    qrWindow.loadFile(path.join(__dirname, 'qr.html'));
    
    qrWindow.webContents.on('did-finish-load', () => {
        if (url) {
            notifyTunnelReady(url);
        }
    });

    // Close entire application when QR window is closed
    qrWindow.on('closed', () => {
        app.quit();
    });

    return { qrWindow, overlayWindow };
}

function notifyTunnelReady(url) {
    const displays = screen.getAllDisplays();
    const primaryDisplay = screen.getPrimaryDisplay();
    
    qrcode.toDataURL(url, (err, qrUrl) => {
        if (err) console.error(err);
        if (qrWindow && !qrWindow.isDestroyed()) {
            qrWindow.webContents.send('setup-data', {
                url,
                qrUrl,
                displays: displays.map(d => ({
                    id: d.id,
                    bounds: d.bounds,
                    isPrimary: d.id === primaryDisplay.id
                }))
            });
        }
    });
}

function notifyDeviceConnected() {
    if (qrWindow && !qrWindow.isDestroyed()) {
        qrWindow.webContents.send('device-connected');
        // Shrink window height
        qrWindow.setSize(400, 350);
    }
    if (overlayWindow && !overlayWindow.isDestroyed()) {
        overlayWindow.webContents.send('device-connected');
    }
}

function notifyDeviceDisconnected() {
    if (qrWindow && !qrWindow.isDestroyed()) {
        qrWindow.webContents.send('device-disconnected');
        // Expand window back to original size
        qrWindow.setSize(400, 600);
    }
    if (overlayWindow && !overlayWindow.isDestroyed()) {
        overlayWindow.webContents.send('device-disconnected');
    }
}

function notifyLaserMove(data) {
    if (overlayWindow && !overlayWindow.isDestroyed()) {
        overlayWindow.webContents.send('laser-move', data);
    }
}

function notifyLaserSetNormalized(data) {
    if (overlayWindow && !overlayWindow.isDestroyed()) {
        overlayWindow.webContents.send('laser-set-normalized', data);
    }
}

function notifyModeChange(data) {
    if (overlayWindow && !overlayWindow.isDestroyed()) {
        overlayWindow.webContents.send('mode-change', data);
    }
}

function setupIPC() {
    ipcMain.removeAllListeners('change-display');
    ipcMain.on('change-display', (event, displayId) => {
        const displays = screen.getAllDisplays();
        const targetDisplay = displays.find(d => d.id === displayId);
        if (targetDisplay && overlayWindow && !overlayWindow.isDestroyed()) {
            overlayWindow.setBounds(targetDisplay.bounds);
        }
    });
}

module.exports = {
    createWindows,
    notifyTunnelReady,
    notifyDeviceConnected,
    notifyDeviceDisconnected,
    notifyLaserMove,
    notifyLaserSetNormalized,
    notifyModeChange,
    setupIPC
};
