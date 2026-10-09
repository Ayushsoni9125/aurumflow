import { Router } from 'express';
import { getLoanSchemesController } from '../controllers/schemeController';
import { getQuoteController } from '../controllers/quoteController';
import { createLeadController, getLeadsController, getLeadByIdController } from '../controllers/leadController';
import { aiChatController } from '../controllers/aiController';

const router = Router();

// Loan Schemes
router.get('/loan-schemes', getLoanSchemesController);

// Quotes
router.post('/quotes', getQuoteController);

// Leads
router.post('/leads', createLeadController);
router.get('/leads', getLeadsController);
router.get('/leads/:id', getLeadByIdController);

// AI Chat
router.post('/chat', aiChatController);

export default router;
