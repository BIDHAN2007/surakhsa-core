// OTP Utility Functions
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const verifyOTP = (storedOTP, providedOTP) => {
  return storedOTP === providedOTP;
};

const sendOTP = async (phoneNumber, otp) => {
  // This will be replaced with actual Twilio integration
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const client = require('twilio')(accountSid, authToken);

  try {
    await client.messages.create({
      body: `Your Surakhsa Core verification code is: ${otp}`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber,
    });
    return true;
  } catch (error) {
    console.error('SMS Error:', error);
    return false;
  }
};

module.exports = { generateOTP, verifyOTP, sendOTP };
