import { Router } from 'express';
import multer from 'multer';
import {
  listDocuments,
  uploadDocument,
  deleteDocument,
} from '../controllers/document.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router({ mergeParams: true }); // mergeParams to access :caseId

// Multer config: store file in memory (buffer) for cloudinary upload + PDF parsing
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50 MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed.'), false);
    }
  },
});

// All routes are protected
router.use(authenticate);

router.get('/', listDocuments);
router.post('/', upload.single('file'), uploadDocument);
router.delete('/:docId', deleteDocument);

export default router;
