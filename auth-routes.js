const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { generateOTP } = require('./otp-service');
const {
  findGuardians,
  getGuardianById,
  addGuardian,
  updateGuardian,
} = require('./store');
require('dotenv').config();

const otpStore = new Map();
const JWT_SECRET =
  process.env.JWT_SECRET ||
  (process.env.NODE_ENV === 'production'
    ? null
    : 'surakhsa-dev-jwt-secret-change-in-production');

if (!JWT_SECRET) {
  console.error('FATAL: Set JWT_SECRET in production');
  process.exit(1);
}

function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

function guardianResponse(guardian) {
  return {
    guardianId: guardian.id,
    phoneNumber: guardian.phoneNumber,
    email: guardian.email,
    fullName: guardian.fullName || 'Guardian',
  };
}

router.post('/send-otp', async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber || String(phoneNumber).replace(/\D/g, '').length < 10) {
      return res.status(400).json({ success: false, message: 'Invalid phone number' });
    }

    const otp = generateOTP();
    otpStore.set(phoneNumber, { otp, expiresAt: Date.now() + 10 * 60 * 1000 });
    console.log(`OTP for ${phoneNumber}: ${otp}`);

    // Demo OTP on screen by default (no SMS). Set SHOW_DEMO_OTP=false to hide code in API.
    const demoOtpEnabled = process.env.SHOW_DEMO_OTP !== 'false';

    const body = {
      success: true,
      demoMode: demoOtpEnabled,
      expiresInMinutes: 10,
      message: demoOtpEnabled
        ? 'Demo verification code ready (SMS not sent — use code on screen)'
        : 'OTP sent successfully',
    };
    if (demoOtpEnabled) {
      body.otp = otp;
    }
    res.json(body);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/verify-otp', async (req, res) => {
  try {
    const { phoneNumber, otp } = req.body;

    if (!otpStore.has(phoneNumber)) {
      return res.status(400).json({ success: false, message: 'OTP expired or not requested' });
    }

    const { otp: storedOTP, expiresAt } = otpStore.get(phoneNumber);

    if (Date.now() > expiresAt) {
      otpStore.delete(phoneNumber);
      return res.status(400).json({ success: false, message: 'OTP expired' });
    }

    if (otp !== storedOTP) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    let guardian = findGuardians({ phoneNumber })[0];

    if (!guardian) {
      const created = addGuardian({
        phoneNumber,
        createdAt: new Date().toISOString(),
        verified: true,
        fullName: 'Guardian',
        patients: [],
      });
      guardian = getGuardianById(created.id);
    } else {
      updateGuardian(guardian.id, { verified: true });
      guardian = getGuardianById(guardian.id);
    }

    otpStore.delete(phoneNumber);

    const info = guardianResponse(guardian);
    res.json({
      success: true,
      message: 'Login successful',
      token: signToken({ guardianId: info.guardianId, phoneNumber }),
      ...info,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password required' });
    }

    const guardian = findGuardians({ email })[0];

    if (!guardian) {
      return res.status(401).json({ success: false, message: 'Guardian not found' });
    }

    const valid =
      (guardian.passwordHash && (await bcrypt.compare(password, guardian.passwordHash))) ||
      (guardian.password && guardian.password === password);

    if (!valid) {
      return res.status(401).json({ success: false, message: 'Invalid password' });
    }

    if (guardian.password && !guardian.passwordHash) {
      updateGuardian(guardian.id, {
        passwordHash: await bcrypt.hash(password, 10),
        password: null,
      });
    }

    const info = guardianResponse(guardian);
    res.json({
      success: true,
      message: 'Login successful',
      token: signToken({ guardianId: info.guardianId, email }),
      ...info,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/register', async (req, res) => {
  try {
    const { fullName, phoneNumber, email, password, dateOfBirth, address } = req.body;

    if (!fullName || !phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'Full name and phone number required',
      });
    }

    if (findGuardians({ phoneNumber }).length > 0) {
      return res.status(400).json({ success: false, message: 'Guardian already registered' });
    }

    if (email && findGuardians({ email }).length > 0) {
      return res.status(400).json({ success: false, message: 'Email already in use' });
    }

    const guardianData = {
      fullName,
      phoneNumber,
      email: email || null,
      passwordHash: password ? await bcrypt.hash(password, 10) : null,
      dateOfBirth: dateOfBirth || null,
      address: address || null,
      createdAt: new Date().toISOString(),
      verified: false,
      patients: [],
    };

    const newGuardian = addGuardian(guardianData);

    res.json({
      success: true,
      message: 'Registration successful. Sign in with phone OTP or email.',
      guardianId: newGuardian.id,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/profile', async (req, res) => {
  try {
    const guardianId = req.headers['x-guardian-id'];

    if (!guardianId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const guardian = getGuardianById(guardianId);

    if (!guardian) {
      return res.status(404).json({ success: false, message: 'Guardian not found' });
    }

    const { password, passwordHash, ...safe } = guardian;
    res.json({ success: true, data: safe });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
