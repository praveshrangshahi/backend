import express from 'express';
import upload from '../middleware/uploadMiddleware.js';
import path from 'path';
import fs from 'fs';
import ImageKit from 'imagekit';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// Initialize ImageKit
const imagekit = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
});

router.post('/', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
           return res.status(400).json({ message: 'No file uploaded' });
        }

        // If in production or ImageKit config is present, upload to ImageKit
        if (process.env.NODE_ENV === 'production' || process.env.IMAGEKIT_PRIVATE_KEY) {
            const fileBuffer = fs.readFileSync(req.file.path);
            
            const uploadResponse = await imagekit.upload({
                file: fileBuffer,
                fileName: req.file.filename,
                folder: '/yms_uploads'
            });

            // Delete local file after upload to ImageKit
            if (fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }

            return res.json({
                message: 'Image uploaded to ImageKit',
                filePath: uploadResponse.url,
                fileId: uploadResponse.fileId
            });
        }

        // Local fallback (Dev)
        res.json({
            message: 'Image uploaded locally',
            filePath: `/${req.file.path.replace(/\\/g, '/')}`,
        });
    } catch (err) {
        console.error("Upload error:", err);
        res.status(400).json({ message: err.message });
    }
});

router.delete('/', async (req, res) => {
    try {
        const { filePath, fileId } = req.body;
        if (!filePath && !fileId) {
            return res.status(400).json({ message: 'File path or ID is required' });
        }

        // Handle ImageKit deletion
        if (fileId) {
            await imagekit.deleteFile(fileId);
            return res.json({ message: 'File deleted from ImageKit successfully' });
        }

        // Local deletion logic
        const safePath = path.posix.normalize(filePath).replace(/^(\.\.[\/\\])+/, '');
        const absolutePath = path.join(process.cwd(), safePath);

        if (fs.existsSync(absolutePath)) {
            fs.unlinkSync(absolutePath);
            res.json({ message: 'File deleted locally successfully' });
        } else {
            res.json({ message: 'File already deleted or not found' });
        }
    } catch (err) {
        console.error("Delete error:", err);
        res.status(500).json({ message: err.message });
    }
});

export default router;
