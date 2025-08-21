# Portfolio Backend API

A comprehensive Node.js/Express.js backend API for managing Sonai Chatterjee's portfolio website. Features include contact form handling, project management, admin authentication, and email notifications.

## 🚀 Features

### Core Functionality
- **Contact Form Management**: Handle contact submissions with email notifications
- **Project Management**: CRUD operations for portfolio projects
- **Admin Authentication**: Secure JWT-based authentication system
- **Email Service**: Automated email notifications using Nodemailer
- **File Upload**: Image upload for projects and profile pictures
- **Role-Based Access Control**: Admin and Super-Admin roles

### Security Features
- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: Bcrypt password encryption
- **Rate Limiting**: API rate limiting to prevent abuse
- **Input Validation**: Comprehensive request validation
- **CORS Protection**: Cross-origin resource sharing configuration
- **Helmet Security**: Security headers middleware

### Database Features
- **MongoDB Integration**: MongoDB with Mongoose ODM
- **Data Validation**: Schema-based data validation
- **Indexing**: Optimized database queries
- **Error Handling**: Comprehensive error management

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or cloud)
- npm or yarn package manager

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp config.env.example .env
   ```
   
   Edit `.env` file with your configuration:
   ```env
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/portfolio
   JWT_SECRET=your-super-secret-jwt-key
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   ```

4. **Start the server**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

## 📁 Project Structure

```
backend/
├── config/
│   └── database.js          # Database configuration
├── middleware/
│   ├── auth.js              # Authentication middleware
│   ├── errorHandler.js      # Error handling middleware
│   └── upload.js            # File upload middleware
├── models/
│   ├── Admin.js             # Admin user model
│   ├── Contact.js           # Contact form model
│   └── Project.js           # Project model
├── routes/
│   ├── admin.js             # Admin routes
│   ├── contact.js           # Contact routes
│   ├── projects.js          # Project routes
│   ├── skills.js            # Skills routes
│   └── achievements.js      # Achievements routes
├── utils/
│   └── emailService.js      # Email service utilities
├── uploads/                 # File upload directory
├── server.js                # Main server file
├── package.json             # Dependencies and scripts
└── README.md               # This file
```

## 🔌 API Endpoints

### Authentication
- `POST /api/admin/login` - Admin login
- `POST /api/admin/forgot-password` - Forgot password
- `PUT /api/admin/reset-password/:token` - Reset password
- `GET /api/admin/profile` - Get admin profile
- `PUT /api/admin/profile` - Update admin profile
- `PUT /api/admin/change-password` - Change password

### Contact Management
- `POST /api/contact` - Submit contact form
- `GET /api/contact` - Get all contacts (admin)
- `GET /api/contact/:id` - Get single contact (admin)
- `PUT /api/contact/:id/status` - Update contact status (admin)
- `DELETE /api/contact/:id` - Delete contact (admin)

### Project Management
- `GET /api/projects` - Get all projects
- `GET /api/projects/:id` - Get single project
- `POST /api/projects` - Create project (admin)
- `PUT /api/projects/:id` - Update project (admin)
- `DELETE /api/projects/:id` - Delete project (admin)

### Admin Management (Super-Admin)
- `GET /api/admin` - Get all admins
- `POST /api/admin` - Create new admin
- `PUT /api/admin/:id` - Update admin
- `DELETE /api/admin/:id` - Delete admin

## 🔐 Authentication

### JWT Token
Include the JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

### Role-Based Access
- **Admin**: Can manage projects, contacts, and their own profile
- **Super-Admin**: Can manage all admins and has full access

## 📧 Email Configuration

### Gmail Setup
1. Enable 2-factor authentication
2. Generate App Password
3. Use App Password in EMAIL_PASS

### Email Templates
- Contact form notifications
- Password reset emails
- Welcome emails for new admins

## 🗄️ Database Models

### Contact Model
```javascript
{
  name: String,
  email: String,
  subject: String,
  message: String,
  phone: String,
  status: String, // unread, read, replied, archived
  ipAddress: String,
  userAgent: String,
  createdAt: Date
}
```

### Project Model
```javascript
{
  title: String,
  description: String,
  category: String,
  technologies: [String],
  image: String,
  liveUrl: String,
  githubUrl: String,
  status: String, // draft, published, archived
  featured: Boolean,
  views: Number,
  likes: Number
}
```

### Admin Model
```javascript
{
  name: String,
  email: String,
  password: String,
  role: String, // admin, super-admin
  isActive: Boolean,
  lastLogin: Date
}
```

## 🚀 Deployment

### Environment Variables
Set up environment variables for production:
```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/portfolio
JWT_SECRET=your-production-jwt-secret
FRONTEND_URL=https://yourdomain.com
```

### PM2 Deployment
```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start server.js --name "portfolio-api"

# Save PM2 configuration
pm2 save

# Setup PM2 startup script
pm2 startup
```

### Docker Deployment
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

## 🔧 Development

### Scripts
```bash
npm run dev          # Start development server with nodemon
npm start           # Start production server
npm test            # Run tests (if configured)
```

### Database Seeding
```bash
# Create default admin user
# This happens automatically on first run
```

### API Testing
Use tools like Postman or curl to test endpoints:

```bash
# Test health endpoint
curl http://localhost:5000/api/health

# Test contact form
curl -X POST http://localhost:5000/api/contact \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","subject":"Test","message":"Hello"}'
```

## 📊 Monitoring

### Health Check
- `GET /api/health` - API health status

### Logging
- Morgan HTTP request logging
- Error logging with stack traces
- Email service logging

### Performance
- Compression middleware
- Database indexing
- Rate limiting

## 🔒 Security

### Best Practices
- Input validation and sanitization
- Password hashing with bcrypt
- JWT token expiration
- Rate limiting
- CORS configuration
- Security headers with Helmet

### Environment Security
- Never commit `.env` files
- Use strong JWT secrets
- Secure database connections
- Regular dependency updates

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Check the API documentation
- Review error logs
- Test with Postman
- Check environment configuration

## 🔄 Updates

### Version 1.0.0
- Initial release
- Basic CRUD operations
- Authentication system
- Email notifications
- File upload functionality

---

**Built with ❤️ for Sonai Chatterjee's Portfolio**

