const { WebSocketServer } = require('ws');

let wss;
const clients = new Set();
let pingInterval;

/**
 * Initialize the WebSocket server
 * @param {Object} server - The HTTP server instance 
 */
function initWebSocket(server) {
    wss = new WebSocketServer({ server });

    wss.on('connection', (ws) => {
        clients.add(ws);
        ws.isAlive = true;
        
        console.log(`📡 New WebSocket connection. Total clients: ${clients.size}`);

        ws.on('pong', () => {
            ws.isAlive = true;
        });

        ws.on('close', () => {
            clients.delete(ws);
            console.log(`🔌 WebSocket disconnected. Total clients: ${clients.size}`);
        });

        ws.on('error', (error) => {
            console.error('❌ WebSocket error:', error);
            clients.delete(ws);
        });

        // Send initial connection message
        ws.send(JSON.stringify({ 
            type: 'CONNECTED', 
            message: 'WebSocket connected to NetGuard Secure Stream',
            timestamp: new Date().toISOString()
        }));
    });

    // Start heartbeat interval to detect and clean up dead connections (every 30 seconds)
    pingInterval = setInterval(() => {
        wss.clients.forEach((ws) => {
            if (ws.isAlive === false) {
                console.log('💀 Terminating dead WebSocket client');
                clients.delete(ws);
                return ws.terminate();
            }
            ws.isAlive = false;
            ws.ping();
        });
    }, 30000);

    wss.on('close', () => {
        if (pingInterval) clearInterval(pingInterval);
    });
}

/**
 * Broadcast message to all connected clients
 * @param {Object} data - The data object to broadcast
 */
function broadcast(data) {
    if (!wss) return;

    const message = JSON.stringify(data);
    clients.forEach(client => {
        if (client.readyState === 1) { // 1 = OPEN
            try {
                client.send(message);
            } catch (err) {
                console.error('❌ Failed to send message to client:', err.message);
                clients.delete(client);
            }
        }
    });
}

module.exports = {
    initWebSocket,
    broadcast
};
