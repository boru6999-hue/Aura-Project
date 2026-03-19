const router = require('express').Router();
const {
  getRequests, createRequest, approveRequest, rejectRequest, cancelRequest, getPendingCount
} = require('../controllers/scheduleRequest.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.get('/',               authenticate, getRequests);
router.get('/pending-count',  authenticate, authorize('ADMIN'), getPendingCount);
router.post('/',              authenticate, authorize('TEACHER', 'ADMIN'), createRequest);
router.put('/:id/approve',    authenticate, authorize('ADMIN'), approveRequest);
router.put('/:id/reject',     authenticate, authorize('ADMIN'), rejectRequest);
router.delete('/:id',         authenticate, cancelRequest);

module.exports = router;
