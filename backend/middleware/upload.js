const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Create subdirectories based on file type
        let uploadPath = uploadsDir;
        
        if (file.fieldname === 'projectImage') {
            uploadPath = path.join(uploadsDir, 'projects');
        } else if (file.fieldname === 'profileImage') {
            uploadPath = path.join(uploadsDir, 'profile');
        } else if (file.fieldname === 'achievementImage') {
            uploadPath = path.join(uploadsDir, 'achievements');
        }
        
        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        // Generate unique filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        const name = path.basename(file.originalname, ext);
        
        cb(null, `${name}-${uniqueSuffix}${ext}`);
    }
});

// File filter
const fileFilter = (req, file, cb) => {
    // Allowed file types
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Only image files are allowed!'), false);
    }
};

// Configure multer
const upload = multer({
    storage: storage,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB default
        files: 1 // Only one file at a time
    },
    fileFilter: fileFilter
});

// Specific upload configurations
const uploadProjectImage = upload.single('projectImage');
const uploadProfileImage = upload.single('profileImage');
const uploadAchievementImage = upload.single('achievementImage');

// Multiple files upload for gallery
const uploadMultiple = multer({
    storage: storage,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024,
        files: 10 // Up to 10 files
    },
    fileFilter: fileFilter
}).array('images', 10);

// Error handling wrapper
const handleUpload = (uploadFunction) => {
    return (req, res, next) => {
        uploadFunction(req, res, (err) => {
            if (err instanceof multer.MulterError) {
                if (err.code === 'LIMIT_FILE_SIZE') {
                    return res.status(400).json({
                        success: false,
                        error: 'File too large. Maximum size is 5MB.'
                    });
                }
                if (err.code === 'LIMIT_FILE_COUNT') {
                    return res.status(400).json({
                        success: false,
                        error: 'Too many files. Maximum is 10 files.'
                    });
                }
                return res.status(400).json({
                    success: false,
                    error: err.message
                });
            } else if (err) {
                return res.status(400).json({
                    success: false,
                    error: err.message
                });
            }
            next();
        });
    };
};

// Helper function to delete file
const deleteFile = (filePath) => {
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return true;
    }
    return false;
};

// Helper function to get file URL
const getFileUrl = (filename, type = 'projects') => {
    if (!filename) return null;
    return `${process.env.BASE_URL || 'http://localhost:5000'}/uploads/${type}/${filename}`;
};

module.exports = {
    uploadProjectImage: handleUpload(uploadProjectImage),
    uploadProfileImage: handleUpload(uploadProfileImage),
    uploadAchievementImage: handleUpload(uploadAchievementImage),
    uploadMultiple: handleUpload(uploadMultiple),
    deleteFile,
    getFileUrl
};
