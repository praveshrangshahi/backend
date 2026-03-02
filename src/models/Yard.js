import mongoose from 'mongoose';

const yardSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    code: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true
    },
    city: {
        type: String,
        required: true
    },
    capacity: {
        type: Number,
        default: 0
    },
    location: {
        lat: Number,
        lng: Number,
        address: String
    },
    headerTitle: {
        type: String,
        default: 'Jaynt associate'
    },
    contactNumber: String,
    email: String,
    printHeaders: [{
        title: { type: String, required: true },
        address: { type: String, required: true },
        phone: String,
        email: String,
        isDefault: { type: Boolean, default: false }
    }],
    managerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, { timestamps: true });

export default mongoose.model('Yard', yardSchema);
