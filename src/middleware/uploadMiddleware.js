import multer from 'multer';
import path from 'path';
import fs from 'fs';

const storage = multer.memoryStorage();

function checkFileType(file, cb) {
    const imageAndDocTypes = /jpg|jpeg|png|pdf/;
    const videoTypes = /mp4|mov|avi|mkv|webm/;
    const videoMime = /video\/(mp4|quicktime|x-msvideo|x-matroska|webm)/;
    
    const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
    const isImageOrDoc = imageAndDocTypes.test(ext) && imageAndDocTypes.test(file.mimetype);
    const isVideo = videoTypes.test(ext) && videoMime.test(file.mimetype);

    if (isImageOrDoc || isVideo) {
        return cb(null, true);
    } else {
        cb(new Error(`Images, PDFs, and Videos only! (Ext: ${path.extname(file.originalname)}, Mime: ${file.mimetype})`));
    }
}

const upload = multer({
    storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit for videos
    fileFilter: function (req, file, cb) {
        checkFileType(file, cb);
    },
});

export default upload;
