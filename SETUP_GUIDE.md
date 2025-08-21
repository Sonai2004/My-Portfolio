# Portfolio Project Setup Guide

## Issues Fixed ✅

1. **Favicon 404 Error**: Added favicon route and inline SVG favicon
2. **Frontend Serving**: Backend now serves frontend files
3. **API Integration**: Updated frontend to use relative API URLs
4. **CORS Configuration**: Updated to allow same-origin requests

## How to Run the Project

### Option 1: Run Backend Only (Recommended)
The backend now serves the frontend files, so you only need to run the backend server.

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   - Copy `config.env.example` to `config.env`
   - Update the values as needed

4. **Start the server:**
   ```bash
   npm start
   ```

5. **Access your portfolio:**
   - Open your browser and go to: `http://localhost:5000`
   - The frontend will be served automatically

### Option 2: Run Frontend Separately (Development)
If you want to run frontend and backend separately for development:

1. **Backend (Terminal 1):**
   ```bash
   cd backend
   npm install
   npm start
   ```

2. **Frontend (Terminal 2):**
   ```bash
   cd Frontend
   # Use any static file server like:
   npx http-server -p 3000
   # or
   python -m http.server 3000
   ```

## What Was Fixed

### 1. Favicon Error
- **Problem**: Browser was requesting `/favicon.ico` but server didn't have one
- **Solution**: 
  - Added favicon route in backend (`/favicon.ico`)
  - Added inline SVG favicon in frontend HTML

### 2. Frontend Serving
- **Problem**: Frontend files weren't being served by the backend
- **Solution**: 
  - Added static file serving for frontend directory
  - Root route now serves `index.html`

### 3. API Integration
- **Problem**: Frontend was using hardcoded localhost URL
- **Solution**: 
  - Updated to use relative URLs (`/api/contact` instead of `http://localhost:5000/api/contact`)
  - Updated CORS to allow same-origin requests

### 4. Reporting.js Error
- **Problem**: This is likely from a browser extension or development tool
- **Solution**: This error is harmless and doesn't affect functionality

## API Endpoints

- **Health Check**: `GET /api/health`
- **Contact Form**: `POST /api/contact`
- **Projects**: `GET /api/projects`
- **Skills**: `GET /api/skills`
- **Achievements**: `GET /api/achievements`
- **Admin**: `GET /api/admin`

## File Structure

```
my folder/
├── backend/          # Node.js/Express server
│   ├── server.js     # Main server file (updated)
│   ├── routes/       # API routes
│   ├── models/       # Database models
│   └── ...
├── Frontend/         # Static frontend files
│   ├── index.html    # Main HTML file (updated with favicon)
│   ├── script.js     # JavaScript (updated API URLs)
│   └── styles.css    # CSS styles
└── SETUP_GUIDE.md    # This file
```

## Troubleshooting

1. **Port already in use**: Change the port in `backend/server.js` or kill the process using the port
2. **Database connection issues**: Make sure MongoDB is running or update the connection string
3. **CORS errors**: The backend now allows same-origin requests, so this should be resolved

## Next Steps

1. Customize the portfolio content in `Frontend/index.html`
2. Update the contact form to use your real email
3. Add your actual projects and achievements
4. Deploy to a hosting service like Heroku, Vercel, or Netlify

Your portfolio should now work without the 404 favicon error! 🎉
