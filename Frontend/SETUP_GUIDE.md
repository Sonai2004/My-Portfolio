# Portfolio Website Setup Guide

Complete setup guide for Sonai Chatterjee's Portfolio Website with Frontend and Backend.

## 📁 Project Structure

```
portfolio-website/
├── frontend/                 # Frontend files
│   ├── index.html           # Main HTML file
│   ├── styles.css           # CSS styling
│   ├── script.js            # JavaScript functionality
│   └── README.md            # Frontend documentation
├── backend/                  # Backend API
│   ├── config/
│   │   └── database.js      # Database configuration
│   ├── middleware/
│   │   ├── auth.js          # Authentication middleware
│   │   ├── errorHandler.js  # Error handling
│   │   └── upload.js        # File upload middleware
│   ├── models/
│   │   ├── Admin.js         # Admin user model
│   │   ├── Contact.js       # Contact form model
│   │   └── Project.js       # Project model
│   ├── routes/
│   │   ├── admin.js         # Admin routes
│   │   ├── contact.js       # Contact routes
│   │   ├── projects.js      # Project routes
│   │   ├── skills.js        # Skills routes
│   │   └── achievements.js  # Achievements routes
│   ├── utils/
│   │   └── emailService.js  # Email service
│   ├── uploads/             # File upload directory
│   ├── server.js            # Main server file
│   ├── package.json         # Backend dependencies
│   ├── config.env.example   # Environment variables template
│   └── README.md            # Backend documentation
└── SETUP_GUIDE.md           # This file
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud)
- npm or yarn package manager

### Step 1: Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   ```bash
   cp config.env.example .env
   ```

4. **Edit .env file**
   ```env
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/portfolio
   JWT_SECRET=your-super-secret-jwt-key-change-this
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   EMAIL_FROM=your-email@gmail.com
   ADMIN_EMAIL=admin@example.com
   ADMIN_PASSWORD=admin123
   FRONTEND_URL=http://localhost:3000
   ```

5. **Start MongoDB** (if using local MongoDB)
   ```bash
   # On Windows
   mongod
   
   # On macOS/Linux
   sudo systemctl start mongod
   ```

6. **Start the backend server**
   ```bash
   npm run dev
   ```

   You should see:
   ```
   🚀 Server running on port 5000
   📧 Environment: development
   🌐 API URL: http://localhost:5000
   📊 Health Check: http://localhost:5000/api/health
   📦 Database: Connected
   Default admin created
   ```

### Step 2: Frontend Setup

1. **Navigate to frontend directory** (or root directory)
   ```bash
   cd ..  # if you're in backend directory
   ```

2. **Open the website**
   - Simply open `index.html` in your browser
   - Or use a local server:
     ```bash
     # Using Python
     python -m http.server 3000
     
     # Using Node.js
     npx serve .
     
     # Using PHP
     php -S localhost:3000
     ```

3. **Access the website**
   - Open: `http://localhost:3000` (or whatever port you used)

## 🔧 Configuration Details

### Backend Configuration

#### Database Setup
- **Local MongoDB**: Install MongoDB locally and use `mongodb://localhost:27017/portfolio`
- **MongoDB Atlas**: Use cloud MongoDB with connection string like:
  ```
  mongodb+srv://username:password@cluster.mongodb.net/portfolio
  ```

#### Email Configuration
1. **Gmail Setup**:
   - Enable 2-factor authentication on your Gmail account
   - Generate an App Password
   - Use the App Password in `EMAIL_PASS`

2. **Other Email Providers**:
   - Update `EMAIL_HOST`, `EMAIL_PORT` accordingly
   - Use appropriate credentials

#### Admin Account
- Default admin credentials are set in `.env`
- Email: `admin@example.com`
- Password: `admin123`
- Change these in production!

### Frontend Configuration

#### API Integration
- The frontend is configured to connect to `http://localhost:5000`
- Update the API URL in `script.js` if your backend runs on a different port

#### Customization
- Update personal information in `index.html`
- Modify styling in `styles.css`
- Add custom functionality in `script.js`

## 🧪 Testing the Setup

### Backend API Testing

1. **Health Check**
   ```bash
   curl http://localhost:5000/api/health
   ```

2. **Contact Form Test**
   ```bash
   curl -X POST http://localhost:5000/api/contact \
     -H "Content-Type: application/json" \
     -d '{
       "name": "Test User",
       "email": "test@example.com",
       "subject": "Test Message",
       "message": "This is a test message"
     }'
   ```

3. **Admin Login Test**
   ```bash
   curl -X POST http://localhost:5000/api/admin/login \
     -H "Content-Type: application/json" \
     -d '{
       "email": "admin@example.com",
       "password": "admin123"
     }'
   ```

### Frontend Testing

1. **Open the website** in your browser
2. **Test the contact form** - it should send emails
3. **Test navigation** - all sections should be accessible
4. **Test responsiveness** - try different screen sizes

## 🔐 Security Considerations

### Production Deployment

1. **Environment Variables**
   - Use strong JWT secrets
   - Secure database connections
   - Use HTTPS in production

2. **Email Security**
   - Use environment variables for email credentials
   - Never commit `.env` files to version control

3. **Database Security**
   - Use strong database passwords
   - Enable database authentication
   - Use connection pooling

4. **API Security**
   - Enable rate limiting
   - Use CORS properly
   - Validate all inputs

## 🚀 Deployment Options

### Backend Deployment

#### Heroku
```bash
# Install Heroku CLI
npm install -g heroku

# Login to Heroku
heroku login

# Create Heroku app
heroku create your-portfolio-api

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set MONGODB_URI=your-mongodb-uri
heroku config:set JWT_SECRET=your-jwt-secret

# Deploy
git push heroku main
```

#### Railway
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Initialize project
railway init

# Deploy
railway up
```

#### DigitalOcean App Platform
- Connect your GitHub repository
- Set environment variables
- Deploy automatically

### Frontend Deployment

#### Netlify
1. Drag and drop your frontend folder
2. Or connect your GitHub repository
3. Set build settings if needed

#### Vercel
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel
```

#### GitHub Pages
1. Push code to GitHub
2. Go to repository Settings > Pages
3. Select source branch

## 🔧 Troubleshooting

### Common Issues

#### Backend Issues

1. **MongoDB Connection Failed**
   ```
   Error: MongoDB connection failed
   ```
   - Check if MongoDB is running
   - Verify connection string in `.env`
   - Check network connectivity

2. **Email Not Sending**
   ```
   Error: Email sending failed
   ```
   - Verify email credentials in `.env`
   - Check if 2FA is enabled for Gmail
   - Use App Password instead of regular password

3. **Port Already in Use**
   ```
   Error: listen EADDRINUSE: address already in use :::5000
   ```
   - Change PORT in `.env`
   - Or kill the process using port 5000

#### Frontend Issues

1. **API Connection Failed**
   ```
   Error: Failed to fetch
   ```
   - Check if backend is running
   - Verify API URL in `script.js`
   - Check CORS configuration

2. **Contact Form Not Working**
   - Check browser console for errors
   - Verify backend is running
   - Check network tab for API calls

### Debug Mode

Enable debug logging in backend:
```env
NODE_ENV=development
DEBUG=*
```

## 📞 Support

### Getting Help

1. **Check the logs** - Backend console and browser console
2. **Verify configuration** - All environment variables set correctly
3. **Test step by step** - Start with backend, then frontend
4. **Check documentation** - README files in both directories

### Common Commands

```bash
# Backend
cd backend
npm install
npm run dev

# Frontend
# Open index.html in browser
# Or use local server
python -m http.server 3000

# Database
# Start MongoDB
mongod

# Testing
curl http://localhost:5000/api/health
```

## 🎉 Success!

Once everything is working:

1. ✅ Backend server running on port 5000
2. ✅ Database connected
3. ✅ Frontend accessible
4. ✅ Contact form sending emails
5. ✅ Admin panel accessible

Your portfolio website is now fully functional with:
- **Frontend**: Modern, responsive design
- **Backend**: Secure API with authentication
- **Database**: MongoDB for data persistence
- **Email**: Automated contact form notifications
- **File Upload**: Image upload for projects
- **Admin Panel**: Content management system

---

**Happy coding! 🚀**

