import { Router } from 'express';
import {
  chat,
  getEvidence,
  getTimeline,
  getInvestigations,
} from '../controllers/agent.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router({ mergeParams: true }); // mergeParams to access :caseId

// All routes are protected
router.use(authenticate);

// Chat with the case agent
router.post('/chat', chat);

// Retrieve case data from Hindsight
router.get('/evidence', getEvidence);
router.get('/timeline', getTimeline);
router.get('/investigations', getInvestigations);

export default router;
