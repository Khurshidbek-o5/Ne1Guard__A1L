const prisma = require('../services/db');

exports.getPrinters = async (req, res) => {
  try {
    let printers = await prisma.device.findMany({
      where: { device_type: 'printer' },
      include: { printJobs: { orderBy: { timestamp: 'desc' }, take: 5 } }
    });

    // If no printers exist, create some demo ones for the professional look
    if (printers.length === 0) {
      await prisma.device.createMany({
        data: [
          { ip_address: '192.168.1.101', hostname: 'HP-LASERJET-D8', device_type: 'printer', modelName: 'HP LaserJet Pro M404n', tonerLevel: 78, pageCount: 12450 },
          { ip_address: '192.168.1.102', hostname: 'EPSON-L3150-NET', device_type: 'printer', modelName: 'Epson EcoTank L3150', tonerLevel: 42, pageCount: 5200 },
          { ip_address: '192.168.1.105', hostname: 'CANON-MF237W', device_type: 'printer', modelName: 'Canon imageCLASS MF237w', tonerLevel: 12, pageCount: 28400, risk_level: 'warning' },
        ]
      });
      printers = await prisma.device.findMany({ where: { device_type: 'printer' } });
    }

    res.json(printers);
  } catch (error) {
    console.error('Error fetching printers:', error);
    res.status(500).json({ error: 'Failed to fetch printers' });
  }
};

exports.getQueue = async (req, res) => {
  try {
    let queue = await prisma.printJob.findMany({
      orderBy: { timestamp: 'desc' },
      include: { printer: true }
    });

    // Seed some demo jobs if empty
    if (queue.length === 0) {
      const printers = await prisma.device.findMany({ where: { device_type: 'printer' } });
      if (printers.length > 0) {
        await prisma.printJob.createMany({
          data: [
            { fileName: 'annual_report_2025.pdf', userName: 'Azizbek S.', status: 'COMPLETED', printerId: printers[0].id },
            { fileName: 'confidential_contract_v2.docx', userName: 'Nigora T.', status: 'PRINTING', printerId: printers[1].id },
            { fileName: 'marketing_flyer.ai', userName: 'Sarvar M.', status: 'PENDING', printerId: printers[0].id },
            { fileName: 'error_log_04.txt', userName: 'System', status: 'FAILED', printerId: printers[2].id },
          ]
        });
        queue = await prisma.printJob.findMany({ orderBy: { timestamp: 'desc' }, include: { printer: true } });
      }
    }

    res.json(queue);
  } catch (error) {
    console.error('Error fetching print queue:', error);
    res.status(500).json({ error: 'Failed to fetch print queue' });
  }
};

exports.cancelJob = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.printJob.update({
      where: { id: parseInt(id) },
      data: { status: 'FAILED' } // Or delete it, but usually 'failed/cancelled' is better for logs
    });
    res.json({ message: 'Job cancelled' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to cancel job' });
  }
};

exports.retryJob = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.printJob.update({
      where: { id: parseInt(id) },
      data: { status: 'PENDING', timestamp: new Date() }
    });
    res.json({ message: 'Job retried' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retry job' });
  }
};

exports.createJob = async (req, res) => {
  try {
    const { fileName, userName, printerId } = req.body;
    if (!fileName || !userName || !printerId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const printer = await prisma.device.findUnique({
      where: { id: parseInt(printerId) }
    });
    if (!printer || printer.device_type !== 'printer') {
      return res.status(404).json({ error: 'Printer not found' });
    }
    if (printer.status !== 'online') {
      return res.status(400).json({ error: 'Printer is offline' });
    }
    const job = await prisma.printJob.create({
      data: {
        fileName,
        userName,
        printerId: parseInt(printerId),
        status: 'PENDING'
      },
      include: { printer: true }
    });
    res.status(201).json(job);
  } catch (error) {
    console.error('Error creating print job:', error);
    res.status(500).json({ error: 'Failed to create print job' });
  }
};

exports.refillToner = async (req, res) => {
  try {
    const { id } = req.params;
    const printer = await prisma.device.findUnique({
      where: { id: parseInt(id) }
    });
    if (!printer || printer.device_type !== 'printer') {
      return res.status(404).json({ error: 'Printer not found' });
    }
    const updated = await prisma.device.update({
      where: { id: parseInt(id) },
      data: { tonerLevel: 100 }
    });
    res.json(updated);
  } catch (error) {
    console.error('Error refilling toner:', error);
    res.status(500).json({ error: 'Failed to refill toner' });
  }
};

exports.toggleStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const printer = await prisma.device.findUnique({
      where: { id: parseInt(id) }
    });
    if (!printer || printer.device_type !== 'printer') {
      return res.status(404).json({ error: 'Printer not found' });
    }
    const newStatus = printer.status === 'online' ? 'offline' : 'online';
    const updated = await prisma.device.update({
      where: { id: parseInt(id) },
      data: { status: newStatus }
    });
    res.json(updated);
  } catch (error) {
    console.error('Error toggling status:', error);
    res.status(500).json({ error: 'Failed to toggle status' });
  }
};

exports.fixPrinter = async (req, res) => {
  try {
    const { id } = req.params;
    const printer = await prisma.device.findUnique({
      where: { id: parseInt(id) }
    });
    if (!printer || printer.device_type !== 'printer') {
      return res.status(404).json({ error: 'Printer not found' });
    }
    const updated = await prisma.device.update({
      where: { id: parseInt(id) },
      data: { risk_level: 'safe', status: 'online' }
    });
    res.json(updated);
  } catch (error) {
    console.error('Error fixing printer:', error);
    res.status(500).json({ error: 'Failed to fix printer' });
  }
};
