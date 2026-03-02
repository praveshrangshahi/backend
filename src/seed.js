import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import connectDB from './config/db.js';
import User from './models/User.js';
import MasterData from './models/MasterData.js';
import Yard from './models/Yard.js';

dotenv.config();

const seedData = async () => {
    await connectDB();

    try {
        console.log('Clearing existing data...');
        // We will maintain MasterData and SuperAdmin, but reset others for clean state if needed
        // For now, let's just Upsert to avoid data loss during dev
        
        // 1. Master Data
        console.log('Seeding Master Data...');
        let masterData = await MasterData.findOne();
        if (!masterData) {
             masterData = await MasterData.create({
                pricingRules: [
                    { type: 'SUV', daily: 100, weekly: 600, monthly: 2500 },
                    { type: 'SEDAN', daily: 80, weekly: 500, monthly: 2000 },
                    { type: 'HATCHBACK', daily: 50, weekly: 300, monthly: 1200 }
                ],
                repoTypes: [
                    { label: 'INVENTORY', code: 'INV' },
                    { label: 'Valuation', code: 'VAL' },
                    { label: 'Surrender', code: 'SUR' },
                    { label: 'Takeover', code: 'TAK' }
                ],
                appConfig: {
                    requireGps: true,
                    requirePhotos: true,
                    allowManualEntry: true
                }
            });
            console.log('Master Data created.');
        } else {
            console.log('Master Data already exists.');
        }

        // 2. Yards
        console.log('Seeding Yards...');
        const yardsData = [
            { name: 'Ujjain Yard', code: 'UJJ', city: 'Ujjain', capacity: 1500, location: { lat: 23.17, lng: 75.78, address: 'Dewas Road, Ujjain' } },
            { name: 'Indore Yard', code: 'IND', city: 'Indore', capacity: 2500, location: { lat: 22.71, lng: 75.85, address: 'Bypass Road, Indore' } },
            { name: 'Shajapur Yard', code: 'SHJ', city: 'Shajapur', capacity: 1000, location: { lat: 23.43, lng: 76.27, address: 'AB Road, Shajapur' } }
        ];

        const yards = [];
        for (const y of yardsData) {
            let yard = await Yard.findOne({ code: y.code });
            if (!yard) {
                yard = await Yard.create(y);
                console.log(`Created Yard: ${y.name}`);
            }
            yards.push(yard);
        }

        const [ujjainYard, indoreYard, shajapurYard] = yards;

        // 3. Users (Super Admin, Managers, Staff)
        console.log('Seeding Users...');
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash('password123', salt); // Default password for all
        const adminHash = await bcrypt.hash('admin123', salt);

        const usersData = [
            { name: 'Super Admin', email: 'admin@yms.com', role: 'SUPER_ADMIN', passwordHash: adminHash, branchId: null },
            { name: 'Ujjain Manager', email: 'manager.ujj@yms.com', role: 'BRANCH_MANAGER', passwordHash, branchId: ujjainYard._id },
            { name: 'Ujjain Staff', email: 'staff.ujj@yms.com', role: 'GATE_STAFF', passwordHash, branchId: ujjainYard._id },
            { name: 'Indore Manager', email: 'manager.ind@yms.com', role: 'BRANCH_MANAGER', passwordHash, branchId: indoreYard._id },
            { name: 'Indore Staff', email: 'staff.ind@yms.com', role: 'GATE_STAFF', passwordHash, branchId: indoreYard._id },
            { name: 'Shajapur Manager', email: 'manager.shj@yms.com', role: 'BRANCH_MANAGER', passwordHash, branchId: shajapurYard._id },
            { name: 'Shajapur Staff', email: 'staff.shj@yms.com', role: 'GATE_STAFF', passwordHash, branchId: shajapurYard._id },
        ];

        for (const u of usersData) {
            const exists = await User.findOne({ email: u.email });
            if (!exists) {
                await User.create(u);
                console.log(`Created User: ${u.name} (${u.email})`);
            } else {
                // optional: update branchId if needed
                if(u.branchId && !exists.branchId) {
                    exists.branchId = u.branchId;
                    await exists.save();
                    console.log(`Updated User Branch: ${u.name}`);
                }
            }
        }

        console.log('Seeding Completed.');
        console.log('-----------------------------------');
        console.log('Credentials:');
        console.log('Super Admin: admin@yms.com / admin123');
        console.log('Managers: manager.ujj@yms.com (Ujjain), manager.ind@yms.com (Indore) / password123');
        console.log('Staff: staff.ujj@yms.com (Ujjain), staff.ind@yms.com (Indore) / password123');
        console.log('-----------------------------------');
        process.exit();
    } catch (error) {
        console.error('Error seeding data:', error);
        process.exit(1);
    }
};

seedData();
