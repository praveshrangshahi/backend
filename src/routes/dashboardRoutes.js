import express from 'express';
import { 
    getDashboardStats, 
    getRecentActivity,
    getDashboardTrends,
    getYardStatus,
    getDashboardAlerts
} from '../controllers/dashboardController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/stats', protect, getDashboardStats);
router.get('/trends', protect, getDashboardTrends);
router.get('/yard-status', protect, getYardStatus);
router.get('/alerts', protect, getDashboardAlerts);
router.get('/activity', protect, getRecentActivity);

export default router;
