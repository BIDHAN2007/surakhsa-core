import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { APP_NAME, APP_TAGLINE } from '../config';
import toast from 'react-hot-toast';

const paths = [
  { label: 'Guardian login (laptop)', path: '/', icon: '💻' },
  { label: 'Patient sensors (phone)', path: '/patient', icon: '📱' },
  { label: 'Register guardian', path: '/register', icon: '📝' },
  { label: 'Admin dispatch', path: '/admin', icon: '🚨' },
];

function copy(text) {
  navigator.clipboard.writeText(text).then(
    () => toast.success('Link copied!'),
    () => toast.error('Copy failed — select and copy manually')
  );
}

export default function DemoPage() {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const [deviceId, setDeviceId] = useState('HACK-2026');

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>⚕️ {APP_NAME}</h1>
        <p style={styles.sub}>{APP_TAGLINE}</p>
        <p style={styles.badge}>Hackathon live demo — share these links with judges</p>

        <div style={styles.links}>
          {paths.map((item) => {
            const url = `${origin}${item.path}`;
            return (
              <div key={item.path} style={styles.row}>
                <span style={{ fontSize: '1.4rem' }}>{item.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={styles.rowLabel}>{item.label}</p>
                  <a href={url} style={styles.url} target="_blank" rel="noreferrer">
                    {url}
                  </a>
                </div>
                <button type="button" style={styles.copyBtn} onClick={() => copy(url)}>
                  Copy
                </button>
              </div>
            );
          })}
        </div>

        <div style={styles.box}>
          <p style={{ margin: '0 0 8px', fontWeight: 600, color: '#00d9ff' }}>Quick test (2 devices)</p>
          <ol style={styles.ol}>
            <li>Laptop: Guardian login → Register or Email login</li>
            <li>Dashboard → Add patient → Device ID: <strong>{deviceId}</strong></li>
            <li>Phone: Patient link → same Device ID → Start sending</li>
            <li>Laptop → Patients → Track → Live vitals</li>
            <li>Shake phone to simulate fall → GPS + alert</li>
          </ol>
          <label style={styles.label}>Demo Device ID</label>
          <input value={deviceId} onChange={(e) => setDeviceId(e.target.value)} style={styles.input} />
        </div>

        <p style={styles.admin}>Admin: login → tap title 3× → code 911</p>
        <Link to="/" style={styles.back}>← Back to login</Link>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0a0e27 0%, #1a0a3e 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1.5rem',
    fontFamily: "'Segoe UI', sans-serif",
  },
  card: {
    maxWidth: 560,
    width: '100%',
    background: 'rgba(26,32,44,0.95)',
    border: '1px solid rgba(0,217,255,0.25)',
    borderRadius: 20,
    padding: '2rem',
  },
  title: {
    margin: 0,
    fontSize: '1.5rem',
    background: 'linear-gradient(135deg, #00d9ff, #00ff88)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  sub: { color: '#a0aec0', margin: '8px 0 16px', fontSize: '0.9rem' },
  badge: {
    background: 'rgba(246,201,14,0.15)',
    color: '#f6c90e',
    padding: '10px 14px',
    borderRadius: 10,
    fontSize: '0.85rem',
    marginBottom: '1.25rem',
    border: '1px solid rgba(246,201,14,0.3)',
  },
  links: { display: 'flex', flexDirection: 'column', gap: 12, marginBottom: '1.25rem' },
  row: {
    display: 'flex',
    gap: 12,
    alignItems: 'flex-start',
    padding: 12,
    background: 'rgba(0,0,0,0.25)',
    borderRadius: 12,
    border: '1px solid rgba(255,255,255,0.08)',
  },
  rowLabel: { margin: 0, fontWeight: 600, color: '#e2e8f0', fontSize: '0.9rem' },
  url: { color: '#00d9ff', fontSize: '0.78rem', wordBreak: 'break-all' },
  copyBtn: {
    flexShrink: 0,
    padding: '6px 12px',
    borderRadius: 8,
    border: '1px solid #00d9ff',
    background: 'rgba(0,217,255,0.1)',
    color: '#00d9ff',
    cursor: 'pointer',
    fontSize: '0.8rem',
  },
  box: {
    padding: 14,
    borderRadius: 12,
    background: 'rgba(0,217,255,0.06)',
    border: '1px solid rgba(0,217,255,0.2)',
    marginBottom: 12,
  },
  ol: { margin: 0, paddingLeft: 20, color: '#cbd5e0', fontSize: '0.88rem', lineHeight: 1.6 },
  label: { display: 'block', fontSize: '0.75rem', color: '#718096', marginTop: 12 },
  input: {
    width: '100%',
    marginTop: 4,
    padding: '8px 12px',
    borderRadius: 8,
    border: '1px solid rgba(0,217,255,0.3)',
    background: 'rgba(0,0,0,0.3)',
    color: 'white',
    boxSizing: 'border-box',
  },
  admin: { fontSize: '0.8rem', color: '#718096', margin: '12px 0' },
  back: { color: '#00d9ff', textDecoration: 'none', fontSize: '0.9rem' },
};
