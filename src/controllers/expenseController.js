import Expense from '../models/Expense.js';

// @desc    Add a new expense
// @route   POST /api/expenses
export const addExpense = async (req, res) => {
    try {
        const { category, amount, date, description, yardId } = req.body;
        
        const expense = await Expense.create({
            category,
            amount,
            date,
            description,
            yardId,
            recordedBy: req.user._id
        });

        res.status(201).json(expense);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all expenses
// @route   GET /api/expenses
export const getExpenses = async (req, res) => {
    try {
        const { branchId, startDate, endDate } = req.query;
        let yardFilter = {};

        if (req.user.role === 'SUPER_ADMIN') {
            if (branchId) yardFilter.yardId = branchId;
        } else {
            yardFilter.yardId = req.user.branchId;
        }

        let query = { ...yardFilter };
        if (startDate && endDate) {
            query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
        }

        const expenses = await Expense.find(query)
            .populate('yardId', 'name')
            .populate('recordedBy', 'name')
            .sort({ date: -1 });

        res.json(expenses);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete an expense
// @route   DELETE /api/expenses/:id
export const deleteExpense = async (req, res) => {
    try {
        const expense = await Expense.findById(req.params.id);
        if (!expense) {
            return res.status(404).json({ message: 'Expense not found' });
        }
        await expense.deleteOne();
        res.json({ message: 'Expense removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
