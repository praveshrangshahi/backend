import mongoose from 'mongoose';

const stockAuditSchema = new mongoose.Schema({
    yardId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Yard',
        required: true
    },
    auditDate: {
        type: Date,
        default: Date.now
    },
    conductedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    expectedVehicles: [
        {
            vehicleId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Vehicle'
            },
            status: {
                type: String,
                enum: ['PENDING', 'SCANNED'],
                default: 'PENDING'
            }
        }
    ],
    scannedVehicles: [
        {
            vehicleId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Vehicle'
            },
            scannedAt: {
                type: Date,
                default: Date.now
            }
        }
    ],
    discrepancies: [
        {
            vehicleId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Vehicle'
            },
            status: {
                type: String,
                enum: ['MISSING', 'FOUND_EXTRA'],
            },
            notes: String
        }
    ],
    totalVehicles: { type: Number, default: 0 },
    verifiedCount: { type: Number, default: 0 },
    missingCount: { type: Number, default: 0 },
    extraCount: { type: Number, default: 0 },
    status: {
        type: String,
        enum: ['IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
        default: 'IN_PROGRESS'
    }
}, { timestamps: true });

export default mongoose.model('StockAudit', stockAuditSchema);
