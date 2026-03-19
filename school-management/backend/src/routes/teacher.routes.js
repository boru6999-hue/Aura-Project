const router = require('express').Router();
const { getTeachers, getTeacherById, createTeacher, updateTeacher, deleteTeacher } = require('../controllers/teacher.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.get('/', authenticate, getTeachers);
router.get('/:id', authenticate, getTeacherById);
router.post('/', authenticate, authorize('ADMIN'), createTeacher);
router.put('/:id', authenticate, authorize('ADMIN'), updateTeacher);
router.delete('/:id', authenticate, authorize('ADMIN'), deleteTeacher);

module.exports = router;
