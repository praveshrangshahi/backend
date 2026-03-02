import express from 'express';
import { addExpense, getExpenses, deleteExpense } from '../controllers/expenseController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(authorize('SUPER_ADMIN'));

router.post('/', addExpense);
router.get('/', getExpenses);
router.delete('/:id', deleteExpense);

export default router;
