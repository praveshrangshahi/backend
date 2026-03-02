import mongoose from 'mongoose';

const masterDataSchema = new mongoose.Schema({
    pricingRules: [
        {
            type: { type: String, required: true }, // e.g., 'SUV', 'SEDAN'
            daily: { type: Number, default: 0 },
            weekly: { type: Number, default: 0 },
            monthly: { type: Number, default: 0 }
        }
    ],
    paymentQrCode: { type: String },
    upiId: { type: String },
    bankName: { type: String },
    bankAccount: { type: String },
    ifscCode: { type: String },
    repoTypes: [
        {
            label: { type: String, required: true },
            code: { type: String, required: true, unique: true }
        }
    ],
    appConfig: {
        requireGps: { type: Boolean, default: true },
        requirePhotos: { type: Boolean, default: true },
        allowManualEntry: { type: Boolean, default: false }
    }
}, { timestamps: true });

// Ensure only one document exists
masterDataSchema.statics.getSingleton = async function() {
    let doc = await this.findOne();
    if (!doc) {
        doc = await this.create({
            pricingRules: [],
            repoTypes: [],
            appConfig: {}
        });
    }
    return doc;
};

export default mongoose.model('MasterData', masterDataSchema);
