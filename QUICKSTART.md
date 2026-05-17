# ⚡ AmpleCare - Quick Start Guide

Get **AmpleCare** running in **5 minutes**!

## 🚀 Quick Setup

### Prerequisites
- ✅ Node.js v18+ installed
- ✅ npm or yarn
- ✅ Visual Studio Code (optional)

### Step 1: Download & Install Dependencies

```bash
# Navigate to project directory
cd "c:\Users\bidha\OneDrive\Desktop\smart health"

# Install backend dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### Step 2: Configure Environment Variables

Create `.env` file in root directory:

```env
# For quick testing, use these mock values:

FIREBASE_PROJECT_ID=test-project
FIREBASE_API_KEY=test-key
FIREBASE_AUTH_DOMAIN=test.firebaseapp.com
FIREBASE_STORAGE_BUCKET=test.appspot.com
FIREBASE_MESSAGING_SENDER_ID=123456
FIREBASE_APP_ID=test-app-id

JWT_SECRET=test-secret-key-make-it-long-in-production

TWILIO_ACCOUNT_SID=ACxxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_PHONE_NUMBER=+1234567890

PORT=5000
NODE_ENV=development
```

### Step 3: Start the Application

**Option A: Run Both Servers (Recommended)**

```bash
npm run dev
```

This will start:
- 🔙 Backend on http://localhost:5000
- 🎨 Frontend on http://localhost:3000

**Option B: Run Separately**

Terminal 1 - Backend:
```bash
npm run server
```

Terminal 2 - Frontend:
```bash
cd frontend
npm start
```

### Step 4: Test the Login

1. Open http://localhost:3000 in your browser
2. Click **"Phone OTP"** tab
3. Enter phone: `+91 9876543210`
4. Click **"Send OTP"**
5. Copy the OTP from the notification (appears on screen in demo mode)
6. Paste OTP and click **"Verify OTP"**
7. ✅ You're logged in!

## 📱 Demo Credentials

### OTP Login (Recommended for Demo)
- **Phone**: `+91 9876543210`
- **OTP**: Displayed in notification (6 digits)

### Email Login
- **Email**: `guardian@example.com`
- **Password**: `password123`

To create a new account, click **"Create Guardian Account"** and fill the registration form.

## 🧪 Quick API Test

Test backend without frontend:

```bash
# Check if backend is running
curl http://localhost:5000/api/health

# Response should be:
# {"status":"AmpleCare Backend Running ✓"}
```

## 📊 Project Files Overview

### Backend Files
```
├── server.js              ← Main Express server
├── auth-routes.js         ← Login/Register API endpoints
├── otp-service.js         ← OTP generation logic
├── firebase-config.js     ← Firebase setup
└── package.json           ← Backend dependencies
```

### Frontend Files
```
frontend/
├── src/
│   ├── pages/
│   │   ├── LoginPage.jsx      ← Login page with OTP
│   │   ├── RegisterPage.jsx   ← Registration form
│   │   └── Dashboard.jsx      ← Patient dashboard
│   ├── components/
│   │   └── ParticleBackground.jsx ← Animated background
│   ├── styles/
│   │   ├── globals.css        ← Global styles
│   │   ├── login.css          ← Login page styles
│   │   └── particles.css      ← Animation styles
│   └── App.js                 ← Main app component
└── package.json
```

## 🎨 UI Features

✨ **Modern Design**
- Glassmorphism effect (frosted glass cards)
- Neon blue & green gradients
- Animated particle background
- Smooth Framer Motion animations
- Dark healthcare theme

🎯 **Responsive Layout**
- Desktop: Full layout
- Tablet: Optimized grid
- Mobile: Single column

## 🔒 Authentication Flow Explained

### OTP-Based Login (Phone)
```
User enters phone → Backend generates OTP → SMS sent to phone
User enters OTP → Backend verifies → JWT token created
Token stored in localStorage → User redirected to dashboard
```

### Email + Password Login
```
User enters email & password → Database lookup
Password verified → JWT token created → User logged in
```

## ❌ Troubleshooting

### "Port 5000 is already in use"
```bash
# Use different port
PORT=5001 npm run server
```

### "Module not found" error
```bash
# Reinstall dependencies
rm -rf node_modules
npm install
```

### "Cannot find module 'firebase-admin'"
```bash
# Make sure to install dependencies
npm install firebase-admin
```

### Frontend won't load
```bash
# Check if backend is running
curl http://localhost:5000/api/health

# If not, start backend first:
npm run server
```

## 📈 Next Steps After Login

After successfully logging in, you can:

1. **View Patient Dashboard** (in development)
   - Real-time vitals
   - Fall detection status
   - Emergency alerts

2. **Register Patients**
   - Add patient information
   - Set emergency contacts
   - Enable wearable tracking

3. **Monitor Health**
   - Live heart rate
   - Oxygen levels
   - GPS tracking
   - Emergency history

4. **Emergency Response**
   - View nearby hospitals
   - Call ambulance
   - Contact emergency services

## 🎓 Learning Objectives

By exploring this project, you'll learn:

✅ **Frontend**
- React hooks & components
- Framer Motion animations
- Tailwind CSS styling
- HTTP requests with Axios

✅ **Backend**
- Express.js server setup
- JWT authentication
- OTP verification logic
- REST API design

✅ **Real-time Features**
- Firebase integration
- Database queries
- Push notifications
- Live data streaming

## 📞 Need Help?

1. Check the **README.md** for detailed setup
2. Review **API Endpoints** section for endpoint details
3. Check browser console for errors: F12 → Console
4. Check backend logs in terminal

## 🎉 You're Ready!

Your AmpleCare healthcare monitoring system is now running!

🔒 **Secure** - JWT authentication
⚡ **Fast** - Real-time updates
📱 **Responsive** - Works on all devices
🎨 **Beautiful** - Modern UI design

---

**Happy Coding! 💻❤️**

For detailed documentation, see **README.md**
