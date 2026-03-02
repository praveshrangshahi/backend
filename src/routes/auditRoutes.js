import express from 'express';
import { getAuditStats, startAudit, getAuditHistory, getActiveAudit, scanVehicle, completeAudit } from '../controllers/auditController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/stats', protect, getAuditStats);
router.post('/start', protect, startAudit);
router.get('/active', protect, getActiveAudit);
router.post('/:id/scan', protect, scanVehicle);
router.post('/:id/complete', protect, completeAudit);
router.get('/history', protect, getAuditHistory);

export default router;
