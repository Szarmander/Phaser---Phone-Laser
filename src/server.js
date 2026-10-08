const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const { getLocalIP } = require('./network');

function createServer(port, callbacks) {
    const app = express();
    const server = http.createServer(app);
    const io = new Server(server, { cors: { origin: '*' } });

    // Serve public directory to mobile clients
    app.use(express.static(path.join(__dirname, '..', 'public')));
    
    // Fallback
    app.get('/', (req, res) => {
        res.sendFile(path.join(__dirname, '..', 'public', 'mobile.html'));
    });

    io.on('connection', (socket) => {
        console.log('Mobile device connected:', socket.id);
        if (callbacks.onConnect) callbacks.onConnect();

        socket.on('disconnect', () => {
            console.log('Mobile device disconnected');
            if (callbacks.onDisconnect) callbacks.onDisconnect();
        });

        socket.on('laser-move', (data) => {
            if (callbacks.onLaserMove) callbacks.onLaserMove(data);
        });
        
        socket.on('laser-set-normalized', (data) => {
            if (callbacks.onLaserSetNormalized) callbacks.onLaserSetNormalized(data);
        });

        socket.on('mode-change', (data) => {
            if (callbacks.onModeChange) callbacks.onModeChange(data);
        });

        socket.on('slide-action', (data) => {
            if (callbacks.onSlideAction) callbacks.onSlideAction(data);
        });
    });

    server.listen(port, '0.0.0.0', () => {
        console.log(`Server listening on port ${port}`);
    });

    return { server, io };
}

module.exports = { createServer };
