const socket = io();

const touchpad = document.getElementById('touchpad');
const btnOff = document.getElementById('btn-off');
const btnLaser = document.getElementById('btn-laser');
const btnHighlight = document.getElementById('btn-highlight');

let currentMode = 'laser';
let lastX = null;
let lastY = null;

// Handle Mode Switching
btnOff.addEventListener('click', () => {
    currentMode = 'off';
    btnOff.classList.add('active');
    btnLaser.classList.remove('active');
    btnHighlight.classList.remove('active');
    socket.emit('mode-change', { mode: 'off' });
});

btnLaser.addEventListener('click', () => {
    currentMode = 'laser';
    btnLaser.classList.add('active');
    btnOff.classList.remove('active');
    btnHighlight.classList.remove('active');
    socket.emit('mode-change', { mode: 'laser' });
});

btnHighlight.addEventListener('click', () => {
    currentMode = 'highlight';
    btnHighlight.classList.add('active');
    btnOff.classList.remove('active');
    btnLaser.classList.remove('active');
    socket.emit('mode-change', { mode: 'highlight' });
});

// Slide Events
const btnPrev = document.getElementById('btn-prev');
const btnNext = document.getElementById('btn-next');

btnPrev.addEventListener('click', () => {
    socket.emit('slide-action', { action: 'prev' });
});

btnNext.addEventListener('click', () => {
    socket.emit('slide-action', { action: 'next' });
});

// Touchpad Events
touchpad.addEventListener('touchstart', (e) => {
    const touch = e.touches[0];
    lastX = touch.clientX;
    lastY = touch.clientY;
});

touchpad.addEventListener('touchmove', (e) => {
    e.preventDefault(); // Prevent scrolling

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

touchpad.addEventListener('touchend', () => {
    lastX = null;
    lastY = null;
});

// Optional: mouse events for testing on desktop browser
touchpad.addEventListener('mousedown', (e) => {
    lastX = e.clientX;
    lastY = e.clientY;
});

touchpad.addEventListener('mousemove', (e) => {
    if (e.buttons !== 1) return; // Only if mouse is pressed
    e.preventDefault();

    const currentX = e.clientX;
    const currentY = e.clientY;

    if (lastX !== null && lastY !== null) {
        const dx = currentX - lastX;
        const dy = currentY - lastY;
        socket.emit('laser-move', { dx, dy });
    }

    lastX = currentX;
    lastY = currentY;
});

touchpad.addEventListener('mouseup', () => {
    lastX = null;
    lastY = null;
});
