import Yard from '../models/Yard.js';

// @desc    Get all yards
// @route   GET /api/yards
// @access  Private (Admin/Manager?)
export const getAllYards = async (req, res) => {
    try {
        // If query param 'active' is needed later, add here
        const yards = await Yard.find({}).select('name code city capacity location printHeaders headerTitle contactNumber email');
        res.json(yards);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// @desc    Create a new yard
// @route   POST /api/yards
// @access  Private (Admin)
export const createYard = async (req, res) => {
    try {
        const { name, code, city, capacity, location, printHeaders, headerTitle, contactNumber, email } = req.body;

        const yardExists = await Yard.findOne({ code });
        if (yardExists) {
            return res.status(400).json({ message: 'Yard code already exists' });
        }

        const yard = await Yard.create({
            name,
            code,
            city,
            capacity,
            location,
            printHeaders: printHeaders || [], // Default to empty array if not provided
            headerTitle, // Keep specific single fields for backward compatibility if needed, or deprecate
            contactNumber,
            email
        });

        res.status(201).json(yard);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update yard
// @route   PUT /api/yards/:id
// @access  Private (Admin)
export const updateYard = async (req, res) => {
    try {
        const yard = await Yard.findById(req.params.id);

        if (yard) {
            yard.name = req.body.name || yard.name;
            yard.code = req.body.code || yard.code;
            yard.city = req.body.city || yard.city;
            yard.capacity = req.body.capacity || yard.capacity;
            yard.location = req.body.location || yard.location;
            
            // Update printHeaders
            if (req.body.printHeaders) {
                yard.printHeaders = req.body.printHeaders;
            }

            // Legacy fields (optional, keep if you want to support old UI for a bit)
            yard.headerTitle = req.body.headerTitle || yard.headerTitle;
            yard.contactNumber = req.body.contactNumber || yard.contactNumber;
            yard.email = req.body.email || yard.email;

            const updatedYard = await yard.save();
            res.json(updatedYard);
        } else {
            res.status(404).json({ message: 'Yard not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete yard
// @route   DELETE /api/yards/:id
// @access  Private (Admin)
export const deleteYard = async (req, res) => {
    try {
        const yard = await Yard.findById(req.params.id);

        if (yard) {
            await yard.deleteOne();
            res.json({ message: 'Yard removed' });
        } else {
            res.status(404).json({ message: 'Yard not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
