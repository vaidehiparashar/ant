const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Firebase Admin once at the root level before any routers or logic import it
admin.initializeApp();

// Import the main Express application
const app = require('./app');

// Import Scheduled Cloud Functions (Cron Jobs)
const { detectAttendanceAnomalies } = require('./attendance/anomalyDetector');
const { calculateMonthlyPayroll } = require('./payroll/monthlyPayroll');
const { generateMonthlyDigest } = require('./digest/monthlyDigest');

// 1. Export the main Express API
exports.api = functions.https.onRequest(app);

// 2. Export Scheduled Jobs
exports.anomalyDetector = detectAttendanceAnomalies;
exports.monthlyPayroll = calculateMonthlyPayroll;
exports.monthlyDigest = generateMonthlyDigest;

// 3. Export standalone Callable Function for assigning Roles
exports.setUserRole = functions.https.onCall(async (data, context) => {
  // Verify the caller is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
  }

  // Verify the caller has the 'admin' role in their token
  if (context.auth.token.role !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Only admins can set roles.');
  }

  const { uid, role } = data;
  
  if (!uid || !role) {
    throw new functions.https.HttpsError('invalid-argument', 'The function must be called with uid and role.');
  }

  try {
    // Set custom claim in Firebase Auth
    await admin.auth().setCustomUserClaims(uid, { role });

    // Update role in Firestore to keep UI and Auth in sync
    await admin.firestore().collection('users').doc(uid).set({ role }, { merge: true });

    return { success: true };
  } catch (error) {
    console.error('Error setting user role:', error);
    throw new functions.https.HttpsError('internal', 'An error occurred while setting the role.');
  }
});
