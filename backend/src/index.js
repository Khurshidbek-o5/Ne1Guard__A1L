require('dotenv').config();

// Global Exception Handling
process.on('uncaughtException', (err) => {
  console.error('💥 UNCAUGHT EXCEPTION! Shutting down...');
  console.error(err.name, err.message);
  process.exit(1);
});

const express = require('express');
const cors = require('cors');
const prisma = require('./services/db');
const { initWebSocket, broadcast } = require('./services/websocketService');

// Route Imports
const authRoutes = require('./routes/authRoutes');
const deviceRoutes = require('./routes/deviceRoutes');
const trafficRoutes = require('./routes/trafficRoutes');
const packetRoutes = require('./routes/packetRoutes');
const alertRoutes = require('./routes/alertRoutes');
const userRoutes = require('./routes/userRoutes');
const statsRoutes = require('./routes/statsRoutes');
const settingRoutes = require('./routes/settingRoutes');
const printRoutes = require('./routes/printRoutes');

// Service Imports
const { startMonitoring } = require('./services/deviceMonitor');
const { startPrinterSimulation } = require('./services/printerSimulator');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());

// Request Logger
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  next();
});

// Health Check
app.get('/api/health', async (req, res) => {
  try {
    await prisma.$connect();
    res.status(200).json({ 
      status: 'ok', 
      db: 'connected', 
      timestamp: new Date() 
    });
  } catch (err) {
    console.error('❌ Health Check DB Error:', err.message);
    res.status(500).json({ 
      status: 'error', 
      db: 'disconnected', 
      error: err.message, 
      timestamp: new Date() 
    });
  }
});

// API Route Registration
const apiPrefix = '/api';
app.use(`${apiPrefix}/auth`, authRoutes);
app.use(`${apiPrefix}/devices`, deviceRoutes);
app.use(`${apiPrefix}/traffic`, trafficRoutes);
app.use(`${apiPrefix}/packets`, packetRoutes);
app.use(`${apiPrefix}/alerts`, alertRoutes);
app.use(`${apiPrefix}/users`, userRoutes);
app.use(`${apiPrefix}/stats`, statsRoutes);
app.use(`${apiPrefix}/settings`, settingRoutes);
app.use(`${apiPrefix}/print`, printRoutes);

// Server Startup
const server = app.listen(PORT, () => {
  console.log(`🚀 NetGuard backend running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔑 Default login: admin@netguard.local / admin123`);
  
  // Initialize WebSocket Server
  initWebSocket(server);
  
  // Attach broadcast to global for easy access (optional, service export is preferred)
  global.wsBroadcast = broadcast;

  // Start background services
  startMonitoring();
  startPrinterSimulation();
});

// Graceful Shutdown
process.on('unhandledRejection', (err) => {
  console.log('💥 UNHANDLED REJECTION! Shutting down...');
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});
