import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiUser, FiPhone, FiMail, FiLock, FiArrowLeft, FiArrowRight, FiCalendar, FiMapPin } from 'react-icons/fi';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import ParticleBackground from '../components/ParticleBackground';
import { API_BASE, APP_NAME, APP_TAGLINE } from '../config';
import '../styles/register.css';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    email: '',
    password: '',
    confirmPassword: '',
    dateOfBirth: '',
    address: '',
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleNextStep = (e) => {
    e.preventDefault();
    
    if (step === 1) {
      if (!formData.fullName || !formData.phoneNumber) {
        toast.error('Please fill all required fields');
        return;
      }
      if (formData.phoneNumber.length < 10) {
        toast.error('Invalid phone number');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!formData.email || !formData.password || !formData.confirmPassword) {
        toast.error('Please fill all required fields');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        toast.error('Passwords do not match');
        return;
      }
      if (formData.password.length < 6) {
        toast.error('Password must be at least 6 characters');
        return;
      }
      setStep(3);
    }
  };

  const handlePrevStep = () => {
    setStep(step - 1);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    
    if (!formData.dateOfBirth || !formData.address) {
      toast.error('Please fill all required fields');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE}/auth/register`, formData);

      if (response.data.success) {
        toast.success('Registration successful! Redirecting to login...');
        setTimeout(() => {
          navigate('/');
        }, 1500);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <ParticleBackground />

      <motion.div 
        className="register-card"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="register-header">
          <Link to="/" className="back-button">
            <FiArrowLeft /> Back to Login
          </Link>
          <div className="header-content">
            <h1>{APP_NAME}</h1>
            <p>{APP_TAGLINE}</p>
            <p style={{ marginTop: 8, fontSize: '0.9rem', opacity: 0.85 }}>Create your guardian account</p>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="progress-steps">
          <div className={`step ${step >= 1 ? 'active' : ''}`}>
            <div className="step-number">1</div>
            <span>Basic Info</span>
          </div>
          <div className="step-line"></div>
          <div className={`step ${step >= 2 ? 'active' : ''}`}>
            <div className="step-number">2</div>
            <span>Credentials</span>
          </div>
          <div className="step-line"></div>
          <div className={`step ${step >= 3 ? 'active' : ''}`}>
            <div className="step-number">3</div>
            <span>Address</span>
          </div>
        </div>

        {/* Form */}
        <form className="register-form" onSubmit={(e) => e.preventDefault()}>
          {/* Step 1: Basic Information */}
          {step === 1 && (
            <motion.div 
              className="form-step"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <div className="form-group">
                <label>Full Name *</label>
                <div className="input-wrapper">
                  <FiUser className="input-icon" />
                  <input
                    type="text"
                    name="fullName"
                    placeholder="John Doe"
                    value={formData.fullName}
                    onChange={handleChange}
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Phone Number *</label>
                <div className="input-wrapper">
                  <FiPhone className="input-icon" />
                  <input
                    type="tel"
                    name="phoneNumber"
                    placeholder="+91 9876543210"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    disabled={loading}
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 2: Credentials */}
          {step === 2 && (
            <motion.div 
              className="form-step"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <div className="form-group">
                <label>Email Address *</label>
                <div className="input-wrapper">
                  <FiMail className="input-icon" />
                  <input
                    type="email"
                    name="email"
                    placeholder="guardian@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Password *</label>
                <div className="input-wrapper">
                  <FiLock className="input-icon" />
                  <input
                    type="password"
                    name="password"
                    placeholder="Create a strong password"
                    value={formData.password}
                    onChange={handleChange}
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Confirm Password *</label>
                <div className="input-wrapper">
                  <FiLock className="input-icon" />
                  <input
                    type="password"
                    name="confirmPassword"
                    placeholder="Re-enter your password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    disabled={loading}
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 3: Address */}
          {step === 3 && (
            <motion.div 
              className="form-step"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <div className="form-group">
                <label>Date of Birth (Optional)</label>
                <div className="input-wrapper">
                  <FiCalendar className="input-icon" />
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Address *</label>
                <div className="input-wrapper">
                  <FiMapPin className="input-icon" />
                  <textarea
                    name="address"
                    placeholder="Enter your full address"
                    value={formData.address}
                    onChange={handleChange}
                    disabled={loading}
                    rows="3"
                  ></textarea>
                </div>
              </div>

              <div className="privacy-notice">
                <input type="checkbox" id="privacy" required />
                <label htmlFor="privacy">
                  I agree to the Terms of Service and Privacy Policy
                </label>
              </div>
            </motion.div>
          )}

          {/* Navigation Buttons */}
          <div className="form-navigation">
            {step > 1 && (
              <button 
                type="button"
                className="btn-back"
                onClick={handlePrevStep}
                disabled={loading}
              >
                <FiArrowLeft /> Back
              </button>
            )}
            
            {step < 3 ? (
              <button 
                type="button"
                className="btn-next"
                onClick={handleNextStep}
                disabled={loading}
              >
                Next <FiArrowRight />
              </button>
            ) : (
              <button 
                type="submit"
                className="btn-register"
                onClick={handleRegister}
                disabled={loading}
              >
                {loading ? '🔄 Creating Account...' : 'Create Account'}
                <FiArrowRight />
              </button>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="register-footer">
          <p>
            Already have an account?{' '}
            <Link to="/" className="link">
              Sign in here
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
