import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from './src/models/User.js';
import Yard from './src/models/Yard.js';
import Client from './src/models/Client.js';

dotenv.config();

const seedDatabase = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ MongoDB Connected');

        // Clear existing data (optional - comment out if you want to keep existing data)
        // await User.deleteMany({});
        // await Yard.deleteMany({});
        // await Client.deleteMany({});

        // 1. Create Admin User
        const adminExists = await User.findOne({ email: 'admin@jayant.com' });
        if (!adminExists) {
            const hashedPassword = await bcrypt.hash('admin123', 10);
            const admin = await User.create({
                name: 'Super Admin',
                email: 'admin@jaynt.com',
                passwordHash: hashedPassword,
                role: 'SUPER_ADMIN',
                phone: '9876543210',
                status: 'ACTIVE'
            });
            console.log('✅ Admin user created:', admin.email);
        } else {
            console.log('ℹ️  Admin user already exists');
        }

        // 2. Create Main Yard
        const yardExists = await Yard.findOne({ name: 'Main Yard' });
        let mainYard;
        if (!yardExists) {
            mainYard = await Yard.create({
                name: 'Main Yard',
                code: 'MAINYRD',
                city: 'Mumbai',
                location: {
                    address: 'Plot No. 123, Industrial Area, Mumbai - 400001'
                },
                contactNumber: '022-12345678',
                email: 'mainyard@jaynt.com',
                capacity: 500
            });
            console.log('✅ Main Yard created:', mainYard.name);
        } else {
            mainYard = yardExists;
            console.log('ℹ️  Main Yard already exists');
        }

        // 3. Create Sample Clients
        const clientsData = [
            {
                matchName: 'HDFC Bank',
                type: 'BANK',
                contactPerson: 'Rajesh Kumar',
                email: 'rajesh@hdfc.com',
                phone: '9876543211',
                address: 'HDFC Tower, BKC, Mumbai',
                branchId: mainYard._id,
                status: 'ACTIVE'
            },
            {
                matchName: 'ICICI Bank',
                type: 'BANK',
                contactPerson: 'Priya Sharma',
                email: 'priya@icici.com',
                phone: '9876543212',
                address: 'ICICI Towers, Bandra, Mumbai',
                branchId: mainYard._id,
                status: 'ACTIVE'
            },
            {
                matchName: 'SBI',
                type: 'BANK',
                contactPerson: 'Amit Verma',
                email: 'amit@sbi.com',
                phone: '9876543213',
                address: 'SBI Building, Fort, Mumbai',
                branchId: mainYard._id,
                status: 'ACTIVE'
            }
        ];

        for (const clientData of clientsData) {
            const exists = await Client.findOne({ matchName: clientData.matchName });
            if (!exists) {
                await Client.create(clientData);
                console.log(`✅ Client created: ${clientData.matchName}`);
            } else {
                console.log(`ℹ️  Client already exists: ${clientData.matchName}`);
            }
        }

        // 4. Create Yard Operator User
        const operatorExists = await User.findOne({ email: 'operator@jayant.com' });
        if (!operatorExists) {
            const hashedPassword = await bcrypt.hash('operator123', 10);
            const operator = await User.create({
                name: 'Yard Operator',
                email: 'operator@jaynt.com',
                passwordHash: hashedPassword,
                role: 'GATE_STAFF',
                phone: '9876543220',
                branchId: mainYard._id,
                status: 'ACTIVE'
            });
            console.log('✅ Yard Operator created:', operator.email);
        } else {
            console.log('ℹ️  Yard Operator already exists');
        }

        console.log('\n🎉 Database seeding completed successfully!');
        console.log('\n📝 Login Credentials:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('Super Admin:');
        console.log('  Email: admin@jayant.com');
        console.log('  Password: admin123');
        console.log('\nYard Operator:');
        console.log('  Email: operator@jayant.com');
        console.log('  Password: operator123');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding database:', error);
        process.exit(1);
    }
};

seedDatabase();
