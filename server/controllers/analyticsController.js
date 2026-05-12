const Form = require('../models/Form');
const User = require('../models/User');
const googleFormsService = require('../services/googleFormsService');

/**
 * Analytics Controller
 * Provides form analytics, response stats, and CSV export.
 */

/**
 * GET /api/forms/:id/analytics
 * Returns aggregated analytics for a form.
 */
const getAnalytics = async (req, res) => {
    try {
        const form = await Form.findOne({ _id: req.params.id, userId: req.userId });
        if (!form) return res.status(404).json({ message: 'Form not found' });

        const user = await User.findById(req.userId);
        if (!user || !user.accessToken) {
            return res.status(401).json({ message: 'Authorization required' });
        }

        // Fetch responses from Google Forms
        let responses = [];
        let formData = null;
        try {
            const result = await googleFormsService.getFormResponses(user, form.googleFormId);
            responses = result.responses;
            formData = result.form;
        } catch (err) {
            console.error('Analytics fetch error:', err.message);
        }

        // Build analytics
        const totalResponses = responses.length;
        const responseRate = form.responseLimit > 0
            ? Math.round((totalResponses / form.responseLimit) * 100)
            : 0;

        // Response trend (group by date)
        const trendMap = {};
        responses.forEach((r) => {
            const date = new Date(r.createTime).toISOString().split('T')[0];
            trendMap[date] = (trendMap[date] || 0) + 1;
        });

        const responseTrend = Object.entries(trendMap)
            .map(([date, count]) => ({ date, count }))
            .sort((a, b) => a.date.localeCompare(b.date));

        // Question breakdown
        const questionBreakdown = [];
        if (formData && formData.items) {
            formData.items.forEach((item) => {
                if (item.questionItem) {
                    const qId = item.questionItem.question.questionId;
                    const answers = {};

                    responses.forEach((r) => {
                        const ans = r.answers?.[qId];
                        if (ans?.textAnswers?.answers) {
                            ans.textAnswers.answers.forEach((a) => {
                                answers[a.value] = (answers[a.value] || 0) + 1;
                            });
                        }
                    });

                    questionBreakdown.push({
                        question: item.title,
                        answers,
                        totalAnswered: Object.values(answers).reduce((s, v) => s + v, 0),
                    });
                }
            });
        }

        res.json({
            totalResponses,
            responseRate,
            responseTrend,
            questionBreakdown,
            lastSynced: form.lastSyncedAt,
            formTitle: form.formTitle,
        });
    } catch (error) {
        console.error('Analytics Error:', error.message);
        res.status(500).json({ message: 'Failed to get analytics', error: error.message });
    }
};

/**
 * GET /api/forms/:id/export
 * Exports form responses as CSV.
 */
const exportCSV = async (req, res) => {
    try {
        const form = await Form.findOne({ _id: req.params.id, userId: req.userId });
        if (!form) return res.status(404).json({ message: 'Form not found' });

        const user = await User.findById(req.userId);
        if (!user || !user.accessToken) {
            return res.status(401).json({ message: 'Authorization required' });
        }

        const { form: formData, responses } = await googleFormsService.getFormResponses(
            user,
            form.googleFormId
        );

        // Build CSV
        const items = formData.items || [];
        const headers = ['Timestamp', 'Response ID'];
        items.forEach((item) => {
            if (item.questionItem) headers.push(item.title);
        });

        let csv = headers.map((h) => `"${h}"`).join(',') + '\n';

        responses.forEach((resp) => {
            const row = [resp.createTime, resp.responseId];
            items.forEach((item) => {
                if (item.questionItem) {
                    const qId = item.questionItem.question.questionId;
                    const ans = resp.answers?.[qId];
                    let val = '';
                    if (ans?.textAnswers?.answers) {
                        val = ans.textAnswers.answers.map((a) => a.value).join('; ');
                    }
                    row.push(val);
                }
            });
            csv += row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',') + '\n';
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${form.formTitle}-responses.csv"`);
        res.send(csv);
    } catch (error) {
        console.error('Export Error:', error.message);
        res.status(500).json({ message: 'Failed to export responses', error: error.message });
    }
};

module.exports = { getAnalytics, exportCSV };
