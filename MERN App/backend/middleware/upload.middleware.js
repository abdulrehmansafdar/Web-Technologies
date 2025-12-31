/**
 * ===========================================
 * File Upload Middleware
 * ===========================================
 * 
 * Configures multer for handling file uploads.
 * Supports single and multiple file uploads with validation.
 * 
 * @module middleware/upload
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

/**
 * Storage Configuration
 * 
 * Defines where and how files are stored on the server.
 * Uses disk storage with custom filename generation.
 */
const storage = multer.diskStorage({
  // Set destination folder for uploads
  destination: (req, file, cb) => {
    // Create subdirectory based on file type
    let subDir = 'general';
    
    if (file.mimetype.startsWith('image/')) {
      subDir = 'images';
    } else if (file.mimetype.includes('pdf') || file.mimetype.includes('document')) {
      subDir = 'documents';
    }

    const uploadPath = path.join(uploadsDir, subDir);
    
    // Create subdirectory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    cb(null, uploadPath);
  },

  // Generate unique filename
  filename: (req, file, cb) => {
    // Create unique filename: timestamp-random-originalname
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const extension = path.extname(file.originalname);
    const basename = path.basename(file.originalname, extension);
    
    // Sanitize filename (remove special characters)
    const sanitizedName = basename.replace(/[^a-zA-Z0-9]/g, '_');
    
    cb(null, `${sanitizedName}-${uniqueSuffix}${extension}`);
  }
});

/**
 * File Filter
 * 
 * Validates file types before upload.
 * Only allows specific file types for security.
 */
const fileFilter = (req, file, cb) => {
  // Allowed file types
  const allowedTypes = [
    // Images
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    // Documents
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    // Text
    'text/plain',
    'text/csv'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} is not allowed`), false);
  }
};

/**
 * Multer Upload Configuration
 * 
 * Main upload middleware with all configurations applied.
 */
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB default
    files: 5 // Maximum 5 files per request
  }
});

/**
 * Upload Middleware Exports
 * 
 * Different configurations for various use cases.
 */
module.exports = {
  // Single file upload (e.g., avatar)
  single: (fieldName) => upload.single(fieldName),
  
  // Multiple files upload (e.g., attachments)
  multiple: (fieldName, maxCount = 5) => upload.array(fieldName, maxCount),
  
  // Mixed fields upload
  fields: (fieldsConfig) => upload.fields(fieldsConfig),
  
  // No file upload (for forms without files)
  none: () => upload.none(),

  /**
   * Error Handler for Upload Errors
   * 
   * Middleware to handle multer-specific errors
   */
  handleUploadError: (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
      // Multer-specific errors
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'File too large. Maximum size is 5MB.'
        });
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({
          success: false,
          message: 'Too many files. Maximum is 5 files.'
        });
      }
      return res.status(400).json({
        success: false,
        message: err.message
      });
    } else if (err) {
      // Custom errors from fileFilter
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }
    next();
  }
};
