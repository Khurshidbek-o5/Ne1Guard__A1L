const { WebSocketServer } = require('ws');

let wss;
const clients = new Set();

/**
 * Initialize the WebSocket server
 * @param {Object} server - The HTTP server instance 
 */
function initWebSocket(server) {
    wss = new WebSocketServer({ server });

    wss.on('connection', (ws) => {
        clients.add(ws);
        console.log(`📡 New WebSocket connection. Total clients: ${clients.size}`);

        ws.on('close', () => {
            clients.delete(ws);
            console.log(`🔌 WebSocket disconnected. Total clients: ${clients.size}`);
        });

        ws.on('error', (error) => {
            console.error('❌ WebSocket error:', error);
            clients.delete(ws);
        });

        // Send initial heartbeat
        ws.send(JSON.stringify({ 
            type: 'CONNECTED', 
            message: 'WebSocket connected to NetGuard Secure Stream',
            timestamp: new Date().toISOString()
        }));
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
