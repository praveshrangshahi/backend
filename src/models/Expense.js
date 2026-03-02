import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema({
    category: {
        type: String,
        required: true,
        enum: ['Rent', 'Electricity', 'Water', 'Salaries', 'Security', 'Maintenance', 'Taxes', 'Others'],
        default: 'Others'
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    date: {
        type: Date,
        default: Date.now
    },
    description: {
        type: String,
        trim: true
    },
    yardId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Yard',
        required: true
    },
    recordedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, { timestamps: true });

export default mongoose.model('Expense', expenseSchema);
