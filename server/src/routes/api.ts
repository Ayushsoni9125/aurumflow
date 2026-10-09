import { Router } from 'express';
import { getLoanSchemesController } from '../controllers/schemeController';
import { getQuoteController } from '../controllers/quoteController';
import { createLeadController, getLeadsController, getLeadByIdController } from '../controllers/leadController';
import { aiChatController, aiChatStreamController } from '../controllers/aiController';
import { loginController, registerController } from '../controllers/authController';
import { optionalAuth } from '../middleware/authMiddleware';

const router = Router();

// Auth
router.post('/auth/register', registerController);
router.post('/auth/login', loginController);

// Loan Schemes
router.get('/loan-schemes', getLoanSchemesController);

// Quotes
router.post('/quotes', getQuoteController);

// Leads
router.post('/leads', optionalAuth, createLeadController);
router.get('/leads', optionalAuth, getLeadsController);
router.get('/leads/:id', optionalAuth, getLeadByIdController);

// AI Chat
router.post('/chat', optionalAuth, aiChatController);
router.post('/chat/stream', optionalAuth, aiChatStreamController);

export default router;
