const { ipcRenderer } = require('electron');

const elLoadingState = document.getElementById('loading-state');
const elQrSection = document.getElementById('qr-section');
const elConnectionStatus = document.getElementById('connection-status');
const elUrlText = document.getElementById('url-text');
const elQrImage = document.getElementById('qr-image');
const elDisplaySelect = document.getElementById('display-select');

ipcRenderer.on('setup-data', (event, data) => {
    // Hide loading state, show QR section
    elLoadingState.classList.add('hidden');
    elQrSection.classList.remove('hidden');

    // Show URL and QR Code
    elUrlText.innerText = data.url;
    elQrImage.src = data.qrUrl;
    elQrImage.classList.remove('hidden');

    // Populate display select
    elDisplaySelect.innerHTML = ''; // clear

    data.displays.forEach((display, index) => {
        const option = document.createElement('option');
        option.value = display.id;
        option.text = `Display ${index + 1} (${display.bounds.width}x${display.bounds.height}) ${display.isPrimary ? '(Primary)' : ''}`;
        
        if (display.isPrimary) {
            option.selected = true;
        }
        
        elDisplaySelect.appendChild(option);
    });

    // Handle display change
    elDisplaySelect.addEventListener('change', (e) => {
        const displayId = parseInt(e.target.value, 10);
        ipcRenderer.send('change-display', displayId);
    });
});

ipcRenderer.on('device-connected', () => {
    elQrSection.classList.add('hidden');
    elConnectionStatus.classList.remove('hidden');
});

ipcRenderer.on('device-disconnected', () => {
    elQrSection.classList.remove('hidden');
    elConnectionStatus.classList.add('hidden');
});
