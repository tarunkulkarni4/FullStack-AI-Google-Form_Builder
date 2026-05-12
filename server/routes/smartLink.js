const router = require('express').Router();
const Form = require('../models/Form');

/**
 * Smart Link Routes (PUBLIC — no authentication required)
 *
 * GET /f/:formId  → Validates form and returns redirect info
 * GET /f/:formId/status → Quick status check
 */

/**
 * GET /f/:formId
 * Public endpoint: validates form expiry/limit, returns public URL or error.
 */
router.get('/:formId', async (req, res) => {
    const { formId } = req.params;

    try {
        const form = await Form.findOne({ googleFormId: formId });

        if (!form) {
            return res.status(404).json({
                status: 'NOT_FOUND',
                message: 'This form does not exist.',
            });
        }

        const now = new Date();
        const isExpired = form.expiryDate && new Date(form.expiryDate) < now;
        const isLimitReached = form.responseLimit > 0 && form.respondentCount >= form.responseLimit;

        if (isExpired) {
            return res.json({
                status: 'EXPIRED',
                message: 'This form has expired and is no longer accepting responses.',
                title: form.formTitle,
            });
        }

        if (isLimitReached) {
            return res.json({
                status: 'LIMIT_REACHED',
                message: 'The response limit for this form has been reached.',
                title: form.formTitle,
            });
        }

        if (form.status === 'closed') {
            return res.json({
                status: 'CLOSED',
                message: 'This form is currently closed.',
                title: form.formTitle,
            });
        }

        // Form is valid — return public URL
        res.json({
            status: 'ACTIVE',
            publicUrl: form.publicUrl,
            title: form.formTitle,
            themeColor: form.themeColor,
            timeEstimate: form.timeEstimate,
        });
    } catch (error) {
        console.error('Smart Link Error:', error.message);
        res.status(500).json({ message: 'Internal server error' });
    }
});

/**
 * GET /f/:formId/status
 * Quick status check without full form data.
 */
router.get('/:formId/status', async (req, res) => {
    try {
        const form = await Form.findOne({ googleFormId: req.params.formId });

        if (!form) {
            return res.json({ valid: false, reason: 'NOT_FOUND' });
        }

        const isExpired = form.expiryDate && new Date(form.expiryDate) < new Date();
        const isLimitReached = form.responseLimit > 0 && form.respondentCount >= form.responseLimit;

        res.json({
            valid: !isExpired && !isLimitReached && form.status === 'active',
            reason: isExpired ? 'EXPIRED' : isLimitReached ? 'LIMIT_REACHED' : form.status !== 'active' ? 'CLOSED' : null,
        });
    } catch (error) {
        res.status(500).json({ valid: false, reason: 'ERROR' });
    }
});

module.exports = router;
