import Content from '../models/Content.js';

// @desc    Get content by type
// @route   GET /api/content/:type
// @access  Public
export const getContent = async (req, res) => {
    try {
        const { type } = req.params;
        const content = await Content.findOne({ type });
        
        if (content) {
            res.json(content);
        } else {
            // Return default/empty structure if not found, rather than 404 for smoother UI
            res.json({ type, data: null });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update content
// @route   PUT /api/content/:type
// @access  Private (Admin)
export const updateContent = async (req, res) => {
    try {
        const { type } = req.params;
        const { data } = req.body;

        const content = await Content.findOneAndUpdate(
            { type },
            { data },
            { new: true, upsert: true } // Create if doesn't exist
        );

        res.json(content);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
