import express from 'express';
import { getAllYards, createYard, updateYard, deleteYard } from '../controllers/yardController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
    .get(protect, getAllYards)
    .post(protect, admin, createYard);

router.route('/:id')
    .put(protect, admin, updateYard)
    .delete(protect, admin, deleteYard);

export default router;
