import Client from '../models/Client.js';

// @desc    Get all clients
// @route   GET /api/clients
// @access  Private
export const getClients = async (req, res) => {
    try {
        console.log("Fetching clients for user:", req.user._id, "Role:", req.user.role);
        let branchFilter = {};
        if (req.user.role === 'SUPER_ADMIN') {
            if (req.query.branchId) branchFilter = { branchId: req.query.branchId };
        } else {
            branchFilter = { branchId: req.user.branchId };
        }

        console.log("Executing query with filter:", branchFilter);
        const clients = await Client.find(branchFilter)
            .populate('branchId', 'name city')
            .sort({ createdAt: -1 });

        console.log("Clients found:", clients.length);
        res.json(clients);
    } catch (error) {
        console.error("Error fetching clients:", error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a client
// @route   POST /api/clients
// @access  Private
export const createClient = async (req, res) => {
    try {
        const { matchName, type, contactPerson, email, phone, address, gstNumber, branchId } = req.body;

        // Validation - if user is not ADMIN, enforce their branchId
        let targetBranch = branchId;
        if (req.user.role !== 'SUPER_ADMIN') {
            targetBranch = req.user.branchId;
        }

        const client = await Client.create({
            matchName,
            type,
            contactPerson,
            email,
            phone,
            address,
            gstNumber,
            branchId: targetBranch,
            createdBy: req.user._id
        });

        res.status(201).json(client);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Update a client
// @route   PUT /api/clients/:id
// @access  Private
export const updateClient = async (req, res) => {
    try {
        const client = await Client.findById(req.params.id);

        if (!client) {
            return res.status(404).json({ message: 'Client not found' });
        }

        // Check permission: Non-Admins can only edit their branch's clients
        if (req.user.role !== 'SUPER_ADMIN' && client.branchId.toString() !== req.user.branchId.toString()) {
            return res.status(403).json({ message: 'Not authorized to edit this client' });
        }

        client.matchName = req.body.matchName || client.matchName;
        client.type = req.body.type || client.type;
        client.contactPerson = req.body.contactPerson || client.contactPerson;
        client.email = req.body.email || client.email;
        client.phone = req.body.phone || client.phone;
        client.address = req.body.address || client.address;
        client.gstNumber = req.body.gstNumber || client.gstNumber;
        client.status = req.body.status || client.status;

        const updatedClient = await client.save();
        res.json(updatedClient);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Delete a client
// @route   DELETE /api/clients/:id
// @access  Private
export const deleteClient = async (req, res) => {
    try {
        const client = await Client.findById(req.params.id);

        if (!client) {
            return res.status(404).json({ message: 'Client not found' });
        }

        if (req.user.role !== 'SUPER_ADMIN' && client.branchId.toString() !== req.user.branchId.toString()) {
            return res.status(403).json({ message: 'Not authorized to delete this client' });
        }

        await client.deleteOne();
        res.json({ message: 'Client removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
