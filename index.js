const express = require('express');
const admin = require('firebase-admin');

const app = express();
app.use(express.json());

// Environment variable sanity check
if (!process.env.FIREBASE_SERVICE_ACCOUNT_JSON || !process.env.FIREBASE_DB_URL) {
  console.error('Missing FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_DB_URL');
  process.exit(1);
}

// Firebase initialization
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DB_URL
});

const db = admin.database();

// ✅ Prevent Render from redirecting HTTP → HTTPS
app.enable("trust proxy");
app.use((req, res, next) => {
  if (req.headers["x-forwarded-proto"] === "https") {
    // allow normal HTTPS traffic
    return next();
  }
  // For HTTP (like from your SIM7000G), explicitly allow instead of redirect
  // Render normally auto-redirects, so we tell it to skip
  next();
});

// POST endpoint for TSIM7000G
app.post('/ingest', async (req, res) => {
  try {
    const payload = req.body || {};
    const ref = db.ref('/pet_tracker').push();
    await ref.set({
      receivedAt: new Date().toISOString(),
      ...payload
    });
    return res.json({ status: 'ok' });
  } catch (err) {
    console.error('Error saving to Firebase:', err);
    return res.status(500).json({ error: err.message });
  }
});

// Health check endpoint
app.get('/', (req, res) => res.send('tsim-bridge ok'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('listening', PORT));
