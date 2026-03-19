const router = require('express').Router();
const { getStudents, getStudentById, createStudent, updateStudent, deleteStudent } = require('../controllers/student.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.get('/', authenticate, getStudents);
router.get('/:id', authenticate, getStudentById);
router.post('/', authenticate, authorize('ADMIN', 'TEACHER'), createStudent);
router.put('/:id', authenticate, authorize('ADMIN', 'TEACHER'), updateStudent);
router.delete('/:id', authenticate, authorize('ADMIN'), deleteStudent);

module.exports = router;
