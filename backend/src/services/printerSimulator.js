const prisma = require('./db');

/**
 * Simulates printer activity and job processing
 */
const startPrinterSimulation = () => {
  console.log('🖨️ Printer Simulation Active (10s interval)');

  setInterval(async () => {
    try {
      // 1. Progress PRINTING jobs to COMPLETED
      const printingJobs = await prisma.printJob.findMany({
        where: { status: 'PRINTING' }
      });

      for (const job of printingJobs) {
        // 70% chance to finish each cycle
        if (Math.random() > 0.3) {
          await prisma.printJob.update({
            where: { id: job.id },
            data: { status: 'COMPLETED' }
          });
          
          // Increment page count for the printer
          await prisma.device.update({
            where: { id: job.printerId },
            data: { 
              pageCount: { increment: Math.floor(Math.random() * 20) + 1 },
              tonerLevel: { decrement: Math.random() > 0.5 ? 1 : 0 } // Slow toner depletion
            }
          });
        }
      }

      // 2. Start PENDING jobs
      const pendingJobs = await prisma.printJob.findMany({
        where: { status: 'PENDING' }
      });

      for (const job of pendingJobs) {
        // Check if printer is already printing (simple simulation)
        const isPrinterOccupied = printingJobs.some(pj => pj.printerId === job.printerId);
        
        if (!isPrinterOccupied && Math.random() > 0.5) {
          await prisma.printJob.update({
            where: { id: job.id },
            data: { status: 'PRINTING' }
          });
        }
      }

      // 3. Occasionally break a printer (Warning status)
      const printers = await prisma.device.findMany({ where: { device_type: 'printer' } });
      for (const p of printers) {
        if (Math.random() > 0.98) { // Very low chance per cycle
          await prisma.device.update({
             where: { id: p.id },
             data: { risk_level: 'warning' }
          });
        }
      }

    } catch (err) {
      console.error('[SIMULATOR] Error:', err.message);
    }
  }, 10000); // 10s cycles
};

module.exports = { startPrinterSimulation };
