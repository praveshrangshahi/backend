import mongoose from 'mongoose';
import Vehicle from '../models/Vehicle.js';
import EntryExitLog from '../models/EntryExitLog.js';
import Yard from '../models/Yard.js';
import User from '../models/User.js';

// @desc    Get dashboard statistics
// @route   GET /api/dashboard/stats
// @access  Private
export const getDashboardStats = async (req, res) => {
    try {
        let yardFilter = {};
        if (req.user.role === 'SUPER_ADMIN') {
            if (req.query.branchId && req.query.branchId !== 'null' && req.query.branchId !== 'undefined') {
                yardFilter = { yardId: new mongoose.Types.ObjectId(req.query.branchId) };
            }
        } else {
            yardFilter = { yardId: req.user.branchId };
        }

        const totalInventory = await Vehicle.countDocuments({ status: 'PARKED', ...yardFilter });
        
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const todayEntries = await EntryExitLog.countDocuments({
            type: 'ENTRY',
            timestamp: { $gte: startOfDay, $lte: endOfDay },
            ...yardFilter
        });

        const todayExits = await EntryExitLog.countDocuments({
            type: 'EXIT',
            timestamp: { $gte: startOfDay, $lte: endOfDay },
            ...yardFilter
        });

        // Calculate Monthly Revenue
        const revenueStats = await EntryExitLog.aggregate([
            { 
                $match: { 
                    type: 'EXIT', 
                    timestamp: { $gte: startOfMonth },
                    ...yardFilter
                } 
            },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: '$paymentAmount' },
                    totalFines: { $sum: { $cond: [{ $gt: ["$totalDays", 2] }, 100, 0] } } // Mock logic for fines: 100 if > 2 days
                }
            }
        ]);

        const totalRevenue = revenueStats[0]?.totalRevenue || 0;
        const totalFines = revenueStats[0]?.totalFines || 0;

        res.json({
            totalInventory,
            todayEntries,
            todayExits,
            totalRevenue,
            totalFines
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get recent activity logs
// @route   GET /api/dashboard/activity
// @access  Private
export const getRecentActivity = async (req, res) => {
    try {
        let yardFilter = {};
        if (req.user.role === 'SUPER_ADMIN' && req.query.branchId) yardFilter = { yardId: req.query.branchId };
        else if (req.user.role !== 'SUPER_ADMIN') yardFilter = { yardId: req.user.branchId };

        const logs = await EntryExitLog.find(yardFilter)
            .sort({ timestamp: -1 })
            .limit(10)
            .populate('vehicleId', 'licensePlate make model')
            .populate('handledBy', 'name');

        res.json(logs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get dashboard trends (vehicle types)
// @route   GET /api/dashboard/trends
// @access  Private
export const getDashboardTrends = async (req, res) => {
    try {
        let branchId = null;
        if (req.user.role === 'SUPER_ADMIN') {
            if (req.query.branchId && req.query.branchId !== 'null' && req.query.branchId !== 'undefined') {
                branchId = req.query.branchId;
            }
        } else {
            branchId = req.user.branchId;
        }

        const matchQuery = { status: 'PARKED' };
        if (branchId) {
            matchQuery.yardId = new mongoose.Types.ObjectId(branchId);
        }

        const trends = await Vehicle.aggregate([
            { $match: matchQuery },
            {
                $group: {
                    _id: '$category', 
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } }
        ]);
        
        const colors = [
            'bg-[#98E2E1]', // Teal
            'bg-[#F3C465]', // Yellow
            'bg-[#FF6B6B]', // Red
            'bg-[#4ECDC4]', // Green
            'bg-[#A0ACE0]', // Purple
        ];

        const formattedTrends = trends.map((t, index) => ({
             name: t._id || 'Unknown',
             type: t._id || 'Unknown', 
             c: t.count,
             t: Math.floor(Math.random() * 50), // Mock turnover for now
             color: colors[index % colors.length]
         }));

        res.json(formattedTrends);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get yard status
// @route   GET /api/dashboard/yard-status
// @access  Private
export const getYardStatus = async (req, res) => {
    try {
        let yardFilter = {};
        if (req.user.role === 'SUPER_ADMIN' && req.query.branchId) yardFilter = { yardId: req.query.branchId };
        else if (req.user.role !== 'SUPER_ADMIN') yardFilter = { yardId: req.user.branchId };

        // If yardId is present, fetch specific yard details. Else, aggregate for all.
        let totalCapacity = 0;
        let managerName = 'Multiple Managers';
        let yardName = 'All Yards';
        
        if (yardFilter.yardId) {
             const yard = await Yard.findById(yardFilter.yardId).populate('managerId', 'name');
             if (yard) {
                 totalCapacity = yard.capacity;
                 yardName = yard.name;
                 if (yard.managerId) managerName = yard.managerId.name;
                 else managerName = 'Unassigned';
             }
        } else {
            // Aggregate capacity of ALL yards
            const allYards = await Yard.find({});
            totalCapacity = allYards.reduce((sum, y) => sum + (y.capacity || 0), 0);
        }

        const currentOccupancy = await Vehicle.countDocuments({ status: 'PARKED', ...yardFilter });
        const staffCount = await User.countDocuments({ 
            // If super admin looking at all yards, count all relevant staff. Else specific yard.
            ...(yardFilter.yardId ? { branchId: yardFilter.yardId } : {}),
            role: { $in: ['YARD_MANAGER', 'YARD_STAFF'] } 
        });
        
        // Calculate dynamic efficiency (e.g., Space Utilization %)
        // Avoid division by zero
        const efficiencyScore = totalCapacity > 0 ? Math.round((currentOccupancy / totalCapacity) * 100) : 0;
        
        // Mock trend for now as we don't have historical snapshots yet
        const efficiencyTrend = 0; 

        res.json({
            name: yardName,
            status: 'Operational', 
            capacity: totalCapacity,
            occupancy: currentOccupancy,
            manager: {
                name: managerName || 'Unassigned',
                role: 'Yard Manager'
            },
            staffCount: staffCount,
            efficiency: {
                score: efficiencyScore,
                trend: efficiencyTrend
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get dashboard alerts
// @route   GET /api/dashboard/alerts
// @access  Private
export const getDashboardAlerts = async (req, res) => {
    try {
        let yardFilter = {};
        if (req.user.role === 'SUPER_ADMIN' && req.query.branchId) yardFilter = { yardId: req.query.branchId };
        else if (req.user.role !== 'SUPER_ADMIN') yardFilter = { yardId: req.user.branchId };

        const heldVehicles = await Vehicle.find({ status: 'HELD', ...yardFilter }).limit(5).select('licensePlate make model');
        
        const dynamicAlerts = heldVehicles.map(v => ({
            title: `Vehicle Held: ${v.licensePlate}`,
            time: 'N/A',
            date: 'Today',
            type: 'warning'
        }));

        if (dynamicAlerts.length === 0) {
             res.json([
                { title: "Damage Reported", time: "09:00 am", date: "Today", type: "alert" },
                { title: "VIP Entry: Director", time: "10:30 am", date: "Today", type: "info" },
            ]);
        } else {
            res.json(dynamicAlerts);
        }

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
