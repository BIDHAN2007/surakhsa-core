import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiLogOut, FiGlobe, FiAlertOctagon, FiUsers, FiMapPin } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { API_BASE, APP_NAME } from '../config';
import '../styles/dashboard.css';

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

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('dispatch');
  const [allVitals, setAllVitals] = useState([]);
  const [globalAlerts, setGlobalAlerts] = useState([]);

  // Poll for ALL devices globally
  useEffect(() => {
    const fetchGlobalData = async () => {
      try {
        const res = await fetch(`${API_BASE}/vitals`);
        const json = await res.json();
        if (json.success) {
          setAllVitals(json.data);
          
          // Check for new emergencies
          json.data.forEach(device => {
            if (device.fallDetected) {
              setGlobalAlerts(prev => {
                if (prev.some(a => a.deviceId === device.deviceId && (Date.now() - a.id < 15000))) return prev;
                toast.error(`🚨 GLOBAL EMERGENCY: Device ${device.deviceId} detected a fall!`, { style: { background:'#ff4d6d', color:'white', fontWeight:'bold' }, duration: 8000 });
                return [{
                  id: Date.now(),
                  deviceId: device.deviceId,
                  lat: device.lat,
                  lng: device.lng,
                  time: new Date().toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' })
                }, ...prev];
              });
            }
          });
        }
      } catch (e) {
        console.error("Admin fetch error", e);
      }
    };
    fetchGlobalData();
    const interval = setInterval(fetchGlobalData, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    toast.success('Admin Logged Out');
    navigate('/');
  };

  const navItems = [
    { key:'dispatch', icon:<FiGlobe />, label:'Global Dispatch Map' },
    { key:'emergencies', icon:<FiAlertOctagon />, label:'Active Emergencies', badge: globalAlerts.length > 0 ? globalAlerts.length : null },
    { key:'devices', icon:<FiUsers />, label:'All Devices' },
  ];

  return (
    <div className="dashboard-container" style={{ background: 'linear-gradient(to bottom right, #050a1f, #0a0e27)' }}>
      {/* ── Sidebar ── */}
      <motion.div className="dashboard-sidebar" style={{ background: 'rgba(0,0,0,0.4)', borderRight: '1px solid rgba(255,77,109,0.3)' }} initial={{ x:-300 }} animate={{ x:0 }} transition={{ duration:0.3 }}>
        <div className="sidebar-header">
          <h1 style={{ color: '#ff4d6d' }}>🚨 911 Dispatch</h1>
          <p style={{ color: '#a0aec0' }}>{APP_NAME} Admin Center</p>
        </div>
        <nav className="sidebar-nav">
          {navItems.map(n => (
            <button key={n.key} className={`nav-item ${activeSection===n.key?'active':''}`} onClick={() => setActiveSection(n.key)}
              style={{ color: activeSection===n.key ? '#ff4d6d' : '#b0a8d4', borderLeft: activeSection===n.key ? '4px solid #ff4d6d' : 'none' }}>
              {n.icon} {n.label}
              {n.badge && <span style={{ marginLeft:'auto', background:'#ff4d6d', color:'white', fontSize:'0.75rem', padding:'2px 8px', borderRadius:20 }}>{n.badge}</span>}
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <button className="btn-logout" onClick={handleLogout} style={{ color: '#ff4d6d', borderColor: '#ff4d6d' }}><FiLogOut /> Admin Logout</button>
        </div>
      </motion.div>

      {/* ── Main ── */}
      <motion.div className="dashboard-main" initial={{ opacity:0 }} animate={{ opacity:1 }}>
        <div className="dashboard-header" style={{ borderBottom: '1px solid rgba(255,77,109,0.2)' }}>
          <div className="header-content">
            <h2 style={{ color: 'white' }}>Global Emergency Command Center</h2>
            <p style={{ display:'flex', alignItems:'center', gap:8, color: '#00d9ff' }}>
              <PulseRing color="#00ff88" /> {allVitals.length} Devices Online • Scanning worldwide
            </p>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={activeSection} className="dashboard-content" initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}>
            
            {/* ── GLOBAL DISPATCH MAP ── */}
            {activeSection === 'dispatch' && (
              <div>
                <h3 style={{ marginBottom:16, color:'#ff4d6d', display:'flex', alignItems:'center', gap:8 }}><FiGlobe /> Live Global Tracking</h3>
                {globalAlerts.length === 0 ? (
                  <div style={{ padding: '60px 20px', textAlign: 'center', background:'rgba(30,25,70,0.5)', borderRadius:16, border:'1px solid rgba(0,217,255,0.2)' }}>
                    <div style={{ fontSize: '3rem', marginBottom: 16 }}>🌍</div>
                    <h3 style={{ margin:0, color:'#00ff88' }}>All Sectors Secure</h3>
                    <p style={{ color:'#a0aec0', maxWidth:400, margin:'10px auto' }}>Global monitoring is active. Currently, no emergency signals or falls are being detected across the network.</p>
                  </div>
                ) : (
                  <div style={{ background:'rgba(30,25,70,0.7)', borderRadius:16, border:'2px solid #ff4d6d', overflow:'hidden', boxShadow:'0 0 30px rgba(255,77,109,0.2)' }}>
                    {/* Simplified Map showing the most recent emergency */}
                    <iframe
                      key={`global-${globalAlerts[0].lat}`}
                      title="Global Dispatch"
                      width="100%"
                      height="500"
                      style={{ border:'none', display:'block' }}
                      src={`https://www.openstreetmap.org/export/embed.html?bbox=${globalAlerts[0].lng-0.01},${globalAlerts[0].lat-0.01},${globalAlerts[0].lng+0.01},${globalAlerts[0].lat+0.01}&layer=mapnik&marker=${globalAlerts[0].lat},${globalAlerts[0].lng}`}
                    />
                  </div>
                )}
              </div>
            )}

            {/* ── EMERGENCIES ── */}
            {activeSection === 'emergencies' && (
              <div className="alerts-container">
                <div className="section-header">
                  <h3 style={{ color:'#ff4d6d' }}>🚨 Active Emergencies</h3>
                  {globalAlerts.length > 0 && <button onClick={() => setGlobalAlerts([])} style={{ background:'rgba(255,77,109,0.2)', color:'#ff4d6d', border:'none', padding:'6px 12px', borderRadius:8, cursor:'pointer' }}>Clear Dispatch</button>}
                </div>
                {globalAlerts.length === 0 ? (
                  <div className="empty-state"><FiAlertOctagon size={48} color="#00ff88" /><p>No emergencies</p></div>
                ) : (
                  <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
                    {globalAlerts.map(a => (
                      <div key={a.id} style={{ background:'rgba(255,77,109,0.15)', borderLeft:'5px solid #ff4d6d', padding:'20px', borderRadius:'0 12px 12px 0' }}>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                          <h4 style={{ margin:0, color:'#ff4d6d', fontSize:'1.3rem', display:'flex', alignItems:'center', gap:8 }}><FiAlertOctagon /> IMMEDIATE ATTENTION REQUIRED</h4>
                          <span style={{ fontSize:'0.9rem', color:'#ff4d6d', fontWeight:'bold', background:'rgba(255,77,109,0.2)', padding:'4px 10px', borderRadius:20 }}>{a.time}</span>
                        </div>
                        <p style={{ margin:0, color:'white', fontSize:'1.1rem' }}>Device <strong>{a.deviceId}</strong> has reported a sudden fall.</p>
                        {a.lat ? (
                          <div style={{ marginTop: 12, display:'flex', gap: 16, alignItems:'center', background:'rgba(0,0,0,0.3)', padding:12, borderRadius:8 }}>
                            <FiMapPin color="#00d9ff" size={24} />
                            <div>
                              <div style={{ color:'#00d9ff', fontWeight:'bold' }}>Coordinates Unlocked</div>
                              <div style={{ color:'#a0aec0', fontSize:'0.9rem', fontFamily:'monospace' }}>LAT: {a.lat.toFixed(6)} | LNG: {a.lng.toFixed(6)}</div>
                            </div>
                            <button onClick={() => setActiveSection('dispatch')} style={{ marginLeft:'auto', background:'#ff4d6d', color:'white', border:'none', padding:'8px 16px', borderRadius:6, cursor:'pointer', fontWeight:'bold' }}>View on Map</button>
                          </div>
                        ) : (
                          <div style={{ marginTop: 12, color: '#f6c90e' }}>⚠ GPS coordinates unavailable for this device.</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── ALL DEVICES ── */}
            {activeSection === 'devices' && (
              <div>
                <h3 style={{ marginBottom:16 }}>All Registered Devices</h3>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:16 }}>
                  {allVitals.length === 0 ? <p style={{ color:'#a0aec0' }}>No devices are currently connected to the network.</p> : null}
                  {allVitals.map(v => (
                    <div key={v.deviceId} style={{ background:'rgba(30,25,70,0.6)', border:'1px solid rgba(0,217,255,0.2)', padding:16, borderRadius:12 }}>
                      <h4 style={{ margin:'0 0 12px', color:'#00d9ff', fontSize:'1.1rem' }}>Device: {v.deviceId}</h4>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                        <span style={{ color:'#a0aec0' }}>Heart Rate:</span>
                        <span style={{ color: v.heartRate ? 'white' : '#7a7690' }}>{v.heartRate || 'Offline'} BPM</span>
                      </div>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                        <span style={{ color:'#a0aec0' }}>Battery:</span>
                        <span style={{ color: v.battery ? '#00ff88' : '#7a7690' }}>{v.battery || '?'}%</span>
                      </div>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                        <span style={{ color:'#a0aec0' }}>Status:</span>
                        <span style={{ color: v.fallDetected ? '#ff4d6d' : '#00ff88', fontWeight:'bold' }}>{v.fallDetected ? 'EMERGENCY' : 'Safe'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
