const mongoose = require('mongoose');

const ContactSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a name'],
        trim: true,
        maxlength: [50, 'Name cannot be more than 50 characters']
    },
    email: {
        type: String,
        required: [true, 'Please add an email'],
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Please add a valid email'
        ]
    },
    subject: {
        type: String,
        required: [true, 'Please add a subject'],
        trim: true,
        maxlength: [100, 'Subject cannot be more than 100 characters']
    },
    message: {
        type: String,
        required: [true, 'Please add a message'],
        trim: true,
        maxlength: [1000, 'Message cannot be more than 1000 characters']
    },
    phone: {
        type: String,
        trim: true,
        maxlength: [20, 'Phone number cannot be more than 20 characters']
    },
    status: {
        type: String,
        enum: ['unread', 'read', 'replied', 'archived'],
        default: 'unread'
    },
    ipAddress: {
        type: String,
        trim: true
    },
    userAgent: {
        type: String,
        trim: true
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

// Index for better query performance
ContactSchema.index({ status: 1, createdAt: -1 });
ContactSchema.index({ email: 1 });

// Pre-save middleware to update updatedAt
ContactSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Static method to get contact statistics
ContactSchema.statics.getStats = async function() {
    const stats = await this.aggregate([
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 }
            }
        }
    ]);

    const total = await this.countDocuments();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayCount = await this.countDocuments({
        createdAt: { $gte: today }
    });

    return {
        total,
        today: todayCount,
        byStatus: stats.reduce((acc, stat) => {
            acc[stat._id] = stat.count;
            return acc;
        }, {})
    };
};

// Instance method to mark as read
ContactSchema.methods.markAsRead = function() {
    this.status = 'read';
    return this.save();
};

// Instance method to mark as replied
ContactSchema.methods.markAsReplied = function() {
    this.status = 'replied';
    return this.save();
};

module.exports = mongoose.model('Contact', ContactSchema);
