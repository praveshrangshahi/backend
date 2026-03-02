import mongoose from 'mongoose';

const clientSchema = new mongoose.Schema({
    matchName: {
        type: String,
        required: true,
        trim: true
    },
    type: {
        type: String,
        enum: ['BANK', 'AGENCY', 'CORPORATE'],
        required: true
    },
    contactPerson: {
        type: String,
        trim: true
    },
    email: {
        type: String,
        trim: true,
        lowercase: true
    },
    phone: {
        type: String,
        trim: true
    },
    address: {
        type: String,
        trim: true
    },
    gstNumber: {
        type: String,
        trim: true,
        uppercase: true
    },
    status: {
        type: String,
        enum: ['ACTIVE', 'INACTIVE'],
        default: 'ACTIVE'
    },
    branchId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Yard',
        required: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, { timestamps: true });

export default mongoose.model('Client', clientSchema);
