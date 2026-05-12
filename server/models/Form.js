const mongoose = require('mongoose');

/**
 * Question sub-schema for storing generated form questions.
 */
const QuestionSchema = new mongoose.Schema({
    text: { type: String, required: true },
    type: {
        type: String,
        enum: ['short_answer', 'paragraph', 'multiple_choice', 'checkbox', 'dropdown', 'scale'],
        default: 'short_answer',
    },
    options: [String],
    required: { type: Boolean, default: true },
}, { _id: false });

/**
 * Section sub-schema for form sections.
 */
const SectionSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, default: '' },
    questions: [QuestionSchema],
}, { _id: false });

/**
 * Form Schema
 * Stores form metadata, Google Form/Sheet IDs, configuration,
 * and response tracking data.
 */
const FormSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    googleFormId: {
        type: String,
        required: true,
        unique: true,
    },
    googleSheetId: {
        type: String,
        default: null,
    },
    formTitle: {
        type: String,
        required: true,
    },
    formDescription: {
        type: String,
        default: '',
    },
    prompt: {
        type: String,
        default: '',
    },
    sections: [SectionSchema],
    themeColor: {
        type: String,
        default: '#3b82f6',
    },
    startDate: {
        type: Date,
        default: null,
    },
    expiryDate: {
        type: Date,
        default: null,
    },
    responseLimit: {
        type: Number,
        default: 0, // 0 = unlimited
    },
    respondentCount: {
        type: Number,
        default: 0,
    },
    status: {
        type: String,
        enum: ['active', 'expired', 'limitReached', 'closed'],
        default: 'active',
    },
    publicUrl: {
        type: String,
        default: '',
    },
    editUrl: {
        type: String,
        default: '',
    },
    sheetUrl: {
        type: String,
        default: '',
    },
    lastSyncedAt: {
        type: Date,
        default: null,
    },
    timeEstimate: {
        type: Number,
        default: 0,
    },
}, {
    timestamps: true,
});

// Virtual for checking if form is expired
FormSchema.virtual('isExpired').get(function () {
    if (!this.expiryDate) return false;
    return new Date(this.expiryDate) < new Date();
});

// Virtual for checking if response limit reached
FormSchema.virtual('isLimitReached').get(function () {
    if (!this.responseLimit || this.responseLimit === 0) return false;
    return this.respondentCount >= this.responseLimit;
});

// Auto-update status before saving
FormSchema.pre('save', function (next) {
    if (this.isExpired) {
        this.status = 'expired';
    } else if (this.isLimitReached) {
        this.status = 'limitReached';
    }
    next();
});

FormSchema.set('toJSON', { virtuals: true });
FormSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Form', FormSchema);
