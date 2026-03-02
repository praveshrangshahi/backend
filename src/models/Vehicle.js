import mongoose from 'mongoose';

const vehicleSchema = new mongoose.Schema({
    // --- 1. Basic Identification ---
    licensePlate: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true
    },
    make: String,
    model: String,
    variant: String,
    manufacturingYear: Number,
    category: String, // e.g., 2W, 3W, 4W, CV
    color: String,
    vin: String, // Vehicle Identification Number
    engineNumber: String,
    chassisNumber: String,

    // --- 2. Contract & Borrower Info ---
    client: { type: String, required: true }, // Client Name
    contractNumber: String,
    borrowerName: String,
    borrowerAddress: String,
    customerContactNumber: String,
    paymentStatus: String, // e.g., 'NPA', 'Regular'

    // --- 3. Repossession Details ---
    repoAgent: String,
    repoType: String,
    bankName: String,
    repoDate: Date,
    repAgencyDetails: String,
    inHouseAgent: { type: Boolean, default: false }, // [NEW]
    agentProof: String,
    proofNumber: String,
    
    // --- 4. Yard Management ---
    inventoryOwner: String, 
    yardId: { type: mongoose.Schema.Types.ObjectId, ref: 'Yard', required: true },
    status: { 
        type: String, 
        enum: ['PARKED', 'HELD', 'RELEASED', 'AUCTION'],
        default: 'PARKED'
    },
    entryDate: { type: Date, default: Date.now },
    entryBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    isYardTransfer: { type: Boolean, default: false },

    // --- 5. Physical Condition Report ---
    condition: {
        exterior: String,
        interior: String,
        startingCondition: String, // [NEW] Starts, Does Not Start, Jam, Key Missing, Tochan
        starts: { type: Boolean, default: false },
        battery: String,
        batteryBrandModel: String,
        batteryMake: String, // [NEW]
        odometer: String,
        
        // Detailed components
        bonnet: String,
        headlights: String,
        taillights: String,
        mirrors: String,
        windshield: String,
        suspsension: String,
        brakes: String,
        ac: String,
        engineSound: String
    },
    
    damageReport: String, // [NEW] General damage description

    // --- 6. Accessories Checklist ---
    accessories: {
        originalRC: { type: Boolean, default: false },
        registrationPaperAvailable: { type: Boolean, default: false }, // [NEW]
        insurancePolicyNumber: String, // [NEW]
        
        duplicateKeys: { type: Boolean, default: false },
        originalKeys: { type: Boolean, default: false },
        battery: { type: Boolean, default: false },
        jack: { type: Boolean, default: false },
        toolKit: { type: Boolean, default: false },
        wheelSpanner: { type: Boolean, default: false }, // [NEW]
        spareWheel: { type: Boolean, default: false },
        stereo: { type: Boolean, default: false },
        ac: { type: Boolean, default: false },
        sideMirrors: { type: Boolean, default: false },
        seatCovers: { type: Boolean, default: false },
        mats: { type: Boolean, default: false },
        fogLamps: { type: Boolean, default: false },
        wipers: { type: Boolean, default: false },

        // Heavy Vehicle Items
        tami: { type: Boolean, default: false },
        tirpal: { type: Boolean, default: false },
        rassi: { type: Boolean, default: false }
    },

    // --- 7. Tyre Details ---
    tyreDetails: {
        noOfAxles: Number,
        noOfTyres: Number,
        tyreMake: String, // Changed to tyreMake to match schema view
        goodTyresCount: Number,
        badTyresCount: Number,
        frontRight: String,
        frontLeft: String,
        rearRight: String,
        rearLeft: String,
        frontRightMake: String,
        frontLeftMake: String,
        rearRightMake: String,
        rearLeftMake: String,
        rearRight2: String,
        rearLeft2: String,
        stepneyCondition: String,
        stepneyMake: String
    },

    // --- 8. Key Inventory ---
    keyInventory: {
        originalKeysCount: { type: Number, default: 0 },
        duplicateKeysCount: { type: Number, default: 0 }
    },

    // --- 9. Documentation Images & Proofs ---
    photos: {
        front: String,
        back: String,
        left: String,
        right: String,
        interior: String,
        dashboard: String,
        odometer: String,
        chassis: String,
        chassisTwo: String, // [NEW]
        engine: String,
        rc: String,
        insurance: String,
        surrenderLetter: String,
        policeIntimation: String, // Legacy
        prePoliceIntimation: String, // [NEW]
        postPoliceIntimation: String, // [NEW]
        authLetter: String,
        agentProof: String,
        tyreImages: [String], // Legacy array
        rightTyres: [String], // [NEW]
        leftTyres: [String], // [NEW]
        signature: String,
        agentSignature: String,
        yardStaffSignature: String
    },

    // --- 10. Damage Reporting ---
    damages: [{
        part: String,
        description: String,
        severity: String, // Low, Medium, High
        photo: String
    }],
    
    // --- 11. Documents & PDFs ---
    entryPdfHindi: String,
    entryPdfEnglish: String


}, { timestamps: true });

export default mongoose.model('Vehicle', vehicleSchema);
