import express from 'express';
import { 
    getDailyMovement, 
    getAgingStock, 
    getClientInventory, 
    getRevenueReport, 
    getTransactionHistory,
    getStockAuditReport,
    getYardUtilization,
    getGateActivity,
    getPnlStatement,
    getReportStats
} from '../controllers/reportController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// All report routes are protected and Super Admin only
router.use(protect);
router.use(authorize('SUPER_ADMIN'));

router.get('/daily-movement', getDailyMovement);
router.get('/gate-activity', getGateActivity);
router.get('/aging-stock', getAgingStock);
router.get('/client-inventory', getClientInventory);
router.get('/revenue-report', getRevenueReport);
router.get('/transaction-history', getTransactionHistory);
router.get('/stock-audit', getStockAuditReport);
router.get('/slot-utilization', getYardUtilization);
router.get('/pnl-statement', getPnlStatement);
router.get('/stats', getReportStats);

export default router;
