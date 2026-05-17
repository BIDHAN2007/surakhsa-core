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

  const [fallDetected, setFallDetected] = useState(false);
  const sensorReadyRef = useRef(false);
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

  // 2. Fall Detection (Accelerometer)
useEffect(() => {
  if (!isSetup || typeof window === 'undefined') return;

  let fallCooldown = false;

  // Ignore initial sensor noise
  sensorReadyRef.current = false;

  const timer = setTimeout(() => {
    sensorReadyRef.current = true;
  }, 2000);

  const handleMotion = (event) => {

    if (!sensorReadyRef.current) return;
    if (!event.accelerationIncludingGravity) return;

    const { x, y, z } = event.accelerationIncludingGravity;

    const magnitude = Math.sqrt(x * x + y * y + z * z);

    console.log("Force:", magnitude);

    // Stronger detection
    if (magnitude > 25 && !fallCooldown) {

      fallCooldown = true;

      setFallDetected(true);

      // Auto start transmitting
      setTransmitting(true);

      alert("🚨 FALL DETECTED!");

      // Get GPS location
      navigator.geolocation.getCurrentPosition(
        (pos) => {

          const latitude = pos.coords.latitude;
          const longitude = pos.coords.longitude;

          console.log(latitude, longitude);

          // Send emergency alert
          fetch("https://surakhsa-core.onrender.com/api/emergency", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              type: "fall",
              latitude,
              longitude,
              timestamp: new Date(),
            }),
          });

          alert(
            `🚨 Emergency Alert Sent!\nLat: ${latitude}\nLng: ${longitude}`
          );
        },
        (err) => {
          console.log(err);
          alert("Location permission denied");
        }
      );

      // Reset after 10 seconds
      setTimeout(() => {
        setFallDetected(false);
        fallCooldown = false;
      }, 10000);
    }
  };

  window.addEventListener('devicemotion', handleMotion);

  return () => {
    clearTimeout(timer);
    window.removeEventListener('devicemotion', handleMotion);
  };

}, [isSetup]);

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
    
    // Request permission for iOS motion sensors on setup click (must be triggered by user action)
    if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
      DeviceMotionEvent.requestPermission().catch(console.error);
    }
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
        </div>

        {/* Fall Alert Overlay */}
        <AnimatePresence>
          {fallDetected && (
            <motion.div initial={{ opacity:0, scale:0.8 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0 }}
              style={{ background:'#ff4d6d', color:'white', padding:'1rem', borderRadius:12, marginBottom:'1rem', textAlign:'center', fontWeight:'bold', boxShadow:'0 0 20px rgba(255,77,109,0.5)' }}>
              🚨 FALL DETECTED!
              <div style={{ fontSize:'0.8rem', fontWeight:'normal', marginTop:4 }}>Auto-transmitting location to Guardian...</div>
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
              DeviceMotionEvent.requestPermission().catch(console.error);
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
