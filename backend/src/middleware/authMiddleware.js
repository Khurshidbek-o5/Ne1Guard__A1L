const jwt = require('jsonwebtoken');
const prisma = require('../services/db');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret_netguard_key_2026';

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET);
      
      // Fetch user from DB to verify approval and role status
      const dbUser = await prisma.user.findUnique({
        where: { id: decoded.id }
      });
      
      if (!dbUser) {
        return res.status(401).json({ error: 'Foydalanuvchi tizimda mavjud emas' });
      }
      
      if (!dbUser.roleApproved) {
        return res.status(403).json({ error: 'Sizning hisobingiz administrator tomonidan tasdiqlanishi kutilmoqda' });
      }

      // Update req.user with the latest data from database
      req.user = {
        id: dbUser.id,
        email: dbUser.email,
        role: dbUser.role,
        name: dbUser.name
      };
      
      next();
    } catch (error) {
      console.error('Auth token validation failure:', error.message);
      return res.status(401).json({ error: 'Ulanish uchun avtorizatsiya qilingan token yaroqsiz' });
    }
  }

  if (!token) {
    return res.status(401).json({ error: 'Avtorizatsiya talab qilinadi, token yo\'q' });
  }
};

const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Sizda bu funksiyani bajarish uchun yetarli ruxsat yo\'q. Action restricted for role: ' + (req.user?.role || 'Guest') 
      });
    }
    next();
  };
};

module.exports = { protect, requireRole, JWT_SECRET };
