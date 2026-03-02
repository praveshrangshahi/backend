import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// Generate JWT Token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email }).populate('branchId', 'name code city');

        if (user && (await bcrypt.compare(password, user.passwordHash))) {
            // Update last login
            user.lastLogin = new Date();
            await user.save();

            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                branchId: user.branchId,
                profileImage: user.profileImage,
                phone: user.phone,
                status: user.status,
                bloodGroup: user.bloodGroup,
                lastLogin: user.lastLogin,
                createdAt: user.createdAt,
                token: generateToken(user._id),
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate('branchId', 'name code city');
        if (user) {
            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                branchId: user.branchId,
                profileImage: user.profileImage,
                phone: user.phone,
                status: user.status,
                bloodGroup: user.bloodGroup,
                lastLogin: user.lastLogin,
                createdAt: user.createdAt,
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (user) {
            user.name = req.body.name || user.name;
            user.phone = req.body.phone || user.phone;
            user.bloodGroup = req.body.bloodGroup || user.bloodGroup;
            user.profileImage = req.body.profileImage || user.profileImage;
            
            const updatedUser = await user.save();
            
            // Populate branch info for consistency
            await updatedUser.populate('branchId', 'name code city');

            res.json({
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                role: updatedUser.role,
                branchId: updatedUser.branchId,
                profileImage: updatedUser.profileImage,
                phone: updatedUser.phone,
                status: updatedUser.status,
                bloodGroup: updatedUser.bloodGroup,
                lastLogin: updatedUser.lastLogin,
                createdAt: updatedUser.createdAt,
                token: generateToken(updatedUser._id), 
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Change user password
// @route   PUT /api/auth/password
// @access  Private
export const changePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    try {
        const user = await User.findById(req.user._id);

        if (user && (await bcrypt.compare(currentPassword, user.passwordHash))) {
            const salt = await bcrypt.genSalt(10);
            user.passwordHash = await bcrypt.hash(newPassword, salt);
            
            await user.save();

            res.json({ message: 'Password updated successfully' });
        } else {
            res.status(401).json({ message: 'Invalid current password' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
