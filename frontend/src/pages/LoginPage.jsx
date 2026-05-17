import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiPhone, FiMail, FiArrowRight } from 'react-icons/fi';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import ParticleBackground from '../components/ParticleBackground';
import { API_BASE, APP_NAME, APP_TAGLINE } from '../config';
import '../styles/login.css';

export default function LoginPage() {
  const navigate = useNavigate();
  const isDemo = process.env.REACT_APP_DEMO_MODE === 'true';
  const [activeTab, setActiveTab] = useState('email'); // email recommended for hackathon
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('input'); // input, otp, or verify
  const [formData, setFormData] = useState({
    phoneNumber: '',
    email: '',
    password: '',
    otp: ''
  });

  // Admin Easter Egg State
  const [logoClicks, setLogoClicks] = useState(0);
  const [showAdminPrompt, setShowAdminPrompt] = useState(false);
  const [adminCode, setAdminCode] = useState('');
  const [demoOtp, setDemoOtp] = useState('');
  const [otpExpiresMin, setOtpExpiresMin] = useState(10);

  const copyDemoOtp = () => {
    if (!demoOtp) return;
    navigator.clipboard.writeText(demoOtp).then(
      () => toast.success('Verification code copied'),
      () => toast.error('Could not copy')
    );
  };

  const fillDemoOtp = () => {
    if (!demoOtp) return;
    setFormData((prev) => ({ ...prev, otp: demoOtp }));
    toast.success('Code filled — tap Verify');
  };

  // Handle Phone-based OTP Login
  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!formData.phoneNumber) {
      toast.error('Please enter phone number');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE}/auth/send-otp`, {
        phoneNumber: formData.phoneNumber
      });

      if (response.data.success) {
        if (response.data.demoMode && response.data.otp) {
          setDemoOtp(response.data.otp);
          setOtpExpiresMin(response.data.expiresInMinutes || 10);
          toast.success('Demo verification code is ready on screen');
        } else {
          setDemoOtp('');
          toast.success('OTP sent to your phone');
        }
        setStep('otp');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (!formData.otp) {
      toast.error('Please enter OTP');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE}/auth/verify-otp`, {
        phoneNumber: formData.phoneNumber,
        otp: formData.otp
      });

      if (response.data.success) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('guardianId', response.data.guardianId);
        if (response.data.fullName) {
          localStorage.setItem('guardianName', response.data.fullName);
        }
        toast.success('Login successful!');
        navigate('/dashboard');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  // Email + Password Login
  const handleEmailLogin = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      toast.error('Please enter email and password');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE}/auth/login`, {
        email: formData.email,
        password: formData.password
      });

      if (response.data.success) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('guardianId', response.data.guardianId);
        if (response.data.fullName) {
          localStorage.setItem('guardianName', response.data.fullName);
        }
        toast.success('Login successful!');
        navigate('/dashboard');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleLogoClick = () => {
    setLogoClicks(prev => prev + 1);
    if (logoClicks >= 2) { // 3 clicks total
      setShowAdminPrompt(true);
      setLogoClicks(0);
    }
  };

  const handleAdminOverride = (e) => {
    e.preventDefault();
    if (adminCode === '911') {
      toast.success('System Override Accepted. Welcome, Commander.', { icon: '🚨', style: { background: '#0a0e27', color: '#ff4d6d', border: '1px solid #ff4d6d' } });
      navigate('/admin');
    } else {
      toast.error('Access Denied. Unauthorized sequence.');
      setShowAdminPrompt(false);
      setAdminCode('');
    }
  };

  return (
    <div className="login-container">
      <ParticleBackground />
      
      <div className="login-content">
        {/* Left Section */}
        <motion.div 
          className="login-left"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="login-branding">
            <motion.h1 
              className="brand-title"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
              onClick={handleLogoClick}
              style={{ cursor: 'pointer', userSelect: 'none' }}
            >
              ⚕️ {APP_NAME}
            </motion.h1>
            <p className="brand-subtitle">
              {APP_TAGLINE}
            </p>
          </div>

          <div className="features-list">
            <motion.div 
              className="feature-item"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <span className="feature-icon">🚨</span>
              <p>Real-time Fall Detection</p>
            </motion.div>
            <motion.div 
              className="feature-item"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <span className="feature-icon">❤️</span>
              <p>Heart Rate Monitoring</p>
            </motion.div>
            <motion.div 
              className="feature-item"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
            >
              <span className="feature-icon">📍</span>
              <p>Live GPS Tracking</p>
            </motion.div>
            <motion.div 
              className="feature-item"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 }}
            >
              <span className="feature-icon">⚡</span>
              <p>Instant Emergency Alerts</p>
            </motion.div>
          </div>
        </motion.div>

        {/* Right Section - Login Form */}
        <motion.div 
          className="login-right"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="glass-card">
            {isDemo && (
              <div style={{ background: 'rgba(246,201,14,0.12)', border: '1px solid rgba(246,201,14,0.4)', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: '0.85rem', color: '#f6c90e' }}>
                <strong>Demo login:</strong> <strong>Phone</strong> tab shows verification code on screen (no SMS). Or use <strong>Email</strong>. <Link to="/demo" style={{ color: '#00d9ff' }}>Share links</Link>
              </div>
            )}
            <div className="login-header">
              <h2>Welcome Back</h2>
              <p>Monitor your loved ones 24/7</p>
            </div>

            {/* Tab Switcher */}
            <div className="auth-tabs">
              <button
                className={`tab ${activeTab === 'phone' ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab('phone');
                  setStep('input');
                  setDemoOtp('');
                  setFormData((prev) => ({ ...prev, otp: '' }));
                }}
              >
                <FiPhone /> Phone (demo code)
              </button>
              <button
                className={`tab ${activeTab === 'email' ? 'active' : ''}`}
                onClick={() => setActiveTab('email')}
              >
                <FiMail /> Email
              </button>
            </div>

            {/* Phone OTP Login */}
            {activeTab === 'phone' && (
              <motion.form 
                onSubmit={step === 'input' ? handleSendOTP : handleVerifyOTP}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {step === 'input' && (
                  <>
                    <p className="demo-otp-hint">
                      Demo mode: we do not send SMS. Your 6-digit code will appear on this screen.
                    </p>
                    <div className="input-group">
                      <label>Phone Number</label>
                      <input
                        type="tel"
                        name="phoneNumber"
                        placeholder="+91 9876543210"
                        value={formData.phoneNumber}
                        onChange={handleChange}
                        disabled={loading}
                      />
                    </div>
                    <button 
                      type="submit" 
                      className="btn-primary"
                      disabled={loading}
                    >
                      {loading ? '🔄 Generating...' : 'Get verification code'}
                      <FiArrowRight />
                    </button>
                  </>
                )}

                {step === 'otp' && (
                  <>
                    <div className="otp-section">
                      {demoOtp ? (
                        <div className="demo-otp-box">
                          <p className="demo-otp-label">Your verification code</p>
                          <p className="demo-otp-note">
                            SMS is not sent to {formData.phoneNumber}. Use this demo code (valid {otpExpiresMin} min).
                          </p>
                          <div className="demo-otp-code">{demoOtp}</div>
                          <div className="demo-otp-actions">
                            <button type="button" className="btn-demo-fill" onClick={fillDemoOtp}>
                              Use this code
                            </button>
                            <button type="button" className="btn-demo-copy" onClick={copyDemoOtp}>
                              Copy
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="otp-text">Enter the code for {formData.phoneNumber}</p>
                      )}
                      <div className="input-group">
                        <label>Enter verification code (6 digits)</label>
                        <input
                          type="text"
                          name="otp"
                          placeholder="000000"
                          maxLength="6"
                          inputMode="numeric"
                          value={formData.otp}
                          onChange={handleChange}
                          disabled={loading}
                          className="otp-input"
                        />
                      </div>
                      <button
                        type="submit"
                        className="btn-primary"
                        disabled={loading}
                      >
                        {loading ? '🔄 Verifying...' : 'Verify & sign in'}
                        <FiArrowRight />
                      </button>
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => handleSendOTP({ preventDefault: () => {} })}
                        disabled={loading}
                      >
                        Resend code
                      </button>
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => {
                          setStep('input');
                          setDemoOtp('');
                          setFormData({ ...formData, otp: '' });
                        }}
                      >
                        Change phone number
                      </button>
                    </div>
                  </>
                )}
              </motion.form>
            )}

            {/* Email Login */}
            {activeTab === 'email' && (
              <motion.form 
                onSubmit={handleEmailLogin}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="input-group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    name="email"
                    placeholder="guardian@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={loading}
                  />
                </div>
                <div className="input-group">
                  <label>Password</label>
                  <input
                    type="password"
                    name="password"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
                    disabled={loading}
                  />
                </div>
                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={loading}
                >
                  {loading ? '🔄 Signing in...' : 'Sign In'}
                  <FiArrowRight />
                </button>
              </motion.form>
            )}

            {/* Divider */}
            <div className="divider">
              <span>New to {APP_NAME}?</span>
            </div>

            {/* Register Link */}
            <Link to="/register" className="btn-secondary-link">
              Create Guardian Account
              <FiArrowRight />
            </Link>

            {/* Footer */}
            <div className="login-footer">
              <p>Prototype demo for Surakhsa Core — not for clinical use</p>
              <p style={{ marginTop: 8 }}><Link to="/demo" style={{ color: '#00d9ff' }}>Hackathon: copy share links</Link></p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Secret Admin Prompt Overlay */}
      {showAdminPrompt && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.9)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <form onSubmit={handleAdminOverride} style={{ background:'#0a0e27', padding:'30px', borderRadius:'16px', border:'2px solid #ff4d6d', textAlign:'center', width:'300px' }}>
            <h3 style={{ color:'#ff4d6d', margin:'0 0 20px', letterSpacing:'2px' }}>RESTRICTED ACCESS</h3>
            <input 
              type="password" 
              autoFocus
              placeholder="Enter Override Code" 
              value={adminCode} 
              onChange={e => setAdminCode(e.target.value)}
              style={{ width:'100%', padding:'12px', background:'rgba(255,77,109,0.1)', border:'1px solid #ff4d6d', color:'white', textAlign:'center', borderRadius:'8px', marginBottom:'20px', letterSpacing:'4px' }}
            />
            <div style={{ display:'flex', gap:'10px' }}>
              <button type="button" onClick={() => setShowAdminPrompt(false)} style={{ flex:1, padding:'10px', background:'transparent', color:'white', border:'1px solid rgba(255,255,255,0.2)', borderRadius:'8px', cursor:'pointer' }}>Abort</button>
              <button type="submit" style={{ flex:1, padding:'10px', background:'#ff4d6d', color:'white', border:'none', borderRadius:'8px', cursor:'pointer', fontWeight:'bold' }}>Execute</button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
