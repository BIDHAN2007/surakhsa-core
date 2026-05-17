const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const GUARDIANS_FILE = path.join(DATA_DIR, 'guardians.json');
const VITALS_FILE = path.join(DATA_DIR, 'vitals.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readJson(file, fallback) {
  ensureDataDir();
  try {
    if (fs.existsSync(file)) {
      return JSON.parse(fs.readFileSync(file, 'utf8'));
    }
  } catch (err) {
    console.error(`Failed to read ${file}:`, err.message);
  }
  return fallback;
}

function writeJson(file, data) {
  ensureDataDir();
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
}

// ── Guardians ────────────────────────────────────────────────────────────────
let guardians = readJson(GUARDIANS_FILE, []);

function saveGuardians() {
  writeJson(GUARDIANS_FILE, guardians);
}

function findGuardians(criteria) {
  return guardians.filter((g) =>
    Object.entries(criteria).every(([field, value]) => g[field] === value)
  );
}

function getGuardianById(id) {
  return guardians.find((g) => g.id === id);
}

function addGuardian(data) {
  const doc = { id: Math.random().toString(36).slice(2, 11), ...data };
  guardians.push(doc);
  saveGuardians();
  return { id: doc.id };
}

function updateGuardian(id, patch) {
  const idx = guardians.findIndex((g) => g.id === id);
  if (idx === -1) return false;
  guardians[idx] = { ...guardians[idx], ...patch };
  saveGuardians();
  return true;
}

// ── Vitals ───────────────────────────────────────────────────────────────────
let latestVitals = readJson(VITALS_FILE, {});

function saveVitals() {
  writeJson(VITALS_FILE, latestVitals);
}

function getVital(deviceId) {
  return latestVitals[deviceId] || null;
}

function setVital(deviceId, data) {
  latestVitals[deviceId] = data;
  saveVitals();
  return data;
}

function getAllVitals() {
  return Object.values(latestVitals);
}

module.exports = {
  findGuardians,
  getGuardianById,
  addGuardian,
  updateGuardian,
  getVital,
  setVital,
  getAllVitals,
};
