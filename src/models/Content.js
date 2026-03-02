import mongoose from 'mongoose';

const contentSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true,
        unique: true,
        enum: ['terms', 'privacy', 'faq', 'contact']
    },
    data: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    }
}, { timestamps: true });

export default mongoose.model('Content', contentSchema);
