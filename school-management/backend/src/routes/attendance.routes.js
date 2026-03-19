const router = require('express').Router();
const { getAttendance, createAttendance } = require('../controllers/attendance.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.get('/', authenticate, getAttendance);
router.post('/', authenticate, authorize('ADMIN', 'TEACHER'), createAttendance);

module.exports = router;
