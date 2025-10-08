const express = require('express');
const admin = require('firebase-admin');

const app = express();
app.use(express.json());

// IMPORTANT: set these environment variables on the host
// FIREBASE_SERVICE_ACCOUNT_JSON -> stringified JSON (service account key)
// FIREBASE_DB_URL -> "https://<your-project-id>.firebaseio.com" OR region URL

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

// POST endpoint the TSIM7000G will call
app.post('/ingest', async (req, res) => {
  try {
    const payload = req.body || {};
    // push into /pet_tracker (change path as you like)
    const ref = db.ref('/pet_tracker').push();
    await ref.set({
      receivedAt: new Date().toISOString(),
      ...payload
    });
    return res.json({ status: 'ok' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});

// health
app.get('/', (req,res)=>res.send('tsim-bridge ok'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=>console.log('listening', PORT));
