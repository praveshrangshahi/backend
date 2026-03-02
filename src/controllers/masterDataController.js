import MasterData from '../models/MasterData.js';

// @desc    Get all master data
// @route   GET /api/master-data
// @access  Private/Admin
export const getMasterData = async (req, res) => {
    try {
        const data = await MasterData.getSingleton();
        res.json(data);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update pricing rules
// @route   PATCH /api/master-data/pricing
// @access  Private/Admin
export const updatePricingRules = async (req, res) => {
    try {
        const { pricingRules } = req.body;
        const data = await MasterData.getSingleton();
        data.pricingRules = pricingRules;
        await data.save();
        res.json(data);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update repo types
// @route   PATCH /api/master-data/repo-types
// @access  Private/Admin
export const updateRepoTypes = async (req, res) => {
    try {
        const { repoTypes } = req.body;
        const data = await MasterData.getSingleton();
        data.repoTypes = repoTypes;
        await data.save();
        res.json(data);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};// @desc    Update payment details
// @route   PATCH /api/master-data/payment-details
// @access  Private/Admin
export const updatePaymentDetails = async (req, res) => {
    try {
        const { paymentQrCode, upiId, bankName, bankAccount, ifscCode } = req.body;
        const data = await MasterData.getSingleton();
        
        if (paymentQrCode !== undefined) data.paymentQrCode = paymentQrCode;
        if (upiId !== undefined) data.upiId = upiId;
        if (bankName !== undefined) data.bankName = bankName;
        if (bankAccount !== undefined) data.bankAccount = bankAccount;
        if (ifscCode !== undefined) data.ifscCode = ifscCode;
        
        await data.save();
        res.json(data);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
