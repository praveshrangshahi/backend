import express from 'express';
import { getAllOwners, createOwner, updateOwner, deleteOwner } from '../controllers/inventoryOwnerController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
    .get(protect, getAllOwners)
    .post(protect, admin, createOwner);

router.route('/:id')
    .put(protect, admin, updateOwner)
    .delete(protect, admin, deleteOwner);

export default router;
