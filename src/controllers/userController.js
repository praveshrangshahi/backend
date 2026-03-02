import User from '../models/User.js';
import bcrypt from 'bcryptjs';

// @desc    Get all users (employees)
// @route   GET /api/users
// @access  Private/Admin
export const getUsers = async (req, res) => {
    try {
        const { branchId, keyword, pageNumber, pageSize } = req.query;
        let query = {};
        
        if (branchId) {
            query.branchId = branchId;
        }

        if (keyword) {
            query.$or = [
                { name: { $regex: keyword, $options: 'i' } },
                { email: { $regex: keyword, $options: 'i' } }
            ];
        }

        const page = Number(pageNumber) || 1;
        const limit = Number(pageSize) || 8;
        const skip = (page - 1) * limit;

        const count = await User.countDocuments(query);
        const users = await User.find(query)
            .select('-passwordHash')
            .sort({ createdAt: -1 })
            .limit(limit)
            .skip(skip);

        res.json({
            users,
            page,
            pages: Math.ceil(count / limit),
            total: count
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a new user
// @route   POST /api/users
// @access  Private/Admin
export const createUser = async (req, res) => {
    const { name, email, password, role, branchId, status, phone, bloodGroup, profileImage } = req.body;

    try {
        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const user = await User.create({
            name,
            email,
            passwordHash,
            role,
            branchId: branchId || null,
            status: status || 'ACTIVE',
            phone: phone || '',
            bloodGroup: bloodGroup || '',
            profileImage: profileImage || ''
        });

        if (user) {
            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                branchId: user.branchId,
                status: user.status,
                phone: user.phone,
                bloodGroup: user.bloodGroup,
                profileImage: user.profileImage
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
export const updateUser = async (req, res) => {
    const { name, email, role, branchId, status, password, phone, bloodGroup, profileImage } = req.body;

    try {
        const user = await User.findById(req.params.id);

        if (user) {
            user.name = name || user.name;
            user.email = email || user.email;
            user.role = role || user.role;
            user.branchId = branchId || user.branchId;
            user.status = status || user.status;
            user.phone = phone !== undefined ? phone : user.phone;
            user.bloodGroup = bloodGroup !== undefined ? bloodGroup : user.bloodGroup;
            user.profileImage = profileImage !== undefined ? profileImage : user.profileImage;

            if (password) {
                const salt = await bcrypt.genSalt(10);
                user.passwordHash = await bcrypt.hash(password, salt);
            }

            const updatedUser = await user.save();

            res.json({
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                role: updatedUser.role,
                branchId: updatedUser.branchId,
                status: updatedUser.status,
                phone: updatedUser.phone,
                bloodGroup: updatedUser.bloodGroup,
                profileImage: updatedUser.profileImage
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
export const deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (user) {
            await user.deleteOne();
            res.json({ message: 'User removed' });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
