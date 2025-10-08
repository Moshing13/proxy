const express = require('express');
const admin = require('firebase-admin');

const app = express();
app.use(express.json());

// Disable any redirect behavior (Render sometimes adds HTTPS enforcement)
app.enable("trust proxy");
app.use((req, res, next) => {
  // Force allow plain HTTP requests
  if (req.headers["x-forwarded-proto"] === "https") {
    next(); // Allow HTTPS too
  } else {
    next(); // Don't redirect HTTP → HTTPS
  }
});

// Firebase setup (env vars must be set in Render dashboard)
if (!process.env.FIREBASE_SERVICE_ACCOUNT_JSON || !process.env.FIREBASE_DB_URL) {
  console.error('Missing FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_DB_URL');
  process.exit(1);
}

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DB_URL
});

const db = admin.database();

// Main ingest endpoint
app.post('/ingest', async (req, res) => {
  try {
    const payload = req.body || {};
    const ref = db.ref('/pet_tracker').push();
    await ref.set({
      receivedAt: new Date().toISOString(),
      ...payload
    });
    console.log('✅ Data saved:', payload);
    return res.status(200).json({ status: 'ok' });
  } catch (err) {
    console.error('❌ Error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// Health check
app.get('/', (req, res) => res.send('tsim-bridge ok (HTTP allowed)'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`listening on ${PORT}`));
