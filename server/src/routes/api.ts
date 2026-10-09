import { Router } from 'express';
import { getLoanSchemesController } from '../controllers/schemeController';
import { getQuoteController } from '../controllers/quoteController';
import { createLeadController, getLeadsController } from '../controllers/leadController';
import { aiChatController } from '../controllers/aiController';

const router = Router();

// Loan Schemes
router.get('/loan-schemes', getLoanSchemesController);

// Quotes
router.post('/quotes', getQuoteController);

// Leads
router.post('/leads', createLeadController);
router.get('/leads', getLeadsController);

// AI Chat
router.post('/chat', aiChatController);

export default router;
