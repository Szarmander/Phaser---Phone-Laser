const { app, BrowserWindow } = require('electron');
const { exec } = require('child_process');
const { getLocalIP } = require('./src/network');
const { createServer } = require('./src/server');
const windowManager = require('./src/windowManager');

const PORT = 3000;

app.whenReady().then(() => {
    // 1. Create windows
    windowManager.createWindows(PORT, getLocalIP);
    
    // 2. Setup IPC for internal communication
    windowManager.setupIPC();

    // 3. Start server and provide callbacks for events
    createServer(PORT, {
        onConnect: () => windowManager.notifyDeviceConnected(),
        onDisconnect: () => windowManager.notifyDeviceDisconnected(),
        onLaserMove: (data) => windowManager.notifyLaserMove(data),
        onModeChange: (data) => windowManager.notifyModeChange(data),
        onSlideAction: (data) => {
            if (data.action === 'next') {
                exec(`osascript -e 'tell application "System Events" to key code 124'`);
            } else if (data.action === 'prev') {
                exec(`osascript -e 'tell application "System Events" to key code 123'`);
            }
        }
    });

    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) {
            windowManager.createWindows(PORT, getLocalIP);
        }
    });
});

app.on('window-all-closed', function () {
    app.quit();
});
