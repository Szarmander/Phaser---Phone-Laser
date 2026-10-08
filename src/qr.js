const { ipcRenderer } = require('electron');

ipcRenderer.on('setup-data', (event, data) => {
    // Show URL and QR Code
    document.getElementById('url-text').innerText = data.url;
    
    const qrImg = document.getElementById('qr-image');
    qrImg.src = data.qrUrl;
    qrImg.style.display = 'block';

    // Populate display select
    const select = document.getElementById('display-select');
    select.innerHTML = ''; // clear

    data.displays.forEach((display, index) => {
        const option = document.createElement('option');
        option.value = display.id;
        option.text = `Display ${index + 1} (${display.bounds.width}x${display.bounds.height}) ${display.isPrimary ? '(Primary)' : ''}`;
        
        if (display.isPrimary) {
            option.selected = true;
        }
        
        select.appendChild(option);
    });

    // Handle display change
    select.addEventListener('change', (e) => {
        const displayId = parseInt(e.target.value, 10);
        ipcRenderer.send('change-display', displayId);
    });
});

ipcRenderer.on('device-connected', () => {
    document.getElementById('qr-section').style.display = 'none';
    document.getElementById('connection-status').style.display = 'block';
});

ipcRenderer.on('device-disconnected', () => {
    document.getElementById('qr-section').style.display = 'block';
    document.getElementById('connection-status').style.display = 'none';
});
