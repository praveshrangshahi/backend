import express from 'express';
import { 
    getVehicles, 
    getVehicleById, 
    registerVehicleEntry, 
    processVehicleExit,
    updateVehicle,
    deleteVehicle,
    getEntryExitLogs,
    getEntryExitStats,
    uploadVehiclePdfs
} from '../controllers/vehicleController.js';
import { protect } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.route('/')
    .get(protect, getVehicles);

router.route('/logs/stats')
    .get(protect, getEntryExitStats);

router.route('/logs')
    .get(protect, getEntryExitLogs);

router.route('/entry')
    .post(protect, registerVehicleEntry);

router.route('/:id/exit')
    .post(protect, processVehicleExit);

router.route('/:id')
    .get(protect, getVehicleById)
    .put(protect, updateVehicle)
    .delete(protect, deleteVehicle);

router.route('/:id/upload-pdfs')
    .post(protect, upload.fields([{ name: 'hindiPdf', maxCount: 1 }, { name: 'englishPdf', maxCount: 1 }]), uploadVehiclePdfs);

export default router;
