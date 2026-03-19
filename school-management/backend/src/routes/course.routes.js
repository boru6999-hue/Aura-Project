const router = require('express').Router();
const { getCourses, getCourseById, createCourse, updateCourse, deleteCourse } = require('../controllers/course.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.get('/', authenticate, getCourses);
router.get('/:id', authenticate, getCourseById);
router.post('/', authenticate, authorize('ADMIN', 'TEACHER'), createCourse);
router.put('/:id', authenticate, authorize('ADMIN', 'TEACHER'), updateCourse);
router.delete('/:id', authenticate, authorize('ADMIN'), deleteCourse);

module.exports = router;
