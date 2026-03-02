import express from 'express';
import { getUsers, createUser, updateUser, deleteUser } from '../controllers/userController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
    .get(protect, authorize('SUPER_ADMIN'), getUsers)
    .post(protect, authorize('SUPER_ADMIN'), createUser);

router.route('/:id')
    .put(protect, authorize('SUPER_ADMIN'), updateUser)
    .delete(protect, authorize('SUPER_ADMIN'), deleteUser);

export default router;
