const router = require('express').Router();
const {
  getEnrollments,
  getStudentsByCourse,
  getCoursesByStudent,
  enrollStudent,
  bulkEnroll,
  unenrollStudent,
  unenrollByStudentCourse,
} = require('../controllers/enrollment.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.get('/', authenticate, getEnrollments);
router.get('/course/:courseId', authenticate, getStudentsByCourse);
router.get('/student/:studentId', authenticate, getCoursesByStudent);
router.post('/', authenticate, authorize('ADMIN', 'TEACHER'), enrollStudent);
router.post('/bulk', authenticate, authorize('ADMIN', 'TEACHER'), bulkEnroll);
router.delete('/:id', authenticate, authorize('ADMIN', 'TEACHER'), unenrollStudent);
router.delete('/student/:studentId/course/:courseId', authenticate, authorize('ADMIN', 'TEACHER'), unenrollByStudentCourse);

module.exports = router;
