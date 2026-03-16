import Vehicle from '../models/Vehicle.js';
import EntryExitLog from '../models/EntryExitLog.js';
import Yard from '../models/Yard.js';
import Client from '../models/Client.js';
import ImageKit from 'imagekit';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

// Initialize ImageKit
const imagekit = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
});

// @desc    Get all vehicles
// @route   GET /api/vehicles
// @access  Private
export const getVehicles = async (req, res) => {
    try {
        const pageSize = 10;
        const page = Number(req.query.pageNumber) || 1;

        let searchKeyword = {};
        if (req.query.keyword) {
            const keyword = req.query.keyword.trim();
            // Create a space-agnostic regex for the license plate
            // e.g. "MP 09" becomes "M\s*P\s*0\s*9" which matches "MP09" or "MP 09"
            const plateRegex = keyword.replace(/\s+/g, '').split('').join('\\s*');
            
            searchKeyword = {
                $or: [
                    { licensePlate: { $regex: plateRegex, $options: 'i' } },
                    { make: { $regex: keyword, $options: 'i' } },
                    { model: { $regex: keyword, $options: 'i' } }
                ],
            };
        }
        
        // Filter by Status if provided
        const statusFilter = req.query.status ? { status: req.query.status } : {};

        // Filter by Branch/Yard (Allow cross-branch access as requested)
        let yardFilter = {};
        if (req.query.branchId) {
            yardFilter = { yardId: req.query.branchId };
        }

        const count = await Vehicle.countDocuments({ ...searchKeyword, ...statusFilter, ...yardFilter });
        const vehicles = await Vehicle.find({ ...searchKeyword, ...statusFilter, ...yardFilter })
            .populate('yardId', 'name city')
            .limit(pageSize)
            .skip(pageSize * (page - 1))
            .sort({ createdAt: -1 });

        res.json({ vehicles, page, pages: Math.ceil(count / pageSize) });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get vehicle by ID
// @route   GET /api/vehicles/:id
// @access  Private
export const getVehicleById = async (req, res) => {
    try {
        const vehicle = await Vehicle.findById(req.params.id)
            .populate('yardId', 'name city')
            .populate('entryBy', 'name');

        if (vehicle) {
            res.json(vehicle);
        } else {
            res.status(404).json({ message: 'Vehicle not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Register new vehicle entry
// @route   POST /api/vehicles/entry
// @access  Private
export const registerVehicleEntry = async (req, res) => {
    // Destructure all possible fields from request body matching the new schema
    const {
        // 1. Basic
        licensePlate, make, model, variant, manufacturingYear, category, color, vin, engineNumber, chassisNumber,
        plateCondition, actualRcNumber, // [NEW]
        // 2. Contract
        client, contractNumber, borrowerName, borrowerAddress, customerContactNumber, vehicleState, paymentStatus,
        // 3. Repo
        repoAgent, repoType, bankName, repoDate, repAgencyDetails, inHouseAgent, agentProof, proofNumber, inventoryOwner,
        // 4. Yard
        yardId, isYardTransfer,
        // 5. Condition
        condition, // { exterior, interior, starts, startingCondition, battery... }
        // 6. Accessories
        accessories, // { originalRC, registrationPaperAvailable... }
        // 7. Tyres
        tyreDetails, // { noOfAxles, goodTyresCount... }
        // 8. Keys
        keyInventory,
        // 9. Photos
        photos, // { front, back, chassisTwo, rightTyres, interior, frontTyre, backTyre... }
        // 10. Damages
        damages,
        damageReport,
        // 11. Entry Date (user-selected, supports back-dating)
        entryDate
    } = req.body;

    // Start a session for transaction - REMOVED for standalone support
    // const session = await Vehicle.startSession();
    // session.startTransaction();

    try {
        // 1. Resolve Client Name if ID is provided (consistent with Mobile App sending IDs)
        let resolvedClientName = client;
        const idPattern = /^[0-9a-fA-F]{24}$/;
        if (idPattern.test(client)) {
            const clientDoc = await Client.findById(client);
            if (clientDoc) {
                resolvedClientName = clientDoc.matchName;
            }
        }

        // 2. Check if vehicle already exists
        const existingVehicle = await Vehicle.findOne({ licensePlate });
        
        // Verification: If vehicle exists and is currently PARKED, we might strictly block or allow update (re-entry logic differs)
        if (existingVehicle && existingVehicle.status === 'PARKED') {
             return res.status(400).json({ message: 'Vehicle is already marked as PARKED in the yard.' });
        }

        const vehicleData = {
            licensePlate, make, model, variant, manufacturingYear, category, color, vin, engineNumber, chassisNumber,
            plateCondition, actualRcNumber, // [NEW]
            client: resolvedClientName, contractNumber, borrowerName, borrowerAddress, customerContactNumber, vehicleState, paymentStatus,
            repoAgent, repoType, bankName, repoDate, repAgencyDetails, inHouseAgent, agentProof, proofNumber, inventoryOwner,
            yardId: yardId || req.user.branchId, status: 'PARKED', entryDate: entryDate ? new Date(entryDate) : Date.now(), entryBy: req.user._id, isYardTransfer,
            condition, accessories, tyreDetails, keyInventory, photos, damages, damageReport
        };

        // Remove undefined fields to avoid overwriting with null/undefined if we were doing a partial update
        Object.keys(vehicleData).forEach(key => vehicleData[key] === undefined && delete vehicleData[key]);

        let vehicle;
        if (existingVehicle) {
            // Update existing record (Re-entry of same vehicle)
            Object.assign(existingVehicle, vehicleData);
            vehicle = await existingVehicle.save();
        } else {
            // Create new vehicle
            const vehicles = await Vehicle.create([vehicleData]);
            vehicle = vehicles[0];
        }

        // 3. Create Entry Log
        await EntryExitLog.create({
            vehicleId: vehicle._id,
            type: 'ENTRY',
            yardId: vehicle.yardId,
            gateNumber: 'MAIN',
            handledBy: req.user._id,
            odometerReading: condition?.odometer || 0
        });

        res.status(201).json(vehicle);

    } catch (error) {
        console.error("Entry Error:", error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Process vehicle exit
// @route   POST /api/vehicles/:id/exit
// @access  Private
export const processVehicleExit = async (req, res) => {
    const {
        customerName, customerContactNumber, paymentMode, paymentAmount, 
        paymentScreenshot, paymentRemarks, exitPhoto1, exitPhoto2, 
        releaseLetter, releaseAadharPhoto, releaseVideo, exitNote,
        totalDays, rentPerDay, isYardTransfer
    } = req.body;

    // Transactions removed to support standalone MongoDB instances
    try {
        const vehicle = await Vehicle.findById(req.params.id);

        if (!vehicle) {
            return res.status(404).json({ message: 'Vehicle not found' });
        }

        if (vehicle.status !== 'PARKED') {
            return res.status(400).json({ message: 'Vehicle is not currently in the yard.' });
        }

        // 1. Update Vehicle Status
        vehicle.status = 'RELEASED';
        await vehicle.save();

        // 2. Create Exit Log
        await EntryExitLog.create({
            vehicleId: vehicle._id,
            type: 'EXIT',
            yardId: vehicle.yardId,
            gateNumber: 'MAIN',
            handledBy: req.user._id,
            customerName,
            customerContactNumber,
            paymentMode,
            paymentAmount,
            paymentScreenshot,
            paymentRemarks,
            releasePhoto: exitPhoto1, // Mapping for backward compatibility if needed, but keeping original ones
            exitPhoto1,
            exitPhoto2,
            releaseLetter,
            releaseAadharPhoto,
            releaseVideo,
            exitNote,
            totalDays,
            rentPerDay,
            isYardTransfer: isYardTransfer || false,
        });

        res.json({ message: 'Vehicle exit processed successfully' });

    } catch (error) {
        console.error("Exit Processing Error:", error);
        res.status(500).json({ message: error.message || 'Internal server error during exit processing' });
    }
};

// @desc    Update vehicle details
// @route   PUT /api/vehicles/:id
// @access  Private
export const updateVehicle = async (req, res) => {
    try {
        const vehicle = await Vehicle.findById(req.params.id);

        if (vehicle) {
            // Resolve Client Name if ID is provided in body
            if (req.body.client) {
                const idPattern = /^[0-9a-fA-F]{24}$/;
                if (idPattern.test(req.body.client)) {
                    const clientDoc = await Client.findById(req.body.client);
                    if (clientDoc) {
                        req.body.client = clientDoc.matchName;
                    }
                }
            }

            // Update fields
            Object.assign(vehicle, req.body);
            const updatedVehicle = await vehicle.save();
            res.json(updatedVehicle);
        } else {
            res.status(404).json({ message: 'Vehicle not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete vehicle
// @route   DELETE /api/vehicles/:id
// @access  Private
export const deleteVehicle = async (req, res) => {
    try {
        const vehicle = await Vehicle.findById(req.params.id);

        if (vehicle) {
            await vehicle.deleteOne();
            res.json({ message: 'Vehicle removed' });
        } else {
            res.status(404).json({ message: 'Vehicle not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get Entry/Exit Logs
// @route   GET /api/vehicles/logs
// @access  Private
// @desc    Get Entry/Exit Logs
// @route   GET /api/vehicles/logs
// @access  Private
export const getEntryExitLogs = async (req, res) => {
    try {
        const pageSize = Number(req.query.pageSize) || 15;
        const page = Number(req.query.pageNumber) || 1;
        const type = req.query.type; // ENTRY or EXIT
        const keyword = req.query.keyword;

        const query = {};
        
        if (type) {
            query.type = type.toUpperCase();
        }

        // Filter by Yard (if not Super Admin)
        if (req.user.role !== 'SUPER_ADMIN') {
            query.yardId = req.user.branchId;
        } else if (req.query.branchId) {
             query.yardId = req.query.branchId;
        }

        // Search Logic
        if (keyword) {
            // Find vehicles that match the keyword
            const matchingVehicles = await Vehicle.find({
                $or: [
                    { licensePlate: { $regex: keyword, $options: 'i' } },
                    { make: { $regex: keyword, $options: 'i' } },
                    { model: { $regex: keyword, $options: 'i' } }
                ]
            }).select('_id');

            const vehicleIds = matchingVehicles.map(v => v._id);
            query.vehicleId = { $in: vehicleIds };
        }

        // Date Range Filter
        if (req.query.startDate && req.query.endDate) {
            query.timestamp = {
                $gte: new Date(req.query.startDate),
                $lte: new Date(req.query.endDate)
            };
        } else if (req.query.startDate) {
             query.timestamp = { $gte: new Date(req.query.startDate) };
        } else if (req.query.endDate) {
             query.timestamp = { $lte: new Date(req.query.endDate) };
        }

        const count = await EntryExitLog.countDocuments(query);
        
        const logs = await EntryExitLog.find(query)
            .populate('vehicleId')
            .populate('handledBy', 'name')
            .populate('yardId', 'name')
            .populate('approvedBy', 'name')
            .limit(pageSize)
            .skip(pageSize * (page - 1))
            .sort({ createdAt: -1 });

        res.json({ logs, page, pages: Math.ceil(count / pageSize), total: count });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get Entry/Exit Stats
// @route   GET /api/vehicles/logs/stats
// @access  Private
export const getEntryExitStats = async (req, res) => {
    try {
        const query = {};
        
        // Filter by Yard (if not Super Admin)
        if (req.user.role !== 'SUPER_ADMIN') {
            query.yardId = req.user.branchId;
        } else if (req.query.branchId) {
             query.yardId = req.query.branchId;
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // 1. Traffic Overview (Today)
        const entriesToday = await EntryExitLog.countDocuments({ ...query, type: 'ENTRY', timestamp: { $gte: today } });
        const exitsToday = await EntryExitLog.countDocuments({ ...query, type: 'EXIT', timestamp: { $gte: today } });

        // 2. Vehicles Currently in Yard
        // Note: yardId filter is already in 'query' for Logs, but Vehicle model uses 'yardId' too.
        // We need to use valid Vehicle filters. 'query.yardId' is suitable.
        const vehicleQuery = { status: 'PARKED' };
        if (req.query.branchId) {
            vehicleQuery.yardId = req.query.branchId;
        }

        const parkedCount = await Vehicle.countDocuments(vehicleQuery);

        res.json({
            entriesToday,
            exitsToday,
            parkedCount
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Upload vehicle entry PDFs (Hindi & English)
// @route   POST /api/vehicles/:id/upload-pdfs
// @access  Private
export const uploadVehiclePdfs = async (req, res) => {
    try {
        const vehicle = await Vehicle.findById(req.params.id);
        
        if (!vehicle) {
            return res.status(404).json({ message: 'Vehicle not found' });
        }

        // Files uploaded via memoryStorage will be in req.files[name][0].buffer
        const hindiPdfFile = req.files?.hindiPdf?.[0];
        const englishPdfFile = req.files?.englishPdf?.[0];

        if (hindiPdfFile) {
            const uploadResponse = await imagekit.upload({
                file: hindiPdfFile.buffer,
                fileName: `entry_hindi_${vehicle._id}${path.extname(hindiPdfFile.originalname)}`,
                folder: '/yms_pdfs'
            });
            vehicle.entryPdfHindi = uploadResponse.url;
        }

        if (englishPdfFile) {
            const uploadResponse = await imagekit.upload({
                file: englishPdfFile.buffer,
                fileName: `entry_english_${vehicle._id}${path.extname(englishPdfFile.originalname)}`,
                folder: '/yms_pdfs'
            });
            vehicle.entryPdfEnglish = uploadResponse.url;
        }

        await vehicle.save();

        res.json({
            message: 'PDFs uploaded to ImageKit successfully',
            entryPdfHindi: vehicle.entryPdfHindi,
            entryPdfEnglish: vehicle.entryPdfEnglish
        });
    } catch (error) {
        console.error("PDF Upload Error:", error);
        res.status(500).json({ message: error.message });
    }
};
