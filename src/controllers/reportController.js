import Vehicle from '../models/Vehicle.js';
import EntryExitLog from '../models/EntryExitLog.js';
import StockAudit from '../models/StockAudit.js';
import Yard from '../models/Yard.js';
import Expense from '../models/Expense.js';
import mongoose from 'mongoose';

// @desc    Get Daily Movement Report
// @route   GET /api/reports/daily-movement
export const getDailyMovement = async (req, res) => {
    try {
        const { startDate, endDate, branchId } = req.query;
        let yardFilter = {};
        
        if (req.user.role === 'SUPER_ADMIN') {
            if (branchId) yardFilter.yardId = branchId;
        } else {
            yardFilter.yardId = req.user.branchId;
        }

        let query = { ...yardFilter };
        if (startDate && endDate) {
            query.timestamp = { $gte: new Date(startDate), $lte: new Date(endDate) };
        }

        const logs = await EntryExitLog.find(query)
            .populate('vehicleId', 'licensePlate make model variant')
            .populate('handledBy', 'name')
            .sort({ timestamp: -1 });

        const formattedData = logs.map(log => ({
            col1: new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            col2: log.vehicleId?.licensePlate || 'N/A',
            col3: log.vehicleId?.make + ' ' + (log.vehicleId?.model || ''),
            col4: log.gateNumber || 'Gate 1',
            col5: log.type,
            col6: log.handledBy?.name || 'System'
        }));

        res.json({
            title: "Daily Movement Report",
            columns: ["Time", "License Plate", "Vehicle", "Gate", "Action", "Staff"],
            data: formattedData
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get Aging Stock Report
// @route   GET /api/reports/aging-stock
export const getAgingStock = async (req, res) => {
    try {
        const { branchId } = req.query;
        let yardFilter = {};
        if (req.user.role === 'SUPER_ADMIN') {
            if (branchId) yardFilter.yardId = branchId;
        } else {
            yardFilter.yardId = req.user.branchId;
        }

        const vehicles = await Vehicle.find({ status: 'PARKED', ...yardFilter })
            .select('licensePlate make model entryDate client status');

        const now = new Date();
        const formattedData = vehicles.map(v => {
            const daysInYard = Math.floor((now - new Date(v.entryDate)) / (1000 * 60 * 60 * 24));
            let status = "Healthy";
            if (daysInYard > 90) status = "Auction Ready";
            else if (daysInYard > 60) status = "Critical";
            else if (daysInYard > 30) status = "Overdue";

            return {
                col1: v.licensePlate,
                col2: `${v.make} ${v.model}`,
                col3: `${daysInYard} Days`,
                col4: v.client,
                col5: status
            };
        }).sort((a, b) => parseInt(b.col3) - parseInt(a.col3));

        res.json({
            title: "Aging Stock Analysis",
            columns: ["License Plate", "Vehicle", "Days in Yard", "Client", "Priority"],
            data: formattedData
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get Client Inventory Report
// @route   GET /api/reports/client-inventory
export const getClientInventory = async (req, res) => {
    try {
        const { branchId } = req.query;
        let yardFilter = {};
        if (req.user.role === 'SUPER_ADMIN') {
            if (branchId) yardFilter.yardId = branchId ? new mongoose.Types.ObjectId(branchId) : null;
        } else {
            yardFilter.yardId = req.user.branchId;
        }

        const matchStage = { status: 'PARKED' };
        if (yardFilter.yardId) matchStage.yardId = yardFilter.yardId;

        const stats = await Vehicle.aggregate([
            { $match: matchStage },
            { $group: {
                _id: "$client",
                count: { $sum: 1 },
                avgAging: { $avg: { $divide: [{ $subtract: [new Date(), "$entryDate"] }, 1000 * 60 * 60 * 24] } }
            }},
            { $sort: { count: -1 } }
        ]);

        const formattedData = stats.map(s => ({
            col1: s._id || 'Unknown Client',
            col2: s.count.toString(),
            col3: Math.floor(s.avgAging) + " Days",
            col4: "Active"
        }));

        res.json({
            title: "Client Inventory Breakdown",
            columns: ["Client Name", "Total Vehicles", "Avg. Aging", "Status"],
            data: formattedData
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get Revenue Report
// @route   GET /api/reports/revenue-report
export const getRevenueReport = async (req, res) => {
    try {
        const { startDate, endDate, branchId } = req.query;
        let yardFilter = {};
        if (req.user.role === 'SUPER_ADMIN') {
            if (branchId) yardFilter.yardId = branchId;
        } else {
            yardFilter.yardId = req.user.branchId;
        }

        let query = { type: 'EXIT', paymentAmount: { $gt: 0 }, ...yardFilter };
        
        if (startDate && endDate) {
            query.timestamp = { $gte: new Date(startDate), $lte: new Date(endDate) };
        }

        const logs = await EntryExitLog.find(query)
            .populate('vehicleId', 'licensePlate client')
            .sort({ timestamp: -1 });

        const formattedData = logs.map(l => ({
            col1: new Date(l.timestamp).toLocaleDateString(),
            col2: l.vehicleId?.client || 'N/A',
            col3: l.paymentMode || 'CASH',
            col4: `₹${l.paymentAmount}`,
            col5: `₹${Math.floor(l.paymentAmount * 0.18)}`, // 18% GST estimate
            col6: `₹${Math.floor(l.paymentAmount * 1.18)}`
        }));

        res.json({
            title: "Revenue Analysis",
            columns: ["Date", "Client", "Method", "Base Amount", "GST (18%)", "Total"],
            data: formattedData
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get Transaction History
// @route   GET /api/reports/transaction-history
export const getTransactionHistory = async (req, res) => {
    try {
        const { branchId } = req.query;
        let yardFilter = {};
        if (req.user.role === 'SUPER_ADMIN') {
            if (branchId) yardFilter.yardId = branchId;
        } else {
            yardFilter.yardId = req.user.branchId;
        }

        const logs = await EntryExitLog.find({ paymentAmount: { $gt: 0 }, ...yardFilter })
            .populate('vehicleId', 'licensePlate')
            .populate('handledBy', 'name')
            .sort({ timestamp: -1 });

        const formattedData = logs.map(l => ({
            col1: `TXN-${l._id.toString().slice(-6).toUpperCase()}`,
            col2: new Date(l.timestamp).toLocaleString(),
            col3: l.vehicleId?.licensePlate || 'N/A',
            col4: l.paymentMode || 'UPI',
            col5: `₹${l.paymentAmount}`,
            col6: 'Success'
        }));

        res.json({
            title: "Transaction Log",
            columns: ["Txn ID", "Date & Time", "Vehicle", "Method", "Amount", "Status"],
            data: formattedData
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get Stock Audit Report
// @route   GET /api/reports/stock-audit
export const getStockAuditReport = async (req, res) => {
    try {
        const { branchId } = req.query;
        let yardFilter = {};
        if (req.user.role === 'SUPER_ADMIN') {
            if (branchId) yardFilter.yardId = branchId;
        } else {
            yardFilter.yardId = req.user.branchId;
        }

        const audits = await StockAudit.find(yardFilter)
            .populate('yardId', 'name')
            .populate('conductedBy', 'name')
            .sort({ auditDate: -1 });

        const formattedData = audits.map(a => ({
            col1: new Date(a.auditDate).toLocaleDateString(),
            col2: a.yardId?.name || 'Unknown Yard',
            col3: a.totalVehicles.toString(),
            col4: a.verifiedCount.toString(),
            col5: a.discrepancies.length.toString(),
            col6: a.status
        }));

        res.json({
            title: "Stock Audit History",
            columns: ["Audit Date", "Yard", "Total Stock", "Verified", "Discrepancies", "Status"],
            data: formattedData
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get Yard Utilization Report
// @route   GET /api/reports/slot-utilization
export const getYardUtilization = async (req, res) => {
    try {
        const { branchId } = req.query;
        let yardQuery = {};
        if (req.user.role === 'SUPER_ADMIN') {
            if (branchId) yardQuery._id = branchId;
        } else {
            yardQuery._id = req.user.branchId;
        }

        const yards = await Yard.find(yardQuery);
        const stats = await Promise.all(yards.map(async (y) => {
            const count = await Vehicle.countDocuments({ yardId: y._id, status: 'PARKED' });
            const percentage = y.capacity > 0 ? Math.floor((count / y.capacity) * 100) : 0;
            return {
                col1: y.name,
                col2: y.capacity.toString(),
                col3: count.toString(),
                col4: `${percentage}%`,
                col5: y.city,
                col6: percentage > 90 ? 'Critical' : percentage > 70 ? 'High' : 'Normal'
            };
        }));

        res.json({
            title: "Yard Slot Utilization",
            columns: ["Yard Name", "Total Capacity", "Current Stock", "Utilization", "City", "Status"],
            data: stats
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get Gate Activity Report
// @route   GET /api/reports/gate-activity
export const getGateActivity = async (req, res) => {
    try {
        const { branchId } = req.query;
        let yardFilter = {};
        if (req.user.role === 'SUPER_ADMIN') {
            if (branchId) yardFilter.yardId = new mongoose.Types.ObjectId(branchId);
        } else {
            yardFilter.yardId = req.user.branchId;
        }

        const matchStage = {};
        if (yardFilter.yardId) matchStage.yardId = yardFilter.yardId;

        const stats = await EntryExitLog.aggregate([
            { $match: matchStage },
            { $group: {
                _id: { gate: "$gateNumber", type: "$type" },
                count: { $sum: 1 }
            }},
            { $group: {
                _id: "$_id.gate",
                entries: { $sum: { $cond: [{ $eq: ["$_id.type", "ENTRY"] }, "$count", 0] } },
                exits: { $sum: { $cond: [{ $eq: ["$_id.type", "EXIT"] }, "$count", 0] } }
            }},
            { $sort: { _id: 1 } }
        ]);

        const formattedData = stats.map(s => ({
            col1: s._id || 'Gate 1',
            col2: s.entries.toString(),
            col3: s.exits.toString(),
            col4: "10:00 AM", // Peak hour placeholder
            col5: "Security Team",
            col6: "Active"
        }));

        res.json({
            title: "Gate Activity Log",
            columns: ["Gate ID", "Total Entries", "Total Exits", "Peak Hour", "Security Staff", "Status"],
            data: formattedData
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get PNL Statement
// @route   GET /api/reports/pnl-statement
export const getPnlStatement = async (req, res) => {
    try {
        const { startDate, endDate, branchId } = req.query;
        
        let yardFilter = {};
        if (req.user.role === 'SUPER_ADMIN') {
            if (branchId) yardFilter.yardId = branchId;
        } else {
            yardFilter.yardId = req.user.branchId;
        }

        let dateQuery = {};
        if (startDate && endDate) {
            dateQuery = { timestamp: { $gte: new Date(startDate), $lte: new Date(endDate) } };
        }

        // 1. Get All Revenue (Exit Payments)
        const revenueLogs = await EntryExitLog.find({ 
            type: 'EXIT', 
            paymentAmount: { $gt: 0 },
            ...yardFilter,
            ...(startDate && endDate ? { timestamp: dateQuery.timestamp } : {})
        });
        const totalRevenue = revenueLogs.reduce((sum, log) => sum + (log.paymentAmount || 0), 0);

        // 2. Get All Expenses
        const expenseQuery = { ...yardFilter };
        if (startDate && endDate) {
            expenseQuery.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
        }

        const expenses = await Expense.find(expenseQuery);
        const totalExpenses = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);

        // Group expenses by category
        const expenseByCategory = expenses.reduce((acc, exp) => {
            acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
            return acc;
        }, {});

        // Format for table
        const data = [
            { col1: 'REVENUE', col2: 'Direct Revenue', col3: 'Credit', col4: `₹${totalRevenue}`, col5: 'Period Total', col6: 'From Exit Charges' },
            ...Object.entries(expenseByCategory).map(([cat, amt]) => ({
                col1: 'EXPENSE',
                col2: cat,
                col3: 'Debit',
                col4: `₹${amt}`,
                col5: 'Recorded',
                col6: 'Manual Entry'
            })),
            { col1: 'NET PROFIT', col2: '-', col3: 'Balance', col4: `₹${totalRevenue - totalExpenses}`, col5: '-', col6: totalRevenue >= totalExpenses ? 'Profitable' : 'Loss' }
        ];

        res.json({
            title: "Profit & Loss Statement",
            columns: ["Category", "Sub-Category", "Type", "Amount", "Period", "Remarks"],
            data: data
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get Report Activity Stats
// @route   GET /api/reports/stats
export const getReportStats = async (req, res) => {
    try {
        const { branchId } = req.query;
        let yardFilter = {};
        
        if (req.user.role === 'SUPER_ADMIN') {
            if (branchId) yardFilter.yardId = branchId;
        } else {
            yardFilter.yardId = req.user.branchId;
        }

        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        // "Generated" count: Total entries and exits this month
        const generatedCount = await EntryExitLog.countDocuments({
            timestamp: { $gte: startOfMonth },
            ...yardFilter
        });

        // "Scheduled" count: Placeholder 0 for now
        const scheduledCount = 0;

        res.json({
            generated: generatedCount,
            scheduled: scheduledCount
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
