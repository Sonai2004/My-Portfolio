const express = require('express');
const { body, validationResult } = require('express-validator');
const Project = require('../models/Project');
const { protect, authorize } = require('../middleware/auth');
const { uploadProjectImage, deleteFile, getFileUrl } = require('../middleware/upload');

const router = express.Router();

// @desc    Get all published projects
// @route   GET /api/projects
// @access  Public
router.get('/', async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const category = req.query.category;
        const featured = req.query.featured;
        const search = req.query.search;

        const skip = (page - 1) * limit;

        // Build query
        let query = { status: 'published' };
        if (category) {
            query.category = category;
        }
        if (featured === 'true') {
            query.featured = true;
        }
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { technologies: { $in: [new RegExp(search, 'i')] } }
            ];
        }

        const projects = await Project.find(query)
            .sort({ order: 1, createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .select('-__v');

        const total = await Project.countDocuments(query);
        const totalPages = Math.ceil(total / limit);

        res.json({
            success: true,
            data: projects,
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

// @desc    Get featured projects
// @route   GET /api/projects/featured
// @access  Public
router.get('/featured', async (req, res, next) => {
    try {
        const projects = await Project.getFeatured();

        res.json({
            success: true,
            data: projects
        });
    } catch (error) {
        next(error);
    }
});

// @desc    Get projects by category
// @route   GET /api/projects/category/:category
// @access  Public
router.get('/category/:category', async (req, res, next) => {
    try {
        const { category } = req.params;
        const projects = await Project.getByCategory(category);

        res.json({
            success: true,
            data: projects
        });
    } catch (error) {
        next(error);
    }
});

// @desc    Get single project
// @route   GET /api/projects/:id
// @access  Public
router.get('/:id', async (req, res, next) => {
    try {
        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({
                success: false,
                error: 'Project not found'
            });
        }

        // Increment views
        await project.incrementViews();

        res.json({
            success: true,
            data: project
        });
    } catch (error) {
        next(error);
    }
});

// @desc    Create new project (admin only)
// @route   POST /api/projects
// @access  Private/Admin
router.post('/', protect, authorize('admin', 'super-admin'), uploadProjectImage, [
    body('title')
        .trim()
        .isLength({ min: 5, max: 100 })
        .withMessage('Title must be between 5 and 100 characters'),
    body('description')
        .trim()
        .isLength({ min: 20, max: 1000 })
        .withMessage('Description must be between 20 and 1000 characters'),
    body('category')
        .isIn(['web-development', 'mobile-app', 'ai-ml', 'database', 'other'])
        .withMessage('Invalid category'),
    body('technologies')
        .isArray({ min: 1 })
        .withMessage('At least one technology is required'),
    body('liveUrl')
        .optional()
        .isURL()
        .withMessage('Invalid live URL'),
    body('githubUrl')
        .optional()
        .isURL()
        .withMessage('Invalid GitHub URL'),
    body('demoUrl')
        .optional()
        .isURL()
        .withMessage('Invalid demo URL')
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

        const {
            title,
            description,
            shortDescription,
            category,
            technologies,
            liveUrl,
            githubUrl,
            demoUrl,
            features,
            challenges,
            solutions,
            status = 'draft',
            featured = false,
            order = 0,
            startDate,
            endDate
        } = req.body;

        // Handle image upload
        let image = null;
        if (req.file) {
            image = getFileUrl(req.file.filename, 'projects');
        }

        const project = await Project.create({
            title,
            description,
            shortDescription,
            category,
            technologies,
            image,
            liveUrl,
            githubUrl,
            demoUrl,
            features: features ? JSON.parse(features) : [],
            challenges,
            solutions,
            status,
            featured,
            order,
            startDate,
            endDate
        });

        res.status(201).json({
            success: true,
            message: 'Project created successfully',
            data: project
        });
    } catch (error) {
        next(error);
    }
});

// @desc    Update project (admin only)
// @route   PUT /api/projects/:id
// @access  Private/Admin
router.put('/:id', protect, authorize('admin', 'super-admin'), uploadProjectImage, [
    body('title')
        .optional()
        .trim()
        .isLength({ min: 5, max: 100 })
        .withMessage('Title must be between 5 and 100 characters'),
    body('description')
        .optional()
        .trim()
        .isLength({ min: 20, max: 1000 })
        .withMessage('Description must be between 20 and 1000 characters'),
    body('category')
        .optional()
        .isIn(['web-development', 'mobile-app', 'ai-ml', 'database', 'other'])
        .withMessage('Invalid category'),
    body('liveUrl')
        .optional()
        .isURL()
        .withMessage('Invalid live URL'),
    body('githubUrl')
        .optional()
        .isURL()
        .withMessage('Invalid GitHub URL'),
    body('demoUrl')
        .optional()
        .isURL()
        .withMessage('Invalid demo URL')
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

        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({
                success: false,
                error: 'Project not found'
            });
        }

        // Handle image upload
        if (req.file) {
            // Delete old image if exists
            if (project.image) {
                const oldImagePath = project.image.split('/').pop();
                deleteFile(`uploads/projects/${oldImagePath}`);
            }
            project.image = getFileUrl(req.file.filename, 'projects');
        }

        // Update fields
        const updateFields = [
            'title', 'description', 'shortDescription', 'category', 'technologies',
            'liveUrl', 'githubUrl', 'demoUrl', 'challenges', 'solutions',
            'status', 'featured', 'order', 'startDate', 'endDate'
        ];

        updateFields.forEach(field => {
            if (req.body[field] !== undefined) {
                if (field === 'technologies' || field === 'features') {
                    project[field] = JSON.parse(req.body[field]);
                } else {
                    project[field] = req.body[field];
                }
            }
        });

        await project.save();

        res.json({
            success: true,
            message: 'Project updated successfully',
            data: project
        });
    } catch (error) {
        next(error);
    }
});

// @desc    Delete project (admin only)
// @route   DELETE /api/projects/:id
// @access  Private/Admin
router.delete('/:id', protect, authorize('admin', 'super-admin'), async (req, res, next) => {
    try {
        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({
                success: false,
                error: 'Project not found'
            });
        }

        // Delete associated image
        if (project.image) {
            const imagePath = project.image.split('/').pop();
            deleteFile(`uploads/projects/${imagePath}`);
        }

        await project.remove();

        res.json({
            success: true,
            message: 'Project deleted successfully'
        });
    } catch (error) {
        next(error);
    }
});

// @desc    Toggle project featured status (admin only)
// @route   PUT /api/projects/:id/toggle-featured
// @access  Private/Admin
router.put('/:id/toggle-featured', protect, authorize('admin', 'super-admin'), async (req, res, next) => {
    try {
        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({
                success: false,
                error: 'Project not found'
            });
        }

        await project.toggleFeatured();

        res.json({
            success: true,
            message: 'Project featured status updated',
            data: project
        });
    } catch (error) {
        next(error);
    }
});

// @desc    Like project
// @route   POST /api/projects/:id/like
// @access  Public
router.post('/:id/like', async (req, res, next) => {
    try {
        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({
                success: false,
                error: 'Project not found'
            });
        }

        await project.incrementLikes();

        res.json({
            success: true,
            message: 'Project liked successfully',
            data: { likes: project.likes }
        });
    } catch (error) {
        next(error);
    }
});

// @desc    Get project statistics (admin only)
// @route   GET /api/projects/stats
// @access  Private/Admin
router.get('/stats', protect, authorize('admin', 'super-admin'), async (req, res, next) => {
    try {
        const stats = await Project.getStats();

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
