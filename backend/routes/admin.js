const express = require('express');
const { body, validationResult } = require('express-validator');
const Admin = require('../models/Admin');
const { protect, authorize } = require('../middleware/auth');
const { sendWelcomeEmail, sendPasswordResetEmail } = require('../utils/emailService');
const crypto = require('crypto');

const router = express.Router();

// @desc    Admin login
// @route   POST /api/admin/login
// @access  Public
router.post('/login', [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email'),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters')
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

        const { email, password } = req.body;

        // Check if admin exists
        const admin = await Admin.findOne({ email }).select('+password');
        if (!admin) {
            return res.status(401).json({
                success: false,
                error: 'Invalid credentials'
            });
        }

        // Check if account is locked
        if (admin.isLocked()) {
            return res.status(423).json({
                success: false,
                error: 'Account is locked due to too many failed login attempts. Please try again later.'
            });
        }

        // Check if account is active
        if (!admin.isActive) {
            return res.status(401).json({
                success: false,
                error: 'Account is deactivated'
            });
        }

        // Check password
        const isMatch = await admin.comparePassword(password);
        if (!isMatch) {
            // Increment login attempts
            await admin.incLoginAttempts();
            
            return res.status(401).json({
                success: false,
                error: 'Invalid credentials'
            });
        }

        // Reset login attempts on successful login
        await admin.resetLoginAttempts();
        await admin.updateLastLogin();

        // Generate token
        const token = admin.generateAuthToken();

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                token,
                admin: {
                    id: admin._id,
                    name: admin.name,
                    email: admin.email,
                    role: admin.role,
                    avatar: admin.avatar,
                    lastLogin: admin.lastLogin
                }
            }
        });
    } catch (error) {
        next(error);
    }
});

// @desc    Get current admin profile
// @route   GET /api/admin/profile
// @access  Private
router.get('/profile', protect, async (req, res, next) => {
    try {
        const admin = await Admin.findById(req.admin.id);

        res.json({
            success: true,
            data: admin
        });
    } catch (error) {
        next(error);
    }
});

// @desc    Update admin profile
// @route   PUT /api/admin/profile
// @access  Private
router.put('/profile', protect, [
    body('name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Name must be between 2 and 50 characters'),
    body('email')
        .optional()
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email')
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

        const { name, email, avatar } = req.body;
        const admin = await Admin.findById(req.admin.id);

        if (name) admin.name = name;
        if (email) admin.email = email;
        if (avatar) admin.avatar = avatar;

        await admin.save();

        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: admin
        });
    } catch (error) {
        next(error);
    }
});

// @desc    Change password
// @route   PUT /api/admin/change-password
// @access  Private
router.put('/change-password', protect, [
    body('currentPassword')
        .isLength({ min: 6 })
        .withMessage('Current password must be at least 6 characters'),
    body('newPassword')
        .isLength({ min: 6 })
        .withMessage('New password must be at least 6 characters')
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

        const { currentPassword, newPassword } = req.body;
        const admin = await Admin.findById(req.admin.id).select('+password');

        // Check current password
        const isMatch = await admin.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                error: 'Current password is incorrect'
            });
        }

        // Update password
        admin.password = newPassword;
        await admin.save();

        res.json({
            success: true,
            message: 'Password changed successfully'
        });
    } catch (error) {
        next(error);
    }
});

// @desc    Forgot password
// @route   POST /api/admin/forgot-password
// @access  Public
router.post('/forgot-password', [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email')
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

        const { email } = req.body;
        const admin = await Admin.findOne({ email });

        if (!admin) {
            return res.status(404).json({
                success: false,
                error: 'No admin found with that email'
            });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        admin.passwordResetToken = crypto
            .createHash('sha256')
            .update(resetToken)
            .digest('hex');
        admin.passwordResetExpires = Date.now() + 60 * 60 * 1000; // 1 hour

        await admin.save();

        // Send reset email
        try {
            await sendPasswordResetEmail(email, resetToken);
        } catch (emailError) {
            admin.passwordResetToken = undefined;
            admin.passwordResetExpires = undefined;
            await admin.save();

            return res.status(500).json({
                success: false,
                error: 'Email could not be sent'
            });
        }

        res.json({
            success: true,
            message: 'Password reset email sent'
        });
    } catch (error) {
        next(error);
    }
});

// @desc    Reset password
// @route   PUT /api/admin/reset-password/:token
// @access  Public
router.put('/reset-password/:token', [
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters')
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

        const { password } = req.body;
        const resetToken = crypto
            .createHash('sha256')
            .update(req.params.token)
            .digest('hex');

        const admin = await Admin.findOne({
            passwordResetToken: resetToken,
            passwordResetExpires: { $gt: Date.now() }
        });

        if (!admin) {
            return res.status(400).json({
                success: false,
                error: 'Invalid or expired reset token'
            });
        }

        // Set new password
        admin.password = password;
        admin.passwordResetToken = undefined;
        admin.passwordResetExpires = undefined;
        await admin.save();

        res.json({
            success: true,
            message: 'Password reset successful'
        });
    } catch (error) {
        next(error);
    }
});

// @desc    Get all admins (super-admin only)
// @route   GET /api/admin
// @access  Private/Super-Admin
router.get('/', protect, authorize('super-admin'), async (req, res, next) => {
    try {
        const admins = await Admin.find().select('-password');

        res.json({
            success: true,
            data: admins
        });
    } catch (error) {
        next(error);
    }
});

// @desc    Create new admin (super-admin only)
// @route   POST /api/admin
// @access  Private/Super-Admin
router.post('/', protect, authorize('super-admin'), [
    body('name')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Name must be between 2 and 50 characters'),
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email'),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters'),
    body('role')
        .optional()
        .isIn(['admin', 'super-admin'])
        .withMessage('Invalid role')
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

        const { name, email, password, role = 'admin' } = req.body;

        // Check if admin already exists
        const existingAdmin = await Admin.findOne({ email });
        if (existingAdmin) {
            return res.status(400).json({
                success: false,
                error: 'Admin with this email already exists'
            });
        }

        const admin = await Admin.create({
            name,
            email,
            password,
            role
        });

        // Send welcome email
        try {
            await sendWelcomeEmail(email, name);
        } catch (emailError) {
            console.error('Welcome email failed:', emailError);
        }

        res.status(201).json({
            success: true,
            message: 'Admin created successfully',
            data: {
                id: admin._id,
                name: admin.name,
                email: admin.email,
                role: admin.role,
                createdAt: admin.createdAt
            }
        });
    } catch (error) {
        next(error);
    }
});

// @desc    Update admin (super-admin only)
// @route   PUT /api/admin/:id
// @access  Private/Super-Admin
router.put('/:id', protect, authorize('super-admin'), [
    body('name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Name must be between 2 and 50 characters'),
    body('email')
        .optional()
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email'),
    body('role')
        .optional()
        .isIn(['admin', 'super-admin'])
        .withMessage('Invalid role'),
    body('isActive')
        .optional()
        .isBoolean()
        .withMessage('isActive must be a boolean')
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

        const admin = await Admin.findById(req.params.id);
        if (!admin) {
            return res.status(404).json({
                success: false,
                error: 'Admin not found'
            });
        }

        const { name, email, role, isActive, avatar } = req.body;

        if (name) admin.name = name;
        if (email) admin.email = email;
        if (role) admin.role = role;
        if (typeof isActive === 'boolean') admin.isActive = isActive;
        if (avatar) admin.avatar = avatar;

        await admin.save();

        res.json({
            success: true,
            message: 'Admin updated successfully',
            data: admin
        });
    } catch (error) {
        next(error);
    }
});

// @desc    Delete admin (super-admin only)
// @route   DELETE /api/admin/:id
// @access  Private/Super-Admin
router.delete('/:id', protect, authorize('super-admin'), async (req, res, next) => {
    try {
        const admin = await Admin.findById(req.params.id);
        if (!admin) {
            return res.status(404).json({
                success: false,
                error: 'Admin not found'
            });
        }

        // Prevent self-deletion
        if (admin._id.toString() === req.admin.id) {
            return res.status(400).json({
                success: false,
                error: 'Cannot delete your own account'
            });
        }

        await admin.remove();

        res.json({
            success: true,
            message: 'Admin deleted successfully'
        });
    } catch (error) {
        next(error);
    }
});

// @desc    Get admin statistics
// @route   GET /api/admin/stats
// @access  Private/Super-Admin
router.get('/stats', protect, authorize('super-admin'), async (req, res, next) => {
    try {
        const stats = await Admin.getStats();

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
