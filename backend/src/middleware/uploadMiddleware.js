import multer from 'multer';

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf'
];

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedFields = [
    'photo_1', 'photo_2', 'photo_3',
    'photo1', 'photo2', 'photo3',
    'photos',
    'identity_document', 'document', 'verification_id'
  ];

  if (!allowedFields.includes(file.fieldname)) {
    const error = new multer.MulterError('LIMIT_UNEXPECTED_FILE', file.fieldname);
    error.message = `Unexpected upload field: '${file.fieldname}'. Allowed fields: photo_1, photo_2, photo_3, identity_document`;
    return cb(error, false);
  }

  if (!ALLOWED_MIME_TYPES.includes(file.mimetype.toLowerCase())) {
    const error = new Error(`Unsupported file type: ${file.mimetype}. Allowed formats: JPEG, PNG, WebP (and PDF for documents).`);
    error.statusCode = 400;
    error.code = 'UNSUPPORTED_MEDIA_TYPE';
    return cb(error, false);
  }

  // Non-document fields cannot be PDF
  if (
    file.mimetype === 'application/pdf' &&
    !['identity_document', 'document', 'verification_id'].includes(file.fieldname)
  ) {
    const error = new Error('Photographs must be JPEG, PNG, or WebP images, not PDF documents.');
    error.statusCode = 400;
    error.code = 'INVALID_PHOTO_FORMAT';
    return cb(error, false);
  }

  cb(null, true);
};

export const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB per file
    files: 10,
  },
  fileFilter,
});

/**
 * Middleware handling registration multi-part uploads:
 * 3 profile photos + 1 identity document
 */
export const registrationUpload = upload.fields([
  { name: 'photo_1', maxCount: 1 },
  { name: 'photo_2', maxCount: 1 },
  { name: 'photo_3', maxCount: 1 },
  { name: 'photo1', maxCount: 1 },
  { name: 'photo2', maxCount: 1 },
  { name: 'photo3', maxCount: 1 },
  { name: 'identity_document', maxCount: 1 },
  { name: 'document', maxCount: 1 },
]);

export default upload;
