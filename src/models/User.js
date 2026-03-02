import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    passwordHash: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['SUPER_ADMIN', 'BRANCH_MANAGER', 'GATE_STAFF', 'GROUND_STAFF'],
        default: 'GROUND_STAFF'
    },
    branchId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Yard',
        default: null
    },
    phone: {
        type: String,
        default: ''
    },
    bloodGroup: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        enum: ['ACTIVE', 'INACTIVE'],
        default: 'ACTIVE'
    },
    profileImage: {
        type: String,
        default: ''
    },
    lastLogin: {
        type: Date,
        default: null
    }
}, { timestamps: true });

export default mongoose.model('User', userSchema);
