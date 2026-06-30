const express  = require('express');
const router   = express.Router();
const ctrl     = require('../controllers/adController');
const { protect, requireRole } = require('../middleware/authMiddleware');

// All AD endpoints require authentication + developer role
const adminOnly = [protect, requireRole('developer')];
// Read-only: developer + security + auditor
const readAccess = [protect, requireRole('developer', 'security', 'auditor', 'support')];

// ── Seed endpoint (developer only) ──────────────────────────────────────────
router.post('/seed',         adminOnly, ctrl.seedOUs);

// ── OrgUnit (OU) endpoints ───────────────────────────────────────────────────
router.get('/ous',                    readAccess,  ctrl.getOUs);
router.post('/ous',                   adminOnly,   ctrl.createOU);
router.delete('/ous/:name',           adminOnly,   ctrl.deleteOU);
router.get('/ous/:name/users',        readAccess,  ctrl.getOUUsers);
router.get('/ous/:name/computers',    readAccess,  ctrl.getOUComputers);

// ── AD User management ───────────────────────────────────────────────────────
router.post('/users',                 adminOnly,   ctrl.createUser);
router.patch('/users/:id',            adminOnly,   ctrl.updateUser);
router.patch('/users/:id/password',   adminOnly,   ctrl.resetPassword);
router.patch('/users/:id/lock',       adminOnly,   ctrl.toggleLock);
router.patch('/users/:id/move',       adminOnly,   ctrl.moveUser);
router.delete('/users/:id',           adminOnly,   ctrl.deleteUser);

// ── Computer management ──────────────────────────────────────────────────────
router.post('/computers',             adminOnly,   ctrl.addComputer);
router.delete('/computers/:id',       adminOnly,   ctrl.deleteComputer);

module.exports = router;
