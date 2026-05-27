require('dotenv').config({ path: '.env.production' });
const admin = require('firebase-admin');

// Initialize Firebase Admin using environment variable for credentials
// On Render, set GOOGLE_APPLICATION_CREDENTIALS_JSON env var to the contents of your service account JSON
const serviceAccount = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON
  ? JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON)
  : null;

if (serviceAccount) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
} else {
  // Fallback: uses Application Default Credentials (local dev)
  admin.initializeApp();
}

const app = require('./src/app');

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`antHR API server running on port ${PORT}`);
});
