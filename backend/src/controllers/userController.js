const prisma = require('../services/db');

exports.getUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { 
        id: true, 
        email: true, 
        name: true, 
        role: true, 
        roleApproved: true, 
        position: true,
        avatarUrl: true,
        created_at: true 
      },
      orderBy: { created_at: 'desc' }
    });
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, position, avatarUrl, role, roleApproved } = req.body;

    const dataToUpdate = {};
    if (name) dataToUpdate.name = name;
    if (email) dataToUpdate.email = email;
    if (position !== undefined) dataToUpdate.position = position;
    if (avatarUrl !== undefined) dataToUpdate.avatarUrl = avatarUrl;
    if (role) dataToUpdate.role = role;
    if (roleApproved !== undefined) dataToUpdate.roleApproved = roleApproved;

    const updatedUser = await prisma.user.update({
      where: { id: parseInt(id) },
      data: dataToUpdate,
      select: { id: true, email: true, name: true, role: true, roleApproved: true, position: true, avatarUrl: true }
    });

    res.json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Foydalanuvchi ma\'lumotlarini yangilab bo\'lmadi' });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.user.delete({
      where: { id: parseInt(id) }
    });
    res.json({ message: 'Foydalanuvchi muvaffaqiyatli o\'chirildi' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Foydalanuvchini o\'chirib bo\'lmadi' });
  }
};

exports.updateUserRole = async (req, res) => {
// ... existing code but wait, I can just combine it into updateUser if I want, but I'll keep it for backward compatibility or replace it.
// Actually, I'll keep it as is or just merge it. I'll merge it into updateUser to be cleaner.
  try {
    const { id } = req.params;
    const { role, roleApproved } = req.body;
    
    const validRoles = ['developer', 'security', 'support', 'user', 'printer', 'auditor', 'guest'];
    if (role && !validRoles.includes(role)) {
      return res.status(400).json({ error: 'Noto\'g\'ri rol nomi kiritildi: ' + role });
    }

    const updatedUser = await prisma.user.update({
      where: { id: parseInt(id) },
      data: { role, roleApproved },
      select: { id: true, email: true, name: true, role: true, roleApproved: true }
    });

    res.json(updatedUser);
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ error: 'Xatolik, foydalanuvchi roli yangilanmadi' });
  }
};

exports.createUser = async (req, res) => {
  try {
    const { email, name, password, role, position, avatarUrl } = req.body;
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(password || 'netguard123', 10);

    const user = await prisma.user.create({
      data: { 
        email, 
        name, 
        password: hashedPassword, 
        role: role || 'user',
        position: position || 'Staff',
        avatarUrl: avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
        roleApproved: true // Auto-approve if created by admin
      }
    });
    res.status(201).json(user);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Foydalanuvchi yaratib bo\'lmadi' });
  }
};
