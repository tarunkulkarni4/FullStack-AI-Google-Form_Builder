const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { aiLimiter, apiLimiter } = require('../middleware/rateLimiter');
const formController = require('../controllers/formController');
const aiController = require('../controllers/aiController');

/**
 * Form Routes (all protected except smart link)
 */

// AI Generation endpoints (stricter rate limit)
router.post('/generate-ai', authenticate, aiLimiter, aiController.analyzeIntent);
router.post('/generate-structure', authenticate, aiLimiter, aiController.generateFormStructure);

// CRUD operations
router.get('/', authenticate, apiLimiter, formController.getUserForms);
router.post('/create', authenticate, apiLimiter, formController.createForm);
router.get('/:id', authenticate, apiLimiter, formController.getFormById);
router.put('/:id/update', authenticate, apiLimiter, formController.updateForm);
router.delete('/:id', authenticate, apiLimiter, formController.deleteForm);

// Form lifecycle
router.post('/:id/sync', authenticate, apiLimiter, formController.syncResponses);
router.post('/:id/duplicate', authenticate, apiLimiter, formController.duplicateFormHandler);
router.get('/:id/expand/suggestions', authenticate, aiLimiter, formController.getExpandSuggestions);
router.post('/:id/expand/generate', authenticate, aiLimiter, formController.generateExpandPreview);
router.post('/:id/expand/apply', authenticate, apiLimiter, formController.applyExpandQuestions);
router.post('/:id/close', authenticate, apiLimiter, formController.closeForm);
router.post('/:id/reactivate', authenticate, apiLimiter, formController.reactivateForm);
router.get('/:id/structure', authenticate, apiLimiter, formController.getFormStructure);
router.put('/:id/structure', authenticate, apiLimiter, formController.updateFormStructure);

module.exports = router;
