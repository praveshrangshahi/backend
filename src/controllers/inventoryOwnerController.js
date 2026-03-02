import InventoryOwner from '../models/InventoryOwner.js';

// @desc    Get all inventory owners
// @route   GET /api/inventory-owners
// @access  Private
export const getAllOwners = async (req, res) => {
    try {
        const owners = await InventoryOwner.find({});
        res.json(owners);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a new inventory owner
// @route   POST /api/inventory-owners
// @access  Private (Admin)
export const createOwner = async (req, res) => {
    try {
        const { name, code, contactPerson, phone, email, address } = req.body;

        const ownerExists = await InventoryOwner.findOne({ code });
        if (ownerExists) {
            return res.status(400).json({ message: 'Owner code already exists' });
        }

        const owner = await InventoryOwner.create({
            name,
            code,
            contactPerson,
            phone,
            email,
            address
        });

        res.status(201).json(owner);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update inventory owner
// @route   PUT /api/inventory-owners/:id
// @access  Private (Admin)
export const updateOwner = async (req, res) => {
    try {
        const owner = await InventoryOwner.findById(req.params.id);

        if (owner) {
            owner.name = req.body.name || owner.name;
            owner.code = req.body.code || owner.code;
            owner.contactPerson = req.body.contactPerson || owner.contactPerson;
            owner.phone = req.body.phone || owner.phone;
            owner.email = req.body.email || owner.email;
            owner.address = req.body.address || owner.address;

            const updatedOwner = await owner.save();
            res.json(updatedOwner);
        } else {
            res.status(404).json({ message: 'Owner not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete inventory owner
// @route   DELETE /api/inventory-owners/:id
// @access  Private (Admin)
export const deleteOwner = async (req, res) => {
    try {
        const owner = await InventoryOwner.findById(req.params.id);

        if (owner) {
            await owner.deleteOne();
            res.json({ message: 'Owner removed' });
        } else {
            res.status(404).json({ message: 'Owner not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
