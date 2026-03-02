import mongoose from 'mongoose';

const entryExitLogSchema = new mongoose.Schema({
    vehicleId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vehicle',
        required: true
    },
    type: {
        type: String,
        enum: ['ENTRY', 'EXIT'],
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    yardId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Yard',
        required: true
    },
    gateNumber: String,
    handledBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    // Entry Specific
    odometerReading: Number,
    
    // Exit Specific
    customerName: String,
    customerContactNumber: String,
    paymentMode: {
        type: String,
        enum: ['CASH', 'UPI', 'BANK_TRANSFER', 'YARD_TRANSFER'],
    },
    paymentAmount: Number,
    paymentScreenshot: String,
    paymentRemarks: String,
    exitPhoto1: String,
    exitPhoto2: String,
    releaseLetter: String,
    totalDays: Number,
    rentPerDay: Number,
    isYardTransfer: { type: Boolean, default: false },
    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, { timestamps: true });

export default mongoose.model('EntryExitLog', entryExitLogSchema);
