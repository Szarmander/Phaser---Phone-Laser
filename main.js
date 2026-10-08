const { app, BrowserWindow } = require('electron');
const { exec } = require('child_process');
const { Tunnel } = require('cloudflared');
const { createServer } = require('./src/server');
const windowManager = require('./src/windowManager');

const PORT = 3000;
let publicUrl = '';

function initializeApp() {
    // 1. Create windows immediately in a loading state
    windowManager.createWindows(PORT, null);
    
    // 2. Setup IPC for internal communication
    windowManager.setupIPC();

    // 3. Start Cloudflared tunnel
    const tunnel = Tunnel.quick(`http://localhost:${PORT}`);
    
    tunnel.on('url', (url) => {
        publicUrl = url;
        console.log('Cloudflare Tunnel created at:', publicUrl);
        // Send the URL to the qr window
        windowManager.notifyTunnelReady(url);
    });

    tunnel.on('error', (err) => {
        console.error('Tunnel error:', err);
        // Fallback to local IP if tunnel fails
        if (!publicUrl) {
            const { getLocalIP } = require('./src/network');
            publicUrl = `http://${getLocalIP()}:${PORT}`;
            windowManager.notifyTunnelReady(publicUrl);
        }
    });

    // 4. Start server and provide callbacks for events
    createServer(PORT, {
        onConnect: () => windowManager.notifyDeviceConnected(),
        onDisconnect: () => windowManager.notifyDeviceDisconnected(),
        onLaserMove: (data) => windowManager.notifyLaserMove(data),
        onLaserSetNormalized: (data) => windowManager.notifyLaserSetNormalized(data),
        onModeChange: (data) => windowManager.notifyModeChange(data),
        onSlideAction: (data) => {
            if (process.platform === 'darwin') {
                if (data.action === 'next') {
                    exec(`osascript -e 'tell application "System Events" to key code 124'`);
                } else if (data.action === 'prev') {
                    exec(`osascript -e 'tell application "System Events" to key code 123'`);
                }
            } else if (process.platform === 'win32') {
                // Proactively support Windows using PowerShell SendKeys
                if (data.action === 'next') {
                    exec(`powershell.exe -c "$wshell = New-Object -ComObject wscript.shell; $wshell.SendKeys('{RIGHT}')"`);
                } else if (data.action === 'prev') {
                    exec(`powershell.exe -c "$wshell = New-Object -ComObject wscript.shell; $wshell.SendKeys('{LEFT}')"`);
                }
            }
        }
    });
}

app.whenReady().then(() => {
    initializeApp();

    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) {
            windowManager.createWindows(PORT, publicUrl);
        }
    });
});

app.on('window-all-closed', function () {
    app.quit();
});
