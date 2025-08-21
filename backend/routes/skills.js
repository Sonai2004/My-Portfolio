const express = require('express');
const { body, validationResult } = require('express-validator');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Sample skills data (in a real app, this would be in a database)
let skills = [
    {
        id: 1,
        category: 'Programming Languages',
        skills: [
            { name: 'HTML', level: 90 },
            { name: 'CSS', level: 85 },
            { name: 'JavaScript', level: 80 },
            { name: 'Java', level: 75 },
            { name: 'Python', level: 85 }
        ]
    },
    {
        id: 2,
        category: 'Databases',
        skills: [
            { name: 'SQL', level: 80 },
            { name: 'MySQL', level: 75 },
            { name: 'MongoDB', level: 70 }
        ]
    },
    {
        id: 3,
        category: 'Computer Fundamentals',
        skills: [
            { name: 'Object Oriented Programming', level: 85 },
            { name: 'Operating System', level: 80 },
            { name: 'DBMS', level: 75 }
        ]
    },
    {
        id: 4,
        category: 'Development Tools',
        skills: [
            { name: 'VS Code', level: 90 },
            { name: 'GitHub', level: 85 },
            { name: 'Git', level: 80 }
        ]
    }
];

// @desc    Get all skills
// @route   GET /api/skills
// @access  Public
router.get('/', async (req, res, next) => {
    try {
        res.json({
            success: true,
            data: skills
        });
    } catch (error) {
        next(error);
    }
});

// @desc    Get skills by category
// @route   GET /api/skills/category/:category
// @access  Public
router.get('/category/:category', async (req, res, next) => {
    try {
        const { category } = req.params;
        const categorySkills = skills.find(s => 
            s.category.toLowerCase().replace(/\s+/g, '-') === category.toLowerCase()
        );

        if (!categorySkills) {
            return res.status(404).json({
                success: false,
                error: 'Skill category not found'
            });
        }

        res.json({
            success: true,
            data: categorySkills
        });
    } catch (error) {
        next(error);
    }
});

// @desc    Add new skill category (admin only)
// @route   POST /api/skills/category
// @access  Private/Admin
router.post('/category', protect, authorize('admin', 'super-admin'), [
    body('category')
        .trim()
        .isLength({ min: 3, max: 50 })
        .withMessage('Category name must be between 3 and 50 characters')
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

        const { category } = req.body;

        // Check if category already exists
        const existingCategory = skills.find(s => 
            s.category.toLowerCase() === category.toLowerCase()
        );

        if (existingCategory) {
            return res.status(400).json({
                success: false,
                error: 'Skill category already exists'
            });
        }

        const newCategory = {
            id: skills.length + 1,
            category,
            skills: []
        };

        skills.push(newCategory);

        res.status(201).json({
            success: true,
            message: 'Skill category created successfully',
            data: newCategory
        });
    } catch (error) {
        next(error);
    }
});

// @desc    Add skill to category (admin only)
// @route   POST /api/skills/category/:categoryId
// @access  Private/Admin
router.post('/category/:categoryId', protect, authorize('admin', 'super-admin'), [
    body('name')
        .trim()
        .isLength({ min: 2, max: 30 })
        .withMessage('Skill name must be between 2 and 30 characters'),
    body('level')
        .isInt({ min: 0, max: 100 })
        .withMessage('Skill level must be between 0 and 100')
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

        const categoryId = parseInt(req.params.categoryId);
        const { name, level } = req.body;

        const category = skills.find(s => s.id === categoryId);

        if (!category) {
            return res.status(404).json({
                success: false,
                error: 'Skill category not found'
            });
        }

        // Check if skill already exists in category
        const existingSkill = category.skills.find(s => 
            s.name.toLowerCase() === name.toLowerCase()
        );

        if (existingSkill) {
            return res.status(400).json({
                success: false,
                error: 'Skill already exists in this category'
            });
        }

        const newSkill = {
            name,
            level
        };

        category.skills.push(newSkill);

        res.status(201).json({
            success: true,
            message: 'Skill added successfully',
            data: newSkill
        });
    } catch (error) {
        next(error);
    }
});

// @desc    Update skill (admin only)
// @route   PUT /api/skills/category/:categoryId/skill/:skillName
// @access  Private/Admin
router.put('/category/:categoryId/skill/:skillName', protect, authorize('admin', 'super-admin'), [
    body('name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 30 })
        .withMessage('Skill name must be between 2 and 30 characters'),
    body('level')
        .optional()
        .isInt({ min: 0, max: 100 })
        .withMessage('Skill level must be between 0 and 100')
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

        const categoryId = parseInt(req.params.categoryId);
        const skillName = decodeURIComponent(req.params.skillName);
        const { name, level } = req.body;

        const category = skills.find(s => s.id === categoryId);

        if (!category) {
            return res.status(404).json({
                success: false,
                error: 'Skill category not found'
            });
        }

        const skill = category.skills.find(s => 
            s.name.toLowerCase() === skillName.toLowerCase()
        );

        if (!skill) {
            return res.status(404).json({
                success: false,
                error: 'Skill not found'
            });
        }

        if (name) skill.name = name;
        if (level !== undefined) skill.level = level;

        res.json({
            success: true,
            message: 'Skill updated successfully',
            data: skill
        });
    } catch (error) {
        next(error);
    }
});

// @desc    Delete skill (admin only)
// @route   DELETE /api/skills/category/:categoryId/skill/:skillName
// @access  Private/Admin
router.delete('/category/:categoryId/skill/:skillName', protect, authorize('admin', 'super-admin'), async (req, res, next) => {
    try {
        const categoryId = parseInt(req.params.categoryId);
        const skillName = decodeURIComponent(req.params.skillName);

        const category = skills.find(s => s.id === categoryId);

        if (!category) {
            return res.status(404).json({
                success: false,
                error: 'Skill category not found'
            });
        }

        const skillIndex = category.skills.findIndex(s => 
            s.name.toLowerCase() === skillName.toLowerCase()
        );

        if (skillIndex === -1) {
            return res.status(404).json({
                success: false,
                error: 'Skill not found'
            });
        }

        const deletedSkill = category.skills.splice(skillIndex, 1)[0];

        res.json({
            success: true,
            message: 'Skill deleted successfully',
            data: deletedSkill
        });
    } catch (error) {
        next(error);
    }
});

// @desc    Delete skill category (admin only)
// @route   DELETE /api/skills/category/:categoryId
// @access  Private/Admin
router.delete('/category/:categoryId', protect, authorize('admin', 'super-admin'), async (req, res, next) => {
    try {
        const categoryId = parseInt(req.params.categoryId);

        const categoryIndex = skills.findIndex(s => s.id === categoryId);

        if (categoryIndex === -1) {
            return res.status(404).json({
                success: false,
                error: 'Skill category not found'
            });
        }

        const deletedCategory = skills.splice(categoryIndex, 1)[0];

        res.json({
            success: true,
            message: 'Skill category deleted successfully',
            data: deletedCategory
        });
    } catch (error) {
        next(error);
    }
});

// @desc    Get skills statistics
// @route   GET /api/skills/stats
// @access  Public
router.get('/stats', async (req, res, next) => {
    try {
        const totalCategories = skills.length;
        const totalSkills = skills.reduce((acc, category) => acc + category.skills.length, 0);
        const averageLevel = skills.reduce((acc, category) => {
            const categoryAvg = category.skills.reduce((sum, skill) => sum + skill.level, 0) / category.skills.length;
            return acc + categoryAvg;
        }, 0) / totalCategories;

        const stats = {
            totalCategories,
            totalSkills,
            averageLevel: Math.round(averageLevel),
            categories: skills.map(category => ({
                name: category.category,
                skillCount: category.skills.length,
                averageLevel: Math.round(category.skills.reduce((sum, skill) => sum + skill.level, 0) / category.skills.length)
            }))
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
