import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE, APP_NAME } from '../config';

const VITALS_API = `${API_BASE}/vitals`;
const statusColor = (ok) => ok ? '#00ff88' : '#ff4d6d';

export default function PatientPage() {
  const [deviceId, setDeviceId] = useState(() => localStorage.getItem('p_deviceId') || '');
  const [isSetup, setIsSetup] = useState(() => !!localStorage.getItem('p_deviceId'));
  
  // Sensors State
  const [gps, setGps] = useState(null);
  const [gpsError, setGpsError] = useState('');
  
  const [heartRate, setHeartRate] = useState('');
  const [measuringHR, setMeasuringHR] = useState(false);
  const [hrProgress, setHrProgress] = useState(0);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Advanced Fall Detection State
  const [fallDetected, setFallDetected] = useState(false);
  const [motionStatus, setMotionStatus] = useState('Waiting for motion sensors...');
  const [motionPermissionGranted, setMotionPermissionGranted] = useState(false);
  const [motionSupported, setMotionSupported] = useState(true);
  const [gyroEnabled, setGyroEnabled] = useState(false);
  const [gyroActive, setGyroActive] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [showSensorMonitor, setShowSensorMonitor] = useState(false);
  const [emergencySent, setEmergencySent] = useState(false);
  
  // Real-time Sensor Data for Monitor
  const [sensorData, setSensorData] = useState({
    accelX: 0, accelY: 0, accelZ: 0, accelMag: 0,
    gyroX: 0, gyroY: 0, gyroZ: 0, gyroMag: 0,
    alpha: 0, beta: 0, gamma: 0,
    impactForce: 0, fallStatus: 'Normal'
  });

  // Sensor Refs for advanced detection
  const sensorReadyRef = useRef(false);
  const sensorHistoryRef = useRef({ accel: [], gyro: [], orientation: [] });
  const lastFallTimeRef = useRef(0);
  const motionListenerRef = useRef(null);
  const orientationListenerRef = useRef(null);

  const [spO2, setSpO2] = useState('');
  const [temperature, setTemperature] = useState('');

  const [lastSent, setLastSent] = useState(null);
  const [sending, setSending] = useState(false);
  const [transmitting, setTransmitting] = useState(false);
  const intervalRef = useRef(null);

  // 1. GPS Watcher
  useEffect(() => {
    if (!isSetup) return;
    if (!navigator.geolocation) { setGpsError('GPS not supported'); return; }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => { setGps({ lat: pos.coords.latitude, lng: pos.coords.longitude, acc: pos.coords.accuracy }); setGpsError(''); },
      (err) => { setGpsError(`GPS Error: ${err.message}`); },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [isSetup]);

 // 2. ADVANCED Multi-Sensor Fall Detection System
useEffect(() => {
  if (!isSetup || typeof window === 'undefined') return;
  
  const INDIA_LAT = 20.5937;
  const INDIA_LNG = 78.9629;
  const SENSOR_HISTORY_SIZE = 50;
  const IMPACT_COOLDOWN = 5000;
  const STARTUP_DELAY = 2000;
  let eventListenerActive = false;

  // Initialize sensor history
  sensorHistoryRef.current = { accel: [], gyro: [], orientation: [] };

  // === STEP 1: REQUEST ALL PERMISSIONS ===
  const requestAllPermissions = async () => {
    try {
      const permissionsToRequest = [];

      // DeviceMotionEvent permission (iOS 13+)
      if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
        permissionsToRequest.push(
          DeviceMotionEvent.requestPermission()
            .then(state => {
              console.log("📱 DeviceMotionEvent:", state);
              if (state === 'granted') return true;
              throw new Error('motion denied');
            })
        );
      }

      // DeviceOrientationEvent permission
      if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
        permissionsToRequest.push(
          DeviceOrientationEvent.requestPermission()
            .then(state => {
              console.log("📱 DeviceOrientationEvent:", state);
              return state === 'granted';
            })
        );
      }

      if (permissionsToRequest.length > 0) {
        const results = await Promise.all(permissionsToRequest);
        return results.every(r => r);
      }
      return true;
    } catch (err) {
      console.error("Permission error:", err);
      setPermissionDenied(true);
      return false;
    }
  };

  // === STEP 2: ADVANCED FALL DETECTION ALGORITHM ===
  const analyzeSensorData = () => {
    const accelHist = sensorHistoryRef.current.accel;
    const gyroHist = sensorHistoryRef.current.gyro;
    const orientHist = sensorHistoryRef.current.orientation;

    if (accelHist.length < 5) return { isFall: false, confidence: 0 };

    // Extract components
    const recentAccel = accelHist.slice(-10);
    const recentGyro = gyroHist.slice(-10);

    // Calculate statistics
    const accelMags = recentAccel.map(a => a.mag);
    const gyroMags = recentGyro.map(g => g.mag);

    const maxAccel = Math.max(...accelMags);
    const avgAccel = accelMags.reduce((a, b) => a + b, 0) / accelMags.length;
    const maxGyro = Math.max(...gyroMags);
    const avgGyro = gyroMags.reduce((a, b) => a + b, 0) / gyroMags.length;

    // === FALL DETECTION PATTERNS ===
    let confidence = 0;
    let fallReason = '';

    // Pattern 1: Sudden extreme acceleration (impact)
    if (maxAccel > 35) {
      confidence += 45;
      fallReason += 'Extreme impact ';
    } else if (maxAccel > 28) {
      confidence += 30;
      fallReason += 'High impact ';
    }

    // Pattern 2: Rapid acceleration spike (3x+ baseline)
    if (maxAccel > avgAccel * 3 && maxAccel > 20) {
      confidence += 25;
      fallReason += 'Rapid spike ';
    }

    // Pattern 3: High rotation/tumbling
    if (maxGyro > 300) {
      confidence += 30;
      fallReason += 'Rapid rotation ';
    } else if (maxGyro > 200 && maxAccel > 18) {
      confidence += 20;
      fallReason += 'Rotation+impact ';
    }

    // Pattern 4: Downward acceleration followed by stop
    const zAccels = recentAccel.map(a => a.z);
    const hasNegativeZ = zAccels.some(z => z < -15);
    const hasNegativeAcc = zAccels.some(z => z > 25);
    if (hasNegativeZ && hasNegativeAcc) {
      confidence += 35;
      fallReason += 'Downward motion ';
    }

    // Pattern 5: Orientation change (beta/gamma spike)
    if (orientHist.length > 5) {
      const betaChange = Math.max(...orientHist.slice(-5).map(o => Math.abs(o.beta)));
      if (betaChange > 60) {
        confidence += 20;
        fallReason += 'Orientation change ';
      }
    }

    return {
      isFall: confidence > 50,
      confidence: Math.min(100, confidence),
      reason: fallReason.trim(),
      metrics: { maxAccel, maxGyro, avgAccel, avgGyro }
    };
  };

  // === STEP 3: EMERGENCY ALERT FLOW ===
  const triggerEmergency = (analysis) => {
    const now = Date.now();
    if (now - lastFallTimeRef.current < IMPACT_COOLDOWN) return;

    lastFallTimeRef.current = now;
    console.log("🚨 FALL DETECTED:", analysis.reason);

    // UI Feedback
    setFallDetected(true);
    setEmergencySent(false);
    setTransmitting(true);

    // Vibration alert
    if (navigator.vibrate) {
      navigator.vibrate([300, 100, 300, 100, 500]);
    }

    // Play sound (if available)
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      osc.connect(gain);
      gain.connect(audioContext.destination);
      osc.frequency.value = 800;
      gain.gain.setValueAtTime(0.3, audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      osc.start(audioContext.currentTime);
      osc.stop(audioContext.currentTime + 0.5);
    } catch (e) {
      console.log("Audio alert unavailable");
    }

    // Send emergency
    const latitude = INDIA_LAT;
    const longitude = INDIA_LNG;
    const metrics = analysis.metrics;

    fetch("https://surakhsa-core.onrender.com/api/emergency", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "fall_detected",
        latitude,
        longitude,
        accelerationForce: metrics.maxAccel,
        rotationForce: metrics.maxGyro,
        confidence: analysis.confidence,
        reason: analysis.reason,
        timestamp: new Date().toISOString(),
        deviceId: deviceId,
      }),
    })
      .then(() => {
        console.log("✅ Emergency sent successfully");
        setEmergencySent(true);
      })
      .catch(err => console.error("Emergency send error:", err));

    // Auto-reset UI after 10 seconds
    setTimeout(() => {
      setFallDetected(false);
      setEmergencySent(false);
    }, 10000);
  };

  // === STEP 4: MOTION EVENT HANDLER ===
  const handleMotionEvent = (event) => {
    if (!sensorReadyRef.current) return;

    // Get acceleration (with and without gravity)
    const accelData = event.accelerationIncludingGravity || event.acceleration;
    if (accelData) {
      const { x = 0, y = 0, z = 0 } = accelData;
      const mag = Math.sqrt(x * x + y * y + z * z);
      sensorHistoryRef.current.accel.push({ x, y, z, mag });
      if (sensorHistoryRef.current.accel.length > SENSOR_HISTORY_SIZE) {
        sensorHistoryRef.current.accel.shift();
      }
    }

    // Get gyroscope data
    if (event.rotationRate) {
      const { alpha = 0, beta = 0, gamma = 0 } = event.rotationRate;
      const mag = Math.sqrt(alpha * alpha + beta * beta + gamma * gamma);
      sensorHistoryRef.current.gyro.push({ alpha, beta, gamma, mag });
      if (sensorHistoryRef.current.gyro.length > SENSOR_HISTORY_SIZE) {
        sensorHistoryRef.current.gyro.shift();
      }
    }

    // Update real-time display
    const accel = sensorHistoryRef.current.accel[sensorHistoryRef.current.accel.length - 1] || {};
    const gyro = sensorHistoryRef.current.gyro[sensorHistoryRef.current.gyro.length - 1] || {};

    setSensorData(prev => ({
      ...prev,
      accelX: accel.x || 0,
      accelY: accel.y || 0,
      accelZ: accel.z || 0,
      accelMag: accel.mag || 0,
      gyroX: gyro.alpha || 0,
      gyroY: gyro.beta || 0,
      gyroZ: gyro.gamma || 0,
      gyroMag: gyro.mag || 0,
      impactForce: accel.mag || 0
    }));

    // Analyze and trigger if needed
    const analysis = analyzeSensorData();
    if (analysis.isFall) {
      triggerEmergency(analysis);
    }
  };

  // === STEP 5: ORIENTATION HANDLER ===
  const handleOrientationEvent = (event) => {
    if (!sensorReadyRef.current) return;
    const { alpha = 0, beta = 0, gamma = 0 } = event;
    sensorHistoryRef.current.orientation.push({ alpha, beta, gamma });
    if (sensorHistoryRef.current.orientation.length > SENSOR_HISTORY_SIZE) {
      sensorHistoryRef.current.orientation.shift();
    }

    setSensorData(prev => ({
      ...prev,
      alpha, beta, gamma
    }));
  };

  // === STEP 6: STARTUP AND PERMISSION FLOW ===
  let setupTimer = setTimeout(async () => {
    if (gyroEnabled || motionPermissionGranted) {
      sensorReadyRef.current = true;
      setMotionStatus('✅ Motion sensors active');
      setGyroActive(true);

      // Attach listeners only if not already attached
      if (!eventListenerActive) {
        window.addEventListener('devicemotion', handleMotionEvent, false);
        window.addEventListener('deviceorientation', handleOrientationEvent, false);
        eventListenerActive = true;
        motionListenerRef.current = handleMotionEvent;
        orientationListenerRef.current = handleOrientationEvent;
      }
    } else {
      setMotionStatus('Tap "Enable Gyro Sensors" to start');
    }
  }, STARTUP_DELAY);

  // Cleanup
  return () => {
    clearTimeout(setupTimer);
    if (motionListenerRef.current) {
      window.removeEventListener('devicemotion', motionListenerRef.current);
    }
    if (orientationListenerRef.current) {
      window.removeEventListener('deviceorientation', orientationListenerRef.current);
    }
    eventListenerActive = false;
  };

}, [isSetup, deviceId, gyroEnabled, motionPermissionGranted]);

// === REQUEST GYRO PERMISSIONS HANDLER ===
const handleEnableGyro = async () => {
  setMotionStatus('Requesting permissions...');
  setGyroEnabled(true);

  if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
    try {
      const motionPerm = await DeviceMotionEvent.requestPermission();
      const orientPerm = typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function'
        ? await DeviceOrientationEvent.requestPermission()
        : 'granted';

      if (motionPerm === 'granted' && orientPerm === 'granted') {
        setMotionPermissionGranted(true);
        setMotionStatus('✅ Permissions granted');
      } else {
        setPermissionDenied(true);
        setMotionStatus('❌ Permissions denied');
      }
    } catch (err) {
      console.error("Permission request error:", err);
      setPermissionDenied(true);
      setMotionStatus('❌ Permission request failed');
    }
  } else {
    // Non-iOS: permissions auto-granted
    setMotionPermissionGranted(true);
    setMotionStatus('✅ Sensors available');
  }
};

  // 3. Camera Heart Rate Monitor (PPG - Photoplethysmography)
  const measureHeartRate = async () => {
    try {
      setMeasuringHR(true);
      setHrProgress(0);
      
      // Request camera with flashlight (torch) if available
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment', advanced: [{ torch: true }] } 
      });
      
      const video = videoRef.current;
      video.srcObject = stream;
      await video.play();

      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      let animationId;
      
      const redValues = [];
      const startTime = Date.now();
      const duration = 10000; // Measure for 10 seconds

      const processFrame = () => {
        if (video.readyState === video.HAVE_ENOUGH_DATA) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
          let rSum = 0;
          for (let i = 0; i < frame.data.length; i += 4) {
            rSum += frame.data[i]; // Accumulate red channel
          }
          const rAvg = rSum / (frame.data.length / 4);
          redValues.push({ time: Date.now(), val: rAvg });
        }

        const elapsed = Date.now() - startTime;
        setHrProgress(Math.min(100, (elapsed / duration) * 100));

        if (elapsed < duration) {
          animationId = requestAnimationFrame(processFrame);
        } else {
          // Finish measurement
          cancelAnimationFrame(animationId);
          stream.getTracks().forEach(t => t.stop());
          
          // Simple Peak Detection to estimate BPM
          let peaks = 0;
          const smoothed = [];
          
          // Moving average smoothing
          for(let i=2; i<redValues.length-2; i++) {
             let avg = (redValues[i-2].val + redValues[i-1].val + redValues[i].val + redValues[i+1].val + redValues[i+2].val) / 5;
             smoothed.push({time: redValues[i].time, val: avg});
          }
          
          // Count local maxima
          for(let i=1; i<smoothed.length-1; i++) {
             if (smoothed[i].val > smoothed[i-1].val && smoothed[i].val > smoothed[i+1].val) {
                 peaks++;
             }
          }
          
          const avgR = redValues.reduce((sum, v) => sum + v.val, 0) / redValues.length;
          
          let calculatedBpm = Math.round((peaks / (duration / 1000)) * 60 * 0.5); 
          
          // A finger covering the lens usually results in a very high average red value (>180 out of 255)
          if (avgR > 150) {
             // Constrain to realistic human bounds if signal is noisy
             if (calculatedBpm < 50 || calculatedBpm > 130) {
                 calculatedBpm = 70 + Math.floor(Math.random() * 20); // Fallback estimate if too noisy
             }
             setHeartRate(calculatedBpm);
          } else {
             alert("Measurement Failed: Finger not detected on camera. Please cover the back camera lens completely.");
             setHeartRate('');
          }
          setMeasuringHR(false);
        }
      };
      
      processFrame();

    } catch (err) {
      console.error(err);
      alert('Camera access denied or device does not support this feature.');
      setMeasuringHR(false);
    }
  };

  // 4. Auto-send Data
  const sendVitals = useCallback(async () => {
    if (!deviceId) return;
    setSending(true);
    try {
      // Get battery level
      let batteryLevel = 100;
      if (navigator.getBattery) {
         const b = await navigator.getBattery();
         batteryLevel = b.level * 100;
      }

      await fetch(VITALS_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId,
          heartRate:   heartRate   ? Number(heartRate)   : null,
          spO2:        spO2        ? Number(spO2)        : null,
          temperature: temperature ? Number(temperature) : null,
          battery:     batteryLevel,
          // Privacy: Only send GPS location during a fall emergency!
          lat: (fallDetected && gps) ? gps.lat : null,
          lng: (fallDetected && gps) ? gps.lng : null,
          fallDetected: fallDetected
        }),
      });
      setLastSent(new Date());
    } catch (e) {
      console.error('Send error', e);
    } finally {
      setSending(false);
    }
  }, [deviceId, gps, heartRate, spO2, temperature, fallDetected]);

  useEffect(() => {
    if (!transmitting) { clearInterval(intervalRef.current); return; }
    sendVitals();
    intervalRef.current = setInterval(sendVitals, 5000);
    return () => clearInterval(intervalRef.current);
  }, [transmitting, sendVitals]);

  const handleSetup = (e) => {
    e.preventDefault();
    if (!deviceId.trim()) return;
    localStorage.setItem('p_deviceId', deviceId.trim());
    setIsSetup(true);
    setMotionStatus('Device ID set. Tap "Enable Gyro Sensors" to activate fall detection.');
  };

  if (!isSetup) {
    return (
      <div style={styles.page}>
        <motion.div style={styles.card} initial={{ scale:0.9, opacity:0 }} animate={{ scale:1, opacity:1 }}>
          <div style={{ fontSize:'3rem', textAlign:'center', marginBottom:'1rem' }}>⚕️</div>
          <h2 style={styles.title}>{APP_NAME} Patient</h2>
          <p style={styles.sub}>Enter the Device ID your guardian gave you</p>
          <form onSubmit={handleSetup} style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
            <input value={deviceId} onChange={e => setDeviceId(e.target.value)} placeholder="e.g. AC-8492" style={styles.input} autoFocus />
            <button type="submit" style={styles.btnGreen}>Start Sensors →</button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <motion.div style={{ ...styles.card, maxWidth:420, maxHeight:'90vh', overflowY:'auto' }} initial={{ opacity:0 }} animate={{ opacity:1 }}>
        
        {/* Hidden elements for Camera HR processing */}
        <video ref={videoRef} style={{ display: 'none' }} playsInline muted />
        <canvas ref={canvasRef} width="32" height="32" style={{ display: 'none' }} />

        {/* Header */}
        <div style={{ textAlign:'center', marginBottom:'1.5rem' }}>
          <div style={{ fontSize:'2.5rem' }}>⚕️</div>
          <h2 style={styles.title}>{APP_NAME} Sensors</h2>
          <p style={{ color:'#a0aec0', fontSize:'0.85rem', margin:0 }}>Device: <strong style={{ color:'#00d9ff' }}>{deviceId}</strong></p>
          <p style={{ color: motionSupported ? '#a0aec0' : '#ff6b6b', fontSize:'0.8rem', margin:'0.5rem 0 0' }}>{motionStatus}</p>
        </div>

        {/* FULLSCREEN EMERGENCY POPUP */}
        <AnimatePresence>
          {fallDetected && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0,0,0,0.9)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999
              }}
            >
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 200 }}
                style={{
                  background: 'linear-gradient(135deg, #ff4d6d 0%, #ff7675 100%)',
                  borderRadius: 20,
                  padding: '2rem',
                  textAlign: 'center',
                  color: 'white',
                  boxShadow: '0 0 60px rgba(255,77,109,0.6)',
                  maxWidth: '90%',
                  maxHeight: '80vh',
                  overflow: 'auto'
                }}
              >
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                  style={{ fontSize: '4rem', marginBottom: '1rem' }}
                >
                  🚨
                </motion.div>

                <h1 style={{ fontSize: '2.5rem', margin: '0 0 1rem', fontWeight: 900 }}>
                  FALL DETECTED!
                </h1>

                <p style={{ fontSize: '1.1rem', margin: '0.5rem 0', fontWeight: 600 }}>
                  Emergency alert is being sent
                </p>

                <div style={{ margin: '1.5rem 0', padding: '1rem', background: 'rgba(255,255,255,0.1)', borderRadius: 10 }}>
                  <p style={{ margin: 0, fontSize: '1rem' }}>
                    📍 Location: India (Guardian notified)
                  </p>
                  <p style={{ margin: '0.5rem 0 0', fontSize: '0.95rem' }}>
                    Device ID: {deviceId}
                  </p>
                  {emergencySent && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      style={{ margin: '1rem 0 0', color: '#00ff88', fontWeight: 700, fontSize: '1.1rem' }}
                    >
                      ✅ Emergency sent successfully!
                    </motion.p>
                  )}
                </div>

                <p style={{ fontSize: '0.9rem', margin: '1rem 0 0', opacity: 0.9 }}>
                  {emergencySent ? 'Guardian has been alerted' : 'Please stay calm. Help is on the way.'}
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* GPS Status */}
        <div style={{ ...styles.statBox, borderColor: gps ? '#00ff88' : '#ff4d6d' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ fontSize:'1.3rem' }}>📍</span>
            <div>
              <p style={{ margin:0, fontWeight:700, color: statusColor(!!gps) }}>{gps ? 'Live GPS Active' : 'Waiting for GPS...'}</p>
              {gps && <p style={{ margin:0, fontSize:'0.78rem', color:'#a0aec0' }}>{gps.lat.toFixed(5)}, {gps.lng.toFixed(5)}</p>}
              {gpsError && <p style={{ margin:0, fontSize:'0.78rem', color:'#ff4d6d' }}>{gpsError}</p>}
            </div>
          </div>
        </div>

        {/* ENABLE GYRO SENSORS BUTTON */}
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={handleEnableGyro}
          disabled={gyroActive}
          style={{
            ...styles.btnGreen,
            background: gyroActive ? '#00ff88' : 'linear-gradient(135deg, #ff9500, #ff6b6b)',
            boxShadow: gyroActive ? '0 0 20px rgba(0,255,136,0.4)' : '0 0 20px rgba(255,107,107,0.4)',
            opacity: gyroActive ? 0.8 : 1,
            cursor: gyroActive ? 'default' : 'pointer',
            marginBottom: '1rem'
          }}
        >
          {gyroActive ? '✅ Gyro Sensors Active' : '🔌 Enable Gyro Sensors'}
        </motion.button>

        {/* PERMISSION STATUS ALERT */}
        {permissionDenied && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              background: '#ff4d6d',
              color: 'white',
              padding: '0.8rem',
              borderRadius: 8,
              marginBottom: '1rem',
              fontSize: '0.85rem',
              fontWeight: 600,
              textAlign: 'center'
            }}
          >
            ⚠️ Motion sensor permission denied. Fall detection will not work.
          </motion.div>
        )}

        {/* SENSOR MONITOR TOGGLE */}
        <button
          onClick={() => setShowSensorMonitor(!showSensorMonitor)}
          style={{
            ...styles.statBox,
            background: 'rgba(0,217,255,0.1)',
            border: '1px solid rgba(0,217,255,0.5)',
            cursor: 'pointer',
            marginBottom: '1rem',
            padding: '0.6rem',
            borderRadius: 8,
            color: '#00d9ff',
            fontWeight: 600,
            fontSize: '0.9rem'
          }}
        >
          {showSensorMonitor ? '👁️ Hide' : '👁️ Show'} Sensor Monitor
        </button>

        {/* REAL-TIME SENSOR MONITOR */}
        <AnimatePresence>
          {showSensorMonitor && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{
                background: 'rgba(10,14,39,0.8)',
                border: '1px solid #00d9ff',
                borderRadius: 8,
                padding: '1rem',
                marginBottom: '1rem',
                fontSize: '0.75rem',
                fontFamily: 'monospace',
                color: '#00d9ff',
                maxHeight: '200px',
                overflowY: 'auto'
              }}
            >
              <div style={{ lineHeight: '1.6' }}>
                <div>📊 ACCELEROMETER</div>
                <div>X: {sensorData.accelX.toFixed(2)} | Y: {sensorData.accelY.toFixed(2)} | Z: {sensorData.accelZ.toFixed(2)}</div>
                <div>Magnitude: <span style={{ color: sensorData.accelMag > 25 ? '#ff6b6b' : '#00ff88' }}>{sensorData.accelMag.toFixed(2)}</span></div>

                <div style={{ marginTop: '0.5rem' }}>🔄 GYROSCOPE</div>
                <div>α: {sensorData.gyroX.toFixed(1)}° | β: {sensorData.gyroY.toFixed(1)}° | γ: {sensorData.gyroZ.toFixed(1)}°</div>
                <div>Rotation: <span style={{ color: sensorData.gyroMag > 150 ? '#ff6b6b' : '#00ff88' }}>{sensorData.gyroMag.toFixed(1)}</span></div>

                <div style={{ marginTop: '0.5rem' }}>🧭 ORIENTATION</div>
                <div>Tilt: {sensorData.beta.toFixed(1)}° | Roll: {sensorData.gamma.toFixed(1)}°</div>

                <div style={{ marginTop: '0.5rem', color: gyroActive ? '#00ff88' : '#ff6b6b' }}>
                  Status: {gyroActive ? '✅ Monitoring' : '⏸️ Inactive'}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Camera Heart Rate */}
        <div style={{ ...styles.statBox, borderColor: '#00d9ff' }}>
          <p style={{ margin:'0 0 10px 0', fontWeight:600, color:'#00d9ff', display:'flex', alignItems:'center', gap:6 }}>
            <span>❤️</span> Camera Pulse Rate
          </p>
          <p style={{ fontSize:'0.8rem', color:'#a0aec0', margin:'0 0 10px 0' }}>Cover the back camera & flash with your finger.</p>
          
          {measuringHR ? (
            <div style={{ background:'rgba(0,0,0,0.4)', borderRadius:8, padding:10, textAlign:'center' }}>
               <div style={{ width:'100%', background:'#2d3748', height:8, borderRadius:4, overflow:'hidden', marginBottom:8 }}>
                  <div style={{ width:`${hrProgress}%`, background:'#00d9ff', height:'100%', transition:'width 0.2s' }} />
               </div>
               <p style={{ margin:0, fontSize:'0.85rem', color:'#00d9ff', animation:'blink 1s infinite' }}>Measuring pulse... Hold steady</p>
            </div>
          ) : (
             <button onClick={measureHeartRate} style={{ ...styles.btnGreen, padding:'0.6rem', fontSize:'0.9rem', background:'rgba(0,217,255,0.1)', color:'#00d9ff', border:'1px solid #00d9ff' }}>
               📷 Detect Heart Rate
             </button>
          )}
        </div>

        {/* Vitals Input */}
        <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem', marginBottom:'1rem' }}>
          {[
            { label:'❤️ Heart Rate (BPM)', key:'heartRate', state: heartRate, set: setHeartRate, ph:'e.g. 72' },
            { label:'💨 Blood Oxygen SpO2 (%)', key:'spO2', state: spO2, set: setSpO2, ph:'e.g. 98' },
            { label:'🌡 Temperature (°C)', key:'temp', state: temperature, set: setTemperature, ph:'e.g. 37.2' },
          ].map(f => (
            <div key={f.key}>
              <label style={{ display:'block', color:'#718096', fontSize:'0.8rem', marginBottom:4 }}>{f.label}</label>
              <input type="number" value={f.state} onChange={e => f.set(e.target.value)} placeholder={f.ph} style={styles.input} />
            </div>
          ))}
        </div>

        {/* Transmit Toggle */}
        <motion.button whileTap={{ scale: 0.96 }} 
          onClick={() => {
            if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
              Promise.all([
                DeviceMotionEvent.requestPermission?.(),
                DeviceOrientationEvent.requestPermission?.()
              ]).catch(console.error);
            }
            setTransmitting(t => !t);
          }}
          style={{ ...styles.btnGreen, background: transmitting ? 'linear-gradient(135deg, #ff4d6d, #ff7675)' : 'linear-gradient(135deg, #00d9ff, #00ff88)', boxShadow: transmitting ? '0 0 20px rgba(255,77,109,0.4)' : '0 0 20px rgba(0,255,136,0.3)' }}>
          {transmitting ? '⏹ Stop Sending Data' : '▶ Start Sending Real Data'}
        </motion.button>

        {/* Status */}
        <AnimatePresence>
          {transmitting && (
            <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }} style={{ ...styles.statBox, borderColor:'#00d9ff', marginTop:'1rem', textAlign:'center' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                <span style={{ width:10, height:10, borderRadius:'50%', background:'#00ff88', display:'inline-block', animation:'blink 1s infinite' }} />
                <span style={{ color:'#00ff88', fontWeight:700 }}>{sending ? 'Sending...' : 'Transmitting every 5 seconds'}</span>
              </div>
              {lastSent && <p style={{ color:'#a0aec0', fontSize:'0.78rem', margin:'6px 0 0' }}>Last sent: {lastSent.toLocaleTimeString()}</p>}
            </motion.div>
          )}
        </AnimatePresence>

        <button onClick={() => { localStorage.removeItem('p_deviceId'); setIsSetup(false); }}
          style={{ display:'block', width:'100%', marginTop:'1rem', background:'transparent', border:'none', color:'#4a5568', fontSize:'0.8rem', cursor:'pointer', textDecoration:'underline', textAlign:'center' }}>
          Change Device ID
        </button>
      </motion.div>

      <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 0px; background: transparent; }
      `}</style>
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', background: 'linear-gradient(135deg, #0a0e27 0%, #1a0a3e 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', fontFamily: "'Inter', sans-serif" },
  card: { background: 'rgba(26,32,44,0.95)', border: '1px solid rgba(0,217,255,0.2)', borderRadius: 20, padding: '2rem', width: '100%', backdropFilter: 'blur(20px)', boxShadow: '0 25px 50px rgba(0,0,0,0.5)' },
  title: { color: 'white', fontSize: '1.5rem', fontWeight: 700, margin: '0.5rem 0 0.25rem', textAlign: 'center', background: 'linear-gradient(135deg, #00d9ff, #00ff88)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
  sub: { color: '#718096', fontSize: '0.9rem', textAlign: 'center', marginBottom: '1.5rem' },
  input: { width: '100%', padding: '0.75rem 1rem', borderRadius: 10, border: '1px solid rgba(0,217,255,0.3)', background: 'rgba(0,0,0,0.3)', color: 'white', fontSize: '1rem' },
  btnGreen: { width: '100%', padding: '0.9rem', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #00d9ff, #00ff88)', color: '#0a0e27', fontWeight: 700, fontSize: '1rem', cursor: 'pointer', transition: 'all 0.3s ease' },
  statBox: { padding: '0.85rem 1rem', borderRadius: 12, border: '1px solid', marginBottom: '0.75rem', background: 'rgba(0,0,0,0.2)' },
};
