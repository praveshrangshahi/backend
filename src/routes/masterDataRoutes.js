import express from 'express';
import { 
    getMasterData, 
    updatePricingRules, 
    updateRepoTypes,
    updatePaymentDetails
} from '../controllers/masterDataController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getMasterData); // Allow any authenticated user to view
router.patch('/pricing', protect, authorize('SUPER_ADMIN'), updatePricingRules);
router.patch('/repo-types', protect, authorize('SUPER_ADMIN'), updateRepoTypes);
router.patch('/payment-details', protect, authorize('SUPER_ADMIN'), updatePaymentDetails);

export default router;
