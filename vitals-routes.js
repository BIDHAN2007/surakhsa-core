const express = require('express');
const router = express.Router();
const { getVital, setVital, getAllVitals } = require('./store');

router.post('/', (req, res) => {
  const { deviceId, heartRate, spO2, temperature, battery, lat, lng, fallDetected } = req.body;
  if (!deviceId) {
    return res.status(400).json({ success: false, message: 'deviceId required' });
  }

  const prev = getVital(deviceId);
  const data = {
    deviceId,
    heartRate: heartRate ?? null,
    spO2: spO2 ?? null,
    temperature: temperature ?? null,
    battery: battery ?? null,
    lat: lat ?? (prev ? prev.lat : null),
    lng: lng ?? (prev ? prev.lng : null),
    fallDetected: Boolean(fallDetected),
    updatedAt: new Date().toISOString(),
  };

  setVital(deviceId, data);
  console.log(`Vitals from ${deviceId}:`, data);
  res.json({ success: true, message: 'Vitals stored' });
});

router.get('/', (req, res) => {
  res.json({ success: true, data: getAllVitals() });
});

router.get('/:deviceId', (req, res) => {
  const data = getVital(req.params.deviceId);
  if (!data) {
    return res.status(404).json({ success: false, message: 'No data for this device yet' });
  }
  res.json({ success: true, data });
});

module.exports = router;
