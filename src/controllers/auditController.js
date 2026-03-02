import StockAudit from '../models/StockAudit.js';
import Vehicle from '../models/Vehicle.js';

// @desc    Get audit stats for user's yard
// @route   GET /api/audit/stats
// @access  Private
export const getAuditStats = async (req, res) => {
    try {
        const userYardId = req.headers['x-branch-id'] || req.user.branchId;
        
        if (!userYardId || userYardId === 'ALL') {
             return res.json({
                totalVehicles: 0,
                verifiedCount: 0,
                missingCount: 0,
                extraCount: 0,
                completionPercentage: 0,
                lastAudit: null
            });
        }

        const totalVehicles = await Vehicle.countDocuments({ 
            yardId: userYardId,
            status: 'PARKED'
        });

        const latestAudit = await StockAudit.findOne({ yardId: userYardId })
            .sort({ createdAt: -1 })
            .populate('conductedBy', 'name');

        if (!latestAudit) {
            return res.json({
                totalVehicles,
                verifiedCount: 0,
                missingCount: 0,
                extraCount: 0,
                completionPercentage: 0,
                lastAudit: null
            });
        }

        const completionPercentage = latestAudit.totalVehicles > 0 
            ? Math.round((latestAudit.verifiedCount / latestAudit.totalVehicles) * 100) 
            : 0;

        res.json({
            totalVehicles,
            verifiedCount: latestAudit.verifiedCount,
            missingCount: latestAudit.missingCount,
            extraCount: latestAudit.extraCount,
            completionPercentage,
            lastAudit: {
                date: latestAudit.auditDate,
                conductedBy: latestAudit.conductedBy?.name,
                status: latestAudit.status
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get active audit for user's yard
// @route   GET /api/audit/active
// @access  Private
export const getActiveAudit = async (req, res) => {
    try {
        const userYardId = req.headers['x-branch-id'] || req.user.branchId;
        if (!userYardId || userYardId === 'ALL') return res.json(null);
        
        const activeAudit = await StockAudit.findOne({ yardId: userYardId, status: 'IN_PROGRESS' })
            .populate('expectedVehicles.vehicleId', 'licensePlate make model vin')
            .populate('scannedVehicles.vehicleId', 'licensePlate make model vin');
            
        res.json(activeAudit); // Will return null if none
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Start new audit
// @route   POST /api/audit/start
// @access  Private
export const startAudit = async (req, res) => {
    try {
        const userYardId = req.headers['x-branch-id'] || req.user.branchId;
        const userId = req.user._id;

        if (!userYardId || userYardId === 'ALL') {
            return res.status(400).json({ message: 'Please select a specific branch to start an audit.' });
        }

        // Check if one is already in progress
        const existingAudit = await StockAudit.findOne({ yardId: userYardId, status: 'IN_PROGRESS' });
        if (existingAudit) {
            return res.status(400).json({ message: 'An audit is already in progress for this yard' });
        }

        // Get all parked vehicles
        const parkedVehicles = await Vehicle.find({ 
            yardId: userYardId,
            status: 'PARKED'
        }).select('_id');

        const expectedVehicles = parkedVehicles.map(v => ({
            vehicleId: v._id,
            status: 'PENDING'
        }));

        const newAudit = await StockAudit.create({
            yardId: userYardId,
            conductedBy: userId,
            totalVehicles: expectedVehicles.length,
            verifiedCount: 0,
            missingCount: 0,
            extraCount: 0,
            expectedVehicles,
            scannedVehicles: [],
            discrepancies: [],
            status: 'IN_PROGRESS'
        });

        await newAudit.populate([
            { path: 'conductedBy', select: 'name' },
            { path: 'expectedVehicles.vehicleId', select: 'licensePlate make model vin' }
        ]);

        res.status(201).json(newAudit);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Scan a vehicle in an audit
// @route   POST /api/audit/:id/scan
// @access  Private
export const scanVehicle = async (req, res) => {
    try {
        const { identifier } = req.body; // could be licensePlate or vin
        
        const audit = await StockAudit.findById(req.params.id);
        if (!audit) return res.status(404).json({ message: 'Audit not found' });
        if (audit.status !== 'IN_PROGRESS') return res.status(400).json({ message: 'Audit is not in progress' });

        // Find the vehicle in DB by identifier
        const currentYardId = req.headers['x-branch-id'] || req.user.branchId;
        const vehicle = await Vehicle.findOne({ 
            yardId: currentYardId,
            $or: [{ licensePlate: identifier }, { vin: identifier }]
        });

        if (!vehicle) {
            return res.status(404).json({ message: 'Vehicle not found in system', scanResult: 'NOT_FOUND' });
        }

        // Check if already scanned
        const alreadyScanned = audit.scannedVehicles.some(s => s.vehicleId.toString() === vehicle._id.toString());
        if (alreadyScanned) {
            return res.status(400).json({ message: 'Vehicle already scanned', scanResult: 'ALREADY_SCANNED', vehicle });
        }

        // Add to scanned vehicles
        audit.scannedVehicles.push({ vehicleId: vehicle._id });

        // Check if expected
        const expectedIndex = audit.expectedVehicles.findIndex(e => e.vehicleId.toString() === vehicle._id.toString());
        
        let scanResult;
        if (expectedIndex !== -1) {
            // It was expected
            audit.expectedVehicles[expectedIndex].status = 'SCANNED';
            audit.verifiedCount += 1;
            scanResult = 'VERIFIED';
        } else {
            // It was NOT expected (FOUND_EXTRA)
            audit.extraCount += 1;
            audit.discrepancies.push({
                vehicleId: vehicle._id,
                status: 'FOUND_EXTRA',
                notes: 'Found during scan but not expected in parked inventory'
            });
            scanResult = 'EXTRA';
        }

        await audit.save();
        res.json({ message: `Vehicle ${scanResult}`, scanResult, vehicle });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Complete audit
// @route   POST /api/audit/:id/complete
// @access  Private
export const completeAudit = async (req, res) => {
    try {
        const audit = await StockAudit.findById(req.params.id);
        if (!audit) return res.status(404).json({ message: 'Audit not found' });
        if (audit.status !== 'IN_PROGRESS') return res.status(400).json({ message: 'Audit is not in progress' });

        // Calculate missing vehicles (expected but still PENDING)
        let missingCount = 0;
        audit.expectedVehicles.forEach(ev => {
            if (ev.status === 'PENDING') {
                missingCount++;
                audit.discrepancies.push({
                    vehicleId: ev.vehicleId,
                    status: 'MISSING',
                    notes: 'Expected in inventory but not scanned'
                });
            }
        });

        audit.missingCount = missingCount;
        audit.status = 'COMPLETED';

        await audit.save();
        res.json(audit);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get audit history
// @route   GET /api/audit/history
// @access  Private
export const getAuditHistory = async (req, res) => {
    try {
        const userYardId = req.headers['x-branch-id'] || req.user.branchId;
        const limit = parseInt(req.query.limit) || 10;
        
        if (!userYardId || userYardId === 'ALL') return res.json([]);

        const audits = await StockAudit.find({ yardId: userYardId })
            .sort({ createdAt: -1 })
            .limit(limit)
            .populate('conductedBy', 'name');

        res.json(audits);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
