const router = require('express').Router();
const { getGrades, createGrade, deleteGrade } = require('../controllers/grade.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.get('/', authenticate, getGrades);
router.post('/', authenticate, authorize('ADMIN', 'TEACHER'), createGrade);
router.delete('/:id', authenticate, authorize('ADMIN', 'TEACHER'), deleteGrade);

module.exports = router;
