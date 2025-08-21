const express = require('express');
const { body, validationResult } = require('express-validator');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Sample achievements data (in a real app, this would be in a database)
let achievements = [
    {
        id: 1,
        title: 'Hackathon Runner-up',
        description: 'Secured 2nd rank in college hackathon competition',
        category: 'Competition',
        date: '2023-12-15',
        icon: 'trophy',
        featured: true,
        order: 1
    },
    {
        id: 2,
        title: 'DSA Excellence',
        description: 'Achieved 200+ problems solved on Geeks for Geeks',
        category: 'Programming',
        date: '2023-11-20',
        icon: 'medal',
        featured: true,
        order: 2
    },
    {
        id: 3,
        title: 'College Rank',
        description: 'Consistently ranked among top performers in college',
        category: 'Academic',
        date: '2023-10-10',
        icon: 'star',
        featured: false,
        order: 3
    }
];

// @desc    Get all achievements
// @route   GET /api/achievements
// @access  Public
router.get('/', async (req, res, next) => {
    try {
        const featured = req.query.featured;
        const category = req.query.category;

        let filteredAchievements = [...achievements];

        if (featured === 'true') {
            filteredAchievements = filteredAchievements.filter(a => a.featured);
        }

        if (category) {
            filteredAchievements = filteredAchievements.filter(a => 
                a.category.toLowerCase() === category.toLowerCase()
            );
        }

        // Sort by order and date
        filteredAchievements.sort((a, b) => {
            if (a.order !== b.order) {
                return a.order - b.order;
            }
            return new Date(b.date) - new Date(a.date);
        });

        res.json({
            success: true,
            data: filteredAchievements
        });
    } catch (error) {
        next(error);
    }
});

// @desc    Get featured achievements
// @route   GET /api/achievements/featured
// @access  Public
router.get('/featured', async (req, res, next) => {
    try {
        const featuredAchievements = achievements
            .filter(a => a.featured)
            .sort((a, b) => a.order - b.order);

        res.json({
            success: true,
            data: featuredAchievements
        });
    } catch (error) {
        next(error);
    }
});

// @desc    Get single achievement
// @route   GET /api/achievements/:id
// @access  Public
router.get('/:id', async (req, res, next) => {
    try {
        const achievementId = parseInt(req.params.id);
        const achievement = achievements.find(a => a.id === achievementId);

        if (!achievement) {
            return res.status(404).json({
                success: false,
                error: 'Achievement not found'
            });
        }

        res.json({
            success: true,
            data: achievement
        });
    } catch (error) {
        next(error);
    }
});

// @desc    Create new achievement (admin only)
// @route   POST /api/achievements
// @access  Private/Admin
router.post('/', protect, authorize('admin', 'super-admin'), [
    body('title')
        .trim()
        .isLength({ min: 3, max: 100 })
        .withMessage('Title must be between 3 and 100 characters'),
    body('description')
        .trim()
        .isLength({ min: 10, max: 500 })
        .withMessage('Description must be between 10 and 500 characters'),
    body('category')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Category must be between 2 and 50 characters'),
    body('date')
        .isISO8601()
        .withMessage('Invalid date format'),
    body('icon')
        .optional()
        .trim()
        .isLength({ min: 1, max: 20 })
        .withMessage('Icon must be between 1 and 20 characters'),
    body('featured')
        .optional()
        .isBoolean()
        .withMessage('Featured must be a boolean'),
    body('order')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Order must be a positive integer')
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
            category,
            date,
            icon = 'star',
            featured = false,
            order = achievements.length + 1
        } = req.body;

        // Check if achievement with same title already exists
        const existingAchievement = achievements.find(a => 
            a.title.toLowerCase() === title.toLowerCase()
        );

        if (existingAchievement) {
            return res.status(400).json({
                success: false,
                error: 'Achievement with this title already exists'
            });
        }

        const newAchievement = {
            id: achievements.length + 1,
            title,
            description,
            category,
            date,
            icon,
            featured,
            order
        };

        achievements.push(newAchievement);

        res.status(201).json({
            success: true,
            message: 'Achievement created successfully',
            data: newAchievement
        });
    } catch (error) {
        next(error);
    }
});

// @desc    Update achievement (admin only)
// @route   PUT /api/achievements/:id
// @access  Private/Admin
router.put('/:id', protect, authorize('admin', 'super-admin'), [
    body('title')
        .optional()
        .trim()
        .isLength({ min: 3, max: 100 })
        .withMessage('Title must be between 3 and 100 characters'),
    body('description')
        .optional()
        .trim()
        .isLength({ min: 10, max: 500 })
        .withMessage('Description must be between 10 and 500 characters'),
    body('category')
        .optional()
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Category must be between 2 and 50 characters'),
    body('date')
        .optional()
        .isISO8601()
        .withMessage('Invalid date format'),
    body('icon')
        .optional()
        .trim()
        .isLength({ min: 1, max: 20 })
        .withMessage('Icon must be between 1 and 20 characters'),
    body('featured')
        .optional()
        .isBoolean()
        .withMessage('Featured must be a boolean'),
    body('order')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Order must be a positive integer')
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

        const achievementId = parseInt(req.params.id);
        const achievement = achievements.find(a => a.id === achievementId);

        if (!achievement) {
            return res.status(404).json({
                success: false,
                error: 'Achievement not found'
            });
        }

        const {
            title,
            description,
            category,
            date,
            icon,
            featured,
            order
        } = req.body;

        // Check if title is being changed and if it conflicts with existing achievement
        if (title && title.toLowerCase() !== achievement.title.toLowerCase()) {
            const existingAchievement = achievements.find(a => 
                a.id !== achievementId && a.title.toLowerCase() === title.toLowerCase()
            );

            if (existingAchievement) {
                return res.status(400).json({
                    success: false,
                    error: 'Achievement with this title already exists'
                });
            }
        }

        // Update fields
        if (title) achievement.title = title;
        if (description) achievement.description = description;
        if (category) achievement.category = category;
        if (date) achievement.date = date;
        if (icon) achievement.icon = icon;
        if (typeof featured === 'boolean') achievement.featured = featured;
        if (order) achievement.order = order;

        res.json({
            success: true,
            message: 'Achievement updated successfully',
            data: achievement
        });
    } catch (error) {
        next(error);
    }
});

// @desc    Delete achievement (admin only)
// @route   DELETE /api/achievements/:id
// @access  Private/Admin
router.delete('/:id', protect, authorize('admin', 'super-admin'), async (req, res, next) => {
    try {
        const achievementId = parseInt(req.params.id);
        const achievementIndex = achievements.findIndex(a => a.id === achievementId);

        if (achievementIndex === -1) {
            return res.status(404).json({
                success: false,
                error: 'Achievement not found'
            });
        }

        const deletedAchievement = achievements.splice(achievementIndex, 1)[0];

        res.json({
            success: true,
            message: 'Achievement deleted successfully',
            data: deletedAchievement
        });
    } catch (error) {
        next(error);
    }
});

// @desc    Toggle achievement featured status (admin only)
// @route   PUT /api/achievements/:id/toggle-featured
// @access  Private/Admin
router.put('/:id/toggle-featured', protect, authorize('admin', 'super-admin'), async (req, res, next) => {
    try {
        const achievementId = parseInt(req.params.id);
        const achievement = achievements.find(a => a.id === achievementId);

        if (!achievement) {
            return res.status(404).json({
                success: false,
                error: 'Achievement not found'
            });
        }

        achievement.featured = !achievement.featured;

        res.json({
            success: true,
            message: 'Achievement featured status updated',
            data: achievement
        });
    } catch (error) {
        next(error);
    }
});

// @desc    Get achievements by category
// @route   GET /api/achievements/category/:category
// @access  Public
router.get('/category/:category', async (req, res, next) => {
    try {
        const { category } = req.params;
        const categoryAchievements = achievements
            .filter(a => a.category.toLowerCase() === category.toLowerCase())
            .sort((a, b) => a.order - b.order);

        res.json({
            success: true,
            data: categoryAchievements
        });
    } catch (error) {
        next(error);
    }
});

// @desc    Get achievements statistics
// @route   GET /api/achievements/stats
// @access  Public
router.get('/stats', async (req, res, next) => {
    try {
        const totalAchievements = achievements.length;
        const featuredCount = achievements.filter(a => a.featured).length;
        
        const categories = [...new Set(achievements.map(a => a.category))];
        const categoryStats = categories.map(category => ({
            name: category,
            count: achievements.filter(a => a.category === category).length
        }));

        const stats = {
            totalAchievements,
            featuredCount,
            categories: categoryStats,
            recentAchievements: achievements
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .slice(0, 5)
        };

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
