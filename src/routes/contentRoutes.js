import express from 'express';
import { getContent, updateContent } from '../controllers/contentController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/:type')
    .get(getContent)
    .put(protect, admin, updateContent);

export default router;
