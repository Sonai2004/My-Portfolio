const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please add a project title'],
        trim: true,
        maxlength: [100, 'Title cannot be more than 100 characters']
    },
    description: {
        type: String,
        required: [true, 'Please add a project description'],
        trim: true,
        maxlength: [1000, 'Description cannot be more than 1000 characters']
    },
    shortDescription: {
        type: String,
        trim: true,
        maxlength: [200, 'Short description cannot be more than 200 characters']
    },
    category: {
        type: String,
        required: [true, 'Please add a project category'],
        enum: ['web-development', 'mobile-app', 'ai-ml', 'database', 'other'],
        default: 'web-development'
    },
    technologies: [{
        type: String,
        trim: true
    }],
    image: {
        type: String,
        trim: true
    },
    images: [{
        type: String,
        trim: true
    }],
    liveUrl: {
        type: String,
        trim: true,
        match: [
            /^https?:\/\/.+/,
            'Please add a valid URL'
        ]
    },
    githubUrl: {
        type: String,
        trim: true,
        match: [
            /^https?:\/\/.+/,
            'Please add a valid URL'
        ]
    },
    demoUrl: {
        type: String,
        trim: true,
        match: [
            /^https?:\/\/.+/,
            'Please add a valid URL'
        ]
    },
    features: [{
        type: String,
        trim: true,
        maxlength: [200, 'Feature description cannot be more than 200 characters']
    }],
    challenges: {
        type: String,
        trim: true,
        maxlength: [500, 'Challenges description cannot be more than 500 characters']
    },
    solutions: {
        type: String,
        trim: true,
        maxlength: [500, 'Solutions description cannot be more than 500 characters']
    },
    status: {
        type: String,
        enum: ['draft', 'published', 'archived'],
        default: 'draft'
    },
    featured: {
        type: Boolean,
        default: false
    },
    order: {
        type: Number,
        default: 0
    },
    views: {
        type: Number,
        default: 0
    },
    likes: {
        type: Number,
        default: 0
    },
    startDate: {
        type: Date
    },
    endDate: {
        type: Date
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Indexes for better query performance
ProjectSchema.index({ status: 1, featured: 1, order: 1 });
ProjectSchema.index({ category: 1, status: 1 });
ProjectSchema.index({ technologies: 1 });

// Pre-save middleware to update updatedAt
ProjectSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Virtual for project duration
ProjectSchema.virtual('duration').get(function() {
    if (this.startDate && this.endDate) {
        const start = new Date(this.startDate);
        const end = new Date(this.endDate);
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    }
    return null;
});

// Static method to get project statistics
ProjectSchema.statics.getStats = async function() {
    const stats = await this.aggregate([
        {
            $group: {
                _id: '$category',
                count: { $sum: 1 },
                totalViews: { $sum: '$views' },
                totalLikes: { $sum: '$likes' }
            }
        }
    ]);

    const total = await this.countDocuments();
    const published = await this.countDocuments({ status: 'published' });
    const featured = await this.countDocuments({ featured: true, status: 'published' });

    return {
        total,
        published,
        featured,
        byCategory: stats.reduce((acc, stat) => {
            acc[stat._id] = {
                count: stat.count,
                views: stat.totalViews,
                likes: stat.totalLikes
            };
            return acc;
        }, {})
    };
};

// Static method to get featured projects
ProjectSchema.statics.getFeatured = function() {
    return this.find({ featured: true, status: 'published' })
        .sort({ order: 1, createdAt: -1 })
        .limit(6);
};

// Static method to get projects by category
ProjectSchema.statics.getByCategory = function(category) {
    return this.find({ category, status: 'published' })
        .sort({ order: 1, createdAt: -1 });
};

// Instance method to increment views
ProjectSchema.methods.incrementViews = function() {
    this.views += 1;
    return this.save();
};

// Instance method to increment likes
ProjectSchema.methods.incrementLikes = function() {
    this.likes += 1;
    return this.save();
};

// Instance method to toggle featured status
ProjectSchema.methods.toggleFeatured = function() {
    this.featured = !this.featured;
    return this.save();
};

module.exports = mongoose.model('Project', ProjectSchema);
