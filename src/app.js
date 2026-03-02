import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import path from 'path';
import { fileURLToPath } from 'url';

// Environment variables
dotenv.config();

// Connect to Database
connectDB();

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(helmet({
    crossOriginResourcePolicy: false,
}));
app.use(morgan('dev'));

// Static files (for local dev)
const uploadsPath = path.join(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsPath));

// Routes
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to YMS Backend API' });
});

// Routes
import authRoutes from './routes/authRoutes.js';
import vehicleRoutes from './routes/vehicleRoutes.js';

app.use('/api/auth', authRoutes);
app.use('/api/vehicles', vehicleRoutes);
import uploadRoutes from './routes/uploadRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';

app.use('/api/upload', uploadRoutes);
app.use('/api/dashboard', dashboardRoutes);

import yardRoutes from './routes/yardRoutes.js';
app.use('/api/yards', yardRoutes);

import userRoutes from './routes/userRoutes.js';
app.use('/api/users', userRoutes);

import inventoryOwnerRoutes from './routes/inventoryOwnerRoutes.js';
app.use('/api/inventory-owners', inventoryOwnerRoutes);

import clientRoutes from './routes/clientRoutes.js';
app.use('/api/clients', clientRoutes);

import masterDataRoutes from './routes/masterDataRoutes.js';
app.use('/api/master-data', masterDataRoutes);

import reportRoutes from './routes/reportRoutes.js';
app.use('/api/reports', reportRoutes);

import expenseRoutes from './routes/expenseRoutes.js';
app.use('/api/expenses', expenseRoutes);

import searchRoutes from './routes/searchRoutes.js';
app.use('/api/search', searchRoutes);

import contentRoutes from './routes/contentRoutes.js';
app.use('/api/content', contentRoutes);

import auditRoutes from './routes/auditRoutes.js';
app.use('/api/audit', auditRoutes);

// Error Handling Middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

export default app;
