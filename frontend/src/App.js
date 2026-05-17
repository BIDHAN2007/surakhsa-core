import BandMode from "./pages/BandMode";
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './pages/Dashboard';
import PatientPage from './pages/PatientPage';
import AdminDashboard from './pages/AdminDashboard';
import DemoPage from './pages/DemoPage';
import './styles/globals.css';

function App() {
  return (
    <Router>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/" element={<PatientPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/patient" element={<PatientPage />} />
        <Route path="/demo" element={<DemoPage />} />
        <Route path="/band" element={<BandMode />} />
      </Routes>
    </Router>
  );
}

export default App;
