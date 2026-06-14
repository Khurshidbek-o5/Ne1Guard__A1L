const ping = require('ping');
const prisma = require('./db');

const pingConfig = {
  timeout: 3, // wait 3 seconds max
};

// Keep track of consecutive ping failures in memory
// { [deviceId]: numberOfFailures }
const deviceFailures = {}; 

const startMonitoring = () => {
  console.log('📡 Real-time ICMP Device Monitor active (5s interval)');
  
  setInterval(async () => {
    try {
      const devices = await prisma.withRetry(() => prisma.device.findMany());
      if (!devices || devices.length === 0) return;

      const promises = devices.map(async (device) => {
        try {
          // Detect if we are in a restricted environment (like Render/Cloud)
          // and if we are trying to ping a private IP from the cloud.
          const isPrivateIP = device.ip_address.startsWith('192.168.') || 
                             device.ip_address.startsWith('10.') || 
                             device.ip_address.startsWith('172.');
          
          // If we are on Render (detected by environment or previous error), 
          // we might want to skip or handle differently.
          
          const res = await ping.promise.probe(device.ip_address, pingConfig);
          const isAlive = res.alive;

          if (isAlive) {
            deviceFailures[device.id] = 0;
            if (device.status !== 'online') {
              const updated = await prisma.withRetry(() => prisma.device.update({
                where: { id: device.id },
                data: { status: 'online', last_seen: new Date() }
              }));
              global.wsBroadcast && global.wsBroadcast({ type: 'DEVICE_STATUS_UPDATE', payload: updated });
            } else {
              await prisma.withRetry(() => prisma.device.update({
                where: { id: device.id },
                data: { last_seen: new Date() }
              }));
            }
          } else {
            deviceFailures[device.id] = (deviceFailures[device.id] || 0) + 1;
            if (deviceFailures[device.id] >= 3 && device.status !== 'offline') {
              const updated = await prisma.withRetry(() => prisma.device.update({
                where: { id: device.id },
                data: { status: 'offline' }
              }));
              global.wsBroadcast && global.wsBroadcast({ type: 'DEVICE_STATUS_UPDATE', payload: updated });
            }
          }
        } catch (e) {
          if (e.message.includes('EPERM') || e.message.includes('permission') || e.message.includes('ping program')) {
             if (!global.pingErrorLogged) {
               console.warn(`[MONITOR] ICMP Ping is restricted in this environment (likely Render/Cloud). Live monitoring of local IPs will not work from here.`);
               global.pingErrorLogged = true;
             }
          } else {
             console.error(`[MONITOR] Unexpected error probing ${device.ip_address}:`, e.message);
          }
        }
      });

      await Promise.allSettled(promises);
    } catch (err) {
      console.error('[MONITOR] Global Monitor Exception:', err);
    }
  }, 5000); // Run every 5000ms
};

module.exports = { startMonitoring };
