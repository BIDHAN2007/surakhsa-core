# 📋 AmpleCare Project Documentation

## 🎯 Project Overview

**AmpleCare** is a full-stack healthcare emergency monitoring platform designed for hackathon submission. It connects wearable devices with a modern web dashboard for real-time health monitoring and emergency response.

**Target Users:**
- Elderly people (65+)
- Heart patients
- Disabled persons
- People living alone
- Guardians/Family members

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                   User Devices                       │
│  ┌──────────────┐        ┌──────────────┐           │
│  │ Wearable Band│        │  Web Browser │           │
│  │  (ESP32)     │        │  (Dashboard) │           │
│  └──────┬───────┘        └──────┬───────┘           │
│         │                       │                    │
│         └───────────┬───────────┘                    │
│                     │ IoT + HTTP                     │
├─────────────────────┼──────────────────────────────┤
│                     ▼                               │
│              API Gateway (Node.js)                   │
│         Express Server on Port 5000                  │
└─────────────────────┼──────────────────────────────┘
                      │
        ┌─────────────┼─────────────┐
        │             │             │
   ┌────▼─────┐ ┌────▼─────┐ ┌────▼─────┐
   │ Firebase  │ │ MongoDB  │ │  Twilio  │
   │ Realtime  │ │ Database │ │   SMS    │
   │ Database  │ │          │ │   API    │
   └──────────┘ └──────────┘ └──────────┘
```

## 📁 Project File Structure

```
amplecare/
│
├── 📄 package.json              # Main dependencies
├── 📄 server.js                 # Express server entry point
├── 📄 auth-routes.js            # Authentication endpoints
├── 📄 otp-service.js            # OTP logic
├── 📄 firebase-config.js        # Firebase setup
├── 📄 .env                       # Environment variables
├── 📄 README.md                  # Full documentation
├── 📄 QUICKSTART.md              # 5-minute setup guide
├── 📄 PROJECT_STRUCTURE.md       # This file
│
└── frontend/                     # React application
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── components/
    │   │   ├── ParticleBackground.jsx      # Animated background
    │   │   └── (More components coming)
    │   │
    │   ├── pages/
    │   │   ├── LoginPage.jsx               # ✅ OTP + Email login
    │   │   ├── RegisterPage.jsx            # ✅ Guardian registration
    │   │   ├── Dashboard.jsx               # ✅ Main dashboard
    │   │   ├── PatientRegistration.jsx     # 📝 Coming soon
    │   │   ├── HealthMonitoring.jsx        # 📝 Coming soon
    │   │   ├── EmergencyResponse.jsx       # 📝 Coming soon
    │   │   └── AdminPanel.jsx              # 📝 Coming soon
    │   │
    │   ├── styles/
    │   │   ├── globals.css                 # ✅ Global styles
    │   │   ├── login.css                   # ✅ Login page styles
    │   │   ├── register.css                # ✅ Registration styles
    │   │   ├── dashboard.css               # ✅ Dashboard styles
    │   │   ├── particles.css               # ✅ Animation styles
    │   │   └── (More coming)
    │   │
    │   ├── utils/
    │   │   ├── api.js                      # API client setup
    │   │   └── constants.js                # App constants
    │   │
    │   ├── App.js                          # ✅ Main app component
    │   ├── index.js                        # React entry point
    │   └── index.css                       # Entry CSS
    │
    ├── package.json                        # Frontend dependencies
    └── .env.local                          # Frontend env variables
```

## 🚀 Current Status (Phase 1 - Authentication)

### ✅ Completed Features

1. **Backend Authentication System**
   - Express.js server setup
   - OTP generation and verification
   - JWT token management
   - Firebase Firestore integration
   - Guardian registration and login
   - Profile management endpoint

2. **Frontend - Login Page**
   - Glassmorphism UI design
   - OTP-based authentication
   - Email + password login option
   - Registration form with multi-step validation
   - Animated particle background
   - Responsive design (mobile, tablet, desktop)
   - Smooth animations with Framer Motion
   - Real-time form validation
   - Toast notifications for feedback

3. **Frontend - Dashboard**
   - Responsive layout with sidebar navigation
   - Real-time vitals display (mock data)
   - Patient management section
   - Emergency alerts section
   - Live tracking section
   - Settings panel
   - Logout functionality

4. **Styling & UI**
   - Dark futuristic healthcare theme
   - Neon blue (#00d9ff) & green (#00ff88) gradients
   - Glassmorphism effect on cards
   - Smooth animations and transitions
   - Mobile-responsive design
   - Particle background effects

## 📋 Upcoming Phases

### Phase 2 - Patient Management (Week 2)
- [ ] Patient registration form
- [ ] Medical history upload
- [ ] Emergency contact management
- [ ] Wearable device pairing
- [ ] Patient list management
- [ ] Quick health overview cards

### Phase 3 - Real-time Health Monitoring (Week 3)
- [ ] Live vitals dashboard
- [ ] Heart rate chart visualization
- [ ] SpO₂ oxygen tracking
- [ ] Temperature monitoring
- [ ] Movement detection
- [ ] Real-time data updates from Firebase
- [ ] Health status indicators

### Phase 4 - Fall Detection & Emergency (Week 4)
- [ ] Fall detection algorithm
- [ ] Accelerometer data processing
- [ ] Inactivity detection (no movement for 10+ seconds)
- [ ] Emergency alert trigger
- [ ] Siren sound/notification
- [ ] Emergency popup display
- [ ] Guardian notification system

### Phase 5 - Location Tracking (Week 5)
- [ ] Google Maps integration
- [ ] Real-time GPS tracking
- [ ] Patient location on map
- [ ] Location history
- [ ] Nearby hospital finder
- [ ] Ambulance route visualization
- [ ] Emergency zone mapping

### Phase 6 - Notifications & Alerts (Week 6)
- [ ] SMS notifications via Twilio
- [ ] Email alerts
- [ ] Push notifications (FCM)
- [ ] Alert history
- [ ] Alert response logging
- [ ] Hospital notification system
- [ ] Ambulance request automation

### Phase 7 - Admin Panel (Week 7)
- [ ] Admin dashboard
- [ ] User management
- [ ] Emergency analytics
- [ ] Device management
- [ ] Hospital directory
- [ ] System monitoring
- [ ] Report generation

### Phase 8 - IoT Integration & Deployment (Week 8)
- [ ] ESP32 firmware development
- [ ] MPU6050 gyroscope setup
- [ ] MAX30102 sensor integration
- [ ] GPS module connection
- [ ] Firebase real-time data push
- [ ] Production deployment
- [ ] Testing and optimization

## 🛠️ API Endpoints

### Currently Implemented ✅

```
POST   /api/auth/send-otp           - Send OTP to phone
POST   /api/auth/verify-otp         - Verify OTP and login
POST   /api/auth/register           - Register new guardian
POST   /api/auth/login              - Email + password login
GET    /api/auth/profile            - Get guardian profile
GET    /api/health                  - Health check
```

### To Be Implemented 📝

```
PATIENT MANAGEMENT
POST   /api/patients                - Register new patient
GET    /api/patients/:id            - Get patient details
PUT    /api/patients/:id            - Update patient info
DELETE /api/patients/:id            - Delete patient
GET    /api/patients                - List all patients

HEALTH DATA
POST   /api/vitals                  - Store vital readings
GET    /api/vitals/:patientId       - Get vital history
GET    /api/vitals/latest/:patientId - Get latest readings

EMERGENCIES
POST   /api/emergencies             - Log emergency
GET    /api/emergencies/:guardianId - Get emergency history
PUT    /api/emergencies/:id         - Update emergency status
POST   /api/emergencies/alert       - Send alert

LOCATION
POST   /api/location                - Store GPS location
GET    /api/location/:patientId     - Get location history
GET    /api/hospitals               - Find nearby hospitals

NOTIFICATIONS
POST   /api/notifications           - Send notification
GET    /api/notifications/:userId   - Get notifications
PUT    /api/notifications/:id       - Mark as read

ADMIN
GET    /api/admin/analytics         - Get system analytics
GET    /api/admin/devices           - Manage devices
POST   /api/admin/hospitals         - Add hospitals
```

## 💾 Database Schema

### Firestore Collections

```javascript
// Collection: guardians
{
  id: String (auto),
  fullName: String,
  phoneNumber: String,
  email: String,
  password: String,
  dateOfBirth: Date,
  address: String,
  createdAt: Timestamp,
  verified: Boolean,
  patients: Array<patientIds>,
  emergencyContacts: Array<{
    name: String,
    relation: String,
    phone: String
  }>
}

// Collection: patients
{
  id: String (auto),
  guardianId: String (FK),
  name: String,
  dateOfBirth: Date,
  age: Number,
  bloodGroup: String,
  diseases: Array<String>,
  medications: Array<String>,
  address: String,
  wearableDeviceId: String,
  profilePhoto: String,
  createdAt: Timestamp,
  lastUpdated: Timestamp
}

// Collection: vitals
{
  id: String (auto),
  patientId: String (FK),
  heartRate: Number,
  spO2: Number,
  temperature: Number,
  movementDetected: Boolean,
  timestamp: Timestamp,
  deviceBattery: Number
}

// Collection: emergencies
{
  id: String (auto),
  patientId: String (FK),
  guardianId: String (FK),
  alertType: String, // fall, abnormal_vitals, inactivity, manual
  severity: String,  // low, medium, high, critical
  status: String,    // active, responded, resolved
  location: {
    latitude: Number,
    longitude: Number,
    address: String
  },
  vitalSigns: Object,
  ambulanceRequested: Boolean,
  createdAt: Timestamp,
  resolvedAt: Timestamp
}
```

## 🔧 Technologies Used

### Frontend
- **React.js** 18.x - UI framework
- **React Router** - Navigation
- **Axios** - HTTP client
- **Framer Motion** - Animations
- **Tailwind CSS** - Styling (can be added)
- **React Hot Toast** - Notifications
- **React Icons** - Icon library

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Server framework
- **Firebase** - Real-time database
- **Firebase Admin SDK** - Backend integration
- **JWT** - Token-based auth
- **Twilio** - SMS notifications
- **Dotenv** - Environment variables

### IoT (Future)
- **ESP32** - Microcontroller
- **MPU6050** - 6-axis gyroscope/accelerometer
- **MAX30102** - Optical heart rate sensor
- **NEO-6M** - GPS module

### Deployment
- **Heroku** - Backend hosting
- **Vercel** - Frontend hosting
- **Firebase Hosting** - Alternative
- **AWS EC2** - Cloud compute (alternative)

## 🎯 Key Features Summary

### ✅ Phase 1 Complete
- OTP-based authentication
- Guardian registration
- Email + password login
- Secure JWT tokens
- Guardian dashboard with vitals display
- Responsive design

### 📝 In Development
- Patient registration and management
- Real-time health monitoring
- Fall detection system
- Emergency alerts
- GPS tracking
- Notification system
- Admin panel

## 🚀 Getting Started

### For Developers
1. Clone the repository
2. Install dependencies: `npm install`
3. Configure `.env` file with Firebase credentials
4. Start backend: `npm run server`
5. Start frontend: `cd frontend && npm start`
6. Open http://localhost:3000

### For Testing
1. Use OTP login with phone: `+91 9876543210`
2. OTP will appear in toast notification
3. Complete registration to create account
4. Access dashboard with real-time mock vitals

### For Deployment
1. Set up Firebase project
2. Get service account credentials
3. Configure Twilio for SMS
4. Deploy backend to Heroku
5. Deploy frontend to Vercel
6. Configure environment variables on hosting platforms

## 📊 Performance Targets

- ⚡ **Page Load Time**: < 2 seconds
- 📊 **API Response Time**: < 500ms
- 🔄 **Real-time Update Frequency**: Every 5 seconds
- 📱 **Mobile Performance**: 90+ Lighthouse score
- 🔒 **Security**: HTTPS + JWT + Input validation

## 🔒 Security Features

- JWT token-based authentication
- OTP verification for phone login
- CORS protection
- Environment variable encryption
- Input validation and sanitization
- HIPAA compliance ready
- Password hashing (bcrypt ready)
- Rate limiting (to be implemented)
- Database encryption at rest (to be configured)

## 📞 Support & Contact

For questions or issues:
- Create GitHub issues
- Check QUICKSTART.md for setup help
- Review API endpoints section for endpoint details
- Check console (F12) for errors

## 🎓 Learning Outcomes

By completing this project, developers will learn:

✅ **Full-Stack Development**
- Frontend: React hooks, routing, state management
- Backend: Express.js, REST APIs, authentication
- Database: Firestore, real-time updates

✅ **Modern Web Technologies**
- Real-time communication
- OTP-based authentication
- JWT token management
- SMS notifications
- GPS tracking

✅ **UI/UX Design**
- Glassmorphism effect
- Animation techniques
- Responsive design
- Dark mode UI
- User experience best practices

✅ **DevOps & Deployment**
- Environment configuration
- Deployment to cloud platforms
- CI/CD basics
- Monitoring and logging

## 📄 Files Checklist

### Backend ✅
- [x] package.json
- [x] server.js
- [x] auth-routes.js
- [x] otp-service.js
- [x] firebase-config.js
- [x] .env template

### Frontend ✅
- [x] App.js
- [x] LoginPage.jsx
- [x] RegisterPage.jsx
- [x] Dashboard.jsx
- [x] ParticleBackground.jsx
- [x] globals.css
- [x] login.css
- [x] register.css
- [x] dashboard.css
- [x] particles.css

### Documentation ✅
- [x] README.md
- [x] QUICKSTART.md
- [x] PROJECT_STRUCTURE.md (this file)

## 🎉 Next Steps

1. **Setup & Testing** (Now)
   - Follow QUICKSTART.md
   - Test login/registration
   - Verify all endpoints

2. **Patient Management** (Next)
   - Build patient registration UI
   - Create patient management API
   - Add patient list view

3. **Health Monitoring** (Ongoing)
   - Real-time vitals display
   - Chart visualization
   - Health status indicators

4. **Emergency System** (Priority)
   - Fall detection logic
   - Emergency alerts
   - Notification system

## 📈 Success Metrics

- ✅ Authentication system working (Phase 1 goal)
- ⏳ Patient management (Phase 2 goal)
- ⏳ Real-time monitoring (Phase 3 goal)
- ⏳ Emergency response (Phase 4 goal)
- ⏳ Full deployment (Phase 8 goal)

---

**Project Status:** 🟢 Phase 1 Complete - Authentication System Ready

**Next Milestone:** Phase 2 - Patient Management (Due Next Week)

**Hackathon Ready:** ✅ Yes - Current phase is production-ready for demo

---

*Last Updated: 2024*
*AmpleCare - Smart Technology That Saves Lives ❤️*
