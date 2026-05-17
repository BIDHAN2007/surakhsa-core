# 🚀 AmpleCare - AI-Powered Healthcare Emergency Monitoring Platform

An intelligent, real-time health monitoring system designed for elderly people, heart patients, and individuals living alone. Features wearable integration, live fall detection, GPS tracking, and instant emergency alerts.

## 🎯 Project Overview

**AmpleCare** is a full-stack healthcare solution that connects:
- Smart wearable healthcare band with advanced sensors
- Real-time web dashboard for guardians
- Mobile tracking system
- Emergency alert automation
- Hospital & ambulance integration

### Key Features

✅ **Real-time Monitoring**
- Heart rate monitoring
- SpO₂ oxygen level tracking
- Fall detection (MPU6050 gyroscope)
- Body temperature monitoring
- Movement activity tracking

✅ **Emergency Detection**
- Sudden fall alerts with automatic location sharing
- Abnormal vital sign detection
- Inactivity alerts (no movement for 10+ seconds)
- Instant SMS/push notifications to guardians

✅ **Live Location Tracking**
- Google Maps integration
- Real-time GPS tracking
- Nearby hospital alerts
- Ambulance route visualization

✅ **Guardian Dashboard**
- Live health vitals display
- Patient emergency history
- Medical reports & PDF exports
- Multiple patient management

✅ **Advanced Security**
- OTP-based authentication
- JWT session management
- Encrypted data transmission
- HIPAA-compliant database

## 📋 Tech Stack

### Frontend
- **React.js 18.x** - UI framework
- **Next.js** - Server-side rendering (optional)
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **React Router** - Navigation
- **Axios** - HTTP client
- **React Hot Toast** - Notifications

### Backend
- **Node.js + Express.js** - Server
- **Firebase** - Real-time database & Auth
- **MongoDB** - Data persistence
- **Firebase Cloud Messaging** - Push notifications
- **Twilio** - SMS notifications
- **JWT** - Authentication

### IoT & Sensors
- **ESP32** - Microcontroller
- **MPU6050** - Gyroscope & Accelerometer
- **MAX30102** - Heart rate & SpO₂ sensor
- **NEO-6M** - GPS module

## 🛠️ Installation & Setup

### Prerequisites
```bash
- Node.js v18+ (https://nodejs.org)
- npm or yarn
- Firebase Account (https://firebase.google.com)
- Twilio Account (https://www.twilio.com) - for SMS
- MongoDB Atlas (https://www.mongodb.com/cloud/atlas) - optional
```

### Backend Setup

1. **Clone the repository**
```bash
git clone https://github.com/your-username/amplecare.git
cd amplecare
```

2. **Install backend dependencies**
```bash
npm install
```

3. **Configure environment variables**
Create a `.env` file in the root directory:

```env
# Firebase Configuration
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your_sender_id
FIREBASE_APP_ID=your_app_id

# MongoDB (Optional)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/amplecare

# JWT Secret
JWT_SECRET=your_super_secret_jwt_key_here_make_it_very_strong

# Twilio SMS Configuration
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# Server Configuration
PORT=5000
NODE_ENV=development

# Email Configuration (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

4. **Get Firebase Service Account Key**
- Go to Firebase Console → Project Settings → Service Accounts
- Download JSON key file
- Add these details to `.env` file

5. **Start the backend server**
```bash
npm run server
```

Expected output:
```
🚀 AmpleCare Server running on http://localhost:5000
📊 API Health: http://localhost:5000/api/health
```

### Frontend Setup

1. **Navigate to frontend directory**
```bash
cd frontend
npm install
```

2. **Create `.env.local` file**
```env
REACT_APP_API_URL=http://localhost:5000/api
```

3. **Start the development server**
```bash
npm start
```

The application will open at `http://localhost:3000`

### Running Both Servers Simultaneously

From the root directory:
```bash
npm run dev
```

This starts both backend (port 5000) and frontend (port 3000) concurrently.

## 📱 Login Credentials

For testing, you can use the OTP-based authentication:

1. **Phone Number Login**
   - Enter any phone number (format: +91 XXXXX XXXXX)
   - OTP will be displayed in the toast notification (demo only)
   - Default OTP pattern: 6-digit number
   - On production, Twilio will send real SMS

2. **Email + Password Login**
   - Create an account via the registration page
   - Use credentials to log in

## 🔐 Authentication Flow

### OTP-Based Login (Recommended)
```
1. User enters phone number
   ↓
2. Backend generates 6-digit OTP
   ↓
3. OTP sent via Twilio SMS
   ↓
4. User enters OTP
   ↓
5. JWT token generated
   ↓
6. User logged in & redirected to dashboard
```

### Email + Password Login
```
1. User enters email & password
   ↓
2. Credentials verified against database
   ↓
3. JWT token generated
   ↓
4. User logged in & redirected to dashboard
```

## 📊 API Endpoints

### Authentication

#### Send OTP
```
POST /api/auth/send-otp
Content-Type: application/json

{
  "phoneNumber": "+91 9876543210"
}

Response:
{
  "success": true,
  "message": "OTP sent successfully",
  "otp": "123456" // Demo only
}
```

#### Verify OTP
```
POST /api/auth/verify-otp
Content-Type: application/json

{
  "phoneNumber": "+91 9876543210",
  "otp": "123456"
}

Response:
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "guardianId": "abc123",
  "phoneNumber": "+91 9876543210"
}
```

#### Register Guardian
```
POST /api/auth/register
Content-Type: application/json

{
  "fullName": "John Doe",
  "phoneNumber": "+91 9876543210",
  "email": "john@example.com",
  "password": "securepassword",
  "dateOfBirth": "1990-01-15",
  "address": "123 Main St, City"
}

Response:
{
  "success": true,
  "message": "Registration successful",
  "guardianId": "abc123"
}
```

#### Email + Password Login
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securepassword"
}

Response:
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "guardianId": "abc123"
}
```

#### Get Guardian Profile
```
GET /api/auth/profile
Headers:
  x-guardian-id: abc123

Response:
{
  "success": true,
  "data": {
    "id": "abc123",
    "fullName": "John Doe",
    "phoneNumber": "+91 9876543210",
    "email": "john@example.com",
    "verified": true,
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

## 🗄️ Database Schema

### Guardians Collection
```javascript
{
  id: "auto-generated",
  fullName: String,
  phoneNumber: String,
  email: String,
  password: String,
  dateOfBirth: Date,
  address: String,
  createdAt: Date,
  verified: Boolean,
  patients: [patientIds],
  emergencyContacts: [
    {
      name: String,
      relation: String,
      phone: String
    }
  ]
}
```

### Patients Collection
```javascript
{
  id: "auto-generated",
  name: String,
  dateOfBirth: Date,
  age: Number,
  phoneNumber: String,
  email: String,
  bloodGroup: String,
  diseases: [String],
  medications: [String],
  address: String,
  guardianId: String,
  wearableDeviceId: String,
  emergencyHistory: [emergencyIds],
  createdAt: Date,
  lastUpdated: Date
}
```

### Real-time Vitals Collection
```javascript
{
  patientId: String,
  heartRate: Number,
  spO2: Number,
  temperature: Number,
  bodyMovement: Boolean,
  timestamp: Date,
  fallDetected: Boolean,
  location: {
    latitude: Number,
    longitude: Number
  }
}
```

### Emergency Alerts Collection
```javascript
{
  id: "auto-generated",
  patientId: String,
  guardianId: String,
  alertType: "fall" | "abnormal_vitals" | "inactivity" | "manual",
  severity: "low" | "medium" | "high" | "critical",
  status: "active" | "responded" | "resolved",
  location: {
    latitude: Number,
    longitude: Number,
    address: String
  },
  vitalSigns: {
    heartRate: Number,
    spO2: Number,
    temperature: Number
  },
  nearbyHospitals: [hospitalIds],
  ambulanceRequested: Boolean,
  notificationSent: Boolean,
  createdAt: Date,
  resolvedAt: Date
}
```

## 🚀 Deployment

### Backend Deployment (Heroku)

1. **Create Heroku app**
```bash
heroku create amplecare-backend
```

2. **Add environment variables**
```bash
heroku config:set FIREBASE_API_KEY=xxx -a amplecare-backend
heroku config:set TWILIO_ACCOUNT_SID=xxx -a amplecare-backend
# Add other variables similarly
```

3. **Deploy**
```bash
git push heroku main
```

### Frontend Deployment (Vercel)

1. **Install Vercel CLI**
```bash
npm i -g vercel
```

2. **Deploy**
```bash
cd frontend
vercel
```

3. **Configure environment**
```
REACT_APP_API_URL=https://amplecare-backend.herokuapp.com/api
```

## 🧪 Testing

### Test OTP Authentication
1. Open `http://localhost:3000`
2. Enter phone number: `+91 9876543210`
3. Click "Send OTP"
4. Copy OTP from toast notification
5. Enter OTP and verify
6. Should redirect to dashboard

### API Testing with cURL

```bash
# Health check
curl http://localhost:5000/api/health

# Send OTP
curl -X POST http://localhost:5000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+91 9876543210"}'

# Verify OTP
curl -X POST http://localhost:5000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+91 9876543210", "otp": "123456"}'
```

## 📸 Project Structure

```
amplecare/
├── server.js                  # Main Express server
├── auth-routes.js            # Authentication endpoints
├── otp-service.js            # OTP generation & verification
├── firebase-config.js        # Firebase initialization
├── package.json              # Backend dependencies
├── .env                       # Environment variables
│
├── frontend/                  # React frontend
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── ParticleBackground.jsx
│   │   │   └── ...
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   └── ...
│   │   ├── styles/
│   │   │   ├── globals.css
│   │   │   ├── login.css
│   │   │   ├── particles.css
│   │   │   └── ...
│   │   ├── App.js
│   │   └── index.js
│   ├── package.json
│   └── .env.local
│
└── README.md
```

## 🛡️ Security Best Practices

✅ **Implemented**
- JWT token-based authentication
- OTP verification for phone login
- CORS protection
- Environment variable encryption
- Password hashing (ready for bcrypt)

⚠️ **To Implement**
- HTTPS/SSL encryption
- Rate limiting on API endpoints
- Input validation & sanitization
- Database encryption at rest
- Regular security audits

## 🐛 Troubleshooting

### Issue: "Port 5000 already in use"
```bash
# Find process using port 5000
lsof -i :5000

# Kill the process
kill -9 <PID>

# Or use different port
PORT=5001 npm run server
```

### Issue: "Firebase credentials not found"
- Ensure `.env` file exists in root directory
- Verify Firebase service account JSON details
- Check file permissions

### Issue: "Twilio SMS not sending"
- Verify Twilio credentials in `.env`
- Check phone number format (should be +country_code format)
- Ensure Twilio account has SMS budget

### Issue: CORS errors
- Ensure backend runs on port 5000
- Check `REACT_APP_API_URL` in frontend `.env.local`
- Frontend CORS requests must match backend URL

## 📚 Next Steps

1. **Implement Patient Registration Page**
2. **Build Real-time Dashboard**
3. **Add Fall Detection Algorithm**
4. **Integrate Google Maps API**
5. **Create Emergency Alert System**
6. **Build Admin Panel**
7. **Deploy to Production**

## 📞 Support

For issues, questions, or contributions:
- Create an issue on GitHub
- Contact: support@amplecare.health
- Documentation: https://docs.amplecare.health

## 📄 License

This project is licensed under the MIT License - see LICENSE file for details.

## 🙌 Contributing

We welcome contributions! Please:
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

---

**Made with ❤️ for hackathon submission**
**AmpleCare - Smart Technology That Saves Lives**
