import { Router } from 'express';
import {
  listCases,
  createCase,
  getCase,
  updateCase,
  deleteCase,
} from '../controllers/case.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// All routes are protected
router.use(authenticate);

router.get('/', listCases);
router.post('/', createCase);
router.get('/:id', getCase);
router.put('/:id', updateCase);
router.delete('/:id', deleteCase);

export default router;
