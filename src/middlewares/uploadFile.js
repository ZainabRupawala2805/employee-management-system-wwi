const multer = require('multer');
const path = require('path');

// Configure storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '..', 'public', 'uploads'));
        // this points to: D:\Web Whiz Infosys\Task-Management-Tool\Backend\src\public\uploads
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

// File filter configuration
const fileFilter = (req, file, cb) => {
    // Accept all file types or add specific validation
    const allowedTypes = [
        'image/jpeg',
        'image/png',
        'application/pdf',
        'application/vnd.ms-powerpoint',        // for .ppt
        'application/vnd.openxmlformats-officedocument.presentationml.presentation' // for .pptx
    ];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 25 * 1024 * 1024 // 5MB limit
    }
});

module.exports = upload;
