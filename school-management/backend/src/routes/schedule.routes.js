const router = require('express').Router();
const { getSchedules, createSchedule, updateSchedule, deleteSchedule, clearCourseSchedule } = require('../controllers/schedule.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.get('/',                          authenticate, getSchedules);
router.post('/',                         authenticate, authorize('ADMIN', 'TEACHER'), createSchedule);
router.put('/:id',                       authenticate, authorize('ADMIN', 'TEACHER'), updateSchedule);
router.delete('/:id',                    authenticate, authorize('ADMIN', 'TEACHER'), deleteSchedule);
router.delete('/course/:courseId',       authenticate, authorize('ADMIN', 'TEACHER'), clearCourseSchedule);

module.exports = router;
