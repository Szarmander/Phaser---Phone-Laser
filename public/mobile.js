const socket = io({ transports: ['websocket'] });

// UI Elements
const touchpadArea = document.getElementById('touchpad-area');
const gyroArea = document.getElementById('gyro-area');

const btnOff = document.getElementById('btn-off');
const btnLaser = document.getElementById('btn-laser');
const btnHighlight = document.getElementById('btn-highlight');

const btnTouch = document.getElementById('btn-touch');
const btnGyro = document.getElementById('btn-gyro');

const btnRecenter = document.getElementById('btn-recenter');
const btnPrev = document.getElementById('btn-prev');
const btnNext = document.getElementById('btn-next');

// State
let currentVisualMode = 'laser';
let currentControlMode = 'touchpad';

// Touchpad State
let lastX = null;
let lastY = null;

// Gyro State
let centerAlpha = null;
let centerBeta = null;
let isGyroActive = false;

// --- Visual Mode Switching ---
btnOff.addEventListener('click', () => {
    currentVisualMode = 'off';
    btnOff.classList.add('active');
    btnLaser.classList.remove('active');
    btnHighlight.classList.remove('active');
    socket.emit('mode-change', { mode: 'off' });
});

btnLaser.addEventListener('click', () => {
    currentVisualMode = 'laser';
    btnLaser.classList.add('active');
    btnOff.classList.remove('active');
    btnHighlight.classList.remove('active');
    socket.emit('mode-change', { mode: 'laser' });
});

btnHighlight.addEventListener('click', () => {
    currentVisualMode = 'highlight';
    btnHighlight.classList.add('active');
    btnOff.classList.remove('active');
    btnLaser.classList.remove('active');
    socket.emit('mode-change', { mode: 'highlight' });
});

// --- Control Mode Switching ---
btnTouch.addEventListener('click', () => {
    currentControlMode = 'touchpad';
    btnTouch.classList.add('active');
    btnGyro.classList.remove('active');
    
    touchpadArea.classList.remove('hidden');
    gyroArea.classList.add('hidden');
    isGyroActive = false;
});

btnGyro.addEventListener('click', () => {
    currentControlMode = 'gyroscope';
    btnGyro.classList.add('active');
    btnTouch.classList.remove('active');
    
    touchpadArea.classList.add('hidden');
    gyroArea.classList.remove('hidden');
    isGyroActive = true;

    // Request permissions for iOS 13+
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
        DeviceOrientationEvent.requestPermission()
            .then(permissionState => {
                if (permissionState === 'granted') {
                    window.addEventListener('deviceorientation', handleOrientation);
                } else {
                    alert('Gyroscope permission denied.');
                }
            })
            .catch(console.error);
    } else {
        // Non-iOS 13+ devices
        window.addEventListener('deviceorientation', handleOrientation);
    }
});

// --- Slide Events ---
btnPrev.addEventListener('click', () => {
    socket.emit('slide-action', { action: 'prev' });
});

btnNext.addEventListener('click', () => {
    socket.emit('slide-action', { action: 'next' });
});

// --- Touchpad Logic ---
touchpadArea.addEventListener('touchstart', (e) => {
    const touch = e.touches[0];
    lastX = touch.clientX;
    lastY = touch.clientY;
});

touchpadArea.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const currentX = touch.clientX;
    const currentY = touch.clientY;

    if (lastX !== null && lastY !== null) {
        const dx = currentX - lastX;
        const dy = currentY - lastY;
        socket.emit('laser-move', { dx, dy });
    }

    lastX = currentX;
    lastY = currentY;
}, { passive: false });

touchpadArea.addEventListener('touchend', () => {
    lastX = null;
    lastY = null;
});

// --- Gyroscope Logic ---
// Helper to get shortest angle distance (-180 to 180)
function getShortestAngle(target, current) {
    let diff = current - target;
    while (diff > 180) diff -= 360;
    while (diff < -180) diff += 360;
    return diff;
}

btnRecenter.addEventListener('click', () => {
    // When recenter is clicked, we want the *next* orientation event to set the center
    centerAlpha = null;
    centerBeta = null;
});

function handleOrientation(event) {
    if (!isGyroActive) return;
    if (event.alpha === null || event.beta === null) return;

    document.getElementById('gyro-debug').innerText = `Alpha: ${Math.round(event.alpha)} | Beta: ${Math.round(event.beta)}`;

    // If center is not set, set it now (on first event or after recenter)
    if (centerAlpha === null || centerBeta === null) {
        centerAlpha = event.alpha;
        centerBeta = event.beta;
        return;
    }

    // Alpha is Z-axis (yaw/compass). Left/Right.
    // Beta is X-axis (pitch/tilt). Up/Down.
    let deltaAlpha = getShortestAngle(centerAlpha, event.alpha);
    let deltaBeta = event.beta - centerBeta;

    const maxDegrees = 25.0; 
    
    // Normalize to [-1, 1]
    let offsetX = deltaAlpha / maxDegrees;
    let offsetY = deltaBeta / maxDegrees;

    // Invert X because turning phone left increases alpha
    offsetX = -offsetX;
    
    // User requested to swap up/down orientation
    offsetY = -offsetY; 

    // Clamp between -1 and 1
    offsetX = Math.max(-1, Math.min(1, offsetX));
    offsetY = Math.max(-1, Math.min(1, offsetY));

    socket.emit('laser-set-normalized', { offsetX, offsetY });
}
