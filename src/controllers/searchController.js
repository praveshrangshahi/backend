import Vehicle from '../models/Vehicle.js';
import Client from '../models/Client.js';
import User from '../models/User.js';

// @desc    Global Universal Search
// @route   GET /api/search
// @access  Private
export const globalSearch = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q || q.length < 2) {
            return res.json([]);
        }

        const query = { $regex: q, $options: 'i' };
        
        // Parallel search across collections
        const [vehicles, clients, users] = await Promise.all([
            Vehicle.find({
                $or: [
                    { licensePlate: query },
                    { vin: query },
                    { make: query },
                    { model: query }
                ]
            }).limit(5).select('licensePlate make model'),

            Client.find({
                $or: [
                    { matchName: query },
                    { email: query }
                ]
            }).limit(3).select('matchName email'),

            User.find({
                $or: [
                    { name: query },
                    { email: query }
                ]
            }).limit(3).select('name role')
        ]);

        // Format results
        const results = [
            ...vehicles.map(v => ({
                id: v._id,
                type: 'vehicle',
                title: v.licensePlate,
                subtitle: `${v.make} ${v.model}`,
                link: `/vehicles/${v._id}`
            })),
            ...clients.map(c => ({
                id: c._id,
                type: 'client',
                title: c.matchName,
                subtitle: 'Client',
                link: `/clients` // Assuming we filter clients page or go to detail if existed
            })),
            ...users.map(u => ({
                id: u._id,
                type: 'user',
                title: u.name,
                subtitle: u.role.replace('_', ' ').toLowerCase(),
                link: `/users`
            }))
        ];

        res.json(results);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
