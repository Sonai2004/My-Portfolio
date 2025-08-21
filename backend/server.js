const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

// Import database connection
const connectDB = require('./config/database');

// Import routes
const contactRoutes = require('./routes/contact');
const projectRoutes = require('./routes/projects');
const skillRoutes = require('./routes/skills');
const achievementRoutes = require('./routes/achievements');
const adminRoutes = require('./routes/admin');

// Import middleware
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// CORS configuration
app.use(cors({
    origin: process.env.FRONTEND_URL || ['http://localhost:3000', 'http://localhost:5000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Compression middleware
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
} else {
    app.use(morgan('combined'));
}

// Static files
app.use('/uploads', express.static('uploads'));

// Serve frontend files
app.use(express.static(path.join(__dirname, '../Frontend')));

// Favicon route to prevent 404 errors
app.get('/favicon.ico', (req, res) => {
    res.status(204).end(); // No content response
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'success',
        message: 'Portfolio API is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// API routes
app.use('/api/contact', contactRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/skills', skillRoutes);
app.use('/api/achievements', achievementRoutes);
app.use('/api/admin', adminRoutes);

// Root endpoint - serve the frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../Frontend/index.html'));
});

// API info endpoint
app.get('/api', (req, res) => {
    res.json({
        message: 'Welcome to Sonai Chatterjee Portfolio API',
        version: '1.0.0',
        endpoints: {
            health: '/api/health',
            contact: '/api/contact',
            projects: '/api/projects',
            skills: '/api/skills',
            achievements: '/api/achievements',
            admin: '/api/admin'
        }
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        status: 'error',
        message: `Route ${req.originalUrl} not found`
    });
});

// Error handling middleware
app.use(errorHandler);

// Connect to database and start server
const startServer = async () => {
    try {
        // Connect to MongoDB (optional for development)
        if (process.env.MONGODB_URI && process.env.MONGODB_URI !== 'mongodb://localhost:27017/portfolio') {
            await connectDB();
            
            // Create default admin if it doesn't exist
            const Admin = require('./models/Admin');
            await Admin.createDefaultAdmin();
            console.log(`📦 Database: Connected`);
        } else {
            console.log(`⚠️  Database: Not connected (using local MongoDB or no database)`);
        }
        
        // Start server
        app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
            console.log(`📧 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`🌐 API URL: http://localhost:${PORT}`);
            console.log(`📊 Health Check: http://localhost:${PORT}/api/health`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    process.exit(0);
});

module.exports = app;
