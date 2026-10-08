const { ipcRenderer } = require('electron');

const laserDot = document.getElementById('laser-dot');
const highlightMask = document.getElementById('highlight-mask');

let currentMode = 'laser'; // 'laser' or 'highlight'
let x = window.innerWidth / 2;
let y = window.innerHeight / 2;

// The size of the spotlight
const spotlightRadius = 150;

function updatePosition() {
    if (currentMode === 'laser') {
        laserDot.style.left = `${x}px`;
        laserDot.style.top = `${y}px`;
        laserDot.style.display = 'block';
        highlightMask.style.display = 'none';
    } else if (currentMode === 'highlight') {
        laserDot.style.display = 'none';
        highlightMask.style.display = 'block';
        
        // CSS trick to make the screen dark everywhere except a circle at (x,y)
        highlightMask.style.background = `radial-gradient(circle at ${x}px ${y}px, transparent 0px, transparent ${spotlightRadius}px, rgba(0,0,0,0.7) ${spotlightRadius + 2}px)`;
    } else if (currentMode === 'off') {
        laserDot.style.display = 'none';
        highlightMask.style.display = 'none';
    }
}

ipcRenderer.on('laser-move', (event, data) => {
    // data.dx and data.dy are normalized deltas (-1 to 1) or pixel deltas
    // We will assume pixel deltas from the controller (scaled)
    
    // Sensitivity multiplier
    const sensitivity = 2.0;

    x += data.dx * sensitivity;
    y += data.dy * sensitivity;

    // Clamp to screen bounds
    x = Math.max(0, Math.min(window.innerWidth, x));
    y = Math.max(0, Math.min(window.innerHeight, y));

    updatePosition();
});

ipcRenderer.on('mode-change', (event, data) => {
    currentMode = data.mode;
    updatePosition();
});

// Hide by default until connection starts sending data
laserDot.style.display = 'none';
highlightMask.style.display = 'none';

ipcRenderer.on('device-connected', () => {
    // Center it when connected
    x = window.innerWidth / 2;
    y = window.innerHeight / 2;
    updatePosition();
});

ipcRenderer.on('device-disconnected', () => {
    laserDot.style.display = 'none';
    highlightMask.style.display = 'none';
});
