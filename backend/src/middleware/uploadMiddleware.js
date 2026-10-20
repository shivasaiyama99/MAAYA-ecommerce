import multer from 'multer';

// In-memory storage: files are kept as buffers in RAM, never written to disk
const storage = multer.memoryStorage();

// Allowed image MIME types
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/avif',
];

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype.toLowerCase())) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Invalid file format: ${file.mimetype}. Allowed formats are JPEG, PNG, WEBP, and AVIF.`
      ),
      false
    );
  }
};

// 5 MB max per image file
export const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 6, // maximum 6 images per request
  },
  fileFilter,
});

export const uploadSingleImage = upload.single('image');
export const uploadMultipleImages = upload.fields([
  { name: 'mainImage', maxCount: 1 },
  { name: 'additionalImages', maxCount: 5 },
]);

export default {
  upload,
  uploadSingleImage,
  uploadMultipleImages,
};
