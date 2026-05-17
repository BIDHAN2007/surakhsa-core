import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiLogOut, FiHome, FiUsers, FiAlertTriangle, FiMap,
  FiSettings, FiHeart, FiWind, FiThermometer, FiBattery,
  FiMessageSquare, FiSend, FiPlus, FiActivity
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { API_BASE, APP_NAME } from '../config';
import '../styles/dashboard.css';

// ── Simulated vitals (used when no real device connected) ────────────────────
function useSimulatedVitals() {
  const [vitals, setVitals] = useState({ heartRate: 72, spO2: 98, temp: 37.2, battery: 85 });
  useEffect(() => {
    const id = setInterval(() => {
      setVitals(v => ({
        heartRate: Math.max(55, Math.min(120, v.heartRate + (Math.random() * 4 - 2))).toFixed(0),
        spO2:      Math.max(90, Math.min(100, v.spO2      + (Math.random() * 0.6 - 0.3))).toFixed(1),
        temp:      Math.max(36, Math.min(38.5,v.temp      + (Math.random() * 0.1 - 0.05))).toFixed(1),
        battery:   Math.max(10, Math.min(100, +v.battery  - 0.01)).toFixed(0),
      }));
    }, 1500);
    return () => clearInterval(id);
  }, []);
  return vitals;
}

// ── Real vitals: polls API for a given deviceId ───────────────────────────────
function useRealVitals(deviceId) {
  const [data, setData] = useState(null);
  useEffect(() => {
    if (!deviceId) return;
    const poll = async () => {
      try {
        const r = await fetch(`${API_BASE}/vitals/${deviceId}`);
        const j = await r.json();
        if (j.success) setData(j.data);
      } catch (_) {}
    };
    poll();
    const id = setInterval(poll, 5000);
    return () => clearInterval(id);
  }, [deviceId]);
  return data;
}

// ── Pulse ring animation ──────────────────────────────────────────────────────
function PulseRing({ color = '#00d9ff' }) {
  return (
    <span style={{ position:'relative', display:'inline-flex', alignItems:'center', justifyContent:'center' }}>
      <span style={{
        position:'absolute', width:14, height:14, borderRadius:'50%',
        background: color, opacity: 0.4,
        animation: 'ping 1.2s cubic-bezier(0,0,0.2,1) infinite'
      }} />
      <span style={{ width:8, height:8, borderRadius:'50%', background: color, display:'block' }} />
    </span>
  );
}

// ── Heart beat SVG ────────────────────────────────────────────────────────────
function HeartBeat({ bpm }) {
  const points = [];
  for (let i = 0; i < 200; i++) {
    const x = i;
    const spike = i > 80 && i < 90;
    const y = spike ? 10 + (i === 85 ? -40 : (Math.abs(i - 85) * 6)) : 30 + Math.sin(i * 0.3) * 3;
    points.push(`${x},${Math.max(0, Math.min(60, y))}`);
  }
  return (
    <svg viewBox="0 0 200 60" style={{ width:'100%', height: 60, opacity:0.8 }}>
      <polyline points={points.join(' ')} fill="none" stroke="#ff4d6d" strokeWidth="2"
        style={{ animation:'dash 2s linear infinite' }} />
    </svg>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate();
  const simVitals = useSimulatedVitals();
  const [selectedDeviceId, setSelectedDeviceId] = useState(null);
  const realData  = useRealVitals(selectedDeviceId);

  // Merge: real data overrides simulation when available
  const vitals = realData ? {
    heartRate: realData.heartRate ?? simVitals.heartRate,
    spO2:      realData.spO2      ?? simVitals.spO2,
    temp:      realData.temperature ?? simVitals.temp,
    battery:   realData.battery   ?? simVitals.battery,
  } : simVitals;

  const gps = (realData?.lat && realData?.lng)
    ? { lat: realData.lat, lng: realData.lng }
    : null; // Null means hidden for privacy until a fall occurs

  const [guardian, setGuardian]       = useState({ fullName: 'Guardian' });
  const [activeSection, setActiveSection] = useState('overview');
  const [patients, setPatients]       = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPatient, setNewPatient]   = useState({ name:'', age:'', deviceId:'', conditions:'' });
  const [messages, setMessages]       = useState([
    { id:1, sender:'Guardian', patient:'Ravi Kumar', text:'How are you feeling today?', time:'09:10', outgoing:true },
    { id:2, sender:'Ravi Kumar', patient:'Ravi Kumar', text:'Feeling dizzy, head hurts', time:'09:12', outgoing:false },
    { id:3, sender:'Guardian', patient:'Ravi Kumar', text:'Stay calm, help is on the way', time:'09:13', outgoing:true },
  ]);
  const [newMsg, setNewMsg]           = useState('');
  const [selectedPatientMsg, setSelectedPatientMsg] = useState('Ravi Kumar');
  const [alerts, setAlerts]           = useState([]);
  const msgEndRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/');
      return;
    }
    const guardianId = localStorage.getItem('guardianId');
    const cachedName =
      localStorage.getItem('guardianName') || localStorage.getItem('g_name');
    if (cachedName) setGuardian({ fullName: cachedName });

    if (guardianId) {
      const saved = localStorage.getItem(`patients_${guardianId}`);
      if (saved) {
        try {
          setPatients(JSON.parse(saved));
        } catch (_) {
          /* ignore corrupt cache */
        }
      }
      fetch(`${API_BASE}/auth/profile`, {
        headers: { 'x-guardian-id': guardianId },
      })
        .then((r) => r.json())
        .then((j) => {
          if (j.success && j.data?.fullName) {
            setGuardian({ fullName: j.data.fullName });
            localStorage.setItem('guardianName', j.data.fullName);
          }
        })
        .catch(() => {});
    }
  }, [navigate]);

  useEffect(() => { msgEndRef.current?.scrollIntoView({ behavior:'smooth' }); }, [messages]);

  // Listen for Fall Detection
  useEffect(() => {
    if (realData && realData.fallDetected) {
      toast.error(`🚨 CRITICAL: FALL DETECTED for Device ${selectedDeviceId}!`, {
        duration: 8000,
        style: { background: '#ff4d6d', color: '#fff', fontWeight: 'bold', fontSize: '1.2rem' }
      });
      // Add auto message
      setMessages(prev => {
        // Prevent duplicate messages in a short span
        const lastMsg = prev[prev.length - 1];
        if (lastMsg && lastMsg.text.includes('FALL DETECTED') && (Date.now() - lastMsg.id < 10000)) return prev;
        
        return [...prev, {
          id: Date.now(), sender: 'System Alert', patient: selectedPatientMsg || 'Unknown',
          text: `🚨 EMERGENCY: A sudden fall was detected for device ${selectedDeviceId}. Please contact the patient immediately!`, 
          time: new Date().toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' }),
          outgoing: false
        }];
      });
      // Add to Alerts Tab
      setAlerts(prev => {
        if (prev.some(a => Date.now() - a.id < 10000)) return prev;
        return [{
          id: Date.now(),
          title: '🚨 Critical Fall Detected',
          text: `Device ${selectedDeviceId} triggered a sudden acceleration spike.`,
          time: new Date().toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' })
        }, ...prev];
      });
      // Force change tab to alerts
      setActiveSection('alerts');
    }
  }, [realData?.fallDetected]);

  const handleLogout = () => {
    localStorage.clear();
    toast.success('Logged out');
    navigate('/');
  };

  const handleAddPatient = (e) => {
    e.preventDefault();
    if (!newPatient.name || !newPatient.deviceId) { toast.error('Name & Device ID required'); return; }
    const next = [...patients, { id: Date.now(), ...newPatient }];
    setPatients(next);
    const guardianId = localStorage.getItem('guardianId');
    if (guardianId) {
      localStorage.setItem(`patients_${guardianId}`, JSON.stringify(next));
    }
    setNewPatient({ name:'', age:'', deviceId:'', conditions:'' });
    setShowAddModal(false);
    toast.success('✅ Patient added!');
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!newMsg.trim()) return;
    setMessages(m => [...m, {
      id: Date.now(), sender:'Guardian', patient: selectedPatientMsg,
      text: newMsg.trim(), time: new Date().toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' }),
      outgoing: true
    }]);
    setNewMsg('');
    toast.success('Message sent!');
  };

  const getHeartStatus = (hr) => {
    if (hr < 60 || hr > 100) return { label:'⚠ Warning', cls:'warning' };
    return { label:'✓ Normal', cls:'safe' };
  };
  const getSpo2Status = (s) => s < 95 ? { label:'⚠ Low', cls:'critical' } : { label:'✓ Normal', cls:'safe' };

  const navItems = [
    { key:'overview',  icon:<FiHome />,          label:'Overview'   },
    { key:'vitals',    icon:<FiActivity />,       label:'Live Vitals'},
    { key:'patients',  icon:<FiUsers />,          label:'Patients'   },
    { key:'tracking',  icon:<FiMap />,            label:'Live GPS'   },
    { key:'messages',  icon:<FiMessageSquare />,  label:'Messages'   },
    { key:'alerts',    icon:<FiAlertTriangle />,  label:'Alerts', badge: alerts.length > 0 ? alerts.length : null },
    { key:'settings',  icon:<FiSettings />,       label:'Settings'   },
  ];

  return (
    <div className="dashboard-container">
      {/* ── Sidebar ── */}
      <motion.div className="dashboard-sidebar" initial={{ x:-300 }} animate={{ x:0 }} transition={{ duration:0.3 }}>
        <div className="sidebar-header">
          <h1>⚕️ {APP_NAME}</h1>
          <p>Guardian Dashboard</p>
        </div>
        <nav className="sidebar-nav">
          {navItems.map(n => (
            <button key={n.key} className={`nav-item ${activeSection===n.key?'active':''}`} onClick={() => setActiveSection(n.key)}>
              {n.icon} {n.label}
              {n.key==='vitals' && <PulseRing color="#ff4d6d" />}
              {n.badge && <span style={{ marginLeft:'auto', background:'#ff4d6d', color:'white', fontSize:'0.75rem', padding:'2px 8px', borderRadius:20 }}>{n.badge}</span>}
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <button className="btn-logout" onClick={handleLogout}><FiLogOut /> Logout</button>
        </div>
      </motion.div>

      {/* ── Main ── */}
      <motion.div className="dashboard-main" initial={{ opacity:0 }} animate={{ opacity:1 }}>
        {/* Header */}
        <div className="dashboard-header">
          <div className="header-content">
            <h2>Welcome, {guardian.fullName}!</h2>
            <p style={{ display:'flex', alignItems:'center', gap:8 }}>
              <PulseRing color="#00ff88" /> Live monitoring active
            </p>
          </div>
          <button className="btn-emergency" onClick={() => toast.error('🚨 Emergency alert sent!')}>
            🚨 Emergency Alert
          </button>
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={activeSection} className="dashboard-content"
            initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}>

            {/* ── OVERVIEW ── */}
            {activeSection === 'overview' && (
              <div>
                <div className="vitals-grid">
                  {[
                    { icon:<FiHeart />, label:'Heart Rate', value: vitals.heartRate, unit:'BPM', color:'#ff4d6d', status: getHeartStatus(vitals.heartRate) },
                    { icon:<FiWind />,  label:'Oxygen (SpO2)', value: vitals.spO2, unit:'%', color:'#00d9ff', status: getSpo2Status(vitals.spO2) },
                    { icon:<FiThermometer />, label:'Temperature', value: vitals.temp, unit:'°C', color:'#f6c90e', status:{ label:'✓ Normal', cls:'safe' } },
                    { icon:<FiBattery />,     label:'Band Battery', value: vitals.battery, unit:'%', color:'#00ff88', status:{ label:'✓ Good', cls:'safe' } },
                  ].map((c,i) => (
                      <motion.div key={i} className="vital-card" whileHover={{ y:-5 }} transition={{ duration:0.2 }}>
                      <div className="vital-icon" style={{ color: c.color }}>{c.icon}</div>
                      <div className="vital-info">
                        <p className="vital-label">{c.label}</p>
                        <motion.p className="vital-value" key={c.value} animate={{ scale:[1.08,1] }} transition={{ duration:0.3 }}>
                          {c.value}
                        </motion.p>
                        <p className="vital-unit">{c.unit}</p>
                      </div>
                      <div className={`vital-status ${c.status.cls}`}>{c.status.label}</div>
                    </motion.div>
                  ))}
                </div>
                <div className="welcome-card">
                  <div className="welcome-content">
                    <h3>🎯 System Active</h3>
                    <p>All sensors are live. Patient data streaming in real-time.</p>
                    <div className="welcome-stats">
                      <div className="stat"><span className="stat-number">{patients.length}</span><span className="stat-label">Patients</span></div>
                      <div className="stat"><span className="stat-number">{messages.length}</span><span className="stat-label">Messages</span></div>
                      <div className="stat"><span className="stat-number">0</span><span className="stat-label">Emergencies</span></div>
                    </div>
                    <button className="btn-add-patient" onClick={() => setShowAddModal(true)}>
                      <FiPlus /> Add Patient
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── LIVE VITALS ── */}
            {activeSection === 'vitals' && (
              <div>
                <h3 style={{ marginBottom:24, fontSize:'1.4rem' }}>❤️ Real-Time Vital Monitoring</h3>
                <div className="vitals-grid">
                  <div className="vital-card" style={{ gridColumn:'span 2', border:'1px solid #ff4d6d44' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                      <div>
                        <p className="vital-label">Heart Rate (ECG Simulation)</p>
                        <motion.p className="vital-value" key={vitals.heartRate} animate={{ scale:[1.12,1] }} transition={{ duration:0.3 }} style={{ color:'#ff4d6d', fontSize:'3.5rem' }}>
                          {vitals.heartRate}
                        </motion.p>
                        <p className="vital-unit">BPM</p>
                      </div>
                      <div className={`vital-status ${getHeartStatus(vitals.heartRate).cls}`}>{getHeartStatus(vitals.heartRate).label}</div>
                    </div>
                    <HeartBeat bpm={vitals.heartRate} />
                  </div>

                  {[
                    { label:'Oxygen Saturation', value: vitals.spO2, unit:'%', color:'#00d9ff', min:90, max:100 },
                    { label:'Body Temperature',  value: vitals.temp,      unit:'°C', color:'#f6c90e', min:35, max:40 },
                    { label:'Device Battery',    value: vitals.battery,   unit:'%', color:'#00ff88', min:0,  max:100 },
                  ].map((c,i) => (
                    <div key={i} className="vital-card">
                      <p className="vital-label">{c.label}</p>
                      <motion.p key={c.value} className="vital-value" animate={{ scale:[1.08,1] }} transition={{ duration:0.3 }} style={{ color: c.color, fontSize:'3rem' }}>
                        {c.value}
                      </motion.p>
                      <p className="vital-unit">{c.unit}</p>
                      <div style={{ marginTop:8, background:'rgba(255,255,255,0.07)', borderRadius:6, overflow:'hidden', height:8 }}>
                        <motion.div style={{ height:'100%', borderRadius:6, background: c.color,
                          width:`${((c.value - c.min)/(c.max - c.min))*100}%` }} animate={{ width:`${((c.value-c.min)/(c.max-c.min))*100}%` }} transition={{ duration:0.3 }} />
                      </div>
                    </div>
                  ))}
                </div>
                <p style={{ color:'#7a7690', marginTop:16, fontSize:'0.85rem', textAlign:'center' }}>
                  ⟳ Data refreshes every 1.5 seconds — simulated sensor stream
                </p>
              </div>
            )}

            {/* ── PATIENTS ── */}
            {activeSection === 'patients' && (
              <div className="patients-container">
                <div className="section-header">
                  <h3>My Patients</h3>
                  <button className="btn-add-patient" onClick={() => setShowAddModal(true)}><FiPlus /> Add Patient</button>
                </div>
                {patients.length === 0 ? (
                  <div className="empty-state">
                    <FiUsers size={48} /><p>No patients added yet</p><small>Click "Add Patient" to get started</small>
                  </div>
                ) : (
                  <div style={{ display:'grid', gap:'1rem', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))' }}>
                    {patients.map(p => (
                      <motion.div key={p.id} className="vital-card" whileHover={{ y:-4 }} transition={{ duration:0.2 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                          <div style={{ width:46, height:46, borderRadius:'50%', background:'linear-gradient(135deg,#00d9ff,#00ff88)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, color:'#0a0e27', fontSize:'1.2rem' }}>
                            {p.name[0]}
                          </div>
                          <div>
                            <p style={{ fontWeight:700, color:'white', margin:0 }}>{p.name}</p>
                            <p style={{ color:'#a0aec0', fontSize:'0.8rem', margin:0 }}>Age: {p.age||'N/A'} • ID: {p.deviceId}</p>
                          </div>
                          <PulseRing color="#00ff88" />
                        </div>
                        <p style={{ color:'#a0aec0', fontSize:'0.9rem', margin:'8px 0' }}>Conditions: {p.conditions||'None'}</p>
                        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                          <button className="btn-add-patient" style={{ flex:1, fontSize:'0.8rem', padding:'8px' }} onClick={() => setActiveSection('vitals')}>❤️ Vitals</button>
                          <button className="btn-add-patient" style={{ flex:1, fontSize:'0.8rem', padding:'8px', background: selectedDeviceId===p.deviceId ? '#00ff88':'rgba(0,217,255,0.15)', color: selectedDeviceId===p.deviceId?'#0a0e27':'#00d9ff', border:'1px solid #00d9ff' }}
                            onClick={() => { setSelectedDeviceId(selectedDeviceId===p.deviceId ? null : p.deviceId); toast.success(selectedDeviceId===p.deviceId ? 'Disconnected' : `📡 Tracking ${p.name} live!`); }}>
                            {selectedDeviceId===p.deviceId ? '🟢 Live' : '📡 Track'}
                          </button>
                          <button className="btn-add-patient" style={{ flex:1, fontSize:'0.8rem', padding:'8px', background:'rgba(255,255,255,0.05)', color:'#b0a8d4', border:'1px solid rgba(255,255,255,0.1)' }}
                            onClick={() => { setSelectedPatientMsg(p.name); setActiveSection('messages'); }}>💬</button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── LIVE GPS TRACKING ── */}
            {activeSection === 'tracking' && (
              <div className="tracking-container">
                <div className="section-header">
                  <h3>📍 Live GPS Tracking</h3>
                  <div style={{ display:'flex', alignItems:'center', gap:8, color: gps ? '#00ff88' : '#a0aec0', fontSize:'0.9rem' }}>
                    {gps ? <><PulseRing color="#00ff88" /> Location unlocked due to emergency</> : '🔒 Location Hidden for Privacy'}
                  </div>
                </div>
                {!gps ? (
                  <div style={{ padding: '60px 20px', textAlign: 'center', background:'rgba(30,25,70,0.7)', borderRadius:16, border:'1px dashed rgba(255,255,255,0.2)' }}>
                    <div style={{ fontSize: '3rem', marginBottom: 16 }}>🔒</div>
                    <h3 style={{ margin:0, color:'#e2e8f0' }}>Location Protected</h3>
                    <p style={{ color:'#a0aec0', maxWidth:400, margin:'10px auto' }}>The patient's location is currently hidden to respect their daily privacy. The exact GPS coordinates will only be transmitted and revealed on this map in the event of a sudden fall or emergency.</p>
                  </div>
                ) : (
                  <>
                    <div style={{ background:'rgba(30,25,70,0.7)', borderRadius:16, border:'1px solid rgba(0,217,255,0.2)', overflow:'hidden', marginBottom: 16 }}>
                      <iframe
                        key={`${gps.lat.toFixed(4)}-${gps.lng.toFixed(4)}`}
                        title="Live Patient Location"
                        width="100%"
                        height="420"
                        style={{ border:'none', display:'block' }}
                        src={`https://www.openstreetmap.org/export/embed.html?bbox=${gps.lng-0.005},${gps.lat-0.005},${gps.lng+0.005},${gps.lat+0.005}&layer=mapnik&marker=${gps.lat},${gps.lng}`}
                      />
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:16 }}>
                      {[
                        { label:'Latitude',  value: gps.lat.toFixed(6), icon:'🌐' },
                        { label:'Longitude', value: gps.lng.toFixed(6), icon:'🌐' },
                        { label:'Status',    value: 'Emergency',        icon:'🚨' },
                      ].map((s,i) => (
                        <div key={i} className="vital-card" style={{ flexDirection:'row', alignItems:'center', gap:12 }}>
                          <span style={{ fontSize:'1.5rem' }}>{s.icon}</span>
                          <div>
                            <p className="vital-label">{s.label}</p>
                            <motion.p key={s.value} style={{ color:'#00d9ff', fontWeight:700, fontSize:'1rem', margin:0 }} animate={{ opacity:[0.5,1] }} transition={{ duration:0.3 }}>
                              {s.value}
                            </motion.p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ── MESSAGES ── */}
            {activeSection === 'messages' && (
              <div className="patients-container">
                <div className="section-header">
                  <h3>💬 Guardian–Patient Messages</h3>
                </div>
                <div style={{ display:'flex', gap:16 }}>
                  {/* contacts */}
                  <div style={{ width:200, flexShrink:0, display:'flex', flexDirection:'column', gap:8 }}>
                    {['Ravi Kumar', ...patients.map(p=>p.name)].map(name => (
                      <button key={name} onClick={() => setSelectedPatientMsg(name)}
                        style={{ padding:'10px 14px', borderRadius:10, border:'1px solid', textAlign:'left', cursor:'pointer', fontWeight:600, fontSize:'0.9rem',
                          background: selectedPatientMsg===name ? 'rgba(0,217,255,0.2)' : 'rgba(30,25,70,0.6)',
                          borderColor: selectedPatientMsg===name ? '#00d9ff' : 'rgba(255,255,255,0.1)',
                          color: selectedPatientMsg===name ? '#00d9ff' : '#b0a8d4' }}>
                        {name[0]} {name}
                      </button>
                    ))}
                  </div>
                  {/* chat */}
                  <div style={{ flex:1, display:'flex', flexDirection:'column', background:'rgba(30,25,70,0.6)', borderRadius:16, border:'1px solid rgba(0,217,255,0.15)', overflow:'hidden' }}>
                    <div style={{ padding:'12px 16px', borderBottom:'1px solid rgba(0,217,255,0.1)', fontWeight:700, color:'#00d9ff' }}>
                      Chat with {selectedPatientMsg}
                    </div>
                    <div style={{ flex:1, overflowY:'auto', padding:16, display:'flex', flexDirection:'column', gap:10, minHeight:300, maxHeight:400 }}>
                      {messages.filter(m => m.patient === selectedPatientMsg).map(m => (
                        <div key={m.id} style={{ display:'flex', justifyContent: m.outgoing?'flex-end':'flex-start' }}>
                          <div style={{ maxWidth:'70%', padding:'10px 14px', borderRadius: m.outgoing?'16px 16px 4px 16px':'16px 16px 16px 4px',
                            background: m.outgoing?'linear-gradient(135deg,#00d9ff,#00ff88)':'rgba(255,255,255,0.07)',
                            color: m.outgoing?'#0a0e27':'white', fontSize:'0.9rem' }}>
                            <p style={{ margin:0 }}>{m.text}</p>
                            <p style={{ margin:'4px 0 0', fontSize:'0.75rem', opacity:0.7, textAlign:'right' }}>{m.time}</p>
                          </div>
                        </div>
                      ))}
                      {messages.filter(m=>m.patient===selectedPatientMsg).length===0 && (
                        <div style={{ textAlign:'center', color:'#7a7690', marginTop:40 }}>No messages yet. Say hello! 👋</div>
                      )}
                      <div ref={msgEndRef} />
                    </div>
                    <form onSubmit={sendMessage} style={{ display:'flex', gap:8, padding:12, borderTop:'1px solid rgba(0,217,255,0.1)' }}>
                      <input value={newMsg} onChange={e=>setNewMsg(e.target.value)} placeholder={`Message ${selectedPatientMsg}...`}
                        style={{ flex:1, padding:'10px 14px', borderRadius:10, border:'1px solid rgba(0,217,255,0.3)', background:'rgba(0,0,0,0.3)', color:'white', fontSize:'0.9rem' }} />
                      <button type="submit" className="btn-add-patient" style={{ padding:'10px 18px' }}><FiSend /></button>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {/* ── ALERTS ── */}
            {activeSection === 'alerts' && (
              <div className="alerts-container">
                <div className="section-header">
                  <h3>🚨 Emergency Alerts</h3>
                  {alerts.length > 0 && <button onClick={() => setAlerts([])} style={{ background:'rgba(255,77,109,0.2)', color:'#ff4d6d', border:'none', padding:'6px 12px', borderRadius:8, cursor:'pointer' }}>Clear All</button>}
                </div>
                {alerts.length === 0 ? (
                  <div className="empty-state"><FiAlertTriangle size={48} /><p>No emergencies</p><small>All patients are safe ✓</small></div>
                ) : (
                  <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
                    {alerts.map(a => (
                      <div key={a.id} style={{ background:'rgba(255,77,109,0.1)', borderLeft:'4px solid #ff4d6d', padding:'16px', borderRadius:'0 12px 12px 0' }}>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                          <h4 style={{ margin:0, color:'#ff4d6d', fontSize:'1.1rem', display:'flex', alignItems:'center', gap:8 }}><FiAlertTriangle /> {a.title}</h4>
                          <span style={{ fontSize:'0.85rem', color:'#a0aec0' }}>{a.time}</span>
                        </div>
                        <p style={{ margin:0, color:'#e2e8f0' }}>{a.text}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── SETTINGS ── */}
            {activeSection === 'settings' && (
              <div className="settings-container">
                <div className="section-header"><h3>⚙️ Settings</h3></div>
                <div className="settings-form" style={{ display:'flex', flexDirection:'column', gap:16, maxWidth:500 }}>
                  
                  <div className="setting-item" style={{ display:'flex', flexDirection:'column', gap:6 }}>
                    <label style={{ fontSize:'0.85rem', color:'#b0a8d4', fontWeight:600, textTransform:'uppercase' }}>Full Name</label>
                    <input 
                      type="text" 
                      value={guardian.fullName} 
                      onChange={e => setGuardian({...guardian, fullName: e.target.value})}
                      style={{ background:'rgba(30,25,70,0.6)', border:'1px solid #00d9ff', borderRadius:10, padding:'12px 15px', color:'white', fontSize:'1rem', outline:'none', boxShadow:'0 0 10px rgba(0,217,255,0.1)' }} 
                    />
                  </div>

                  <div className="setting-item" style={{ display:'flex', flexDirection:'column', gap:6 }}>
                    <label style={{ fontSize:'0.85rem', color:'#b0a8d4', fontWeight:600, textTransform:'uppercase' }}>Role</label>
                    <input type="text" value="Medical Guardian" disabled style={{ background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, padding:'12px 15px', color:'#7a7690', fontSize:'1rem' }} />
                  </div>

                  <div className="setting-item" style={{ display:'flex', flexDirection:'column', gap:6 }}>
                    <label style={{ fontSize:'0.85rem', color:'#b0a8d4', fontWeight:600, textTransform:'uppercase' }}>System Status</label>
                    <input type="text" value="Active & Encrypted" disabled style={{ background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, padding:'12px 15px', color:'#00ff88', fontSize:'1rem' }} />
                  </div>

                  <button 
                    onClick={() => {
                      localStorage.setItem('guardianName', guardian.fullName);
                      toast.success('Settings saved successfully!');
                    }}
                    style={{ background:'linear-gradient(135deg, #00d9ff, #00ff88)', color:'#0a0e27', border:'none', padding:'14px', borderRadius:10, fontWeight:'bold', cursor:'pointer', marginTop:10, fontSize:'1rem' }}>
                    Save Settings
                  </button>
                  
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* ── Add Patient Modal ── */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}>
            <motion.div initial={{ scale:0.85 }} animate={{ scale:1 }} exit={{ scale:0.85 }}
              style={{ background:'#1a202c', padding:'2rem', borderRadius:20, border:'1px solid #2d3748', width:'90%', maxWidth:420 }}>
              <h3 style={{ marginTop:0, color:'white', marginBottom:'1.5rem' }}>➕ Add New Patient</h3>
              <form onSubmit={handleAddPatient} style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
                {[
                  { label:'Patient Name *', key:'name', type:'text', ph:'Jane Doe' },
                  { label:'Age', key:'age', type:'number', ph:'65' },
                  { label:'Smart Band Device ID *', key:'deviceId', type:'text', ph:'AC-8492' },
                ].map(f => (
                  <div key={f.key}>
                    <label style={{ display:'block', marginBottom:'0.4rem', color:'#a0aec0', fontSize:'0.85rem' }}>{f.label}</label>
                    <input type={f.type} placeholder={f.ph} value={newPatient[f.key]}
                      onChange={e => setNewPatient({...newPatient, [f.key]: e.target.value})}
                      style={{ width:'100%', padding:'0.75rem', borderRadius:8, border:'1px solid #4a5568', background:'rgba(0,0,0,0.3)', color:'white', boxSizing:'border-box' }} />
                  </div>
                ))}
                <div>
                  <label style={{ display:'block', marginBottom:'0.4rem', color:'#a0aec0', fontSize:'0.85rem' }}>Medical Conditions</label>
                  <textarea value={newPatient.conditions} onChange={e => setNewPatient({...newPatient, conditions:e.target.value})}
                    placeholder="Hypertension, Diabetes..." rows={3}
                    style={{ width:'100%', padding:'0.75rem', borderRadius:8, border:'1px solid #4a5568', background:'rgba(0,0,0,0.3)', color:'white', resize:'vertical', boxSizing:'border-box' }} />
                </div>
                <div style={{ display:'flex', gap:12 }}>
                  <button type="button" onClick={() => setShowAddModal(false)}
                    style={{ flex:1, padding:'0.75rem', borderRadius:10, border:'1px solid #4a5568', background:'transparent', color:'#a0aec0', cursor:'pointer' }}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-add-patient" style={{ flex:1 }}>Add Patient</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes ping {
          75%, 100% { transform: scale(2); opacity: 0; }
        }
        @keyframes dash {
          from { stroke-dashoffset: 400; }
          to   { stroke-dashoffset: 0; }
        }
      `}</style>
    </div>
  );
}
