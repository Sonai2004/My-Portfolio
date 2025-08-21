const express = require('express');
const { body, validationResult } = require('express-validator');
const Contact = require('../models/Contact');
const { sendContactEmail } = require('../utils/emailService');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// @desc    Submit contact form
// @route   POST /api/contact
// @access  Public
router.post('/', [
    body('name')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Name must be between 2 and 50 characters'),
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email'),
    body('subject')
        .trim()
        .isLength({ min: 5, max: 100 })
        .withMessage('Subject must be between 5 and 100 characters'),
    body('message')
        .trim()
        .isLength({ min: 10, max: 1000 })
        .withMessage('Message must be between 10 and 1000 characters'),
    body('phone')
        .optional()
        .trim()
        .isLength({ max: 20 })
        .withMessage('Phone number cannot be more than 20 characters')
], async (req, res, next) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: errors.array()
            });
        }

        const { name, email, subject, message, phone } = req.body;

        // Create contact submission
        const contact = await Contact.create({
            name,
            email,
            subject,
            message,
            phone,
            ipAddress: req.ip,
            userAgent: req.get('User-Agent')
        });

        // Send email notification
        try {
            await sendContactEmail({
                name,
                email,
                subject,
                message,
                phone
            });
        } catch (emailError) {
            console.error('Email sending failed:', emailError);
            // Don't fail the request if email fails
        }

        res.status(201).json({
            success: true,
            message: 'Message sent successfully! I will get back to you soon.',
            data: {
                id: contact._id,
                name: contact.name,
                email: contact.email,
                subject: contact.subject,
                createdAt: contact.createdAt
            }
        });
    } catch (error) {
        next(error);
    }
});

// @desc    Get all contacts (admin only)
// @route   GET /api/contact
// @access  Private/Admin
router.get('/', protect, authorize('admin', 'super-admin'), async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const status = req.query.status;
        const search = req.query.search;

        const skip = (page - 1) * limit;

        // Build query
        let query = {};
        if (status) {
            query.status = status;
        }
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { subject: { $regex: search, $options: 'i' } }
            ];
        }

        const contacts = await Contact.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .select('-__v');

        const total = await Contact.countDocuments(query);
        const totalPages = Math.ceil(total / limit);

        res.json({
            success: true,
            data: contacts,
            pagination: {
                page,
                limit,
                total,
                totalPages,
                hasNext: page < totalPages,
                hasPrev: page > 1
            }
        });
    } catch (error) {
        next(error);
    }
});

// @desc    Get contact statistics (admin only)
// @route   GET /api/contact/stats
// @access  Private/Admin
router.get('/stats', protect, authorize('admin', 'super-admin'), async (req, res, next) => {
    try {
        const stats = await Contact.getStats();

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        next(error);
    }
});

// @desc    Get single contact (admin only)
// @route   GET /api/contact/:id
// @access  Private/Admin
router.get('/:id', protect, authorize('admin', 'super-admin'), async (req, res, next) => {
    try {
        const contact = await Contact.findById(req.params.id);

        if (!contact) {
            return res.status(404).json({
                success: false,
                error: 'Contact not found'
            });
        }

        // Mark as read if it's unread
        if (contact.status === 'unread') {
            await contact.markAsRead();
        }

        res.json({
            success: true,
            data: contact
        });
    } catch (error) {
        next(error);
    }
});

// @desc    Update contact status (admin only)
// @route   PUT /api/contact/:id/status
// @access  Private/Admin
router.put('/:id/status', protect, authorize('admin', 'super-admin'), [
    body('status')
        .isIn(['unread', 'read', 'replied', 'archived'])
        .withMessage('Invalid status')
], async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: errors.array()
            });
        }

        const contact = await Contact.findById(req.params.id);

        if (!contact) {
            return res.status(404).json({
                success: false,
                error: 'Contact not found'
            });
        }

        contact.status = req.body.status;
        await contact.save();

        res.json({
            success: true,
            message: 'Contact status updated successfully',
            data: contact
        });
    } catch (error) {
        next(error);
    }
});

// @desc    Delete contact (admin only)
// @route   DELETE /api/contact/:id
// @access  Private/Admin
router.delete('/:id', protect, authorize('admin', 'super-admin'), async (req, res, next) => {
    try {
        const contact = await Contact.findById(req.params.id);

        if (!contact) {
            return res.status(404).json({
                success: false,
                error: 'Contact not found'
            });
        }

        await contact.remove();

        res.json({
            success: true,
            message: 'Contact deleted successfully'
        });
    } catch (error) {
        next(error);
    }
});

// @desc    Bulk update contact status (admin only)
// @route   PUT /api/contact/bulk/status
// @access  Private/Admin
router.put('/bulk/status', protect, authorize('admin', 'super-admin'), [
    body('ids')
        .isArray({ min: 1 })
        .withMessage('At least one contact ID is required'),
    body('status')
        .isIn(['unread', 'read', 'replied', 'archived'])
        .withMessage('Invalid status')
], async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: errors.array()
            });
        }

        const { ids, status } = req.body;

        const result = await Contact.updateMany(
            { _id: { $in: ids } },
            { status }
        );

        res.json({
            success: true,
            message: `${result.modifiedCount} contacts updated successfully`,
            data: {
                modifiedCount: result.modifiedCount
            }
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
