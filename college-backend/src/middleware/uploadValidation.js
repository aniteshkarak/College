import multer from 'multer';

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedImageMimes = ['image/jpeg', 'image/png', 'image/webp'];
  const allowedDocMimes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

  if (['photo_1', 'photo_2', 'photo_3', 'photos'].includes(file.fieldname)) {
    if (allowedImageMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid image format for ${file.fieldname}. Allowed: JPEG, PNG, WebP.`), false);
    }
  } else if (file.fieldname === 'identity_document') {
    if (allowedDocMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid identity document format. Allowed: JPEG, PNG, WebP or PDF.'), false);
    }
  } else {
    cb(new Error(`Unexpected upload field: ${file.fieldname}`), false);
  }
};

export const registrationUpload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB absolute max
    files: 5
  },
  fileFilter
}).fields([
  { name: 'photo_1', maxCount: 1 },
  { name: 'photo_2', maxCount: 1 },
  { name: 'photo_3', maxCount: 1 },
  { name: 'photos', maxCount: 3 },
  { name: 'identity_document', maxCount: 1 }
]);
