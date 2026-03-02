import mongoose from 'mongoose';

const inventoryOwnerSchema = new mongoose.Schema({
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
    contactPerson: String,
    phone: String,
    email: String,
    address: String
}, { timestamps: true });

export default mongoose.model('InventoryOwner', inventoryOwnerSchema);
