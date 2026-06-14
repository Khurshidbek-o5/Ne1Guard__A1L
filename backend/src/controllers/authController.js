const prisma = require('../services/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../middleware/authMiddleware');

const generateToken = (id, email, role, name) => {
  return jwt.sign({ id, email, role, name }, JWT_SECRET, { expiresIn: '30d' });
};

exports.registerUser = async (req, res) => {
  try {
    const { email, password, name, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email va parol kiritilishi shart' });
    }

    const userExists = await prisma.user.findUnique({ where: { email } });
    if (userExists) {
      return res.status(400).json({ error: 'Ushbu email bilan avval ro\'yxatdan o\'tilgan' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Barcha yangi foydalanuvchilar sukut bo'yicha 'user' va 'kutmoqda' holatida bo'ladi
    // FAQAT bazada hech kim bo'lmasa, dastlabki kishini administrator (developer) deb hisoblaymiz.
    const totalUsers = await prisma.user.count();
    const isFirstUser = totalUsers === 0;

    const assignedRole = isFirstUser ? 'developer' : 'guest'; 
    const isApproved = isFirstUser ? true : false;

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || email.split('@')[0],
        role: assignedRole,
        roleApproved: isApproved
      }
    });

    if (user) {
      res.status(201).json({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        token: generateToken(user.id, user.email, user.role, user.name),
      });
    } else {
      res.status(400).json({ error: 'Foydalanuvchi ma\'lumotlari noto\'g\'ri' });
    }
  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({ error: 'Server xatoligi' });
  }
};

exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });

    if (user && (await bcrypt.compare(password, user.password))) {
      // Role Approved check
      if (!user.roleApproved) {
        return res.status(403).json({ error: 'You are waiting for admin approval' });
      }

      res.json({
        token: generateToken(user.id, user.email, user.role, user.name),
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        }
      });
    } else {
      res.status(401).json({ error: 'Email yoki parol noto\'g\'ri' });
    }
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ error: 'Server xatoligi' });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, email: true, name: true, role: true, created_at: true }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'Foydalanuvchi topilmadi' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get Me Error:', error);
    res.status(500).json({ error: 'Server xatoligi' });
  }
};
