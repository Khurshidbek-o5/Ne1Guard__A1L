const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect, requireRole } = require('../middleware/authMiddleware');

router.get('/', protect, requireRole('developer'), userController.getUsers);
router.post('/', protect, requireRole('developer'), userController.createUser);
router.put('/:id', protect, requireRole('developer'), userController.updateUser);
router.delete('/:id', protect, requireRole('developer'), userController.deleteUser);
router.put('/:id/role', protect, requireRole('developer'), userController.updateUserRole);

module.exports = router;
